import { getDb } from '../database/index.js';
import { cleanMobile } from '../validators/index.js';

export class LoanService {
  public async getApplicationsByMobile(mobile: string): Promise<any[]> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();
    const rows = (await sql`
      SELECT id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, status_updated_at, remarks, next_action, data, created_at
      FROM loan_applications
      WHERE mobile = ${cleaned}
      ORDER BY created_at DESC;
    `) as any[];
    return rows.map((r: any) => this.mapLoanRow(r));
  }

  public async getApplicationById(id: string): Promise<any | null> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, status_updated_at, remarks, next_action, data, created_at
      FROM loan_applications
      WHERE id = ${id}
      LIMIT 1;
    `) as any[];
    if (!rows || rows.length === 0) return null;
    return this.mapLoanRow(rows[0]);
  }

  public async getAllApplications(): Promise<any[]> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, status_updated_at, remarks, next_action, data, created_at
      FROM loan_applications
      ORDER BY created_at DESC;
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
      documents: parsedData.documents || [],
    };
  }
}

export const loanService = new LoanService();
