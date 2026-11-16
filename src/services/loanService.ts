import { LoanApplication, LoanCategory, LoanType } from '../types';
import { LOAN_CATEGORIES, INITIAL_APPLICATIONS, COMPANY_INFO } from '../data/mockData';
import { crmService } from './crmService';
import { getDbClient, isDatabaseConfigured } from './neonDbService';
import { dbSyncService } from './dbSyncService';

class LoanService {
  private applications: LoanApplication[] = [...INITIAL_APPLICATIONS];

  public getCategories(): LoanCategory[] {
    return LOAN_CATEGORIES;
  }

  public getCategoryById(id: LoanType): LoanCategory | undefined {
    return LOAN_CATEGORIES.find((cat) => cat.id === id);
  }

  public getApplications(): LoanApplication[] {
    return [...this.applications];
  }

  public setApplications(apps: LoanApplication[]): void {
    this.applications = [...apps];
  }

  public async fetchApplicationsForMobile(mobile: string): Promise<LoanApplication[]> {
    const dbApps = await dbSyncService.getApplicationsByMobile(mobile);
    if (dbApps && dbApps.length > 0) {
      this.applications = dbApps;
      return dbApps;
    }
    return this.getApplications();
  }

  public getApplicationById(id: string): LoanApplication | undefined {
    return this.applications.find((app) => app.id === id);
  }

  public async submitEnquiry(params: {
    loanType: LoanType;
    requestedAmount: number;
    tenureMonths: number;
    applicantName: string;
    mobile: string;
    monthlyIncome: number;
    employmentType: string;
    city: string;
    pincode?: string;
    panNumber?: string;
    aadhaarNumber?: string;
    purpose?: string;
  }): Promise<LoanApplication> {
    const category = this.getCategoryById(params.loanType);
    const categoryTitle = category ? category.title : 'Loan';

    const prefixMap: Record<LoanType, string> = {
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

    const newApp: LoanApplication = {
      id: generatedId,
      loanType: params.loanType,
      loanTypeName: categoryTitle,
      requestedAmount: params.requestedAmount,
      tenureMonths: params.tenureMonths,
      submissionDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Enquiry Received',
      statusUpdatedDate: 'Just now',
      assignedManager: {
        name: COMPANY_INFO.leadRelationshipManager,
        role: 'Principal Loan Advisor & Branch Head',
        phone: COMPANY_INFO.contactNumber,
        email: COMPANY_INFO.primaryEmail,
      },
      pendingDocuments: category ? category.requiredDocuments.slice(0, 3) : ['PAN & Aadhaar Card', '3 Months Bank Statement'],
      submittedDocuments: ['Initial KYC Form'],
      nextAction: 'Loan Point advisor will review and call you within 2-4 business hours for preliminary document verification.',
      remarks: `Online portal enquiry for ${categoryTitle}. Stated monthly income: ₹${params.monthlyIncome.toLocaleString('en-IN')}.`,
      applicantName: params.applicantName,
      applicantMobile: params.mobile,
    };

    this.applications.unshift(newApp);
    await crmService.pushLoanEnquiry(newApp);

    // Sync any newly provided profile details from the loan application back to the users table
    await dbSyncService.syncUserProfileFromApplication({
      mobile: params.mobile,
      applicantName: params.applicantName,
      city: params.city,
      employmentType: params.employmentType,
      monthlyIncome: params.monthlyIncome,
      panNumber: params.panNumber,
      aadhaarNumber: params.aadhaarNumber,
    });

    if (isDatabaseConfigured) {
      try {
        const sql = getDbClient();
        await sql.query(
          `INSERT INTO loan_applications (id, applicant_name, mobile, loan_type, requested_amount, tenure_months, status, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             applicant_name = EXCLUDED.applicant_name,
             mobile = EXCLUDED.mobile,
             loan_type = EXCLUDED.loan_type,
             requested_amount = EXCLUDED.requested_amount,
             tenure_months = EXCLUDED.tenure_months,
             status = EXCLUDED.status,
             data = EXCLUDED.data;`,
          [
            newApp.id,
            newApp.applicantName,
            newApp.applicantMobile,
            newApp.loanType,
            newApp.requestedAmount,
            newApp.tenureMonths,
            newApp.status,
            JSON.stringify(newApp),
          ]
        );
      } catch (dbErr) {
        console.warn('Neon Postgres save notice:', dbErr);
      }
    }

    return newApp;
  }

  public async attachDocumentToApplication(appId: string, documentName: string): Promise<LoanApplication> {
    const index = this.applications.findIndex((a) => a.id === appId);
    if (index === -1) throw new Error('Application not found');

    const app = this.applications[index];
    const updatedPending = app.pendingDocuments.filter((d) => d !== documentName);
    const updatedSubmitted = [...app.submittedDocuments, documentName];

    let updatedStatus = app.status;
    let updatedNext = app.nextAction;
    if (updatedPending.length === 0 && app.status === 'Documents Pending') {
      updatedStatus = 'Application Submitted';
      updatedNext = 'Documents received. Application file being prepared for bank credit underwriting.';
    }

    const updatedApp: LoanApplication = {
      ...app,
      pendingDocuments: updatedPending,
      submittedDocuments: updatedSubmitted,
      status: updatedStatus,
      nextAction: updatedNext,
      statusUpdatedDate: 'Just now',
    };

    this.applications[index] = updatedApp;
    return updatedApp;
  }

  public updateApplicationStatus(
    appId: string,
    newStatus: LoanApplication['status'],
    remarks?: string,
    nextAction?: string,
    customUpdatedDate?: string
  ): LoanApplication {
    const index = this.applications.findIndex((a) => a.id === appId);
    const updatedDate = customUpdatedDate || new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (index === -1) {
      // If not yet in memory, create a stub that will be merged
      const stubApp: LoanApplication = {
        id: appId,
        loanType: 'personal',
        loanTypeName: 'Loan Application',
        requestedAmount: 0,
        tenureMonths: 12,
        submissionDate: 'Recently',
        status: newStatus,
        statusUpdatedDate: updatedDate,
        pendingDocuments: [],
        submittedDocuments: [],
        nextAction: nextAction || '',
        remarks: remarks || '',
      };
      this.applications.unshift(stubApp);
      return stubApp;
    }

    const app = this.applications[index];
    const updatedApp: LoanApplication = {
      ...app,
      status: newStatus,
      statusUpdatedDate: updatedDate,
      remarks: remarks !== undefined ? remarks : app.remarks,
      nextAction: nextAction !== undefined ? nextAction : app.nextAction,
    };

    this.applications[index] = updatedApp;
    return updatedApp;
  }

  public resetToDefaultDemo(): void {
    this.applications = [...INITIAL_APPLICATIONS];
  }
}

export const loanService = new LoanService();
