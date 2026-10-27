/**
 * Pure Financial and Utility Calculations
 * Reusable in both Web and React Native environments
 */

/**
 * Calculate Monthly EMI using standard reducing balance formula:
 * EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
 * where P = Principal, R = Monthly interest rate (Annual % / 12 / 100), N = Tenure in months
 */
export function calculateEMI(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePercent <= 0) return Math.round(principal / tenureMonths);

  const monthlyRate = annualRatePercent / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);

  if (isNaN(emi) || !isFinite(emi)) return 0;
  return Math.round(emi);
}

/**
 * Total payment across the entire loan tenure
 */
export function calculateTotalPayment(emi: number, tenureMonths: number): number {
  if (emi <= 0 || tenureMonths <= 0) return 0;
  return Math.round(emi * tenureMonths);
}

/**
 * Total interest payable over the loan life
 */
export function calculateTotalInterest(principal: number, totalPayment: number): number {
  const interest = totalPayment - principal;
  return interest > 0 ? Math.round(interest) : 0;
}

/**
 * Preliminary Loan Eligibility Estimation
 * Standard Indian banking rule of thumb: Maximum Debt-to-Income (DTI / FOIR) typically 50%
 * Available EMI = (Monthly Income * 50%) - Existing EMIs
 */
export interface EligibilityResult {
  monthlyIncome: number;
  existingObligations: number;
  availableMonthlyEmi: number;
  estimatedEligibleLoan: number;
  foirPercentage: number;
  isEligible: boolean;
  disclaimer: string;
}

export function calculateEligibility(
  monthlyIncome: number,
  existingObligations: number,
  tenureMonths: number,
  annualInterestRate: number,
  maxFoirPercent = 50
): EligibilityResult {
  const safeIncome = Math.max(0, monthlyIncome);
  const safeObligations = Math.max(0, existingObligations);
  const maxAllowedEmiTotal = (safeIncome * maxFoirPercent) / 100;
  const availableMonthlyEmi = Math.max(0, maxAllowedEmiTotal - safeObligations);

  let estimatedEligibleLoan = 0;
  if (availableMonthlyEmi > 0 && annualInterestRate > 0 && tenureMonths > 0) {
    // Reverse EMI calculation: P = [EMI * ((1+R)^N - 1)] / [R * (1+R)^N]
    const monthlyRate = annualInterestRate / (12 * 100);
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    estimatedEligibleLoan = Math.round((availableMonthlyEmi * (factor - 1)) / (monthlyRate * factor));
  }

  const foir = safeIncome > 0 ? Math.round((safeObligations / safeIncome) * 100) : 0;

  return {
    monthlyIncome: safeIncome,
    existingObligations: safeObligations,
    availableMonthlyEmi: Math.round(availableMonthlyEmi),
    estimatedEligibleLoan: Math.max(0, estimatedEligibleLoan),
    foirPercentage: foir,
    isEligible: availableMonthlyEmi > 2000 && estimatedEligibleLoan > 25000,
    disclaimer: 'Preliminary estimate for planning purposes. Final sanction depends on credit score, bank policies, and document verification.',
  };
}

/**
 * Balance Transfer Savings Calculator
 * Computes monthly and lifetime interest savings when switching to a lower rate
 */
export interface BalanceTransferResult {
  currentPrincipal: number;
  currentRate: number;
  newRate: number;
  remainingTenureMonths: number;
  currentEmi: number;
  newEmi: number;
  monthlySavings: number;
  totalCurrentPayment: number;
  totalNewPayment: number;
  netLifetimeSavings: number;
  hasSavings: boolean;
}

export function calculateBalanceTransferSavings(
  currentPrincipal: number,
  currentRate: number,
  remainingTenureMonths: number,
  newRate: number
): BalanceTransferResult {
  const currentEmi = calculateEMI(currentPrincipal, currentRate, remainingTenureMonths);
  const newEmi = calculateEMI(currentPrincipal, newRate, remainingTenureMonths);

  const totalCurrentPayment = calculateTotalPayment(currentEmi, remainingTenureMonths);
  const totalNewPayment = calculateTotalPayment(newEmi, remainingTenureMonths);

  const monthlySavings = Math.max(0, currentEmi - newEmi);
  const netLifetimeSavings = Math.max(0, totalCurrentPayment - totalNewPayment);

  return {
    currentPrincipal,
    currentRate,
    newRate,
    remainingTenureMonths,
    currentEmi,
    newEmi,
    monthlySavings,
    totalCurrentPayment,
    totalNewPayment,
    netLifetimeSavings,
    hasSavings: netLifetimeSavings > 0,
  };
}

/**
 * Format Indian Currency (INR) with standard comma grouping
 * e.g. 100000 -> "₹1,00,000"
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);

  const str = absVal.toString();
  let result = '';
  if (str.length <= 3) {
    result = str;
  } else {
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = formattedOther + ',' + lastThree;
  }

  return (isNegative ? '-₹' : '₹') + result;
}

/**
 * Validate 10-digit Indian Mobile Number
 * Must start with 6, 7, 8, or 9
 */
export function validateMobileNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return /^[6-9]\d{9}$/.test(cleaned.substring(2));
  }
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate Indian PAN Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
 */
export function validatePAN(pan: string): boolean {
  if (!pan) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase());
}

/**
 * Validate Indian Aadhaar Number: Exactly 12 numeric digits (e.g. 5489 1234 5678 or 548912345678)
 * Cannot start with 0 or 1 per UIDAI specifications.
 */
export function validateAadhaar(aadhaar: string): { isValid: boolean; error?: string } {
  if (!aadhaar) {
    return { isValid: false, error: 'Aadhaar number is required' };
  }
  const cleaned = aadhaar.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Aadhaar number must contain only 12 numeric digits' };
  }
  if (cleaned.length !== 12) {
    return { isValid: false, error: `Aadhaar must be exactly 12 digits (currently ${cleaned.length} digits)` };
  }
  if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
    return { isValid: false, error: 'Aadhaar number cannot begin with 0 or 1' };
  }
  return { isValid: true };
}

/**
 * Validate Monthly Net Income (₹)
 * Checks: wrong numbers, 0, negative numbers, excessively high numbers, minimum bank eligibility threshold
 */
export function validateMonthlyIncome(income: number | string): { isValid: boolean; error?: string; value: number } {
  if (income === '' || income === null || income === undefined) {
    return { isValid: false, error: 'Please enter your monthly net income', value: 0 };
  }

  const rawStr = income.toString().trim();
  // Check for negative signs or non-digit chars (allowing commas)
  if (rawStr.includes('-')) {
    return { isValid: false, error: 'Monthly income cannot be a negative amount', value: 0 };
  }

  const cleaned = rawStr.replace(/[,\s₹]/g, '');
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid numeric income amount', value: 0 };
  }

  const num = parseInt(cleaned, 10);
  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid income number format', value: 0 };
  }

  if (num === 0) {
    return { isValid: false, error: 'Monthly income cannot be ₹0. Minimum ₹10,000 required', value: 0 };
  }

  if (num < 10000) {
    return { isValid: false, error: `Income ₹${num.toLocaleString('en-IN')} is below minimum eligible income of ₹10,000/mo`, value: num };
  }

  // Check excessively high number (e.g. > 50,00,000 / 50 Lakhs per month)
  if (num > 50000000) {
    return { isValid: false, error: 'Amount exceeds maximum allowable limit (₹5 Crore/month)', value: num };
  }

  return { isValid: true, value: num };
}

/**
 * Validate standard email format
 */
export function validateEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  // Standard RFC compliant email regex
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return regex.test(email.trim());
}

/**
 * Popular Indian email domains for quick @ auto-suggest
 */
export const POPULAR_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
];

/**
 * Return email domain suggestions when user types '@'
 */
export function getEmailDomainSuggestions(input: string): string[] {
  if (!input || !input.includes('@')) return [];
  const parts = input.split('@');
  if (parts.length > 2) return []; // Multiple @ is invalid

  const username = parts[0];
  const typedDomain = (parts[1] || '').toLowerCase();
  if (!username) return [];

  const matched = POPULAR_EMAIL_DOMAINS.filter((d) => d.startsWith(typedDomain));
  return matched.map((d) => `${username}@${d}`);
}

/**
 * Generate 100% collision-free referral code (PhonePe hybrid style)
 * Formula: FIRST_NAME (clean uppercase) + LAST_4_OF_MOBILE (e.g., "RAHUL" + "5999" -> "RAHUL5999")
 */
export function generateUniqueReferralCode(name: string, mobile: string): string {
  const cleanName = (name || '').trim().split(' ')[0].replace(/[^A-Za-z]/g, '').toUpperCase() || 'LP';
  const cleanMobile = (mobile || '').replace(/\D/g, '').slice(-4) || '2026';
  return `${cleanName}${cleanMobile}`;
}

