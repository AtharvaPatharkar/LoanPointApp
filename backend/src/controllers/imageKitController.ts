import { ServerResponse } from 'node:http';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { imageKitService } from '../services/imageKitService.js';

export async function handleGetImageKitAuth(req: AuthenticatedRequest, res: ServerResponse) {
  try {
    const authParams = imageKitService.getAuthenticationParameters();
    return sendSuccess(res, authParams);
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to generate ImageKit authentication parameters');
  }
}

export async function handleUploadFile(req: AuthenticatedRequest, res: ServerResponse) {
  const { fileData, fileName, folder } = req.parsedBody || {};
  if (!fileData || !fileName) {
    return sendError(res, 400, 'fileData (Base64) and fileName are required');
  }

  try {
    const userFolder = req.user?.mobile ? `/loanpoint_vault/${req.user.mobile}` : (folder || '/loanpoint_vault');
    const uploadRes = await imageKitService.uploadFile(fileData, fileName, userFolder);
    return sendSuccess(res, { file: uploadRes }, 'File uploaded successfully', 201);
  } catch (err: any) {
    return sendError(res, 500, err.message || 'File upload failed');
  }
}
