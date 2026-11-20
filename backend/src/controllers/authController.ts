import { ServerResponse } from 'node:http';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { authService } from '../services/authService.js';
import { validateIndianMobile, cleanMobile } from '../validators/index.js';
import { rateLimiter, getClientIp } from '../middleware/rateLimiter.js';

export async function handleRequestOtp(req: AuthenticatedRequest, res: ServerResponse) {
  const { mobile, mode } = req.parsedBody || {};
  if (!mobile || !validateIndianMobile(mobile)) {
    return sendError(res, 400, 'Please provide a valid 10-digit Indian mobile number');
  }

  const clientIp = getClientIp(req);
  const cleaned = cleanMobile(mobile);
  const rateLimitKey = `otp_req_${cleaned}_${clientIp}`;

  // Rate Limiting: Max 3 OTP requests per 10 minutes per mobile/IP
  const allowed = await rateLimiter.checkLimit(rateLimitKey, 3, 10 * 60 * 1000);
  if (!allowed) {
    return sendError(res, 429, 'Too many OTP requests. Please wait 10 minutes before requesting again.');
  }

  try {
    const result = await authService.requestOtp(mobile, mode === 'signup' ? 'signup' : 'login');
    return sendSuccess(res, result, 'OTP dispatched successfully');
  } catch (err: any) {
    return sendError(res, 400, err.message || 'Failed to dispatch OTP');
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

  // Check if locked out (Exponential Backoff or IP Jail)
  const lockoutStatus = await rateLimiter.isLockedOut(lockoutKey);
  if (lockoutStatus.locked) {
    const formattedWait = lockoutStatus.remainingSeconds! > 3600
      ? `${Math.ceil(lockoutStatus.remainingSeconds! / 3600)} hours`
      : lockoutStatus.remainingSeconds! > 60
      ? `${Math.ceil(lockoutStatus.remainingSeconds! / 60)} minutes`
      : `${lockoutStatus.remainingSeconds} seconds`;
    return sendError(res, 429, `Too many failed attempts. Security lockout active. Please wait ${formattedWait} before trying again.`);
  }

  try {
    const result = await authService.verifyOtp(mobile, otp, referralCode);
    await rateLimiter.clearFailures(lockoutKey);
    return sendSuccess(res, result, 'OTP verified successfully');
  } catch (err: any) {
    // Record failed attempt with dynamic exponential backoff & IP Jail (30s, 60s, 5m, 15m, 24h)
    const failureRecord = await rateLimiter.recordFailure(lockoutKey);
    const retryWaitStr = failureRecord.remainingSeconds >= 86400
      ? '24 hours (Account Jailed due to suspicious activity)'
      : failureRecord.remainingSeconds >= 60
      ? `${Math.ceil(failureRecord.remainingSeconds / 60)} minutes`
      : `${failureRecord.remainingSeconds} seconds`;

    return sendError(
      res,
      429,
      `${err.message || 'OTP verification failed'}. Attempt ${failureRecord.failedAttempts}. Next retry permitted in: ${retryWaitStr}`
    );
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

  // Check lockout on admin endpoint (IP Jail check)
  const lockoutStatus = await rateLimiter.isLockedOut(lockoutKey);
  if (lockoutStatus.locked) {
    const formattedWait = lockoutStatus.remainingSeconds! > 3600
      ? `${Math.ceil(lockoutStatus.remainingSeconds! / 3600)} hours`
      : lockoutStatus.remainingSeconds! > 60
      ? `${Math.ceil(lockoutStatus.remainingSeconds! / 60)} minutes`
      : `${lockoutStatus.remainingSeconds} seconds`;
    return sendError(res, 429, `Admin portal locked due to failed attempts. Please wait ${formattedWait} before trying again.`);
  }

  try {
    const result = await authService.adminLogin(pin);
    await rateLimiter.clearFailures(lockoutKey);
    return sendSuccess(res, result, 'Admin authenticated successfully');
  } catch (err: any) {
    const failureRecord = await rateLimiter.recordFailure(lockoutKey);
    const retryWaitStr = failureRecord.remainingSeconds >= 86400
      ? '24 hours (IP Jailed)'
      : failureRecord.remainingSeconds >= 60
      ? `${Math.ceil(failureRecord.remainingSeconds / 60)} minutes`
      : `${failureRecord.remainingSeconds} seconds`;

    return sendError(res, 429, `Invalid Admin credentials. Attempt ${failureRecord.failedAttempts}. Next attempt allowed in: ${retryWaitStr}`);
  }
}

export async function handleRefreshToken(req: AuthenticatedRequest, res: ServerResponse) {
  const { refreshToken } = req.parsedBody || {};
  if (!refreshToken) {
    return sendError(res, 400, 'Refresh token is required');
  }

  const clientIp = getClientIp(req);
  const userAgent = (req.headers['user-agent'] as string) || '';

  try {
    const result = await authService.refreshSession(refreshToken, clientIp, userAgent);
    return sendSuccess(res, result, 'Session refreshed successfully');
  } catch (err: any) {
    return sendError(res, 401, err.message || 'Failed to refresh session');
  }
}

export async function handleLogout(req: AuthenticatedRequest, res: ServerResponse) {
  const { refreshToken } = req.parsedBody || {};
  const userId = req.user?.userId;

  try {
    await authService.revokeSession(refreshToken, userId);
    return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Logout error');
  }
}
