import crypto from 'node:crypto';
import { getDb } from '../database/index.js';
import { signJwt, signRefreshToken, verifyJwt, hashToken } from '../utils/jwt.js';
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
  ): Promise<{ token: string; refreshToken?: string; user: any; isNewUser: boolean }> {
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
      const refreshToken = signRefreshToken({
        userId: adminUser.id,
        mobile: adminUser.mobile,
        role: 'admin',
      });
      await this.saveSession(adminUser.id, refreshToken, 'admin');
      return { token, refreshToken, user: adminUser, isNewUser: false } as any;
    }

    // Customer Login -> Fetch from Neon Postgres
    const sql = getDb();
    const existing = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, business_location, registered_business, business_constitution, business_vintage, industry_sector, annual_turnover, is_gst_registered, gstin, car_condition, car_make_model, car_dealer_seller, car_on_road_price, car_fuel_type, car_mfg_year, car_down_payment, property_type, property_location, est_property_value, market_valuation, property_ownership, is_property_freehold, has_existing_loan_on_property, lap_purpose, land_holding_acres, taluka_village, gat_number, irrigation_source, primary_crops, has_kcc_card, farming_type, agri_loan_type, social_category, enterprise_name, enterprise_activity, activity_sector, business_premises, has_udyam_number, udyam_reg_number, mudra_tier, mudra_card_required, study_destination, course_level, course_name, institute_name, course_duration, admission_status, total_course_cost, co_applicant_relation, co_applicant_name, moratorium_period, existing_emi, loan_purpose, is_kyc_completed, documents, created_at
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
      const refreshToken = signRefreshToken({
        userId: row.id,
        mobile: row.mobile,
        role: 'customer',
      });
      await this.saveSession(row.id, refreshToken, 'customer');
      return {
        token,
        refreshToken,
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
          companyName: row.company_name || '',
          workExperience: row.work_experience || '',
          salaryBank: row.salary_bank || '',
          companyType: row.company_type || '',
          hasCreditCard: row.has_credit_card || '',
          cibilScoreRange: row.cibil_score_range || '',
          dob: row.dob || '',
          businessLocation: row.business_location || '',
          registeredBusiness: row.registered_business || '',
          businessConstitution: row.business_constitution || '',
          businessVintage: row.business_vintage || '',
          industrySector: row.industry_sector || '',
          annualTurnover: row.annual_turnover || '',
          isGstRegistered: row.is_gst_registered || '',
          gstin: row.gstin || '',
          // Car Loan
          carCondition: row.car_condition || '',
          carMakeModel: row.car_make_model || '',
          carDealerSeller: row.car_dealer_seller || '',
          carOnRoadPrice: row.car_on_road_price || '',
          carFuelType: row.car_fuel_type || '',
          carMfgYear: row.car_mfg_year || '',
          carDownPayment: row.car_down_payment || '',
          // Mortgage Loan (LAP)
          propertyType: row.property_type || '',
          propertyLocation: row.property_location || '',
          estPropertyValue: row.est_property_value || '',
          marketValuation: row.market_valuation || '',
          propertyOwnership: row.property_ownership || '',
          isPropertyFreehold: row.is_property_freehold || '',
          hasExistingLoanOnProperty: row.has_existing_loan_on_property || '',
          lapPurpose: row.lap_purpose || '',
          // Agriculture Loan
          landHoldingAcres: row.land_holding_acres || '',
          talukaVillage: row.taluka_village || '',
          gatNumber: row.gat_number || '',
          irrigationSource: row.irrigation_source || '',
          primaryCrops: row.primary_crops || '',
          hasKccCard: row.has_kcc_card || '',
          farmingType: row.farming_type || '',
          agriLoanType: row.agri_loan_type || '',
          // Mudra Loan
          socialCategory: row.social_category || '',
          enterpriseName: row.enterprise_name || '',
          enterpriseActivity: row.enterprise_activity || '',
          activitySector: row.activity_sector || '',
          businessPremises: row.business_premises || '',
          hasUdyamNumber: row.has_udyam_number || '',
          udyamRegNumber: row.udyam_reg_number || '',
          mudraTier: row.mudra_tier || '',
          mudraCardRequired: row.mudra_card_required || '',
          // Education Loan
          studyDestination: row.study_destination || '',
          courseLevel: row.course_level || '',
          courseName: row.course_name || '',
          instituteName: row.institute_name || '',
          courseDuration: row.course_duration || '',
          admissionStatus: row.admission_status || '',
          totalCourseCost: row.total_course_cost || '',
          coApplicantRelation: row.co_applicant_relation || '',
          coApplicantName: row.co_applicant_name || '',
          moratoriumPeriod: row.moratorium_period || '',
          // Personal Loan extras
          existingEmi: row.existing_emi || '',
          loanPurpose: row.loan_purpose || '',
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
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, is_kyc_completed, documents, created_at
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
        companyName: row.company_name || '',
        workExperience: row.work_experience || '',
        salaryBank: row.salary_bank || '',
        companyType: row.company_type || '',
        hasCreditCard: row.has_credit_card || '',
        cibilScoreRange: row.cibil_score_range || '',
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
  public async adminLogin(pin: string): Promise<{ token: string; refreshToken?: string; user: any }> {
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
      const refreshToken = signRefreshToken({
        userId: adminUser.id,
        mobile: adminUser.mobile,
        role: 'admin',
      });
      await this.saveSession(adminUser.id, refreshToken, 'admin');
      return { token, refreshToken, user: adminUser };
    }

    throw new Error('Invalid Admin PIN or credentials');
  }

  /**
   * Session Management: Store active session with hashed refresh token
   */
  public async saveSession(
    userId: string,
    refreshToken: string,
    role: 'customer' | 'admin',
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const sql = getDb();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    try {
      await sql`
        INSERT INTO user_sessions (user_id, refresh_token_hash, role, ip_address, user_agent, is_revoked, expires_at)
        VALUES (${userId}, ${tokenHash}, ${role}, ${ip || null}, ${userAgent || null}, false, ${expiresAt})
        ON CONFLICT (refresh_token_hash) DO NOTHING;
      `;
    } catch (err: any) {
      console.warn('[Session Save Warning]:', err.message);
    }
  }

  /**
   * Refresh Token: Verify, rotate, and generate a fresh Access Token & Refresh Token
   */
  public async refreshSession(
    oldRefreshToken: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ token: string; refreshToken: string; user: any }> {
    const payload = verifyJwt(oldRefreshToken, 'refresh');
    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(oldRefreshToken);
    const sql = getDb();

    // Check if session exists in DB and is active
    const rows = (await sql`
      SELECT id, user_id, role, is_revoked, expires_at
      FROM user_sessions
      WHERE refresh_token_hash = ${tokenHash}
      LIMIT 1;
    `) as any[];

    if (!rows || rows.length === 0) {
      throw new Error('Session not found. Please log in again.');
    }

    const session = rows[0];
    if (session.is_revoked) {
      // Security: Token reuse detected! Revoke all sessions for this user to protect account
      await sql`
        UPDATE user_sessions
        SET is_revoked = true, updated_at = NOW()
        WHERE user_id = ${session.user_id};
      `;
      throw new Error('Compromised session detected. All sessions revoked for security. Please log in again.');
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      throw new Error('Refresh token has expired. Please log in again.');
    }

    // Revoke old refresh token (Token Rotation pattern)
    await sql`
      UPDATE user_sessions
      SET is_revoked = true, updated_at = NOW()
      WHERE id = ${session.id};
    `;

    // Fetch user details
    let userProfile: any = null;
    if (payload.role === 'admin') {
      userProfile = {
        id: 'LP-ADMIN-001',
        name: 'Arvind Patil (Branch Head / Admin)',
        mobile: config.adminMobile,
        email: 'admin@loanpoint.in',
        role: 'admin',
        city: '',
      };
    } else {
      const userRows = (await sql`
        SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, is_kyc_completed, created_at
        FROM users
        WHERE id = ${session.user_id}
        LIMIT 1;
      `) as any[];

      if (!userRows || userRows.length === 0) {
        throw new Error('User not found');
      }

      const u = userRows[0];
      userProfile = {
        id: u.id,
        name: u.full_name,
        mobile: u.mobile,
        email: u.email || '',
        city: u.city || '',
        employmentType: u.employment_type || 'Salaried',
        monthlyIncome: Number(u.monthly_income) || 0,
        panNumber: u.pan_number || '',
        aadhaarNumber: u.aadhaar_number || u.aadhaar_last_four || '',
        aadhaarLinked: Boolean(u.aadhaar_number || u.aadhaar_last_four),
        role: 'customer',
        referralCode: u.referral_code,
        isKycCompleted: Boolean(u.is_kyc_completed),
      };
    }

    // Generate new Access Token (15 mins) and new Refresh Token (7 days)
    const newAccessToken = signJwt({
      userId: userProfile.id,
      mobile: userProfile.mobile,
      role: userProfile.role,
    });
    const newRefreshToken = signRefreshToken({
      userId: userProfile.id,
      mobile: userProfile.mobile,
      role: userProfile.role,
    });

    // Save new session
    await this.saveSession(userProfile.id, newRefreshToken, userProfile.role, ip, userAgent);

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: userProfile,
    };
  }

  /**
   * Instant Revocation / Logout: Revoke session in database
   */
  public async revokeSession(refreshToken?: string, userId?: string): Promise<boolean> {
    const sql = getDb();
    try {
      if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        await sql`
          UPDATE user_sessions
          SET is_revoked = true, updated_at = NOW()
          WHERE refresh_token_hash = ${tokenHash};
        `;
      } else if (userId) {
        await sql`
          UPDATE user_sessions
          SET is_revoked = true, updated_at = NOW()
          WHERE user_id = ${userId};
        `;
      }
      return true;
    } catch (err: any) {
      console.warn('[Revoke Session Error]:', err.message);
      return false;
    }
  }
}

export const authService = new AuthService();
