import { ServerResponse } from 'node:http';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { businessService } from '../services/businessService.js';

// Insurance
export async function handleCreateInsurance(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { insuranceType, applicantName, details } = req.parsedBody || {};
  if (!insuranceType || !applicantName) {
    return sendError(res, 400, 'Insurance type and applicant name are required');
  }

  try {
    const record = await businessService.createInsuranceApplication({
      applicantName,
      mobile: req.user.mobile,
      insuranceType,
      details,
      userId: req.user.userId,
    });
    return sendSuccess(res, { insurance: record }, 'Insurance application created successfully', 201);
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to submit insurance application');
  }
}

export async function handleGetInsurance(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const items = await businessService.getInsuranceByMobile(req.user.mobile);
    return sendSuccess(res, { insurance: items });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch insurance applications');
  }
}

export async function handleGetAllInsurance(req: AuthenticatedRequest, res: ServerResponse) {
  try {
    const items = await businessService.getAllInsurance();
    return sendSuccess(res, { insurance: items });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch all insurance records');
  }
}

export async function handleUpdateInsuranceStatus(req: AuthenticatedRequest, res: ServerResponse) {
  const appId = req.params?.id;
  const { status, remarks, nextAction } = req.parsedBody || {};

  if (!appId || !status) {
    return sendError(res, 400, 'Application ID and status are required');
  }

  try {
    await businessService.updateInsuranceStatus(appId, status, remarks, nextAction);
    return sendSuccess(res, {}, 'Insurance status updated successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to update insurance status');
  }
}

// Referrals
export async function handleCreateReferral(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { friendName, friendMobile, loanProduct, city, loanAmount } = req.parsedBody || {};
  if (!friendName || !friendMobile || !loanProduct) {
    return sendError(res, 400, 'Friend name, friend mobile, and loan product are required');
  }

  try {
    const lead = await businessService.createReferralLead({
      referrerMobile: req.user.mobile,
      referrerUserId: req.user.userId,
      friendName,
      friendMobile,
      loanProduct,
      city: city || '',
      loanAmount: Number(loanAmount || 0),
    });
    return sendSuccess(res, { referral: lead }, 'Referral lead submitted successfully', 201);
  } catch (err: any) {
    const errorMsg = err?.message || 'Failed to submit referral';
    const statusCode = errorMsg === 'User are present' || errorMsg.includes('own mobile') ? 400 : 500;
    return sendError(res, statusCode, errorMsg);
  }
}

export async function handleGetReferrals(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const referrals = await businessService.getReferralsByReferrer(req.user.mobile);
    return sendSuccess(res, { referrals });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch referral leads');
  }
}

export async function handleGetAllReferrals(req: AuthenticatedRequest, res: ServerResponse) {
  try {
    const referrals = await businessService.getAllReferrals();
    return sendSuccess(res, { referrals });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch all referrals');
  }
}

export async function handleUpdateReferralStatus(req: AuthenticatedRequest, res: ServerResponse) {
  const leadId = req.params?.id;
  const { status, remarks, nextAction, payoutAmount, payoutStatus } = req.parsedBody || {};

  if (!leadId || !status) {
    return sendError(res, 400, 'Lead ID and status are required');
  }

  try {
    await businessService.updateReferralStatus(leadId, status, remarks, nextAction, payoutAmount, payoutStatus);
    return sendSuccess(res, {}, 'Referral status updated successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to update referral status');
  }
}

export async function handleDeleteReferral(req: AuthenticatedRequest, res: ServerResponse) {
  const leadId = req.params?.id;
  if (!leadId) {
    return sendError(res, 400, 'Lead ID parameter is required');
  }

  try {
    await businessService.deleteReferral(leadId);
    return sendSuccess(res, {}, 'Referral lead deleted successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to delete referral lead');
  }
}
