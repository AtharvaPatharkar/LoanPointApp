import { getDb } from '../database/index.js';
import { cleanMobile } from '../validators/index.js';

export class UserService {
  public async getProfileByUserId(userId: string): Promise<any | null> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, business_location, registered_business, business_constitution, business_vintage, industry_sector, annual_turnover, is_gst_registered, gstin, car_condition, car_make_model, car_dealer_seller, car_on_road_price, car_fuel_type, car_mfg_year, car_down_payment, property_type, property_location, est_property_value, market_valuation, property_ownership, is_property_freehold, has_existing_loan_on_property, lap_purpose, land_holding_acres, taluka_village, gat_number, irrigation_source, primary_crops, has_kcc_card, farming_type, agri_loan_type, social_category, enterprise_name, enterprise_activity, activity_sector, business_premises, has_udyam_number, udyam_reg_number, mudra_tier, mudra_card_required, study_destination, course_level, course_name, institute_name, course_duration, admission_status, total_course_cost, co_applicant_relation, co_applicant_name, moratorium_period, existing_emi, loan_purpose, is_kyc_completed, documents, created_at, updated_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1;
    `) as any[];
    if (!rows || rows.length === 0) return null;
    return this.mapUserRow(rows[0]);
  }

  public async getProfileByMobile(mobile: string): Promise<any | null> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();
    const rows = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, business_location, registered_business, business_constitution, business_vintage, industry_sector, annual_turnover, is_gst_registered, gstin, car_condition, car_make_model, car_dealer_seller, car_on_road_price, car_fuel_type, car_mfg_year, car_down_payment, property_type, property_location, est_property_value, market_valuation, property_ownership, is_property_freehold, has_existing_loan_on_property, lap_purpose, land_holding_acres, taluka_village, gat_number, irrigation_source, primary_crops, has_kcc_card, farming_type, agri_loan_type, social_category, enterprise_name, enterprise_activity, activity_sector, business_premises, has_udyam_number, udyam_reg_number, mudra_tier, mudra_card_required, study_destination, course_level, course_name, institute_name, course_duration, admission_status, total_course_cost, co_applicant_relation, co_applicant_name, moratorium_period, existing_emi, loan_purpose, is_kyc_completed, documents, created_at, updated_at
      FROM users
      WHERE mobile = ${cleaned}
      LIMIT 1;
    `) as any[];
    if (!rows || rows.length === 0) return null;
    return this.mapUserRow(rows[0]);
  }

  public async updateProfile(mobile: string, updates: any): Promise<any> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();

    const cleanAadhaar = updates.aadhaarNumber ? updates.aadhaarNumber.replace(/\D/g, '') : '';
    const fullAadhaar = cleanAadhaar.length === 12 ? cleanAadhaar : (updates.aadhaar_number || null);
    const lastFour = cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : (updates.aadhaar_last_four || null);
    const docsJson = (Array.isArray(updates.documents) && updates.documents.length > 0)
      ? JSON.stringify(updates.documents)
      : null;
    const isComplete = Boolean(
      updates.city &&
      updates.panNumber &&
      Number(updates.monthlyIncome) > 0 &&
      fullAadhaar &&
      fullAadhaar.length === 12
    );

    await sql`
      UPDATE users
      SET full_name = CASE WHEN ${updates.name || updates.fullName || ''} <> '' THEN ${updates.name || updates.fullName} ELSE full_name END,
          email = CASE WHEN ${updates.email || ''} <> '' THEN ${updates.email} ELSE email END,
          city = CASE WHEN ${updates.city || ''} <> '' THEN ${updates.city} ELSE city END,
          employment_type = CASE WHEN ${updates.employmentType || ''} <> '' THEN ${updates.employmentType} ELSE employment_type END,
          monthly_income = CASE WHEN ${updates.monthlyIncome !== undefined && updates.monthlyIncome !== null} THEN ${Number(updates.monthlyIncome) || 0} ELSE monthly_income END,
          pan_number = CASE WHEN ${updates.panNumber || ''} <> '' THEN ${updates.panNumber} ELSE pan_number END,
          aadhaar_number = CASE WHEN ${fullAadhaar || ''} <> '' THEN ${fullAadhaar} ELSE aadhaar_number END,
          aadhaar_last_four = CASE WHEN ${lastFour || ''} <> '' THEN ${lastFour} ELSE aadhaar_last_four END,
          company_name = CASE WHEN ${updates.companyName || ''} <> '' THEN ${updates.companyName} ELSE company_name END,
          work_experience = CASE WHEN ${updates.workExperience || ''} <> '' THEN ${updates.workExperience} ELSE work_experience END,
          salary_bank = CASE WHEN ${updates.salaryBank || updates.bankName || ''} <> '' THEN ${updates.salaryBank || updates.bankName} ELSE salary_bank END,
          company_type = CASE WHEN ${updates.companyType || ''} <> '' THEN ${updates.companyType} ELSE company_type END,
          has_credit_card = CASE WHEN ${updates.hasCreditCard || ''} <> '' THEN ${updates.hasCreditCard} ELSE has_credit_card END,
          cibil_score_range = CASE WHEN ${updates.cibilScoreRange || ''} <> '' THEN ${updates.cibilScoreRange} ELSE cibil_score_range END,
          dob = CASE WHEN ${updates.dob || ''} <> '' THEN ${updates.dob} ELSE dob END,
          business_location = CASE WHEN ${updates.businessLocation || ''} <> '' THEN ${updates.businessLocation} ELSE business_location END,
          registered_business = CASE WHEN ${updates.registeredBusiness || updates.businessName || ''} <> '' THEN ${updates.registeredBusiness || updates.businessName} ELSE registered_business END,
          business_constitution = CASE WHEN ${updates.businessConstitution || updates.businessType || ''} <> '' THEN ${updates.businessConstitution || updates.businessType} ELSE business_constitution END,
          business_vintage = CASE WHEN ${updates.businessVintage || ''} <> '' THEN ${updates.businessVintage} ELSE business_vintage END,
          industry_sector = CASE WHEN ${updates.industrySector || updates.industryType || ''} <> '' THEN ${updates.industrySector || updates.industryType} ELSE industry_sector END,
          annual_turnover = CASE WHEN ${updates.annualTurnover || ''} <> '' THEN ${updates.annualTurnover} ELSE annual_turnover END,
          is_gst_registered = CASE WHEN ${updates.isGstRegistered || updates.hasGstRegistration || ''} <> '' THEN ${updates.isGstRegistered || updates.hasGstRegistration} ELSE is_gst_registered END,
          gstin = CASE WHEN ${updates.gstin || updates.gstNumber || ''} <> '' THEN ${updates.gstin || updates.gstNumber} ELSE gstin END,
          documents = CASE WHEN ${docsJson || ''} <> '' THEN ${docsJson}::jsonb ELSE documents END,
          is_kyc_completed = CASE WHEN ${isComplete} THEN TRUE ELSE is_kyc_completed END,
          updated_at = NOW()
      WHERE mobile = ${cleaned};
    `;

    return await this.getProfileByMobile(cleaned);
  }

  public async getAllUsers(): Promise<any[]> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, business_location, registered_business, business_constitution, business_vintage, industry_sector, annual_turnover, is_gst_registered, gstin, car_condition, car_make_model, car_dealer_seller, car_on_road_price, car_fuel_type, car_mfg_year, car_down_payment, property_type, property_location, est_property_value, market_valuation, property_ownership, is_property_freehold, has_existing_loan_on_property, lap_purpose, land_holding_acres, taluka_village, gat_number, irrigation_source, primary_crops, has_kcc_card, farming_type, agri_loan_type, social_category, enterprise_name, enterprise_activity, activity_sector, business_premises, has_udyam_number, udyam_reg_number, mudra_tier, mudra_card_required, study_destination, course_level, course_name, institute_name, course_duration, admission_status, total_course_cost, co_applicant_relation, co_applicant_name, moratorium_period, existing_emi, loan_purpose, is_kyc_completed, documents, created_at, updated_at
      FROM users
      ORDER BY created_at DESC;
    `) as any[];
    return rows.map((r: any) => this.mapUserRow(r));
  }

  public async adminUpdateUser(userId: string, updates: any): Promise<any | null> {
    const sql = getDb();
    const cleanAadhaar = updates.aadhaarNumber ? updates.aadhaarNumber.replace(/\D/g, '') : '';
    const fullAadhaar = cleanAadhaar.length === 12 ? cleanAadhaar : (updates.aadhaar_number || null);
    const lastFour = cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : (updates.aadhaar_last_four || null);
    const docsJson = (Array.isArray(updates.documents) && updates.documents.length > 0)
      ? JSON.stringify(updates.documents)
      : null;
    const isKyc = updates.isKycCompleted !== undefined ? Boolean(updates.isKycCompleted) : null;

    await sql`
      UPDATE users
      SET full_name = CASE WHEN ${updates.name || updates.fullName || ''} <> '' THEN ${updates.name || updates.fullName} ELSE full_name END,
          email = CASE WHEN ${updates.email || ''} <> '' THEN ${updates.email} ELSE email END,
          city = CASE WHEN ${updates.city || ''} <> '' THEN ${updates.city} ELSE city END,
          employment_type = CASE WHEN ${updates.employmentType || ''} <> '' THEN ${updates.employmentType} ELSE employment_type END,
          monthly_income = CASE WHEN ${updates.monthlyIncome !== undefined && updates.monthlyIncome !== null} THEN ${Number(updates.monthlyIncome) || 0} ELSE monthly_income END,
          pan_number = CASE WHEN ${updates.panNumber || ''} <> '' THEN ${updates.panNumber} ELSE pan_number END,
          aadhaar_number = CASE WHEN ${fullAadhaar || ''} <> '' THEN ${fullAadhaar} ELSE aadhaar_number END,
          aadhaar_last_four = CASE WHEN ${lastFour || ''} <> '' THEN ${lastFour} ELSE aadhaar_last_four END,
          company_name = CASE WHEN ${updates.companyName !== undefined} THEN ${updates.companyName || ''} ELSE company_name END,
          company_type = CASE WHEN ${updates.companyType !== undefined} THEN ${updates.companyType || ''} ELSE company_type END,
          work_experience = CASE WHEN ${updates.workExperience !== undefined} THEN ${updates.workExperience || ''} ELSE work_experience END,
          salary_bank = CASE WHEN ${updates.salaryBank !== undefined} THEN ${updates.salaryBank || ''} ELSE salary_bank END,
          has_credit_card = CASE WHEN ${updates.hasCreditCard !== undefined} THEN ${updates.hasCreditCard || ''} ELSE has_credit_card END,
          cibil_score_range = CASE WHEN ${updates.cibilScoreRange !== undefined} THEN ${updates.cibilScoreRange || ''} ELSE cibil_score_range END,
          dob = CASE WHEN ${updates.dob !== undefined} THEN ${updates.dob || ''} ELSE dob END,
          registered_business = CASE WHEN ${updates.registeredBusiness !== undefined} THEN ${updates.registeredBusiness || ''} ELSE registered_business END,
          gstin = CASE WHEN ${updates.gstin !== undefined} THEN ${updates.gstin || ''} ELSE gstin END,
          documents = CASE WHEN ${docsJson || ''} <> '' THEN ${docsJson}::jsonb ELSE documents END,
          is_kyc_completed = CASE WHEN ${isKyc !== null} THEN ${isKyc} ELSE is_kyc_completed END,
          updated_at = NOW()
      WHERE id = ${userId};
    `;

    return await this.getProfileByUserId(userId);
  }

  public async adminCreateCustomer(payload: any): Promise<any> {
    const sql = getDb();
    const rawMobile = payload.mobile || '';
    const cleaned = cleanMobile(rawMobile);
    if (!cleaned || cleaned.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const name = (payload.name || payload.fullName || '').trim();
    if (!name) {
      throw new Error('Customer full name is required.');
    }

    // Check duplicate mobile
    const existing = (await sql`
      SELECT id, full_name, mobile FROM users WHERE mobile = ${cleaned} LIMIT 1;
    `) as any[];
    if (existing && existing.length > 0) {
      throw new Error(`A customer with mobile number ${cleaned} is already registered (${existing[0].full_name}).`);
    }

    // Generate unique referral code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newRefCode = 'LP';
    for (let i = 0; i < 6; i++) {
      newRefCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const collision = (await sql`SELECT id FROM users WHERE referral_code = ${newRefCode} LIMIT 1;`) as any[];
      if (!collision || collision.length === 0) break;
      newRefCode = 'LP' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const cleanAadhaar = payload.aadhaarNumber ? payload.aadhaarNumber.replace(/\D/g, '') : '';
    const fullAadhaar = cleanAadhaar.length === 12 ? cleanAadhaar : (payload.aadhaar_number || null);
    const lastFour = cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : (payload.aadhaar_last_four || null);
    const panNumber = (payload.panNumber || '').trim().toUpperCase() || null;
    const email = (payload.email || '').trim().toLowerCase() || null;
    const city = (payload.city || '').trim() || null;
    const employmentType = payload.employmentType || 'Salaried';
    const monthlyIncome = Number(payload.monthlyIncome) || 0;
    const isKyc = Boolean(payload.isKycCompleted);
    const docsJson = Array.isArray(payload.documents) ? JSON.stringify(payload.documents) : '[]';

    const insertResult = (await sql`
      INSERT INTO users (
        full_name,
        mobile,
        email,
        city,
        employment_type,
        monthly_income,
        pan_number,
        aadhaar_number,
        aadhaar_last_four,
        referral_code,
        is_kyc_completed,
        documents,
        created_at,
        updated_at
      ) VALUES (
        ${name},
        ${cleaned},
        ${email},
        ${city},
        ${employmentType},
        ${monthlyIncome},
        ${panNumber},
        ${fullAadhaar},
        ${lastFour},
        ${newRefCode},
        ${isKyc},
        ${docsJson}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, pan_number, aadhaar_last_four, aadhaar_number, is_kyc_completed, documents, created_at, updated_at;
    `) as any[];

    if (!insertResult || insertResult.length === 0) {
      throw new Error('Failed to create customer record in database.');
    }

    return this.mapUserRow(insertResult[0]);
  }

  public async adminDeleteCustomer(userId: string): Promise<{ success: boolean; deletedUser: any }> {
    const sql = getDb();
    const existing = await this.getProfileByUserId(userId);
    if (!existing) {
      throw new Error('Customer not found or already deleted.');
    }

    const cleaned = cleanMobile(existing.mobile);

    // 1. Archive customer record in deleted_users table for full historical auditing
    try {
      const docsJson = Array.isArray(existing.documents) ? JSON.stringify(existing.documents) : '[]';
      await sql`
        INSERT INTO deleted_users (
          original_user_id,
          full_name,
          mobile,
          email,
          city,
          employment_type,
          monthly_income,
          pan_number,
          aadhaar_number,
          referral_code,
          is_kyc_completed,
          documents,
          deleted_by,
          deleted_at,
          metadata
        ) VALUES (
          ${existing.id || userId},
          ${existing.name || null},
          ${cleaned},
          ${existing.email || null},
          ${existing.city || null},
          ${existing.employmentType || null},
          ${Number(existing.monthlyIncome) || 0},
          ${existing.panNumber || null},
          ${existing.aadhaarNumber || null},
          ${existing.referralCode || null},
          ${Boolean(existing.isKycCompleted)},
          ${docsJson}::jsonb,
          'admin',
          NOW(),
          ${JSON.stringify({ originalCreatedAt: existing.createdAt || null })}::jsonb
        );
      `;
    } catch (archiveErr: any) {
      console.warn('[UserService] Could not archive user into deleted_users table:', archiveErr.message);
    }

    // 2. Delete user sessions to revoke active tokens
    try {
      await sql`DELETE FROM user_sessions WHERE user_id = ${userId} OR mobile = ${cleaned};`;
    } catch (e: any) {
      console.warn('[UserService] Could not delete user_sessions:', e.message);
    }

    // 3. Unlink or clean up loan applications if any
    try {
      // Soft-unlink or retain loan records with an unlinked flag so financial auditing is not lost
      await sql`
        UPDATE loan_applications
        SET applicant_name = applicant_name || ' (Deleted Account)',
            remarks = COALESCE(remarks, '') || ' [Customer deleted by admin]'
        WHERE mobile = ${cleaned};
      `;
    } catch (e: any) {
      console.warn('[UserService] Could not update loan_applications on delete:', e.message);
    }

    // 4. Delete user record from users table
    await sql`DELETE FROM users WHERE id = ${userId};`;

    return {
      success: true,
      deletedUser: existing,
    };
  }

  public async saveUserDocument(mobile: string, documentItem: any): Promise<any[]> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();

    const user = await this.getProfileByMobile(cleaned);
    let docs: any[] = user?.documents || [];
    if (!Array.isArray(docs)) docs = [];

    docs = docs.filter((d: any) => d.id !== documentItem.id);
    docs.unshift(documentItem);

    await sql`
      UPDATE users
      SET documents = ${JSON.stringify(docs)}::jsonb,
          updated_at = NOW()
      WHERE mobile = ${cleaned};
    `;

    return docs;
  }

  public async deleteUserDocument(mobile: string, docId: string): Promise<any[]> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();

    const user = await this.getProfileByMobile(cleaned);
    let docs: any[] = user?.documents || [];
    if (!Array.isArray(docs)) docs = [];

    docs = docs.filter((d: any) => d.id !== docId);

    await sql`
      UPDATE users
      SET documents = ${JSON.stringify(docs)}::jsonb,
          updated_at = NOW()
      WHERE mobile = ${cleaned};
    `;

    return docs;
  }

  private mapUserRow(row: any) {
    const docs = typeof row.documents === 'string' ? JSON.parse(row.documents) : row.documents || [];
    const passportDoc = Array.isArray(docs)
      ? docs.find((d: any) => d.docKey === 'passport_photo' || d.name?.toLowerCase().includes('passport'))
      : undefined;

    return {
      id: row.id,
      name: row.full_name || 'Valued Customer',
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
      avatar: passportDoc?.fileUri || undefined,
      isKycCompleted: Boolean(row.is_kyc_completed),
      documents: Array.isArray(docs) ? docs : [],
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }
}

export const userService = new UserService();
