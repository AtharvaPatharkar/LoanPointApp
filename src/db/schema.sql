-- Migration: Complete LoanPoint Schema for Neon Postgres
-- Created: 2026-11-17

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(150),
  city VARCHAR(100),
  employment_type VARCHAR(50),
  monthly_income NUMERIC(12, 2) DEFAULT 0,
  referral_code VARCHAR(20) UNIQUE,
  referred_by VARCHAR(20),
  pan_number VARCHAR(10),
  aadhaar_number VARCHAR(12),
  aadhaar_last_four VARCHAR(4),
  is_kyc_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

-- 2. Loan Applications Table
CREATE TABLE IF NOT EXISTS loan_applications (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  applicant_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  loan_type VARCHAR(30) NOT NULL,
  requested_amount NUMERIC(14, 2) NOT NULL,
  tenure_months INTEGER NOT NULL,
  aadhaar_number VARCHAR(12),
  status VARCHAR(50) DEFAULT 'Enquiry Received',
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_manager JSONB,
  remarks TEXT,
  next_action TEXT,
  pending_documents JSONB DEFAULT '[]'::jsonb,
  submitted_documents JSONB DEFAULT '[]'::jsonb,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_apps_mobile ON loan_applications(mobile);
CREATE INDEX IF NOT EXISTS idx_loan_apps_status ON loan_applications(status);

-- 3. Application Documents Table
CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id VARCHAR(50) REFERENCES loan_applications(id) ON DELETE CASCADE,
  document_name VARCHAR(100) NOT NULL,
  document_type VARCHAR(50),
  status VARCHAR(30) DEFAULT 'pending',
  file_url TEXT,
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_docs_application_id ON application_documents(application_id);

-- 4. Callback Requests Table
CREATE TABLE IF NOT EXISTS callback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  loan_type VARCHAR(30),
  preferred_time VARCHAR(50),
  status VARCHAR(30) DEFAULT 'open',
  agent_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_callback_mobile ON callback_requests(mobile);

-- 5. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'Open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON support_tickets(user_id);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  action_route VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
