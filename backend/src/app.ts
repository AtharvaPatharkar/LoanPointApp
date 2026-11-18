import { IncomingMessage, ServerResponse } from 'node:http';
import { handleCors, AuthenticatedRequest } from './middleware/auth.js';
import { parseJsonBody, sendError } from './utils/http.js';
import { buildAppRouter } from './routes/index.js';

const router = buildAppRouter();

export async function appHandler(req: IncomingMessage, res: ServerResponse) {
  // 1. Handle CORS Preflight and headers
  if (handleCors(req, res)) {
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 2. Query parameters
  authReq.query = Object.fromEntries(parsedUrl.searchParams.entries());

  // 3. Request Logging (Sanitized, no sensitive details)
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // 4. Parse JSON body for mutation requests
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      authReq.parsedBody = await parseJsonBody(req);
    } catch (err: any) {
      return sendError(res, 400, `Malformed request body: ${err.message}`);
    }
  }

  // 5. Dispatch route
  try {
    await router.dispatch(authReq, res, pathname);
  } catch (err: any) {
    console.error(`[Unhandled Error at ${pathname}]:`, err);
    sendError(res, 500, 'Internal server error');
  }
}
