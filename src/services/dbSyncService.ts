import { UserProfile, LoanApplication, InsuranceApplication, ReferralLead } from '../types';
import { getDbClient, isDatabaseConfigured } from './neonDbService';

export class DbSyncService {
  /**
   * Find user in Neon DB by mobile number, or create if not exists
   */
  public async getOrCreateUserByMobile(mobile: string, defaultName = 'Valued Customer'): Promise<{ user: UserProfile; isFirstTime: boolean }> {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    if (!isDatabaseConfigured) {
      return {
        user: {
          id: `LP-CUST-${cleanMobile.slice(-4)}`,
          name: defaultName,
          mobile: cleanMobile,
          email: `${cleanMobile}@loanpoint.in`,
          city: '',
          pincode: '',
          employmentType: 'Salaried',
          monthlyIncome: 0,
          panNumber: '',
          aadhaarNumber: '',
          aadhaarLinked: false,
          cibilEstimateScore: 720,
          memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          referralCode: `LP${cleanMobile.slice(-4)}`,
          role: 'customer',
        },
        isFirstTime: true,
      };
    }

    const sql = getDbClient();

    // Check if user already exists
    const existing = await sql.query(
      `SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, is_kyc_completed, created_at
       FROM users
       WHERE mobile = $1
       LIMIT 1;`,
      [cleanMobile]
    );

    if (existing.length > 0) {
      const row = existing[0];
      return {
        user: {
          id: row.id,
          name: row.full_name,
          mobile: row.mobile,
          email: row.email || `${row.mobile}@loanpoint.in`,
          city: row.city || '',
          pincode: '',
          employmentType: (row.employment_type as any) || 'Salaried',
          monthlyIncome: Number(row.monthly_income) || 0,
          panNumber: row.pan_number || '',
          aadhaarNumber: row.aadhaar_last_four ? `XXXX-XXXX-${row.aadhaar_last_four}` : '',
          aadhaarLinked: Boolean(row.aadhaar_last_four),
          cibilEstimateScore: 740,
          memberSince: new Date(row.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          referralCode: row.referral_code || `LP${cleanMobile.slice(-4)}`,
          referredBy: row.referred_by || undefined,
          role: 'customer',
        },
        isFirstTime: !row.is_kyc_completed && !row.city,
      };
    }

    // Insert new user into Neon Postgres
    const newRefCode = `LP${cleanMobile.slice(-4)}`;
    const inserted = await sql.query(
      `INSERT INTO users (full_name, mobile, email, referral_code, is_kyc_completed)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, full_name, mobile, email, referral_code, created_at;`,
      [defaultName, cleanMobile, `${cleanMobile}@loanpoint.in`, newRefCode]
    );

    const newRow = inserted[0];
    return {
      user: {
        id: newRow.id,
        name: newRow.full_name,
        mobile: newRow.mobile,
        email: newRow.email,
        city: '',
        pincode: '',
        employmentType: 'Salaried',
        monthlyIncome: 0,
        panNumber: '',
        aadhaarNumber: '',
        aadhaarLinked: false,
        cibilEstimateScore: 720,
        memberSince: new Date(newRow.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        referralCode: newRow.referral_code,
        role: 'customer',
      },
      isFirstTime: true,
    };
  }

  /**
   * Update User Profile in Neon DB
   */
  public async updateUserProfile(user: UserProfile): Promise<void> {
    if (!isDatabaseConfigured) return;
    try {
      const sql = getDbClient();
      const lastFour = user.aadhaarNumber ? user.aadhaarNumber.replace(/\D/g, '').slice(-4) : null;
      const isComplete = Boolean(user.city && user.panNumber && (user.monthlyIncome > 0));

      await sql.query(
        `UPDATE users
         SET full_name = COALESCE(NULLIF($1, ''), full_name),
             email = COALESCE(NULLIF($2, ''), email),
             city = COALESCE(NULLIF($3, ''), city),
             employment_type = COALESCE(NULLIF($4, ''), employment_type),
             monthly_income = CASE WHEN $5::numeric > 0 THEN $5::numeric ELSE monthly_income END,
             pan_number = COALESCE(NULLIF($6, ''), pan_number),
             aadhaar_last_four = COALESCE(NULLIF($7, ''), aadhaar_last_four),
             is_kyc_completed = CASE WHEN $8::boolean THEN TRUE ELSE is_kyc_completed END,
             updated_at = NOW()
         WHERE mobile = $9;`,
        [
          user.name || '',
          user.email || '',
          user.city || '',
          user.employmentType || '',
          user.monthlyIncome || 0,
          user.panNumber || '',
          lastFour || '',
          isComplete,
          user.mobile,
        ]
      );
    } catch (err) {
      console.warn('Neon DB profile update error:', err);
    }
  }

  /**
   * Sync profile data submitted from any loan application form to User profile in DB
   */
  public async syncUserProfileFromApplication(params: {
    mobile: string;
    applicantName?: string;
    email?: string;
    city?: string;
    employmentType?: string;
    monthlyIncome?: number;
    panNumber?: string;
    aadhaarNumber?: string;
  }): Promise<void> {
    if (!isDatabaseConfigured) return;
    try {
      const sql = getDbClient();
      const cleanMobile = params.mobile.replace(/\D/g, '').slice(-10);
      const lastFour = params.aadhaarNumber ? params.aadhaarNumber.replace(/\D/g, '').slice(-4) : null;

      await sql.query(
        `UPDATE users
         SET full_name = COALESCE(NULLIF($1, ''), full_name),
             email = COALESCE(NULLIF($2, ''), email),
             city = COALESCE(NULLIF($3, ''), city),
             employment_type = COALESCE(NULLIF($4, ''), employment_type),
             monthly_income = CASE WHEN $5::numeric > 0 THEN $5::numeric ELSE monthly_income END,
             pan_number = COALESCE(NULLIF($6, ''), pan_number),
             aadhaar_last_four = COALESCE(NULLIF($7, ''), aadhaar_last_four),
             updated_at = NOW()
         WHERE mobile = $8;`,
        [
          params.applicantName || '',
          params.email || '',
          params.city || '',
          params.employmentType || '',
          params.monthlyIncome || 0,
          params.panNumber || '',
          lastFour || '',
          cleanMobile,
        ]
      );
    } catch (err) {
      console.warn('Neon DB syncUserProfileFromApplication error:', err);
    }
  }

  /**
   * Fetch applications for a specific user by mobile number
   */
  public async getApplicationsByMobile(mobile: string): Promise<LoanApplication[]> {
    if (!isDatabaseConfigured) return [];
    try {
      const sql = getDbClient();
      const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
      const rows = await sql.query(
        `SELECT id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, status_updated_at, remarks, next_action, data, created_at
         FROM loan_applications
         WHERE mobile = $1
         ORDER BY created_at DESC;`,
        [cleanMobile]
      );

      return rows.map((r: any) => {
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

        return {
          id: r.id,
          loanType: r.loan_type,
          loanTypeName: parsedData.loanTypeName || `${r.loan_type.toUpperCase()} Loan`,
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
          bankName: parsedData.bankName,
        } as LoanApplication;
      });
    } catch (err) {
      console.warn('Neon DB getApplicationsByMobile error:', err);
      return [];
    }
  }
  public async getAllApplications(): Promise<LoanApplication[]> {
    if (!isDatabaseConfigured) return [];
    try {
      const sql = getDbClient();
      const rows = await sql.query(
        `SELECT id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, data, created_at
         FROM loan_applications
         ORDER BY created_at DESC;`
      );

      return rows.map((r: any) => {
        const parsedData = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          loanType: r.loan_type,
          loanTypeName: parsedData.loanTypeName || `${r.loan_type.toUpperCase()} Loan`,
          requestedAmount: Number(r.requested_amount),
          tenureMonths: Number(r.tenure_months),
          submissionDate: parsedData.submissionDate || new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: r.status,
          statusUpdatedDate: parsedData.statusUpdatedDate || 'Recently',
          assignedManager: parsedData.assignedManager,
          pendingDocuments: parsedData.pendingDocuments || [],
          submittedDocuments: parsedData.submittedDocuments || [],
          nextAction: parsedData.nextAction || 'Under Review',
          remarks: parsedData.remarks || '',
          applicantName: r.applicant_name,
          applicantMobile: r.mobile,
          bankName: parsedData.bankName,
        } as LoanApplication;
      });
    } catch (err) {
      console.warn('Neon DB fetch applications error:', err);
      return [];
    }
  }

  /**
   * Update loan application status in Neon DB with timestamp and reasons
   */
  public async updateApplicationStatus(
    appId: string,
    status: string,
    remarks?: string,
    nextAction?: string,
    statusUpdatedDate?: string
  ): Promise<void> {
    if (!isDatabaseConfigured) return;
    try {
      const sql = getDbClient();
      const nowIso = new Date().toISOString();
      const updatedDate = statusUpdatedDate || new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      await sql.query(
        `UPDATE loan_applications
         SET status = $1,
             remarks = COALESCE($2, remarks),
             next_action = COALESCE($3, next_action),
             status_updated_at = $4,
             data = jsonb_set(
               jsonb_set(
                 COALESCE(data, '{}'::jsonb),
                 '{statusUpdatedDate}',
                 to_jsonb($5::text)
               ),
               '{status}',
               to_jsonb($1::text)
             ),
             updated_at = NOW()
         WHERE id = $6;`,
        [status, remarks || null, nextAction || null, nowIso, updatedDate, appId]
      );
    } catch (err) {
      console.warn('Neon DB update status error:', err);
    }
  }

  /**
   * Save a new Insurance Application / Request to Neon DB
   */
  public async createInsuranceApplication(
    app: {
      applicantName: string;
      mobile: string;
      insuranceType: string;
      insuranceTypeName?: string;
      details?: Record<string, any>;
      userId?: string;
    }
  ): Promise<InsuranceApplication> {
    const cleanMobile = app.mobile.replace(/\D/g, '').slice(-10);
    const appId = `INS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const initialStatus = 'Request Received';

    const insRecord: InsuranceApplication = {
      id: appId,
      userId: app.userId || null,
      applicantName: app.applicantName,
      mobile: cleanMobile,
      insuranceType: app.insuranceType,
      insuranceTypeName: app.insuranceTypeName || app.insuranceType,
      details: app.details || {},
      status: initialStatus,
      statusUpdatedAt: nowIso,
      remarks: 'Application received. Insurance advisor will review and contact you with optimal quotes.',
      nextAction: 'Agent assigned for plan comparison',
      createdAt: nowIso,
    };

    if (!isDatabaseConfigured) return insRecord;

    try {
      const sql = getDbClient();
      await sql.query(
        `INSERT INTO insurance_applications (
          id, user_id, applicant_name, mobile, insurance_type, details, status, remarks, next_action, status_updated_at, created_at, updated_at
        ) VALUES (
          $1,
          CASE WHEN $2::text IS NOT NULL AND $2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $2::uuid ELSE NULL END,
          $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET details = EXCLUDED.details,
            updated_at = NOW();`,
        [
          insRecord.id,
          insRecord.userId || null,
          insRecord.applicantName,
          insRecord.mobile,
          insRecord.insuranceType,
          JSON.stringify(insRecord.details || {}),
          insRecord.status,
          insRecord.remarks || null,
          insRecord.nextAction || null,
          nowIso,
        ]
      );
    } catch (err) {
      console.warn('Neon DB createInsuranceApplication error:', err);
    }

    return insRecord;
  }

  /**
   * Fetch all insurance applications (for Admin)
   */
  public async getAllInsuranceApplications(): Promise<InsuranceApplication[]> {
    if (!isDatabaseConfigured) return [];
    try {
      const sql = getDbClient();
      const rows = await sql.query(
        `SELECT id, user_id, applicant_name, mobile, insurance_type, details, status, remarks, next_action, status_updated_at, created_at
         FROM insurance_applications
         ORDER BY created_at DESC;`
      );

      return rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        applicantName: r.applicant_name,
        mobile: r.mobile,
        insuranceType: r.insurance_type,
        insuranceTypeName: r.details?.insuranceTypeName || r.insurance_type,
        details: typeof r.details === 'string' ? JSON.parse(r.details) : (r.details || {}),
        status: r.status,
        remarks: r.remarks || undefined,
        nextAction: r.next_action || undefined,
        statusUpdatedAt: r.status_updated_at || r.created_at,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Neon DB getAllInsuranceApplications error:', err);
      return [];
    }
  }

  /**
   * Fetch insurance applications for a specific user mobile
   */
  public async getInsuranceApplicationsByMobile(mobile: string): Promise<InsuranceApplication[]> {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!isDatabaseConfigured) return [];
    try {
      const sql = getDbClient();
      const rows = await sql.query(
        `SELECT id, user_id, applicant_name, mobile, insurance_type, details, status, remarks, next_action, status_updated_at, created_at
         FROM insurance_applications
         WHERE mobile = $1
         ORDER BY created_at DESC;`,
        [cleanMobile]
      );

      return rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        applicantName: r.applicant_name,
        mobile: r.mobile,
        insuranceType: r.insurance_type,
        insuranceTypeName: r.details?.insuranceTypeName || r.insurance_type,
        details: typeof r.details === 'string' ? JSON.parse(r.details) : (r.details || {}),
        status: r.status,
        remarks: r.remarks || undefined,
        nextAction: r.next_action || undefined,
        statusUpdatedAt: r.status_updated_at || r.created_at,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Neon DB getInsuranceApplicationsByMobile error:', err);
      return [];
    }
  }

  /**
   * Update status, remarks, and timestamp for an insurance application (Admin action)
   */
  public async updateInsuranceApplicationStatus(
    appId: string,
    status: string,
    remarks?: string,
    nextAction?: string,
    statusUpdatedDate?: string
  ): Promise<void> {
    if (!isDatabaseConfigured) return;
    try {
      const sql = getDbClient();
      const nowIso = statusUpdatedDate || new Date().toISOString();

      await sql.query(
        `UPDATE insurance_applications
         SET status = $1,
             remarks = COALESCE($2, remarks),
             next_action = COALESCE($3, next_action),
             status_updated_at = $4,
             updated_at = NOW()
         WHERE id = $5;`,
        [status, remarks || null, nextAction || null, nowIso, appId]
      );
    } catch (err) {
      console.warn('Neon DB updateInsuranceApplicationStatus error:', err);
    }
  }

  /**
   * Create a new Referral Lead in Neon DB
   */
  public async createReferralLead(lead: {
    referrerMobile: string;
    referrerUserId?: string;
    friendName: string;
    friendMobile: string;
    loanProduct: string;
    city: string;
    loanAmount?: number;
  }): Promise<ReferralLead> {
    const cleanRefMobile = lead.referrerMobile.replace(/\D/g, '').slice(-10);
    const cleanFriendMobile = lead.friendMobile.replace(/\D/g, '').slice(-10);
    const leadId = `REF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const initialStatus = 'Referral Submitted';

    const newLead: ReferralLead = {
      id: leadId,
      referrerUserId: lead.referrerUserId || null,
      referrerMobile: cleanRefMobile,
      friendName: lead.friendName,
      friendMobile: cleanFriendMobile,
      loanProduct: lead.loanProduct,
      city: lead.city,
      loanAmount: lead.loanAmount || 0,
      status: initialStatus,
      payoutAmount: 0,
      payoutStatus: 'Pending',
      remarks: 'Referral submitted. Loan executive will contact candidate.',
      nextAction: 'Loan Point team connecting with lead',
      statusUpdatedAt: nowIso,
      createdAt: nowIso,
    };

    if (!isDatabaseConfigured) return newLead;

    try {
      const sql = getDbClient();
      await sql.query(
        `INSERT INTO referral_leads (
          id, referrer_user_id, referrer_mobile, friend_name, friend_mobile, loan_product, city, loan_amount, status, payout_amount, payout_status, remarks, next_action, status_updated_at, created_at, updated_at
        ) VALUES (
          $1,
          CASE WHEN $2::text IS NOT NULL AND $2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $2::uuid ELSE NULL END,
          $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING;`,
        [
          newLead.id,
          newLead.referrerUserId || null,
          newLead.referrerMobile,
          newLead.friendName,
          newLead.friendMobile,
          newLead.loanProduct,
          newLead.city,
          newLead.loanAmount,
          newLead.status,
          newLead.payoutAmount,
          newLead.payoutStatus,
          newLead.remarks || null,
          newLead.nextAction || null,
          nowIso,
        ]
      );
    } catch (err) {
      console.warn('Neon DB createReferralLead error:', err);
    }

    return newLead;
  }

  /**
   * Get all referral leads (for Admin)
   */
  public async getAllReferralLeads(): Promise<ReferralLead[]> {
    if (!isDatabaseConfigured) return [];
    try {
      const sql = getDbClient();
      const rows = await sql.query(
        `SELECT id, referrer_user_id, referrer_mobile, friend_name, friend_mobile, loan_product, city, loan_amount, status, payout_amount, payout_status, remarks, next_action, status_updated_at, created_at
         FROM referral_leads
         ORDER BY created_at DESC;`
      );

      return rows.map((r: any) => ({
        id: r.id,
        referrerUserId: r.referrer_user_id,
        referrerMobile: r.referrer_mobile,
        friendName: r.friend_name,
        friendMobile: r.friend_mobile,
        loanProduct: r.loan_product,
        city: r.city,
        loanAmount: Number(r.loan_amount) || 0,
        status: r.status,
        payoutAmount: Number(r.payout_amount) || 0,
        payoutStatus: r.payout_status || 'Pending',
        remarks: r.remarks || undefined,
        nextAction: r.next_action || undefined,
        statusUpdatedAt: r.status_updated_at || r.created_at,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Neon DB getAllReferralLeads error:', err);
      return [];
    }
  }

  /**
   * Get referral leads submitted by a user mobile
   */
  public async getReferralLeadsByReferrer(referrerMobile: string): Promise<ReferralLead[]> {
    const cleanMobile = referrerMobile.replace(/\D/g, '').slice(-10);
    if (!isDatabaseConfigured) return [];
    try {
      const sql = getDbClient();
      const rows = await sql.query(
        `SELECT id, referrer_user_id, referrer_mobile, friend_name, friend_mobile, loan_product, city, loan_amount, status, payout_amount, payout_status, remarks, next_action, status_updated_at, created_at
         FROM referral_leads
         WHERE referrer_mobile = $1
         ORDER BY created_at DESC;`,
        [cleanMobile]
      );

      return rows.map((r: any) => ({
        id: r.id,
        referrerUserId: r.referrer_user_id,
        referrerMobile: r.referrer_mobile,
        friendName: r.friend_name,
        friendMobile: r.friend_mobile,
        loanProduct: r.loan_product,
        city: r.city,
        loanAmount: Number(r.loan_amount) || 0,
        status: r.status,
        payoutAmount: Number(r.payout_amount) || 0,
        payoutStatus: r.payout_status || 'Pending',
        remarks: r.remarks || undefined,
        nextAction: r.next_action || undefined,
        statusUpdatedAt: r.status_updated_at || r.created_at,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Neon DB getReferralLeadsByReferrer error:', err);
      return [];
    }
  }

  /**
   * Update referral status and payout by Admin
   */
  public async updateReferralLeadStatus(
    leadId: string,
    status: string,
    remarks?: string,
    nextAction?: string,
    payoutAmount?: number,
    payoutStatus?: string,
    statusUpdatedDate?: string
  ): Promise<void> {
    if (!isDatabaseConfigured) return;
    try {
      const sql = getDbClient();
      const nowIso = statusUpdatedDate || new Date().toISOString();

      await sql.query(
        `UPDATE referral_leads
         SET status = $1,
             remarks = COALESCE($2, remarks),
             next_action = COALESCE($3, next_action),
             payout_amount = COALESCE($4, payout_amount),
             payout_status = COALESCE($5, payout_status),
             status_updated_at = $6,
             updated_at = NOW()
         WHERE id = $7;`,
        [
          status,
          remarks || null,
          nextAction || null,
          payoutAmount !== undefined ? payoutAmount : null,
          payoutStatus || null,
          nowIso,
          leadId,
        ]
      );
    } catch (err) {
      console.warn('Neon DB updateReferralLeadStatus error:', err);
    }
  }
}

export const dbSyncService = new DbSyncService();
