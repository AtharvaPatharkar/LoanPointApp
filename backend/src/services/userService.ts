import { getDb } from '../database/index.js';
import { cleanMobile } from '../validators/index.js';

export class UserService {
  public async getProfileByUserId(userId: string): Promise<any | null> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, business_location, registered_business, business_constitution, business_vintage, industry_sector, annual_turnover, is_gst_registered, gstin, car_condition, car_make_model, car_dealer_seller, car_on_road_price, car_fuel_type, car_mfg_year, car_down_payment, property_type, property_location, market_valuation, property_ownership, is_property_freehold, has_existing_loan_on_property, lap_purpose, land_holding_acres, taluka_village, gat_number, irrigation_source, primary_crops, has_kcc_card, farming_type, agri_loan_type, social_category, enterprise_name, enterprise_activity, activity_sector, business_premises, has_udyam_number, udyam_reg_number, mudra_tier, mudra_card_required, is_kyc_completed, documents, created_at, updated_at
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
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, business_location, registered_business, business_constitution, business_vintage, industry_sector, annual_turnover, is_gst_registered, gstin, car_condition, car_make_model, car_dealer_seller, car_on_road_price, car_fuel_type, car_mfg_year, car_down_payment, property_type, property_location, market_valuation, property_ownership, is_property_freehold, has_existing_loan_on_property, lap_purpose, land_holding_acres, taluka_village, gat_number, irrigation_source, primary_crops, has_kcc_card, farming_type, agri_loan_type, social_category, enterprise_name, enterprise_activity, activity_sector, business_premises, has_udyam_number, udyam_reg_number, mudra_tier, mudra_card_required, is_kyc_completed, documents, created_at, updated_at
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
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, company_name, work_experience, salary_bank, company_type, has_credit_card, cibil_score_range, dob, business_location, registered_business, business_constitution, business_vintage, industry_sector, annual_turnover, is_gst_registered, gstin, car_condition, car_make_model, car_dealer_seller, car_on_road_price, car_fuel_type, car_mfg_year, car_down_payment, property_type, property_location, market_valuation, property_ownership, is_property_freehold, has_existing_loan_on_property, lap_purpose, land_holding_acres, taluka_village, gat_number, irrigation_source, primary_crops, has_kcc_card, farming_type, agri_loan_type, social_category, enterprise_name, enterprise_activity, activity_sector, business_premises, has_udyam_number, udyam_reg_number, mudra_tier, mudra_card_required, is_kyc_completed, documents, created_at, updated_at
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
          documents = CASE WHEN ${docsJson || ''} <> '' THEN ${docsJson}::jsonb ELSE documents END,
          is_kyc_completed = CASE WHEN ${isKyc !== null} THEN ${isKyc} ELSE is_kyc_completed END,
          updated_at = NOW()
      WHERE id = ${userId};
    `;

    return await this.getProfileByUserId(userId);
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
