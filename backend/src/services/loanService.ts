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
      documents: params.documents || [],
    };

    await sql`
      INSERT INTO loan_applications (id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, data)
      VALUES (
        ${newApp.id},
        ${newApp.applicantName},
        ${newApp.applicantMobile},
        ${newApp.loanType},
        ${newApp.requestedAmount},
        ${newApp.tenureMonths},
        ${newApp.status},
        ${JSON.stringify(newApp)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        applicant_name = EXCLUDED.applicant_name,
        mobile = EXCLUDED.mobile,
        loan_type = EXCLUDED.loan_type,
        requested_amount = EXCLUDED.requested_amount,
        tenure_months = EXCLUDED.tenure_months,
        status = EXCLUDED.status,
        data = EXCLUDED.data;
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
