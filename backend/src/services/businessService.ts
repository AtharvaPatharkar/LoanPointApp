import { getDb } from '../database/index.js';
import { cleanMobile } from '../validators/index.js';

export class BusinessService {
  // Insurance
  public async createInsuranceApplication(data: {
    applicantName: string;
    mobile: string;
    insuranceType: string;
    details?: any;
    userId?: string;
  }): Promise<any> {
    const sql = getDb();
    const cleaned = cleanMobile(data.mobile);
    const appId = `INS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const initialStatus = 'Request Received';

    const insRecord = {
      id: appId,
      userId: data.userId || null,
      applicantName: data.applicantName,
      mobile: cleaned,
      insuranceType: data.insuranceType,
      details: data.details || {},
      status: initialStatus,
      statusUpdatedAt: nowIso,
      remarks: 'Application received. Insurance advisor will review and contact you with optimal quotes.',
      nextAction: 'Agent assigned for plan comparison',
      createdAt: nowIso,
    };

    await sql`
      INSERT INTO insurance_applications (
        id, user_id, applicant_name, mobile, insurance_type, details, status, remarks, next_action, status_updated_at, created_at, updated_at
      ) VALUES (
        ${insRecord.id},
        ${insRecord.userId ? sql`${insRecord.userId}::uuid` : null},
        ${insRecord.applicantName},
        ${insRecord.mobile},
        ${insRecord.insuranceType},
        ${JSON.stringify(insRecord.details)}::jsonb,
        ${insRecord.status},
        ${insRecord.remarks},
        ${insRecord.nextAction},
        ${nowIso},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET details = EXCLUDED.details,
          updated_at = NOW();
    `;

    return insRecord;
  }

  public async getInsuranceByMobile(mobile: string): Promise<any[]> {
    const sql = getDb();
    const cleaned = cleanMobile(mobile);
    const rows = (await sql`
      SELECT id, user_id, applicant_name, mobile, insurance_type, details, status, remarks, next_action, status_updated_at, created_at
      FROM insurance_applications
      WHERE mobile = ${cleaned}
      ORDER BY created_at DESC;
    `) as any[];
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
  }

  public async getAllInsurance(): Promise<any[]> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, user_id, applicant_name, mobile, insurance_type, details, status, remarks, next_action, status_updated_at, created_at
      FROM insurance_applications
      ORDER BY created_at DESC;
    `) as any[];
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
  }

  public async updateInsuranceStatus(appId: string, status: string, remarks?: string, nextAction?: string): Promise<void> {
    const sql = getDb();
    const nowIso = new Date().toISOString();
    await sql`
      UPDATE insurance_applications
      SET status = ${status},
          remarks = COALESCE(${remarks || null}, remarks),
          next_action = COALESCE(${nextAction || null}, next_action),
          status_updated_at = ${nowIso},
          updated_at = NOW()
      WHERE id = ${appId};
    `;
  }

  // Referrals
  public async createReferralLead(lead: {
    referrerMobile: string;
    referrerUserId?: string;
    friendName: string;
    friendMobile: string;
    loanProduct: string;
    city: string;
    loanAmount?: number;
  }): Promise<any> {
    const sql = getDb();
    const cleanRefMobile = cleanMobile(lead.referrerMobile);
    const cleanFriendMobile = cleanMobile(lead.friendMobile);
    const leadId = `REF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const initialStatus = 'Referral Submitted';

    const newLead = {
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

    await sql`
      INSERT INTO referral_leads (
        id, referrer_user_id, referrer_mobile, friend_name, friend_mobile, loan_product, city, loan_amount, status, payout_amount, payout_status, remarks, next_action, status_updated_at, created_at, updated_at
      ) VALUES (
        ${newLead.id},
        ${newLead.referrerUserId ? sql`${newLead.referrerUserId}::uuid` : null},
        ${newLead.referrerMobile},
        ${newLead.friendName},
        ${newLead.friendMobile},
        ${newLead.loanProduct},
        ${newLead.city},
        ${newLead.loanAmount},
        ${newLead.status},
        ${newLead.payoutAmount},
        ${newLead.payoutStatus},
        ${newLead.remarks},
        ${newLead.nextAction},
        ${nowIso},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    return newLead;
  }

  public async getReferralsByReferrer(referrerMobile: string): Promise<any[]> {
    const sql = getDb();
    const cleanRef = cleanMobile(referrerMobile);
    const rows = (await sql`
      SELECT id, referrer_user_id, referrer_mobile, friend_name, friend_mobile, loan_product, city, loan_amount, status, payout_amount, payout_status, remarks, next_action, status_updated_at, created_at
      FROM referral_leads
      WHERE referrer_mobile = ${cleanRef}
      ORDER BY created_at DESC;
    `) as any[];
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
  }

  public async getAllReferrals(): Promise<any[]> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, referrer_user_id, referrer_mobile, friend_name, friend_mobile, loan_product, city, loan_amount, status, payout_amount, payout_status, remarks, next_action, status_updated_at, created_at
      FROM referral_leads
      ORDER BY created_at DESC;
    `) as any[];
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
  }

  public async updateReferralStatus(
    leadId: string,
    status: string,
    remarks?: string,
    nextAction?: string,
    payoutAmount?: number,
    payoutStatus?: string
  ): Promise<void> {
    const sql = getDb();
    const nowIso = new Date().toISOString();
    await sql`
      UPDATE referral_leads
      SET status = ${status},
          remarks = COALESCE(${remarks || null}, remarks),
          next_action = COALESCE(${nextAction || null}, next_action),
          payout_amount = COALESCE(${payoutAmount !== undefined ? payoutAmount : null}, payout_amount),
          payout_status = COALESCE(${payoutStatus || null}, payout_status),
          status_updated_at = ${nowIso},
          updated_at = NOW()
      WHERE id = ${leadId};
    `;
  }
}

export const businessService = new BusinessService();
