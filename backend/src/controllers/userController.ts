import { ServerResponse } from 'node:http';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { userService } from '../services/userService.js';

export async function handleGetProfile(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const user = await userService.getProfileByMobile(req.user.mobile);
    if (!user) {
      return sendError(res, 404, 'User profile not found');
    }
    return sendSuccess(res, { user });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch profile');
  }
}

export async function handleUpdateProfile(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const user = await userService.updateProfile(req.user.mobile, req.parsedBody || {});
    return sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to update profile');
  }
}

export async function handleGetAllUsers(req: AuthenticatedRequest, res: ServerResponse) {
  try {
    const users = await userService.getAllUsers();
    return sendSuccess(res, { users });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to fetch users');
  }
}

export async function handleAdminUpdateUser(req: AuthenticatedRequest, res: ServerResponse) {
  const userId = req.params?.id;
  if (!userId) {
    return sendError(res, 400, 'User ID parameter is required');
  }

  try {
    const user = await userService.adminUpdateUser(userId, req.parsedBody || {});
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    return sendSuccess(res, { user }, 'User profile updated successfully by admin');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to update user profile');
  }
}

export async function handleAdminCreateUser(req: AuthenticatedRequest, res: ServerResponse) {
  try {
    const user = await userService.adminCreateCustomer(req.parsedBody || {});
    return sendSuccess(res, { user }, 'Customer created successfully', 201);
  } catch (err: any) {
    const statusCode = err.message?.includes('already registered') || err.message?.includes('valid 10-digit') ? 400 : 500;
    return sendError(res, statusCode, err.message || 'Failed to create customer');
  }
}

export async function handleAdminDeleteUser(req: AuthenticatedRequest, res: ServerResponse) {
  const userId = req.params?.id;
  if (!userId) {
    return sendError(res, 400, 'User ID parameter is required');
  }

  try {
    const result = await userService.adminDeleteCustomer(userId);
    return sendSuccess(res, result, 'Customer deleted successfully');
  } catch (err: any) {
    const statusCode = err.message?.includes('not found') ? 404 : 500;
    return sendError(res, statusCode, err.message || 'Failed to delete customer');
  }
}

export async function handleAdminDeleteUserDocument(req: AuthenticatedRequest, res: ServerResponse) {
  const userId = req.params?.userId;
  const docId = req.params?.docId;
  if (!userId || !docId) {
    return sendError(res, 400, 'User ID and Document ID parameters are required');
  }

  try {
    const user = await userService.getProfileByUserId(userId);
    if (!user) {
      return sendError(res, 404, 'User profile not found');
    }
    const documents = await userService.deleteUserDocument(user.mobile, docId);
    return sendSuccess(res, { documents }, 'Document removed successfully by admin');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to remove customer document');
  }
}

export async function handleSaveDocument(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { document } = req.parsedBody || {};
  if (!document || !document.id) {
    return sendError(res, 400, 'Valid document item payload is required');
  }

  try {
    const documents = await userService.saveUserDocument(req.user.mobile, document);
    return sendSuccess(res, { documents }, 'Document saved successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to save document');
  }
}

export async function handleDeleteDocument(req: AuthenticatedRequest, res: ServerResponse) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const docId = req.params?.id;
  if (!docId) {
    return sendError(res, 400, 'Document ID parameter is required');
  }

  try {
    const documents = await userService.deleteUserDocument(req.user.mobile, docId);
    return sendSuccess(res, { documents }, 'Document deleted successfully');
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to delete document');
  }
}
