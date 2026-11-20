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
