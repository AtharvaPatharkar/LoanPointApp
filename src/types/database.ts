export interface DbUser {
  id: string;
  full_name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  employment_type: string | null;
  monthly_income: number;
  referral_code: string | null;
  referred_by: string | null;
  pan_number: string | null;
  aadhaar_last_four: string | null;
  is_kyc_completed: boolean;
  documents?: any;
  created_at: string;
  updated_at: string;
}

export interface DbLoanApplication {
  id: string;
  user_id: string | null;
  applicant_name: string;
  mobile: string;
  loan_type: string;
  requested_amount: number;
  tenure_months: number;
  status: string;
  status_updated_at: string;
  assigned_manager: any;
  remarks: string | null;
  next_action: string | null;
  pending_documents: any;
  submitted_documents: any;
  data: any;
  created_at: string;
  updated_at: string;
}

export interface DbApplicationDocument {
  id: string;
  application_id: string;
  document_name: string;
  document_type: string | null;
  status: string;
  file_url: string | null;
  uploaded_at: string | null;
  created_at: string;
}

export interface DbCallbackRequest {
  id: string;
  applicant_name: string;
  mobile: string;
  loan_type: string | null;
  preferred_time: string | null;
  status: string;
  agent_notes: string | null;
  created_at: string;
}

export interface DbSupportTicket {
  id: string;
  user_id: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_route: string | null;
  created_at: string;
}

export interface DbInsuranceApplication {
  id: string;
  user_id: string | null;
  applicant_name: string;
  mobile: string;
  insurance_type: string;
  details: any;
  status: string;
  remarks: string | null;
  next_action: string | null;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbReferralLead {
  id: string;
  referrer_user_id: string | null;
  referrer_mobile: string;
  friend_name: string;
  friend_mobile: string;
  loan_product: string;
  city: string;
  loan_amount: number;
  status: string;
  payout_amount: number;
  payout_status: string;
  remarks: string | null;
  next_action: string | null;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
}
