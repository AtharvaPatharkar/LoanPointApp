import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/mockData';
import { validateMobileNumber, generateUniqueReferralCode } from '../utils/calculator';
import { crmService } from './crmService';
import { whatsAppService } from './whatsAppService';
import { referralService } from './referralService';

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

    const newUser: UserProfile = {
      ...INITIAL_USER,
      id: `LP-CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: params.name.trim(),
      mobile: cleanMobile,
      email: params.email?.trim() || `${cleanMobile}@loanpoint.in`,
      city: params.city?.trim() || '',
      employmentType: params.employmentType || 'Salaried',
      monthlyIncome: params.monthlyIncome || 50000,
      memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      referralCode: generateUniqueReferralCode(params.name, cleanMobile),
      referredBy: refCode,
    };

    if (refCode) {
      referralService.registerNewReferral(newUser.name, refCode);
    }

    // Registration saves the customer record without auto-logging in
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

    const demoOtp = '123456';
    const expiresAt = Date.now() + 120000;

    this.state.pendingMobile = mobile;
    this.state.pendingOtpCode = demoOtp;
    this.state.pendingReferralCode = referralCode ? referralCode.trim().toUpperCase() : undefined;
    this.state.otpExpiresAt = expiresAt;

    // Dispatch OTP via WhatsApp service
    await whatsAppService.sendOtpViaWhatsApp(mobile, demoOtp);

    return {
      success: true,
      message: `WhatsApp OTP sent to +91 ${mobile}`,
      demoOtp,
    };
  }

  public async verifyOtp(code: string, referralCodeOverride?: string): Promise<{ success: boolean; isExistingUser: boolean; user: UserProfile }> {
    await new Promise((r) => setTimeout(r, 500));

    if (!code || (code.trim() !== '123456' && code.trim() !== this.state.pendingOtpCode)) {
      throw new Error('Invalid OTP. For demo purposes, use code 123456');
    }

    const mobile = this.state.pendingMobile || INITIAL_USER.mobile;
    const refCode = referralCodeOverride?.trim().toUpperCase() || this.state.pendingReferralCode;

    let matchedUser = this.state.user;
    if (!matchedUser || matchedUser.mobile !== mobile) {
      const userName = mobile === INITIAL_USER.mobile ? INITIAL_USER.name : 'Valued Customer';
      matchedUser = {
        ...INITIAL_USER,
        mobile,
        name: userName,
        referralCode: generateUniqueReferralCode(userName, mobile),
        referredBy: refCode || undefined,
      };
    } else if (refCode) {
      matchedUser = {
        ...matchedUser,
        referredBy: refCode,
      };
    }

    // Automatically record referral in referralService if a referral code was supplied
    if (refCode) {
      referralService.registerNewReferral(
        matchedUser.name === 'Valued Customer' ? `User (+91 ${mobile.slice(-4)})` : matchedUser.name,
        refCode
      );
    }

    this.state.isAuthenticated = true;
    this.state.user = matchedUser;
    this.state.pendingMobile = undefined;
    this.state.pendingOtpCode = undefined;
    this.state.pendingReferralCode = undefined;

    await crmService.syncCustomerLead(matchedUser);

    return {
      success: true,
      isExistingUser: mobile === INITIAL_USER.mobile,
      user: matchedUser,
    };
  }

  public loginDemoUser(): UserProfile {
    this.state = {
      isAuthenticated: true,
      user: INITIAL_USER,
    };
    return INITIAL_USER;
  }

  public logout(): void {
    this.state = {
      isAuthenticated: false,
      user: null,
    };
  }

  public updateProfile(updated: Partial<UserProfile>): UserProfile {
    if (!this.state.user) throw new Error('No user logged in');
    this.state.user = { ...this.state.user, ...updated };
    crmService.syncCustomerLead(this.state.user);
    return this.state.user;
  }
}

export const authService = new AuthService();
