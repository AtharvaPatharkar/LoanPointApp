import { ServerResponse } from 'node:http';
import { AuthenticatedRequest, authenticate, requireAdmin } from '../middleware/auth.js';
import { sendError } from '../utils/http.js';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as loanController from '../controllers/loanController.js';
import * as businessController from '../controllers/businessController.js';
import * as imageKitController from '../controllers/imageKitController.js';
import { testDbConnection } from '../database/index.js';

export type RouteHandler = (req: AuthenticatedRequest, res: ServerResponse) => Promise<any> | any;

interface RouteDefinition {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  authRequired?: boolean;
  adminRequired?: boolean;
}

export class Router {
  private routes: RouteDefinition[] = [];

  public register(
    method: string,
    path: string,
    handler: RouteHandler,
    options: { auth?: boolean; admin?: boolean } = {}
  ) {
    const paramNames: string[] = [];
    const regexPath = path.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });

    const pattern = new RegExp(`^${regexPath}$`);
    this.routes.push({
      method: method.toUpperCase(),
      pattern,
      paramNames,
      handler,
      authRequired: options.auth,
      adminRequired: options.admin,
    });
  }

  public async dispatch(req: AuthenticatedRequest, res: ServerResponse, pathname: string) {
    const method = req.method?.toUpperCase() || 'GET';

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = pathname.match(route.pattern);
      if (match) {
        req.params = {};
        for (let i = 0; i < route.paramNames.length; i++) {
          req.params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
        }

        // Authorization checks
        if (route.adminRequired) {
          if (!requireAdmin(req, res)) return;
        } else if (route.authRequired) {
          if (!authenticate(req, res)) return;
        }

        return await route.handler(req, res);
      }
    }

    sendError(res, 404, `Endpoint ${method} ${pathname} not found`);
  }
}

export function buildAppRouter(): Router {
  const router = new Router();

  // Health check
  router.register('GET', '/api/v1/health', async (_req, res) => {
    const dbOk = await testDbConnection();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        message: 'LoanPoint Backend is running',
        status: 'healthy',
        database: dbOk ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      })
    );
  });

  // Auth Routes
  router.register('POST', '/api/v1/auth/request-otp', authController.handleRequestOtp);
  router.register('POST', '/api/v1/auth/verify-otp', authController.handleVerifyOtp);
  router.register('POST', '/api/v1/auth/register', authController.handleRegister);
  router.register('POST', '/api/v1/auth/admin-login', authController.handleAdminLogin);

  // User Profile Routes (Authenticated)
  router.register('GET', '/api/v1/user/profile', userController.handleGetProfile, { auth: true });
  router.register('PUT', '/api/v1/user/profile', userController.handleUpdateProfile, { auth: true });
  router.register('POST', '/api/v1/user/documents', userController.handleSaveDocument, { auth: true });
  router.register('DELETE', '/api/v1/user/documents/:id', userController.handleDeleteDocument, { auth: true });

  // Loan Application Routes
  router.register('GET', '/api/v1/loans/applications', loanController.handleGetApplications, { auth: true });
  router.register('GET', '/api/v1/loans/applications/:id', loanController.handleGetApplicationById, { auth: true });
  router.register('POST', '/api/v1/loans/enquiry', loanController.handleSubmitEnquiry, { auth: true });

  // Insurance Routes
  router.register('GET', '/api/v1/insurance', businessController.handleGetInsurance, { auth: true });
  router.register('POST', '/api/v1/insurance', businessController.handleCreateInsurance, { auth: true });

  // Referral Routes
  router.register('GET', '/api/v1/referrals', businessController.handleGetReferrals, { auth: true });
  router.register('POST', '/api/v1/referrals', businessController.handleCreateReferral, { auth: true });

  // ImageKit Secure Routes
  router.register('GET', '/api/v1/imagekit/auth', imageKitController.handleGetImageKitAuth, { auth: true });
  router.register('POST', '/api/v1/imagekit/upload', imageKitController.handleUploadFile, { auth: true });

  // Admin Operations (Admin auth required)
  router.register('GET', '/api/v1/admin/users', userController.handleGetAllUsers, { admin: true });
  router.register('GET', '/api/v1/admin/loans', loanController.handleGetAllApplications, { admin: true });
  router.register('PUT', '/api/v1/admin/loans/:id/status', loanController.handleUpdateApplicationStatus, { admin: true });
  router.register('GET', '/api/v1/admin/insurance', businessController.handleGetAllInsurance, { admin: true });
  router.register('PUT', '/api/v1/admin/insurance/:id/status', businessController.handleUpdateInsuranceStatus, { admin: true });
  router.register('GET', '/api/v1/admin/referrals', businessController.handleGetAllReferrals, { admin: true });
  router.register('PUT', '/api/v1/admin/referrals/:id/status', businessController.handleUpdateReferralStatus, { admin: true });

  return router;
}
