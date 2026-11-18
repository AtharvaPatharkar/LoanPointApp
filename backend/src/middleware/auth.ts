import { IncomingMessage, ServerResponse } from 'node:http';
import { TokenPayload, verifyJwt } from '../utils/jwt.js';
import { sendError } from '../utils/http.js';

export interface AuthenticatedRequest extends IncomingMessage {
  user?: TokenPayload;
  parsedBody?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export function handleCors(req: IncomingMessage, res: ServerResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true; // Request handled
  }
  return false;
}

export function authenticate(req: AuthenticatedRequest, res: ServerResponse): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'Authentication token required (Bearer format)');
    return false;
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyJwt(token);

  if (!payload) {
    sendError(res, 401, 'Invalid or expired authentication token');
    return false;
  }

  req.user = payload;
  return true;
}

export function requireAdmin(req: AuthenticatedRequest, res: ServerResponse): boolean {
  if (!authenticate(req, res)) return false;

  if (req.user?.role !== 'admin') {
    sendError(res, 403, 'Forbidden: Admin access required');
    return false;
  }

  return true;
}
