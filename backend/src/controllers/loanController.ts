import { ServerResponse } from 'node:http';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { loanService } from '../services/loanService.js';
import { cleanMobile } from '../validators/index.js';

export async function handleGetApplications(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const applications = await loanService.getApplicationsByMobile(req.user.mobile);
    return sendSuccess(res, { applications });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch loan applications');
  }
}

export async function handleGetApplicationById(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const appId = req.params?.id;
  if (!appId) {
    return sendError(res, 400, 'Application ID is required');
  }

  try {
    const application = await loanService.getApplicationById(appId);
    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    // Ownership Enforcement: Non-admin users can ONLY access their own application
    if (req.user.role !== 'admin' && cleanMobile(application.applicantMobile) !== cleanMobile(req.user.mobile)) {
      return sendError(res, 403, 'Forbidden: You do not have access to this application record');
    }

    return sendSuccess(res, { application });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch application');
  }
}

export async function handleSubmitEnquiry(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const payload = req.parsedBody || {};
  if (!payload.loanType || !payload.requestedAmount) {
    return sendError(res, 400, 'Loan type and requested amount are required');
  }

  // Ownership Enforcement: Customer cannot submit an enquiry for another person's mobile number
  if (req.user.role !== 'admin') {
    if (payload.mobile && cleanMobile(payload.mobile) !== cleanMobile(req.user.mobile)) {
      return sendError(res, 403, 'Forbidden: Customers can only submit applications for their own authenticated mobile number');
    }
    payload.mobile = req.user.mobile;
  }

  try {
    const application = await loanService.submitEnquiry(payload);
    return sendSuccess(res, { application }, 'Loan application submitted successfully', 201);
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to submit loan enquiry');
  }
}

export async function handleGetAllApplications(req: AuthenticatedRequest, res: ServerResponse) {
  try {
    const applications = await loanService.getAllApplications();
    return sendSuccess(res, { applications });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch applications');
  }
}

export async function handleUpdateApplicationStatus(req: AuthenticatedRequest, res: ServerResponse) {
  const appId = req.params?.id;
  const { status, remarks, nextAction, statusUpdatedDate } = req.parsedBody || {};

  if (!appId || !status) {
    return sendError(res, 400, 'Application ID and status are required');
  }

  try {
    const updated = await loanService.updateApplicationStatus(appId, status, remarks, nextAction, statusUpdatedDate);
    return sendSuccess(res, { application: updated }, 'Application status updated successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to update application status');
  }
}
