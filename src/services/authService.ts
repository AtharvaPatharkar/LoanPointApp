import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/mockData';
import { validateMobileNumber, generateRandomCustomerCode, generateRandomCustomerId } from '../utils/calculator';
import { crmService } from './crmService';
import { whatsAppService } from './whatsAppService';
import { referralService } from './referralService';
import { apiRequest, setAuthToken } from './apiClient';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  pendingMobile?: string;
  pendingOtpCode?: string;
  pendingReferralCode?: string;
  otpExpiresAt?: number;
}

class AuthService {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
  };

  public getAuthState(): AuthState {
    return { ...this.state };
  }

  public getUser(): UserProfile | null {
    return this.state.user;
  }

  public async registerUser(params: {
    name: string;
    mobile: string;
    email?: string;
    city?: string;
    employmentType?: 'Salaried' | 'Self Employed' | 'Business Owner' | 'Agriculturist' | 'Others';
    monthlyIncome?: number;
    referralCode?: string;
  }): Promise<{ success: boolean; user: UserProfile }> {
    if (!validateMobileNumber(params.mobile)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }
    if (!params.name.trim()) {
      throw new Error('Please enter your full name');
    }

    const cleanMobile = params.mobile.replace(/\D/g, '').slice(-10);
    const refCode = params.referralCode ? params.referralCode.trim().toUpperCase() : undefined;
    const generatedCustCode = generateRandomCustomerCode();
    const generatedCustId = generateRandomCustomerId();

    let newUser: UserProfile = {
      ...INITIAL_USER,
      id: generatedCustId,
      name: params.name.trim(),
      mobile: cleanMobile,
      email: params.email?.trim() || '',
      city: params.city?.trim() || '',
      employmentType: params.employmentType || 'Salaried',
      monthlyIncome: params.monthlyIncome && params.monthlyIncome > 0 ? params.monthlyIncome : 0,
      memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      referralCode: generatedCustCode,
      referredBy: refCode,
    };

    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          name: newUser.name,
          mobile: cleanMobile,
          email: newUser.email,
          city: newUser.city,
          employmentType: newUser.employmentType,
          monthlyIncome: newUser.monthlyIncome,
          referralCode: refCode,
        },
      });
      if (res.user) {
        newUser = res.user;
      }
    } catch (err: any) {
      console.warn('Backend register call notice:', err.message);
    }

    if (refCode) {
      referralService.registerNewReferral(newUser.name, refCode);
    }

    this.state.isAuthenticated = false;
    this.state.user = null;

    await crmService.syncCustomerLead(newUser);

    return {
      success: true,
      user: newUser,
    };
  }

  public async requestOtp(mobile: string, referralCode?: string): Promise<{ success: boolean; message: string; demoOtp: string }> {
    if (!validateMobileNumber(mobile)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    let demoOtp = '123456';

    try {
      const res = await apiRequest('/auth/request-otp', {
        method: 'POST',
        body: { mobile: cleanMobile },
      });
      if (res.demoOtp) {
        demoOtp = res.demoOtp;
      }
    } catch (err: any) {
      console.warn('Backend OTP request notice:', err.message);
      throw err;
    }

    const expiresAt = Date.now() + 120000;
    this.state.pendingMobile = cleanMobile;
    this.state.pendingOtpCode = demoOtp;
    this.state.pendingReferralCode = referralCode ? referralCode.trim().toUpperCase() : undefined;
    this.state.otpExpiresAt = expiresAt;

    await whatsAppService.sendOtpViaWhatsApp(cleanMobile, demoOtp);

    return {
      success: true,
      message: `WhatsApp OTP sent to +91 ${cleanMobile}`,
      demoOtp,
    };
  }

  public async verifyOtp(code: string, referralCodeOverride?: string): Promise<{ success: boolean; isExistingUser: boolean; user: UserProfile }> {
    const enteredCode = (code || '').trim();
    if (!enteredCode) {
      throw new Error('Please enter the OTP code');
    }

    const cleanMobile = (this.state.pendingMobile || '').replace(/\D/g, '').slice(-10);
    const refCode = referralCodeOverride?.trim().toUpperCase() || this.state.pendingReferralCode;

    // All authentication is verified by the backend API
    const res = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: {
        mobile: cleanMobile,
        otp: enteredCode,
        referralCode: refCode,
      },
    });

    if (res.token) {
      setAuthToken(res.token);
    }

    const verifiedUser: UserProfile = res.user;

    this.state.isAuthenticated = true;
    this.state.user = verifiedUser;
    this.state.pendingMobile = undefined;
    this.state.pendingOtpCode = undefined;
    this.state.pendingReferralCode = undefined;

    if (refCode) {
      referralService.registerNewReferral(verifiedUser.name, refCode);
    }
    await crmService.syncCustomerLead(verifiedUser);

    return {
      success: true,
      isExistingUser: !res.isNewUser,
      user: verifiedUser,
    };
  }

  public loginDemoUser(): UserProfile {
    const defaultUser: UserProfile = {
      id: `LP-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'Guest User',
      mobile: '9876543210',
      email: 'guest@loanpoint.in',
      city: 'Nanded',
      pincode: '431605',
      employmentType: 'Salaried',
      monthlyIncome: 0,
      panNumber: '',
      aadhaarNumber: '',
      aadhaarLinked: false,
      cibilEstimateScore: 0,
      memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      referralCode: 'DEMO5999',
      role: 'customer',
    };
    this.state = {
      isAuthenticated: true,
      user: defaultUser,
    };
    return defaultUser;
  }

  /**
   * Admin Login - Always verified by backend; never permits offline access
   */
  public async loginAdmin(pin: string): Promise<{ success: boolean; user: UserProfile }> {
    if (!pin || !pin.trim()) {
      throw new Error('Admin PIN is required');
    }

    // Must authenticate exclusively through backend
    const res = await apiRequest('/auth/admin-login', {
      method: 'POST',
      body: { pin: pin.trim() },
    });

    if (res.token) {
      setAuthToken(res.token);
    }

    this.state = {
      isAuthenticated: true,
      user: res.user,
    };

    return {
      success: true,
      user: res.user,
    };
  }

  public logout(): void {
    setAuthToken(null);
    this.state = {
      isAuthenticated: false,
      user: null,
    };
  }

  public updateProfile(updated: Partial<UserProfile>): UserProfile {
    if (!this.state.user) throw new Error('No user logged in');
    const updatedUser = { ...this.state.user, ...updated };
    this.state.user = updatedUser;

    apiRequest('/user/profile', {
      method: 'PUT',
      body: updatedUser,
    }).then((res) => {
      if (res && res.user) {
        this.state.user = res.user;
      }
    }).catch((err) => {
      console.warn('API updateProfile sync error:', err.message);
    });

    crmService.syncCustomerLead(updatedUser);
    return updatedUser;
  }
}

export const authService = new AuthService();
