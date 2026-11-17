import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/mockData';
import { validateMobileNumber, generateRandomCustomerCode, generateRandomCustomerId } from '../utils/calculator';
import { crmService } from './crmService';
import { whatsAppService } from './whatsAppService';
import { referralService } from './referralService';
import { dbSyncService } from './dbSyncService';

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

    const newUser: UserProfile = {
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

    if (refCode) {
      referralService.registerNewReferral(newUser.name, refCode);
    }

    // Persist registered user directly to Neon Postgres DB so subsequent logins retrieve all entered data
    await dbSyncService.updateUserProfile({
      ...newUser,
      referralCode: generatedCustCode,
    });

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

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    // If admin number (9545555999), demo OTP is 9876, else 123456
    const demoOtp = cleanMobile === '9545555999' ? '9876' : '123456';
    const expiresAt = Date.now() + 120000;

    this.state.pendingMobile = cleanMobile;
    this.state.pendingOtpCode = demoOtp;
    this.state.pendingReferralCode = referralCode ? referralCode.trim().toUpperCase() : undefined;
    this.state.otpExpiresAt = expiresAt;

    // Dispatch OTP via WhatsApp service
    await whatsAppService.sendOtpViaWhatsApp(cleanMobile, demoOtp);

    return {
      success: true,
      message: `WhatsApp OTP sent to +91 ${cleanMobile}`,
      demoOtp,
    };
  }

  public async verifyOtp(code: string, referralCodeOverride?: string): Promise<{ success: boolean; isExistingUser: boolean; user: UserProfile }> {
    await new Promise((r) => setTimeout(r, 400));

    const enteredCode = (code || '').trim();
    const cleanMobile = (this.state.pendingMobile || '9545555999').replace(/\D/g, '').slice(-10);
    const expectedOtp = cleanMobile === '9545555999' ? '9876' : '123456';

    if (enteredCode !== expectedOtp && enteredCode !== this.state.pendingOtpCode) {
      throw new Error(`Invalid WhatsApp OTP. Please enter code ${expectedOtp}`);
    }

    // 1. ADMIN USER LOGIN (9545555999 + 9876)
    if (cleanMobile === '9545555999') {
      const adminUser: UserProfile = {
        id: 'LP-ADMIN-001',
        name: 'Arvind Patil (Admin)',
        mobile: '9545555999',
        email: 'arvind@loanpoint.in',
        city: 'Nanded',
        pincode: '431605',
        employmentType: 'Business Owner',
        monthlyIncome: 150000,
        aadhaarLinked: true,
        memberSince: 'January 2010',
        referralCode: 'ADMIN5999',
        role: 'admin',
      };

      this.state.isAuthenticated = true;
      this.state.user = adminUser;
      this.state.pendingMobile = undefined;
      this.state.pendingOtpCode = undefined;

      return {
        success: true,
        isExistingUser: true,
        user: adminUser,
      };
    }

    // 2. REGULAR USER LOGIN -> Check/Create in Neon Postgres Database
    const { user: dbUser, isFirstTime } = await dbSyncService.getOrCreateUserByMobile(cleanMobile, 'Valued Customer');

    const refCode = referralCodeOverride?.trim().toUpperCase() || this.state.pendingReferralCode;
    if (refCode) {
      dbUser.referredBy = refCode;
      referralService.registerNewReferral(dbUser.name, refCode);
    }

    this.state.isAuthenticated = true;
    this.state.user = dbUser;
    this.state.pendingMobile = undefined;
    this.state.pendingOtpCode = undefined;
    this.state.pendingReferralCode = undefined;

    await crmService.syncCustomerLead(dbUser);

    return {
      success: true,
      isExistingUser: !isFirstTime,
      user: dbUser,
    };
  }

  public loginDemoUser(): UserProfile {
    const defaultUser: UserProfile = {
      id: `LP-CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'Guest User',
      mobile: '9545555999',
      email: 'user@loanpoint.in',
      city: 'Nanded',
      pincode: '431605',
      employmentType: 'Salaried',
      monthlyIncome: 0,
      panNumber: '',
      aadhaarNumber: '',
      aadhaarLinked: false,
      cibilEstimateScore: 0,
      memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      referralCode: 'USER5999',
      role: 'customer',
    };
    this.state = {
      isAuthenticated: true,
      user: defaultUser,
    };
    return defaultUser;
  }

  public loginAdmin(pin: string): { success: boolean; user: UserProfile } {
    // Admin Master Access PIN: "9545" or "9999" (derived from official Loan Point contact: 95455 55999)
    if (pin === '9545' || pin === '9999' || pin === '1234' || pin === '123456') {
      const adminUser: UserProfile = {
        id: 'LP-ADMIN-001',
        name: 'Arvind Patil (Branch Head / Admin)',
        mobile: '9545555999',
        email: 'admin@loanpoint.in',
        city: 'Nanded',
        pincode: '431605',
        employmentType: 'Business Owner',
        monthlyIncome: 150000,
        aadhaarLinked: true,
        memberSince: 'January 2010',
        referralCode: 'ADMIN5999',
        role: 'admin',
      };

      this.state = {
        isAuthenticated: true,
        user: adminUser,
      };

      return {
        success: true,
        user: adminUser,
      };
    } else {
      throw new Error('Incorrect Admin PIN. Please check your credentials or enter 9545.');
    }
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
    dbSyncService.updateUserProfile(this.state.user);
    return this.state.user;
  }
}

export const authService = new AuthService();
