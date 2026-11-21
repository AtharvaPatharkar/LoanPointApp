import { getDb } from '../database/index.js';
import { cleanMobile } from '../validators/index.js';

export class LoanService {
  public async getApplicationsByMobile(mobile: string): Promise<any[]> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();
    const rows = (await sql`
      SELECT 
        la.id, la.applicant_name, la.mobile, la.loan_type, la.requested_amount, la.tenure_months, 
        la.status, la.status_updated_at, la.remarks, la.next_action, la.data, la.created_at,
        u.id AS user_id, u.full_name AS u_full_name, u.email AS u_email, u.city AS u_city,
        u.employment_type AS u_employment_type, u.monthly_income AS u_monthly_income,
        u.referral_code AS u_referral_code, u.referred_by AS u_referred_by,
        u.pan_number AS u_pan_number, u.aadhaar_number AS u_aadhaar_number, u.aadhaar_last_four AS u_aadhaar_last_four,
        u.company_name AS u_company_name, u.work_experience AS u_work_experience, u.salary_bank AS u_salary_bank,
        u.company_type AS u_company_type, u.has_credit_card AS u_has_credit_card, u.cibil_score_range AS u_cibil_score_range,
        u.dob AS u_dob, u.business_location AS u_business_location, u.registered_business AS u_registered_business,
        u.business_constitution AS u_business_constitution, u.business_vintage AS u_business_vintage,
        u.industry_sector AS u_industry_sector, u.annual_turnover AS u_annual_turnover,
        u.is_gst_registered AS u_is_gst_registered, u.gstin AS u_gstin,
        u.car_condition AS u_car_condition, u.car_make_model AS u_car_make_model, u.car_dealer_seller AS u_car_dealer_seller,
        u.car_on_road_price AS u_car_on_road_price, u.car_fuel_type AS u_car_fuel_type, u.car_mfg_year AS u_car_mfg_year,
        u.car_down_payment AS u_car_down_payment, u.property_type AS u_property_type, u.property_location AS u_property_location,
        u.est_property_value AS u_est_property_value, u.market_valuation AS u_market_valuation,
        u.property_ownership AS u_property_ownership, u.is_property_freehold AS u_is_property_freehold,
        u.has_existing_loan_on_property AS u_has_existing_loan_on_property, u.lap_purpose AS u_lap_purpose,
        u.land_holding_acres AS u_land_holding_acres, u.taluka_village AS u_taluka_village, u.gat_number AS u_gat_number,
        u.irrigation_source AS u_irrigation_source, u.primary_crops AS u_primary_crops, u.has_kcc_card AS u_has_kcc_card,
        u.farming_type AS u_farming_type, u.agri_loan_type AS u_agri_loan_type, u.social_category AS u_social_category,
        u.enterprise_name AS u_enterprise_name, u.enterprise_activity AS u_enterprise_activity,
        u.activity_sector AS u_activity_sector, u.business_premises AS u_business_premises,
        u.has_udyam_number AS u_has_udyam_number, u.udyam_reg_number AS u_udyam_reg_number,
        u.mudra_tier AS u_mudra_tier, u.mudra_card_required AS u_mudra_card_required,
        u.study_destination AS u_study_destination, u.course_level AS u_course_level,
        u.course_name AS u_course_name, u.institute_name AS u_institute_name,
        u.course_duration AS u_course_duration, u.admission_status AS u_admission_status,
        u.total_course_cost AS u_total_course_cost, u.co_applicant_relation AS u_co_applicant_relation,
        u.co_applicant_name AS u_co_applicant_name, u.moratorium_period AS u_moratorium_period,
        u.existing_emi AS u_existing_emi, u.loan_purpose AS u_loan_purpose,
        u.is_kyc_completed AS u_is_kyc_completed, u.documents AS u_documents
      FROM loan_applications la
      LEFT JOIN users u ON la.mobile = u.mobile
      WHERE la.mobile = ${cleaned}
      ORDER BY la.created_at DESC;
    `) as any[];
    return rows.map((r: any) => this.mapLoanRow(r));
  }

  public async getApplicationById(id: string): Promise<any | null> {
    const sql = getDb();
    const rows = (await sql`
      SELECT 
        la.id, la.applicant_name, la.mobile, la.loan_type, la.requested_amount, la.tenure_months, 
        la.status, la.status_updated_at, la.remarks, la.next_action, la.data, la.created_at,
        u.id AS user_id, u.full_name AS u_full_name, u.email AS u_email, u.city AS u_city,
        u.employment_type AS u_employment_type, u.monthly_income AS u_monthly_income,
        u.referral_code AS u_referral_code, u.referred_by AS u_referred_by,
        u.pan_number AS u_pan_number, u.aadhaar_number AS u_aadhaar_number, u.aadhaar_last_four AS u_aadhaar_last_four,
        u.company_name AS u_company_name, u.work_experience AS u_work_experience, u.salary_bank AS u_salary_bank,
        u.company_type AS u_company_type, u.has_credit_card AS u_has_credit_card, u.cibil_score_range AS u_cibil_score_range,
        u.dob AS u_dob, u.business_location AS u_business_location, u.registered_business AS u_registered_business,
        u.business_constitution AS u_business_constitution, u.business_vintage AS u_business_vintage,
        u.industry_sector AS u_industry_sector, u.annual_turnover AS u_annual_turnover,
        u.is_gst_registered AS u_is_gst_registered, u.gstin AS u_gstin,
        u.car_condition AS u_car_condition, u.car_make_model AS u_car_make_model, u.car_dealer_seller AS u_car_dealer_seller,
        u.car_on_road_price AS u_car_on_road_price, u.car_fuel_type AS u_car_fuel_type, u.car_mfg_year AS u_car_mfg_year,
        u.car_down_payment AS u_car_down_payment, u.property_type AS u_property_type, u.property_location AS u_property_location,
        u.est_property_value AS u_est_property_value, u.market_valuation AS u_market_valuation,
        u.property_ownership AS u_property_ownership, u.is_property_freehold AS u_is_property_freehold,
        u.has_existing_loan_on_property AS u_has_existing_loan_on_property, u.lap_purpose AS u_lap_purpose,
        u.land_holding_acres AS u_land_holding_acres, u.taluka_village AS u_taluka_village, u.gat_number AS u_gat_number,
        u.irrigation_source AS u_irrigation_source, u.primary_crops AS u_primary_crops, u.has_kcc_card AS u_has_kcc_card,
        u.farming_type AS u_farming_type, u.agri_loan_type AS u_agri_loan_type, u.social_category AS u_social_category,
        u.enterprise_name AS u_enterprise_name, u.enterprise_activity AS u_enterprise_activity,
        u.activity_sector AS u_activity_sector, u.business_premises AS u_business_premises,
        u.has_udyam_number AS u_has_udyam_number, u.udyam_reg_number AS u_udyam_reg_number,
        u.mudra_tier AS u_mudra_tier, u.mudra_card_required AS u_mudra_card_required,
        u.study_destination AS u_study_destination, u.course_level AS u_course_level,
        u.course_name AS u_course_name, u.institute_name AS u_institute_name,
        u.course_duration AS u_course_duration, u.admission_status AS u_admission_status,
        u.total_course_cost AS u_total_course_cost, u.co_applicant_relation AS u_co_applicant_relation,
        u.co_applicant_name AS u_co_applicant_name, u.moratorium_period AS u_moratorium_period,
        u.existing_emi AS u_existing_emi, u.loan_purpose AS u_loan_purpose,
        u.is_kyc_completed AS u_is_kyc_completed, u.documents AS u_documents
      FROM loan_applications la
      LEFT JOIN users u ON la.mobile = u.mobile
      WHERE la.id = ${id}
      LIMIT 1;
    `) as any[];
    if (!rows || rows.length === 0) return null;
    return this.mapLoanRow(rows[0]);
  }

  public async getAllApplications(): Promise<any[]> {
    const sql = getDb();
    const rows = (await sql`
      SELECT 
        la.id, la.applicant_name, la.mobile, la.loan_type, la.requested_amount, la.tenure_months, 
        la.status, la.status_updated_at, la.remarks, la.next_action, la.data, la.created_at,
        u.id AS user_id, u.full_name AS u_full_name, u.email AS u_email, u.city AS u_city,
        u.employment_type AS u_employment_type, u.monthly_income AS u_monthly_income,
        u.referral_code AS u_referral_code, u.referred_by AS u_referred_by,
        u.pan_number AS u_pan_number, u.aadhaar_number AS u_aadhaar_number, u.aadhaar_last_four AS u_aadhaar_last_four,
        u.company_name AS u_company_name, u.work_experience AS u_work_experience, u.salary_bank AS u_salary_bank,
        u.company_type AS u_company_type, u.has_credit_card AS u_has_credit_card, u.cibil_score_range AS u_cibil_score_range,
        u.dob AS u_dob, u.business_location AS u_business_location, u.registered_business AS u_registered_business,
        u.business_constitution AS u_business_constitution, u.business_vintage AS u_business_vintage,
        u.industry_sector AS u_industry_sector, u.annual_turnover AS u_annual_turnover,
        u.is_gst_registered AS u_is_gst_registered, u.gstin AS u_gstin,
        u.car_condition AS u_car_condition, u.car_make_model AS u_car_make_model, u.car_dealer_seller AS u_car_dealer_seller,
        u.car_on_road_price AS u_car_on_road_price, u.car_fuel_type AS u_car_fuel_type, u.car_mfg_year AS u_car_mfg_year,
        u.car_down_payment AS u_car_down_payment, u.property_type AS u_property_type, u.property_location AS u_property_location,
        u.est_property_value AS u_est_property_value, u.market_valuation AS u_market_valuation,
        u.property_ownership AS u_property_ownership, u.is_property_freehold AS u_is_property_freehold,
        u.has_existing_loan_on_property AS u_has_existing_loan_on_property, u.lap_purpose AS u_lap_purpose,
        u.land_holding_acres AS u_land_holding_acres, u.taluka_village AS u_taluka_village, u.gat_number AS u_gat_number,
        u.irrigation_source AS u_irrigation_source, u.primary_crops AS u_primary_crops, u.has_kcc_card AS u_has_kcc_card,
        u.farming_type AS u_farming_type, u.agri_loan_type AS u_agri_loan_type, u.social_category AS u_social_category,
        u.enterprise_name AS u_enterprise_name, u.enterprise_activity AS u_enterprise_activity,
        u.activity_sector AS u_activity_sector, u.business_premises AS u_business_premises,
        u.has_udyam_number AS u_has_udyam_number, u.udyam_reg_number AS u_udyam_reg_number,
        u.mudra_tier AS u_mudra_tier, u.mudra_card_required AS u_mudra_card_required,
        u.study_destination AS u_study_destination, u.course_level AS u_course_level,
        u.course_name AS u_course_name, u.institute_name AS u_institute_name,
        u.course_duration AS u_course_duration, u.admission_status AS u_admission_status,
        u.total_course_cost AS u_total_course_cost, u.co_applicant_relation AS u_co_applicant_relation,
        u.co_applicant_name AS u_co_applicant_name, u.moratorium_period AS u_moratorium_period,
        u.existing_emi AS u_existing_emi, u.loan_purpose AS u_loan_purpose,
        u.is_kyc_completed AS u_is_kyc_completed, u.documents AS u_documents
      FROM loan_applications la
      LEFT JOIN users u ON la.mobile = u.mobile
      ORDER BY la.created_at DESC;
    `) as any[];
    return rows.map((r: any) => this.mapLoanRow(r));
  }

  public async submitEnquiry(params: any): Promise<any> {
    const sql = getDb();
    const cleaned = cleanMobile(params.mobile);

    const prefixMap: Record<string, string> = {
      home: 'HL',
      car: 'CL',
      personal: 'PL',
      business: 'BL',
      education: 'EL',
      agriculture: 'AL',
      mortgage: 'ML',
      mudra: 'PMMY',
    };
    const prefix = prefixMap[params.loanType] || 'LP';
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(10 + Math.random() * 900)).padStart(4, '0');
    const generatedId = `${prefix}-${yyyy}${mm}${dd}-${seq}`;

    let detectedBank = params.bankName;
    if (!detectedBank) {
      const defaultBanks: Record<string, string> = {
        home: 'HDFC Bank',
        personal: 'ICICI Bank',
        business: 'State Bank of India',
        car: 'Axis Bank',
        education: 'Canara Bank',
        agriculture: 'State Bank of India',
        mortgage: 'HDFC Bank',
        mudra: 'Bank of Maharashtra',
      };
      detectedBank = defaultBanks[params.loanType] || 'State Bank of India';
    }

    const cleanAadhaar = params.aadhaarNumber ? String(params.aadhaarNumber).replace(/\D/g, '') : '';
    const fullAadhaar = cleanAadhaar.length === 12 ? cleanAadhaar : (params.aadhaar_number || null);

    const newApp = {
      id: generatedId,
      loanType: params.loanType,
      loanTypeName: params.loanTypeName || `${params.loanType.toUpperCase()} Loan`,
      requestedAmount: Number(params.requestedAmount),
      tenureMonths: Number(params.tenureMonths),
      submissionDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Application Sent',
      statusUpdatedDate: 'Just now',
      bankName: detectedBank,
      assignedManager: {
        name: 'Arvind Patil',
        role: 'Principal Loan Advisor & Branch Head',
        phone: '9545555999',
        email: 'info@loanpoint.in',
      },
      pendingDocuments: [],
      submittedDocuments: ['Initial KYC Form'],
      nextAction: 'Application submitted. Awaiting review and verification by Loan Point admin.',
      remarks: `Online portal enquiry. Stated monthly income: ₹${Number(params.monthlyIncome || 0).toLocaleString('en-IN')}.`,
      applicantName: params.applicantName,
      applicantMobile: cleaned,
      aadhaarNumber: fullAadhaar || undefined,
      documents: params.documents || [],
    };

    await sql`
      INSERT INTO loan_applications (id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, aadhaar_number, data)
      VALUES (
        ${newApp.id},
        ${newApp.applicantName},
        ${newApp.applicantMobile},
        ${newApp.loanType},
        ${newApp.requestedAmount},
        ${newApp.tenureMonths},
        ${newApp.status},
        ${fullAadhaar},
        ${JSON.stringify(newApp)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        applicant_name = EXCLUDED.applicant_name,
        mobile = EXCLUDED.mobile,
        loan_type = EXCLUDED.loan_type,
        requested_amount = EXCLUDED.requested_amount,
        tenure_months = EXCLUDED.tenure_months,
        status = EXCLUDED.status,
        aadhaar_number = EXCLUDED.aadhaar_number,
        data = EXCLUDED.data;
    `;

    // Smart Profile Sync: Automatically save/update user details in users database table
    // Non-destructive: if user already has information or submitted value is empty, keep existing
    const cleanPan = params.panNumber ? String(params.panNumber).trim().toUpperCase() : '';
    const cleanCity = params.city ? String(params.city).trim() : '';
    const cleanEmp = params.employmentType ? String(params.employmentType).trim() : '';
    const cleanIncome = Number(params.monthlyIncome) || 0;
    const cleanCompany = params.companyName ? String(params.companyName).trim() : '';
    const cleanExp = params.workExperience ? String(params.workExperience).trim() : '';
    const cleanBank = (params.salaryBank || params.bankName || '') ? String(params.salaryBank || params.bankName).trim() : '';
    const cleanCompType = params.companyType ? String(params.companyType).trim() : '';
    const cleanCreditCard = params.hasCreditCard ? String(params.hasCreditCard).trim() : '';
    const cleanCibil = params.cibilScoreRange ? String(params.cibilScoreRange).trim() : '';
    const cleanDob = params.dob ? String(params.dob).trim() : '';
    const cleanBizLocation = (params.businessLocation || params.city || '') ? String(params.businessLocation || params.city).trim() : '';
    const cleanRegBiz = (params.registeredBusiness || params.businessName || params.companyName || '') ? String(params.registeredBusiness || params.businessName || params.companyName).trim() : '';
    const cleanBizConst = (params.businessConstitution || params.businessType || params.companyType || '') ? String(params.businessConstitution || params.businessType || params.companyType).trim() : '';
    const cleanBizVintage = (params.businessVintage || params.workExperience || '') ? String(params.businessVintage || params.workExperience).trim() : '';
    const cleanIndSector = (params.industrySector || params.industryType || '') ? String(params.industrySector || params.industryType).trim() : '';
    const cleanTurnover = params.annualTurnover ? String(params.annualTurnover).trim() : '';
    const cleanIsGst = (params.isGstRegistered || params.hasGstRegistration || '') ? String(params.isGstRegistered || params.hasGstRegistration).trim() : '';
    const cleanGstin = (params.gstin || params.gstNumber || '') ? String(params.gstin || params.gstNumber).trim().toUpperCase() : '';

    // Car Loan params
    const cleanCarCondition = params.carCondition ? String(params.carCondition).trim() : '';
    const cleanCarMakeModel = params.carMakeModel ? String(params.carMakeModel).trim() : '';
    const cleanCarDealer = params.carDealerSeller || params.carDealerOrSeller ? String(params.carDealerSeller || params.carDealerOrSeller).trim() : '';
    const cleanCarPrice = params.carOnRoadPrice || params.onRoadPrice ? String(params.carOnRoadPrice || params.onRoadPrice).trim() : '';
    const cleanCarFuel = params.carFuelType || params.fuelType ? String(params.carFuelType || params.fuelType).trim() : '';
    const cleanCarYear = params.carMfgYear || params.manufacturingYear ? String(params.carMfgYear || params.manufacturingYear).trim() : '';
    const cleanCarDown = params.carDownPayment || params.downPayment ? String(params.carDownPayment || params.downPayment).trim() : '';

    // Mortgage Loan (LAP) & Home Loan params
    const cleanPropType = params.propertyType ? String(params.propertyType).trim() : '';
    const cleanPropLoc = (params.propertyLocation || params.city || '') ? String(params.propertyLocation || params.city).trim() : '';
    const cleanEstPropValue = (params.estPropertyValue || params.propertyValue || '') ? String(params.estPropertyValue || params.propertyValue).trim() : '';
    const cleanValuation = (params.marketValuation || params.propertyValue || '') ? String(params.marketValuation || params.propertyValue).trim() : '';
    const cleanOwnership = params.propertyOwnership ? String(params.propertyOwnership).trim() : '';
    const cleanFreehold = params.isPropertyFreehold ? String(params.isPropertyFreehold).trim() : '';
    const cleanExistingLoanProp = params.hasExistingLoanOnProperty ? String(params.hasExistingLoanOnProperty).trim() : '';
    const cleanLapPurpose = (params.lapPurpose || params.loanPurpose || '') ? String(params.lapPurpose || params.loanPurpose).trim() : '';

    // Agriculture Loan params
    const cleanLandAcres = params.landHoldingAcres ? String(params.landHoldingAcres).trim() : '';
    const cleanTaluka = params.talukaVillage ? String(params.talukaVillage).trim() : '';
    const cleanGatNumber = params.gatNumber ? String(params.gatNumber).trim() : '';
    const cleanIrrigation = params.irrigationSource ? String(params.irrigationSource).trim() : '';
    const cleanCrops = params.primaryCrops ? String(params.primaryCrops).trim() : '';
    const cleanKcc = params.hasKccCard ? String(params.hasKccCard).trim() : '';
    const cleanFarmingType = params.farmingType ? String(params.farmingType).trim() : '';
    const cleanAgriScheme = params.agriLoanType ? String(params.agriLoanType).trim() : '';

    // Mudra Loan params
    const cleanSocialCategory = params.socialCategory ? String(params.socialCategory).trim() : '';
    const cleanEnterpriseName = params.enterpriseName ? String(params.enterpriseName).trim() : '';
    const cleanEnterpriseActivity = params.enterpriseActivity ? String(params.enterpriseActivity).trim() : '';
    const cleanActivitySector = params.activitySector ? String(params.activitySector).trim() : '';
    const cleanPremises = params.businessPremises ? String(params.businessPremises).trim() : '';
    const cleanHasUdyam = params.hasUdyamNumber ? String(params.hasUdyamNumber).trim() : '';
    const cleanUdyamReg = params.udyamRegNumber ? String(params.udyamRegNumber).trim().toUpperCase() : '';
    const cleanMudraTier = params.mudraTier ? String(params.mudraTier).trim() : '';
    const cleanMudraCard = params.mudraCardRequired ? String(params.mudraCardRequired).trim() : '';

    // Education Loan params
    const cleanStudyDest = params.studyDestination ? String(params.studyDestination).trim() : '';
    const cleanCourseLevel = params.courseLevel ? String(params.courseLevel).trim() : '';
    const cleanCourseName = params.courseName ? String(params.courseName).trim() : '';
    const cleanInstituteName = params.instituteName ? String(params.instituteName).trim() : '';
    const cleanCourseDuration = params.courseDuration ? String(params.courseDuration).trim() : '';
    const cleanAdmissionStatus = params.admissionStatus ? String(params.admissionStatus).trim() : '';
    const cleanCourseCost = params.totalCourseCost ? String(params.totalCourseCost).trim() : '';
    const cleanCoApplicantRel = params.coApplicantRelation ? String(params.coApplicantRelation).trim() : '';
    const cleanCoApplicantName = params.coApplicantName ? String(params.coApplicantName).trim() : '';
    const cleanMoratorium = params.moratoriumPeriod ? String(params.moratoriumPeriod).trim() : '';

    // Personal Loan extras
    const cleanExistingEmi = params.existingEmi ? String(params.existingEmi).trim() : '';
    const cleanLoanPurpose = params.loanPurpose || params.purpose ? String(params.loanPurpose || params.purpose).trim() : '';

    await sql`
      UPDATE users
      SET 
        city = CASE WHEN (city IS NULL OR city = '') AND ${cleanCity} <> '' THEN ${cleanCity} ELSE city END,
        employment_type = CASE WHEN (employment_type IS NULL OR employment_type = '') AND ${cleanEmp} <> '' THEN ${cleanEmp} ELSE employment_type END,
        monthly_income = CASE WHEN (monthly_income IS NULL OR monthly_income = 0) AND ${cleanIncome} > 0 THEN ${cleanIncome} ELSE monthly_income END,
        pan_number = CASE WHEN (pan_number IS NULL OR pan_number = '') AND ${cleanPan} <> '' THEN ${cleanPan} ELSE pan_number END,
        aadhaar_number = CASE WHEN (aadhaar_number IS NULL OR aadhaar_number = '') AND ${fullAadhaar || ''} <> '' THEN ${fullAadhaar} ELSE aadhaar_number END,
        aadhaar_last_four = CASE WHEN (aadhaar_last_four IS NULL OR aadhaar_last_four = '') AND ${fullAadhaar || ''} <> '' THEN ${fullAadhaar ? fullAadhaar.slice(-4) : ''} ELSE aadhaar_last_four END,
        company_name = CASE WHEN (company_name IS NULL OR company_name = '') AND ${cleanCompany || cleanRegBiz || cleanEnterpriseName} <> '' THEN ${cleanCompany || cleanRegBiz || cleanEnterpriseName} ELSE company_name END,
        work_experience = CASE WHEN (work_experience IS NULL OR work_experience = '') AND ${cleanExp || cleanBizVintage} <> '' THEN ${cleanExp || cleanBizVintage} ELSE work_experience END,
        salary_bank = CASE WHEN (salary_bank IS NULL OR salary_bank = '') AND ${cleanBank} <> '' THEN ${cleanBank} ELSE salary_bank END,
        company_type = CASE WHEN (company_type IS NULL OR company_type = '') AND ${cleanCompType || cleanBizConst} <> '' THEN ${cleanCompType || cleanBizConst} ELSE company_type END,
        has_credit_card = CASE WHEN (has_credit_card IS NULL OR has_credit_card = '') AND ${cleanCreditCard} <> '' THEN ${cleanCreditCard} ELSE has_credit_card END,
        cibil_score_range = CASE WHEN (cibil_score_range IS NULL OR cibil_score_range = '') AND ${cleanCibil} <> '' THEN ${cleanCibil} ELSE cibil_score_range END,
        dob = CASE WHEN (dob IS NULL OR dob = '') AND ${cleanDob} <> '' THEN ${cleanDob} ELSE dob END,
        business_location = CASE WHEN (business_location IS NULL OR business_location = '') AND ${cleanBizLocation} <> '' THEN ${cleanBizLocation} ELSE business_location END,
        registered_business = CASE WHEN (registered_business IS NULL OR registered_business = '') AND ${cleanRegBiz || cleanEnterpriseName} <> '' THEN ${cleanRegBiz || cleanEnterpriseName} ELSE registered_business END,
        business_constitution = CASE WHEN (business_constitution IS NULL OR business_constitution = '') AND ${cleanBizConst} <> '' THEN ${cleanBizConst} ELSE business_constitution END,
        business_vintage = CASE WHEN (business_vintage IS NULL OR business_vintage = '') AND ${cleanBizVintage} <> '' THEN ${cleanBizVintage} ELSE business_vintage END,
        industry_sector = CASE WHEN (industry_sector IS NULL OR industry_sector = '') AND ${cleanIndSector || cleanActivitySector} <> '' THEN ${cleanIndSector || cleanActivitySector} ELSE industry_sector END,
        annual_turnover = CASE WHEN (annual_turnover IS NULL OR annual_turnover = '') AND ${cleanTurnover} <> '' THEN ${cleanTurnover} ELSE annual_turnover END,
        is_gst_registered = CASE WHEN (is_gst_registered IS NULL OR is_gst_registered = '') AND ${cleanIsGst} <> '' THEN ${cleanIsGst} ELSE is_gst_registered END,
        gstin = CASE WHEN (gstin IS NULL OR gstin = '') AND ${cleanGstin} <> '' THEN ${cleanGstin} ELSE gstin END,
        car_condition = CASE WHEN (car_condition IS NULL OR car_condition = '') AND ${cleanCarCondition} <> '' THEN ${cleanCarCondition} ELSE car_condition END,
        car_make_model = CASE WHEN (car_make_model IS NULL OR car_make_model = '') AND ${cleanCarMakeModel} <> '' THEN ${cleanCarMakeModel} ELSE car_make_model END,
        car_dealer_seller = CASE WHEN (car_dealer_seller IS NULL OR car_dealer_seller = '') AND ${cleanCarDealer} <> '' THEN ${cleanCarDealer} ELSE car_dealer_seller END,
        car_on_road_price = CASE WHEN (car_on_road_price IS NULL OR car_on_road_price = '') AND ${cleanCarPrice} <> '' THEN ${cleanCarPrice} ELSE car_on_road_price END,
        car_fuel_type = CASE WHEN (car_fuel_type IS NULL OR car_fuel_type = '') AND ${cleanCarFuel} <> '' THEN ${cleanCarFuel} ELSE car_fuel_type END,
        car_mfg_year = CASE WHEN (car_mfg_year IS NULL OR car_mfg_year = '') AND ${cleanCarYear} <> '' THEN ${cleanCarYear} ELSE car_mfg_year END,
        car_down_payment = CASE WHEN (car_down_payment IS NULL OR car_down_payment = '') AND ${cleanCarDown} <> '' THEN ${cleanCarDown} ELSE car_down_payment END,
        property_type = CASE WHEN (property_type IS NULL OR property_type = '') AND ${cleanPropType} <> '' THEN ${cleanPropType} ELSE property_type END,
        property_location = CASE WHEN (property_location IS NULL OR property_location = '') AND ${cleanPropLoc} <> '' THEN ${cleanPropLoc} ELSE property_location END,
        est_property_value = CASE WHEN (est_property_value IS NULL OR est_property_value = '') AND ${cleanEstPropValue} <> '' THEN ${cleanEstPropValue} ELSE est_property_value END,
        market_valuation = CASE WHEN (market_valuation IS NULL OR market_valuation = '') AND ${cleanValuation} <> '' THEN ${cleanValuation} ELSE market_valuation END,
        property_ownership = CASE WHEN (property_ownership IS NULL OR property_ownership = '') AND ${cleanOwnership} <> '' THEN ${cleanOwnership} ELSE property_ownership END,
        is_property_freehold = CASE WHEN (is_property_freehold IS NULL OR is_property_freehold = '') AND ${cleanFreehold} <> '' THEN ${cleanFreehold} ELSE is_property_freehold END,
        has_existing_loan_on_property = CASE WHEN (has_existing_loan_on_property IS NULL OR has_existing_loan_on_property = '') AND ${cleanExistingLoanProp} <> '' THEN ${cleanExistingLoanProp} ELSE has_existing_loan_on_property END,
        lap_purpose = CASE WHEN (lap_purpose IS NULL OR lap_purpose = '') AND ${cleanLapPurpose} <> '' THEN ${cleanLapPurpose} ELSE lap_purpose END,
        land_holding_acres = CASE WHEN (land_holding_acres IS NULL OR land_holding_acres = '') AND ${cleanLandAcres} <> '' THEN ${cleanLandAcres} ELSE land_holding_acres END,
        taluka_village = CASE WHEN (taluka_village IS NULL OR taluka_village = '') AND ${cleanTaluka} <> '' THEN ${cleanTaluka} ELSE taluka_village END,
        gat_number = CASE WHEN (gat_number IS NULL OR gat_number = '') AND ${cleanGatNumber} <> '' THEN ${cleanGatNumber} ELSE gat_number END,
        irrigation_source = CASE WHEN (irrigation_source IS NULL OR irrigation_source = '') AND ${cleanIrrigation} <> '' THEN ${cleanIrrigation} ELSE irrigation_source END,
        primary_crops = CASE WHEN (primary_crops IS NULL OR primary_crops = '') AND ${cleanCrops} <> '' THEN ${cleanCrops} ELSE primary_crops END,
        has_kcc_card = CASE WHEN (has_kcc_card IS NULL OR has_kcc_card = '') AND ${cleanKcc} <> '' THEN ${cleanKcc} ELSE has_kcc_card END,
        farming_type = CASE WHEN (farming_type IS NULL OR farming_type = '') AND ${cleanFarmingType} <> '' THEN ${cleanFarmingType} ELSE farming_type END,
        agri_loan_type = CASE WHEN (agri_loan_type IS NULL OR agri_loan_type = '') AND ${cleanAgriScheme} <> '' THEN ${cleanAgriScheme} ELSE agri_loan_type END,
        social_category = CASE WHEN (social_category IS NULL OR social_category = '') AND ${cleanSocialCategory} <> '' THEN ${cleanSocialCategory} ELSE social_category END,
        enterprise_name = CASE WHEN (enterprise_name IS NULL OR enterprise_name = '') AND ${cleanEnterpriseName} <> '' THEN ${cleanEnterpriseName} ELSE enterprise_name END,
        enterprise_activity = CASE WHEN (enterprise_activity IS NULL OR enterprise_activity = '') AND ${cleanEnterpriseActivity} <> '' THEN ${cleanEnterpriseActivity} ELSE enterprise_activity END,
        activity_sector = CASE WHEN (activity_sector IS NULL OR activity_sector = '') AND ${cleanActivitySector} <> '' THEN ${cleanActivitySector} ELSE activity_sector END,
        business_premises = CASE WHEN (business_premises IS NULL OR business_premises = '') AND ${cleanPremises} <> '' THEN ${cleanPremises} ELSE business_premises END,
        has_udyam_number = CASE WHEN (has_udyam_number IS NULL OR has_udyam_number = '') AND ${cleanHasUdyam} <> '' THEN ${cleanHasUdyam} ELSE has_udyam_number END,
        udyam_reg_number = CASE WHEN (udyam_reg_number IS NULL OR udyam_reg_number = '') AND ${cleanUdyamReg} <> '' THEN ${cleanUdyamReg} ELSE udyam_reg_number END,
        mudra_tier = CASE WHEN (mudra_tier IS NULL OR mudra_tier = '') AND ${cleanMudraTier} <> '' THEN ${cleanMudraTier} ELSE mudra_tier END,
        mudra_card_required = CASE WHEN (mudra_card_required IS NULL OR mudra_card_required = '') AND ${cleanMudraCard} <> '' THEN ${cleanMudraCard} ELSE mudra_card_required END,
        study_destination = CASE WHEN (study_destination IS NULL OR study_destination = '') AND ${cleanStudyDest} <> '' THEN ${cleanStudyDest} ELSE study_destination END,
        course_level = CASE WHEN (course_level IS NULL OR course_level = '') AND ${cleanCourseLevel} <> '' THEN ${cleanCourseLevel} ELSE course_level END,
        course_name = CASE WHEN (course_name IS NULL OR course_name = '') AND ${cleanCourseName} <> '' THEN ${cleanCourseName} ELSE course_name END,
        institute_name = CASE WHEN (institute_name IS NULL OR institute_name = '') AND ${cleanInstituteName} <> '' THEN ${cleanInstituteName} ELSE institute_name END,
        course_duration = CASE WHEN (course_duration IS NULL OR course_duration = '') AND ${cleanCourseDuration} <> '' THEN ${cleanCourseDuration} ELSE course_duration END,
        admission_status = CASE WHEN (admission_status IS NULL OR admission_status = '') AND ${cleanAdmissionStatus} <> '' THEN ${cleanAdmissionStatus} ELSE admission_status END,
        total_course_cost = CASE WHEN (total_course_cost IS NULL OR total_course_cost = '') AND ${cleanCourseCost} <> '' THEN ${cleanCourseCost} ELSE total_course_cost END,
        co_applicant_relation = CASE WHEN (co_applicant_relation IS NULL OR co_applicant_relation = '') AND ${cleanCoApplicantRel} <> '' THEN ${cleanCoApplicantRel} ELSE co_applicant_relation END,
        co_applicant_name = CASE WHEN (co_applicant_name IS NULL OR co_applicant_name = '') AND ${cleanCoApplicantName} <> '' THEN ${cleanCoApplicantName} ELSE co_applicant_name END,
        moratorium_period = CASE WHEN (moratorium_period IS NULL OR moratorium_period = '') AND ${cleanMoratorium} <> '' THEN ${cleanMoratorium} ELSE moratorium_period END,
        existing_emi = CASE WHEN (existing_emi IS NULL OR existing_emi = '') AND ${cleanExistingEmi} <> '' THEN ${cleanExistingEmi} ELSE existing_emi END,
        loan_purpose = CASE WHEN (loan_purpose IS NULL OR loan_purpose = '') AND ${cleanLoanPurpose} <> '' THEN ${cleanLoanPurpose} ELSE loan_purpose END,
        updated_at = NOW()
      WHERE mobile = ${cleaned};
    `;

    return newApp;
  }

  public async updateApplicationStatus(
    appId: string,
    status: string,
    remarks?: string,
    nextAction?: string,
    statusUpdatedDate?: string
  ): Promise<any> {
    const sql = getDb();
    const nowIso = new Date().toISOString();
    const updatedDate = statusUpdatedDate || new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    await sql`
      UPDATE loan_applications
      SET status = ${status},
          remarks = COALESCE(${remarks || null}, remarks),
          next_action = COALESCE(${nextAction || null}, next_action),
          status_updated_at = ${nowIso},
          data = jsonb_set(
            jsonb_set(
              COALESCE(data, '{}'::jsonb),
              '{statusUpdatedDate}',
              to_jsonb(${updatedDate}::text)
            ),
            '{status}',
            to_jsonb(${status}::text)
          ),
          updated_at = NOW()
      WHERE id = ${appId};
    `;

    return await this.getApplicationById(appId);
  }

  private mapLoanRow(r: any) {
    const parsedData = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
    const formattedUpdatedDate = r.status_updated_at
      ? new Date(r.status_updated_at).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : parsedData.statusUpdatedDate || 'Recently';

    const defaultBanks: Record<string, string> = {
      home: 'HDFC Bank',
      personal: 'ICICI Bank',
      business: 'State Bank of India',
      car: 'Axis Bank',
      education: 'Canara Bank',
      agriculture: 'State Bank of India',
      mortgage: 'HDFC Bank',
      mudra: 'Bank of Maharashtra',
    };
    const detectedBank = parsedData.bankName || defaultBanks[r.loan_type] || 'State Bank of India';

    const userDocs = typeof r.u_documents === 'string' ? JSON.parse(r.u_documents) : r.u_documents || [];
    const loanDocs = parsedData.documents || [];
    // Combine user profile documents and loan documents if loan documents are empty
    const mergedDocs = (Array.isArray(loanDocs) && loanDocs.length > 0) ? loanDocs : userDocs;

    const applicantProfile = r.user_id ? {
      id: r.user_id,
      name: r.u_full_name || r.applicant_name,
      mobile: r.mobile,
      email: r.u_email || '',
      city: r.u_city || '',
      employmentType: r.u_employment_type || 'Salaried',
      monthlyIncome: Number(r.u_monthly_income) || 0,
      referralCode: r.u_referral_code || '',
      referredBy: r.u_referred_by || undefined,
      panNumber: r.u_pan_number || undefined,
      aadhaarNumber: r.u_aadhaar_number || undefined,
      aadhaarLastFour: r.u_aadhaar_last_four || undefined,
      companyName: r.u_company_name || undefined,
      workExperience: r.u_work_experience || undefined,
      salaryBank: r.u_salary_bank || undefined,
      companyType: r.u_company_type || undefined,
      hasCreditCard: r.u_has_credit_card || undefined,
      cibilScoreRange: r.u_cibil_score_range || undefined,
      dob: r.u_dob || undefined,
      businessLocation: r.u_business_location || undefined,
      registeredBusiness: r.u_registered_business || undefined,
      businessConstitution: r.u_business_constitution || undefined,
      businessVintage: r.u_business_vintage || undefined,
      industrySector: r.u_industry_sector || undefined,
      annualTurnover: r.u_annual_turnover || undefined,
      isGstRegistered: r.u_is_gst_registered || undefined,
      gstin: r.u_gstin || undefined,
      carCondition: r.u_car_condition || undefined,
      carMakeModel: r.u_car_make_model || undefined,
      carDealerSeller: r.u_car_dealer_seller || undefined,
      carOnRoadPrice: r.u_car_on_road_price || undefined,
      carFuelType: r.u_car_fuel_type || undefined,
      carMfgYear: r.u_car_mfg_year || undefined,
      carDownPayment: r.u_car_down_payment || undefined,
      propertyType: r.u_property_type || undefined,
      propertyLocation: r.u_property_location || undefined,
      estPropertyValue: r.u_est_property_value || undefined,
      marketValuation: r.u_market_valuation || undefined,
      propertyOwnership: r.u_property_ownership || undefined,
      isPropertyFreehold: r.u_is_property_freehold || undefined,
      hasExistingLoanOnProperty: r.u_has_existing_loan_on_property || undefined,
      lapPurpose: r.u_lap_purpose || undefined,
      landHoldingAcres: r.u_land_holding_acres || undefined,
      talukaVillage: r.u_taluka_village || undefined,
      gatNumber: r.u_gat_number || undefined,
      irrigationSource: r.u_irrigation_source || undefined,
      primaryCrops: r.u_primary_crops || undefined,
      hasKccCard: r.u_has_kcc_card || undefined,
      farmingType: r.u_farming_type || undefined,
      agriLoanType: r.u_agri_loan_type || undefined,
      socialCategory: r.u_social_category || undefined,
      enterpriseName: r.u_enterprise_name || undefined,
      enterpriseActivity: r.u_enterprise_activity || undefined,
      activitySector: r.u_activity_sector || undefined,
      businessPremises: r.u_business_premises || undefined,
      hasUdyamNumber: r.u_has_udyam_number || undefined,
      udyamRegNumber: r.u_udyam_reg_number || undefined,
      mudraTier: r.u_mudra_tier || undefined,
      mudraCardRequired: r.u_mudra_card_required || undefined,
      studyDestination: r.u_study_destination || undefined,
      courseLevel: r.u_course_level || undefined,
      courseName: r.u_course_name || undefined,
      instituteName: r.u_institute_name || undefined,
      courseDuration: r.u_course_duration || undefined,
      admissionStatus: r.u_admission_status || undefined,
      totalCourseCost: r.u_total_course_cost || undefined,
      coApplicantRelation: r.u_co_applicant_relation || undefined,
      coApplicantName: r.u_co_applicant_name || undefined,
      moratoriumPeriod: r.u_moratorium_period || undefined,
      existingEmi: r.u_existing_emi || undefined,
      loanPurpose: r.u_loan_purpose || undefined,
      isKycCompleted: Boolean(r.u_is_kyc_completed),
      documents: userDocs,
    } : undefined;

    return {
      id: r.id,
      loanType: r.loan_type,
      loanTypeName: parsedData.loanTypeName || `${(r.loan_type || '').toUpperCase()} Loan`,
      requestedAmount: Number(r.requested_amount),
      tenureMonths: Number(r.tenure_months),
      submissionDate: parsedData.submissionDate || new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: r.status,
      statusUpdatedDate: formattedUpdatedDate,
      assignedManager: parsedData.assignedManager,
      pendingDocuments: parsedData.pendingDocuments || [],
      submittedDocuments: parsedData.submittedDocuments || [],
      nextAction: r.next_action || parsedData.nextAction || 'Under Review',
      remarks: r.remarks || parsedData.remarks || '',
      applicantName: r.applicant_name,
      applicantMobile: r.mobile,
      bankName: detectedBank,
      documents: mergedDocs,
      applicantProfile,
    };
  }
}

export const loanService = new LoanService();
