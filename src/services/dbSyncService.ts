import { UserProfile, LoanApplication, InsuranceApplication, ReferralLead, DocumentItem } from '../types';
import { apiRequest } from './apiClient';
import { generateRandomCustomerCode } from '../utils/calculator';

export class DbSyncService {
  /**
   * Find user by mobile number, or create if not exists
   */
  public async getOrCreateUserByMobile(mobile: string, defaultName = 'Valued Customer'): Promise<{ user: UserProfile; isFirstTime: boolean }> {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    try {
      const res = await apiRequest(`/user/profile`, { method: 'GET' });
      if (res && res.user) {
        return {
          user: res.user,
          isFirstTime: !res.user.isKycCompleted && !res.user.city,
        };
      }
    } catch {
      // Fallback
    }

    const fallbackCode = generateRandomCustomerCode();
    return {
      user: {
        id: fallbackCode,
        name: defaultName,
        mobile: cleanMobile,
        email: '',
        city: '',
        pincode: '',
        employmentType: 'Salaried',
        monthlyIncome: 0,
        panNumber: '',
        aadhaarNumber: '',
        aadhaarLinked: false,
        cibilEstimateScore: 720,
        memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        referralCode: fallbackCode,
        role: 'customer',
      },
      isFirstTime: true,
    };
  }

  /**
   * Fetch all registered users / customers for Admin
   */
  public async getAllUsers(): Promise<UserProfile[]> {
    try {
      const res = await apiRequest(`/admin/users`, { method: 'GET' });
      return res.users || [];
    } catch (err) {
      console.warn('API getAllUsers error:', err);
      return [];
    }
  }

  /**
   * Fetch current user profile
   */
  public async getUserByMobile(mobile: string): Promise<UserProfile | null> {
    try {
      const res = await apiRequest(`/user/profile`, { method: 'GET' });
      return res.user || null;
    } catch (err) {
      console.warn('API getUserByMobile error:', err);
      return null;
    }
  }

  /**
   * Update User Profile via Backend API
   */
  public async updateUserProfile(user: UserProfile): Promise<void> {
    try {
      await apiRequest(`/user/profile`, {
        method: 'PUT',
        body: user,
      });
    } catch (err) {
      console.warn('API profile update error:', err);
    }
  }

  /**
   * Save or append a document to user's documents
   */
  public async saveUserDocument(mobile: string, documentItem: DocumentItem): Promise<DocumentItem[]> {
    try {
      const res = await apiRequest(`/user/documents`, {
        method: 'POST',
        body: { document: documentItem },
      });
      return res.documents || [];
    } catch (err) {
      console.warn('API saveUserDocument error:', err);
      return [];
    }
  }

  /**
   * Delete a document from user's documents
   */
  public async deleteUserDocument(mobile: string, docId: string): Promise<DocumentItem[]> {
    try {
      const res = await apiRequest(`/user/documents/${docId}`, {
        method: 'DELETE',
      });
      return res.documents || [];
    } catch (err) {
      console.warn('API deleteUserDocument error:', err);
      return [];
    }
  }

  /**
   * Sync profile data submitted from any loan application form to User profile
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
    try {
      await apiRequest(`/user/profile`, {
        method: 'PUT',
        body: {
          name: params.applicantName,
          email: params.email,
          city: params.city,
          employmentType: params.employmentType,
          monthlyIncome: params.monthlyIncome,
          panNumber: params.panNumber,
          aadhaarNumber: params.aadhaarNumber,
        },
      });
    } catch (err) {
      console.warn('API syncUserProfileFromApplication error:', err);
    }
  }

  /**
   * Fetch applications for current user
   */
  public async getApplicationsByMobile(mobile: string): Promise<LoanApplication[]> {
    try {
      const res = await apiRequest(`/loans/applications`, { method: 'GET' });
      return res.applications || [];
    } catch (err) {
      console.warn('API getApplicationsByMobile error:', err);
      return [];
    }
  }

  /**
   * Fetch all applications for Admin
   */
  public async getAllApplications(): Promise<LoanApplication[]> {
    try {
      const res = await apiRequest(`/admin/loans`, { method: 'GET' });
      return res.applications || [];
    } catch (err) {
      console.warn('API getAllApplications error:', err);
      return [];
    }
  }

  /**
   * Update loan application status via Backend
   */
  public async updateApplicationStatus(
    appId: string,
    status: string,
    remarks?: string,
    nextAction?: string,
    statusUpdatedDate?: string
  ): Promise<void> {
    try {
      await apiRequest(`/admin/loans/${appId}/status`, {
        method: 'PUT',
        body: {
          status,
          remarks,
          nextAction,
          statusUpdatedDate,
        },
      });
    } catch (err) {
      console.warn('API updateApplicationStatus error:', err);
    }
  }

  /**
   * Save a new Insurance Application
   */
  public async createInsuranceApplication(app: {
    applicantName: string;
    mobile: string;
    insuranceType: string;
    insuranceTypeName?: string;
    details?: Record<string, any>;
    userId?: string;
  }): Promise<InsuranceApplication> {
    try {
      const res = await apiRequest(`/insurance`, {
        method: 'POST',
        body: {
          applicantName: app.applicantName,
          insuranceType: app.insuranceType,
          insuranceTypeName: app.insuranceTypeName,
          details: app.details,
        },
      });
      return res.insurance;
    } catch (err) {
      console.warn('API createInsuranceApplication error:', err);
      const appId = `INS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: appId,
        userId: app.userId || null,
        applicantName: app.applicantName,
        mobile: app.mobile,
        insuranceType: app.insuranceType,
        insuranceTypeName: app.insuranceTypeName || app.insuranceType,
        details: app.details || {},
        status: 'Request Received',
        statusUpdatedAt: new Date().toISOString(),
        remarks: 'Application received. Advisor will review.',
        nextAction: 'Agent assigned for plan comparison',
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch all insurance applications for Admin
   */
  public async getAllInsuranceApplications(): Promise<InsuranceApplication[]> {
    try {
      const res = await apiRequest(`/admin/insurance`, { method: 'GET' });
      return res.insurance || [];
    } catch (err) {
      console.warn('API getAllInsuranceApplications error:', err);
      return [];
    }
  }

  /**
   * Fetch insurance applications for user
   */
  public async getInsuranceApplicationsByMobile(mobile: string): Promise<InsuranceApplication[]> {
    try {
      const res = await apiRequest(`/insurance`, { method: 'GET' });
      return res.insurance || [];
    } catch (err) {
      console.warn('API getInsuranceApplicationsByMobile error:', err);
      return [];
    }
  }

  /**
   * Update insurance status
   */
  public async updateInsuranceApplicationStatus(
    appId: string,
    status: string,
    remarks?: string,
    nextAction?: string,
    statusUpdatedDate?: string
  ): Promise<void> {
    try {
      await apiRequest(`/admin/insurance/${appId}/status`, {
        method: 'PUT',
        body: { status, remarks, nextAction },
      });
    } catch (err) {
      console.warn('API updateInsuranceApplicationStatus error:', err);
    }
  }

  /**
   * Create Referral Lead
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
    try {
      const res = await apiRequest(`/referrals`, {
        method: 'POST',
        body: lead,
      });
      return res.referral;
    } catch (err) {
      console.warn('API createReferralLead error:', err);
      const leadId = `REF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: leadId,
        referrerUserId: lead.referrerUserId || null,
        referrerMobile: lead.referrerMobile,
        friendName: lead.friendName,
        friendMobile: lead.friendMobile,
        loanProduct: lead.loanProduct,
        city: lead.city,
        loanAmount: lead.loanAmount || 0,
        status: 'Referral Submitted',
        payoutAmount: 0,
        payoutStatus: 'Pending',
        remarks: 'Referral submitted.',
        nextAction: 'Loan Point team connecting with lead',
        statusUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get all referral leads (Admin)
   */
  public async getAllReferralLeads(): Promise<ReferralLead[]> {
    try {
      const res = await apiRequest(`/admin/referrals`, { method: 'GET' });
      return res.referrals || [];
    } catch (err) {
      console.warn('API getAllReferralLeads error:', err);
      return [];
    }
  }

  /**
   * Get referral leads submitted by current user
   */
  public async getReferralLeadsByReferrer(referrerMobile: string): Promise<ReferralLead[]> {
    try {
      const res = await apiRequest(`/referrals`, { method: 'GET' });
      return res.referrals || [];
    } catch (err) {
      console.warn('API getReferralLeadsByReferrer error:', err);
      return [];
    }
  }

  /**
   * Update referral status
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
    try {
      await apiRequest(`/admin/referrals/${leadId}/status`, {
        method: 'PUT',
        body: {
          status,
          remarks,
          nextAction,
          payoutAmount,
          payoutStatus,
        },
      });
    } catch (err) {
      console.warn('API updateReferralLeadStatus error:', err);
    }
  }
}

export const dbSyncService = new DbSyncService();
