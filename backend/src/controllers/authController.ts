import { ServerResponse } from 'node:http';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { authService } from '../services/authService.js';
import { validateIndianMobile, cleanMobile } from '../validators/index.js';
import { rateLimiter, getClientIp } from '../middleware/rateLimiter.js';

export async function handleRequestOtp(req: AuthenticatedRequest, res: ServerResponse) {
  const { mobile } = req.parsedBody || {};
  if (!mobile || !validateIndianMobile(mobile)) {
    return sendError(res, 400, 'Please provide a valid 10-digit Indian mobile number');
  }

  const clientIp = getClientIp(req);
  const cleaned = cleanMobile(mobile);
  const rateLimitKey = `otp_req_${cleaned}_${clientIp}`;

  // Rate Limiting: Max 3 OTP requests per 10 minutes per mobile/IP
  const allowed = rateLimiter.checkLimit(rateLimitKey, 3, 10 * 60 * 1000);
  if (!allowed) {
    return sendError(res, 429, 'Too many OTP requests. Please wait 10 minutes before requesting again.');
  }

  try {
    const result = await authService.requestOtp(mobile);
    return sendSuccess(res, result, 'OTP dispatched successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to dispatch OTP');
  }
}

export async function handleVerifyOtp(req: AuthenticatedRequest, res: ServerResponse) {
  const { mobile, otp, referralCode } = req.parsedBody || {};
  if (!mobile || !validateIndianMobile(mobile)) {
    return sendError(res, 400, 'Please provide a valid 10-digit Indian mobile number');
  }
  if (!otp) {
    return sendError(res, 400, 'OTP is required');
  }

  const cleaned = cleanMobile(mobile);
  const lockoutKey = `otp_fail_${cleaned}`;

  // Check if locked out
  const lockoutStatus = rateLimiter.isLockedOut(lockoutKey);
  if (lockoutStatus.locked) {
    return sendError(res, 429, `Too many failed attempts. Account temporarily locked. Please try again in ${lockoutStatus.remainingSeconds} seconds.`);
  }

  try {
    const result = await authService.verifyOtp(mobile, otp, referralCode);
    rateLimiter.clearFailures(lockoutKey);
    return sendSuccess(res, result, 'OTP verified successfully');
  } catch (err: any) {
    // Record failed attempt: Max 5 failed attempts before 15 min lockout
    const failureRecord = rateLimiter.recordFailure(lockoutKey, 5, 15 * 60 * 1000);
    if (failureRecord.locked) {
      return sendError(res, 429, 'Maximum OTP verification attempts exceeded. Account temporarily locked for 15 minutes.');
    }
    return sendError(res, 400, `${err.message || 'OTP verification failed'}. Remaining attempts: ${failureRecord.remainingAttempts}`);
  }
}

export async function handleRegister(req: AuthenticatedRequest, res: ServerResponse) {
  const { name, mobile, email, city, employmentType, monthlyIncome, referralCode } = req.parsedBody || {};
  if (!name || !name.trim()) {
    return sendError(res, 400, 'Full name is required');
  }
  if (!mobile || !validateIndianMobile(mobile)) {
    return sendError(res, 400, 'Please provide a valid 10-digit Indian mobile number');
  }

  try {
    const result = await authService.register({
      name,
      mobile,
      email,
      city,
      employmentType,
      monthlyIncome,
      referralCode,
    });
    return sendSuccess(res, result, 'User registered successfully', 201);
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Registration failed');
  }
}

export async function handleAdminLogin(req: AuthenticatedRequest, res: ServerResponse) {
  const { pin } = req.parsedBody || {};
  if (!pin) {
    return sendError(res, 400, 'Admin PIN is required');
  }

  const clientIp = getClientIp(req);
  const lockoutKey = `admin_fail_${clientIp}`;

  // Check lockout on admin endpoint
  const lockoutStatus = rateLimiter.isLockedOut(lockoutKey);
  if (lockoutStatus.locked) {
    return sendError(res, 429, `Too many failed admin login attempts. Locked for ${lockoutStatus.remainingSeconds} seconds.`);
  }

  try {
    const result = await authService.adminLogin(pin);
    rateLimiter.clearFailures(lockoutKey);
    return sendSuccess(res, result, 'Admin authenticated successfully');
  } catch (err: any) {
    const failureRecord = rateLimiter.recordFailure(lockoutKey, 5, 15 * 60 * 1000);
    if (failureRecord.locked) {
      return sendError(res, 429, 'Maximum failed login attempts exceeded. Portal temporarily locked for 15 minutes.');
    }
    return sendError(res, 401, `Invalid Admin credentials. Remaining attempts: ${failureRecord.remainingAttempts}`);
  }
}
