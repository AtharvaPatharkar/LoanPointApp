import { LoanApplication, LoanCategory, LoanType } from '../types';
import { LOAN_CATEGORIES, INITIAL_APPLICATIONS, COMPANY_INFO } from '../data/mockData';
import { crmService } from './crmService';

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

    const newApp: LoanApplication = {
      id: `LP-2026-APP-${Math.floor(1000 + Math.random() * 9000)}`,
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
      isDemoRecord: true,
      applicantName: params.applicantName,
      applicantMobile: params.mobile,
    };

    this.applications.unshift(newApp);
    await crmService.pushLoanEnquiry(newApp);

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
    nextAction?: string
  ): LoanApplication {
    const index = this.applications.findIndex((a) => a.id === appId);
    if (index === -1) throw new Error('Application not found');

    const app = this.applications[index];
    const updatedApp: LoanApplication = {
      ...app,
      status: newStatus,
      statusUpdatedDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
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
