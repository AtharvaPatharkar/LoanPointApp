/**
 * Core Type Definitions for Loan Point Customer App
 * Aligned for future Expo React Native & TypeScript implementation
 */

export type LoanType =
  | 'personal'
  | 'business'
  | 'home'
  | 'mortgage'
  | 'car'
  | 'education'
  | 'agriculture'
  | 'mudra';

export type ApplicationStatus =
  | 'Enquiry Received'
  | 'Documents Pending'
  | 'Application Submitted'
  | 'Under Bank Processing'
  | 'Approved'
  | 'Disbursed'
  | 'Rejected';

export interface LoanCategory {
  id: LoanType;
  title: string;
  shortDescription: string;
  fullDescription: string;
  minAmount: number;
  maxAmount: number;
  indicativeInterestRate: string; // e.g. "10.49% - 14.50% p.a."
  tenureRange: string; // e.g. "12 to 60 Months"
  processingFee: string;
  eligibility: string[];
  requiredDocuments: string[];
  features: string[];
  iconName: string;
}

export interface LoanApplication {
  id: string; // e.g. "LP-2026-APP-8102"
  loanType: LoanType;
  loanTypeName: string;
  requestedAmount: number;
  tenureMonths: number;
  submissionDate: string;
  status: ApplicationStatus;
  statusUpdatedDate: string;
  assignedManager?: {
    name: string;
    role: string;
    phone: string;
    email: string;
  };
  pendingDocuments: string[];
  submittedDocuments: string[];
  nextAction: string;
  remarks?: string;
  isDemoRecord: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  pincode?: string;
  employmentType: 'Salaried' | 'Self Employed' | 'Business Owner' | 'Agriculturist' | 'Others';
  monthlyIncome: number;
  panNumber?: string;
  aadhaarNumber?: string;
  aadhaarLinked: boolean;
  cibilEstimateScore?: number;
  memberSince: string;
  referralCode: string;
  referredBy?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: 'Identity Proof' | 'Address Proof' | 'Income Proof' | 'Property Document' | 'Other';
  fileType: string;
  fileSizeKb: number;
  uploadDate: string;
  status: 'Verified' | 'Under Review' | 'Action Needed';
  fileName: string;
  downloadUrl?: string;
  fileUri?: string;
  mimeType?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'application' | 'emi_due' | 'reminder' | 'offer' | 'support';
  timestamp: string;
  read: boolean;
  actionScreen?: string;
}

export interface NotificationPreferences {
  channels: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  reminders: {
    emiReminders: boolean;
    loanTopUpFollowUps: boolean;
    birthdayGreetings: boolean;
    anniversaryGreetings: boolean;
    pendingDocuments: boolean;
    applicationStatusUpdates: boolean;
    callbackReminders: boolean;
    complaintUpdates: boolean;
    offersAndReferralUpdates: boolean;
  };
}

export interface CallbackRequest {
  id: string;
  customerName: string;
  mobile: string;
  preferredDate: string;
  preferredTimeSlot: string;
  topic: string;
  notes?: string;
  status: 'Pending' | 'Completed';
  createdAt: string;
}

export interface ComplaintTicket {
  id: string; // e.g. "LP-TKT-5512"
  category: string;
  subject: string;
  description: string;
  status: 'Received' | 'In Investigation' | 'Resolved';
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  resolutionRemarks?: string;
}

export interface ReferralRecord {
  id: string;
  refereeName: string;
  refereeMobileMasked: string;
  loanType: string;
  status: 'Enquiry Registered' | 'Loan Disbursed' | 'In Progress';
  date: string;
  rewardPoints: number;
}

export interface BankRateComparison {
  lenderName: string;
  loanType: LoanType;
  indicativeRateMin: number;
  indicativeRateMax: number;
  processingFee: string;
  maxTenureYears: number;
  isPublicSector: boolean;
  note: string;
}
