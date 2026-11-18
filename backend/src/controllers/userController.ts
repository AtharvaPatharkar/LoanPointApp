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
