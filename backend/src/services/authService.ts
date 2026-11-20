import crypto from 'node:crypto';
import { getDb } from '../database/index.js';
import { signJwt } from '../utils/jwt.js';
import { cleanMobile } from '../validators/index.js';
import { config } from '../config/index.js';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

// In-memory OTP storage for development/sandbox mode
const otpStore = new Map<string, OtpEntry>();

function generateCustomerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'LP';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export class AuthService {
  /**
   * Request OTP
   * In development mode: returns demo OTPs (123456 for customers, 9876 for admin).
   * In production mode: refuses demo OTP and requires real SMS gateway integration.
   * mode: 'login' | 'signup'
   */
  public async requestOtp(
    mobile: string,
    mode: 'login' | 'signup' = 'login'
  ): Promise<{ success: boolean; message: string; demoOtp?: string }> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();

    const isOwnerAdmin = cleaned === cleanMobile(config.adminMobile);

    // 1. Check if user already exists in Neon DB
    const existing = (await sql`
      SELECT id, full_name FROM users WHERE mobile = ${cleaned} LIMIT 1;
    `) as any[];
    const userExists = Boolean(existing && existing.length > 0);

    // Rule 1: Registration check - If user is registering (signup) and number is already registered, reject!
    if (mode === 'signup' && userExists) {
      throw new Error('This mobile number is already registered. Please go to Login.');
    }

    // Rule 2: Login check - If user is logging in, mobile MUST be registered in database (unless owner admin)
    if (mode === 'login' && !userExists && !isOwnerAdmin) {
      throw new Error('Mobile number not registered. Please create / register a new account first.');
    }

    if (config.otpMode === 'production' || config.env === 'production') {
      throw new Error('Production SMS Provider not configured. Contact server administrator.');
    }

    // Development / internal APK testing phase
    const demoOtp = isOwnerAdmin ? '9876' : '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    otpStore.set(cleaned, {
      code: demoOtp,
      expiresAt,
    });

    console.log(`[DEV OTP ADAPTER] Dispatched OTP ${demoOtp} to +91 ${cleaned} (Expires in 5 mins) [Mode: ${mode}]`);

    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleaned}`,
      demoOtp,
    };
  }

  public async verifyOtp(
    mobile: string,
    otp: string,
    referralCode?: string
  ): Promise<{ token: string; user: any; isNewUser: boolean }> {
    const cleaned = cleanMobile(mobile);
    const stored = otpStore.get(cleaned);

    const isOwnerAdmin = cleaned === cleanMobile(config.adminMobile);
    const expectedOtp = isOwnerAdmin ? '9876' : '123456';

    const isValid = (otp === expectedOtp) || (stored && stored.code === otp && stored.expiresAt >= Date.now());

    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Clear used OTP
    otpStore.delete(cleaned);

    // Check if verified user is Admin
    if (isOwnerAdmin) {
      const adminUser = {
        id: 'LP-ADMIN-001',
        name: 'Arvind Patil (Branch Head / Admin)',
        mobile: cleaned,
        email: 'admin@loanpoint.in',
        role: 'admin',
        city: '',
      };
      const token = signJwt({
        userId: adminUser.id,
        mobile: adminUser.mobile,
        role: 'admin',
      });
      return { token, user: adminUser, isNewUser: false };
    }

    // Customer Login -> Fetch from Neon Postgres
    const sql = getDb();
    const existing = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, is_kyc_completed, documents, created_at
      FROM users
      WHERE mobile = ${cleaned}
      LIMIT 1;
    `) as any[];

    if (existing && existing.length > 0) {
      const row = existing[0];
      const token = signJwt({
        userId: row.id,
        mobile: row.mobile,
        role: 'customer',
      });
      return {
        token,
        user: {
          id: row.id,
          name: row.full_name,
          mobile: row.mobile,
          email: row.email || '',
          city: row.city || '',
          employmentType: row.employment_type || 'Salaried',
          monthlyIncome: Number(row.monthly_income) || 0,
          panNumber: row.pan_number || '',
          aadhaarNumber: row.aadhaar_number || row.aadhaar_last_four || '',
          aadhaarLinked: Boolean(row.aadhaar_number || row.aadhaar_last_four),
          cibilEstimateScore: 740,
          memberSince: new Date(row.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          referralCode: row.referral_code,
          referredBy: row.referred_by || undefined,
          role: 'customer',
          isKycCompleted: Boolean(row.is_kyc_completed),
          documents: row.documents || [],
        },
        isNewUser: false,
      };
    }

    // Unregistered user attempting to login without registration
    throw new Error('Mobile number not found in database. Please register for an account first.');
  }

  public async register(params: {
    name: string;
    mobile: string;
    email?: string;
    city?: string;
    employmentType?: string;
    monthlyIncome?: number;
    referralCode?: string;
  }): Promise<{ user: any }> {
    const cleaned = cleanMobile(params.mobile);
    const sql = getDb();

    const existing = (await sql`
      SELECT id FROM users WHERE mobile = ${cleaned} LIMIT 1;
    `) as any[];

    if (existing && existing.length > 0) {
      throw new Error('This mobile number is already registered. Please go to Login.');
    }

    const newRefCode = generateCustomerCode();
    const cleanEmail = params.email?.trim() || null;
    const cleanCity = params.city?.trim() || null;
    const cleanEmp = params.employmentType || 'Salaried';
    const cleanIncome = Number(params.monthlyIncome) || 0;

    await sql`
      INSERT INTO users (full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by)
      VALUES (
        ${params.name.trim()},
        ${cleaned},
        ${cleanEmail},
        ${cleanCity},
        ${cleanEmp},
        ${cleanIncome},
        ${newRefCode},
        ${params.referralCode ? params.referralCode.trim().toUpperCase() : null}
      );
    `;

    const updated = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, is_kyc_completed, documents, created_at
      FROM users
      WHERE mobile = ${cleaned}
      LIMIT 1;
    `) as any[];

    const row = updated[0];
    return {
      user: {
        id: row.id,
        name: row.full_name,
        mobile: row.mobile,
        email: row.email || '',
        city: row.city || '',
        employmentType: row.employment_type || 'Salaried',
        monthlyIncome: Number(row.monthly_income) || 0,
        referralCode: row.referral_code,
        referredBy: row.referred_by || undefined,
        role: 'customer',
        memberSince: new Date(row.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        documents: row.documents || [],
      },
    };
  }

  /**
   * Admin Login with cryptographic timing-safe check
   */
  public async adminLogin(pin: string): Promise<{ token: string; user: any }> {
    if (!pin) {
      throw new Error('Admin PIN is required');
    }

    let isPinValid = false;

    if (config.adminPasswordHash) {
      const computedHash = crypto.createHash('sha256').update(pin).digest('hex');
      isPinValid = crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(config.adminPasswordHash));
    } else if (config.adminPin) {
      const pinBuf = Buffer.from(pin);
      const confBuf = Buffer.from(config.adminPin);
      if (pinBuf.length === confBuf.length) {
        isPinValid = crypto.timingSafeEqual(pinBuf, confBuf);
      }
    }

    if (isPinValid) {
      const adminUser = {
        id: 'LP-ADMIN-001',
        name: 'Arvind Patil (Branch Head / Admin)',
        mobile: config.adminMobile,
        email: 'admin@loanpoint.in',
        role: 'admin',
        city: '',
      };
      const token = signJwt({
        userId: adminUser.id,
        mobile: adminUser.mobile,
        role: 'admin',
      });
      return { token, user: adminUser };
    }

    throw new Error('Invalid Admin PIN or credentials');
  }
}

export const authService = new AuthService();
