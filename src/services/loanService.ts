import { LoanApplication, LoanCategory, LoanType } from '../types';
import { LOAN_CATEGORIES, INITIAL_APPLICATIONS, COMPANY_INFO } from '../data/mockData';
import { crmService } from './crmService';
import { apiRequest } from './apiClient';

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
    try {
      const res = await apiRequest('/loans/applications', { method: 'GET' });
      if (res && Array.isArray(res.applications)) {
        this.applications = res.applications;
        return res.applications;
      }
    } catch (err: any) {
      console.warn('Backend fetch applications error:', err.message);
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
    bankName?: string;
  }): Promise<LoanApplication> {
    const category = this.getCategoryById(params.loanType);
    const categoryTitle = category ? category.title : 'Loan';

    try {
      const res = await apiRequest('/loans/enquiry', {
        method: 'POST',
        body: {
          ...params,
          loanTypeName: categoryTitle,
        },
      });

      if (res.application) {
        this.applications.unshift(res.application);
        await crmService.pushLoanEnquiry(res.application);
        return res.application;
      }
    } catch (err: any) {
      console.warn('Backend loan enquiry fallback to local:', err.message);
    }

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

    let detectedBank = params.bankName;
    if (!detectedBank && params.purpose) {
      const match = params.purpose.match(/Bank:\s*([^|]+)/i);
      if (match && match[1].trim()) {
        detectedBank = match[1].trim();
      }
    }
    if (!detectedBank) {
      const defaultBanks: Record<LoanType, string> = {
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

    const newApp: LoanApplication = {
      id: generatedId,
      loanType: params.loanType,
      loanTypeName: categoryTitle,
      requestedAmount: params.requestedAmount,
      tenureMonths: params.tenureMonths,
      submissionDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Application Sent',
      statusUpdatedDate: 'Just now',
      bankName: detectedBank,
      assignedManager: {
        name: COMPANY_INFO.leadRelationshipManager,
        role: 'Principal Loan Advisor & Branch Head',
        phone: COMPANY_INFO.contactNumber,
        email: COMPANY_INFO.primaryEmail,
      },
      pendingDocuments: [],
      submittedDocuments: ['Initial KYC Form'],
      nextAction: 'Application submitted. Awaiting review and verification by Loan Point admin.',
      remarks: `Online portal enquiry for ${categoryTitle}. Stated monthly income: ₹${params.monthlyIncome.toLocaleString('en-IN')}.`,
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

  public async submitTopUpRequest(params: {
    parentApplicationId: string;
    topUpAmount: number;
    purpose: string;
    applicantName?: string;
    applicantMobile?: string;
  }): Promise<LoanApplication> {
    const parentApp = this.getApplicationById(params.parentApplicationId);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    const generatedId = `TU-${yyyy}${mm}${dd}-${seq}`;

    const loanType: LoanType = parentApp?.loanType || 'home';
    const loanTypeName = parentApp?.loanTypeName || 'Home Loan';
    const bankName = parentApp?.bankName || 'Partner Bank';
    const existingAmount = parentApp?.requestedAmount || 5000000;
    const tenureMonths = parentApp?.tenureMonths || 240;

    const newTopUpApp: LoanApplication = {
      id: generatedId,
      loanType,
      loanTypeName,
      requestedAmount: existingAmount + params.topUpAmount,
      tenureMonths,
      submissionDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Processing',
      statusUpdatedDate: 'Just now',
      bankName,
      assignedManager: parentApp?.assignedManager || {
        name: COMPANY_INFO.leadRelationshipManager,
        role: 'Principal Loan Advisor & Branch Head',
        phone: COMPANY_INFO.contactNumber,
        email: COMPANY_INFO.primaryEmail,
      },
      pendingDocuments: [],
      submittedDocuments: ['Top Up Declaration'],
      nextAction: 'Top up request submitted. Under lender assessment.',
      remarks: `Top Up Request of ₹${params.topUpAmount.toLocaleString('en-IN')} for ${params.purpose} linked to ${params.parentApplicationId}.`,
      applicantName: params.applicantName || parentApp?.applicantName,
      applicantMobile: params.applicantMobile || parentApp?.applicantMobile,
      isTopUp: true,
      existingLoanAmount: existingAmount,
      topUpRequestedAmount: params.topUpAmount,
      topUpStageIndex: 1,
    };

    this.applications.unshift(newTopUpApp);
    await crmService.pushLoanEnquiry(newTopUpApp);
    return newTopUpApp;
  }

  public clearUserData(): void {
    this.applications = [];
  }

  public resetToDefaultDemo(): void {
    this.applications = [];
  }
}

export const loanService = new LoanService();
