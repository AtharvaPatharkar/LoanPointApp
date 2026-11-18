import http from 'node:http';
import { appHandler } from './app.js';
import { config } from './config/index.js';
import { signJwt } from './utils/jwt.js';

const PORT = 4005;
let server: http.Server;
const baseUrl = `http://localhost:${PORT}`;

function makeRequest(method: string, path: string, body?: any, token?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = body ? JSON.stringify(body) : '';

    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const data = responseBody ? JSON.parse(responseBody) : {};
            resolve({ status: res.statusCode || 200, data });
          } catch {
            resolve({ status: res.statusCode || 200, data: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting LoanPoint V3 Security Verification Suite ---');

  server = http.createServer(appHandler);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}`);

  let testUserToken = '';
  let adminToken = '';
  const testMobile = '9876543210';
  const otherMobile = '9123456789';

  let passed = 0;
  let failed = 0;

  async function assert(desc: string, fn: () => Promise<boolean>) {
    try {
      const ok = await fn();
      if (ok) {
        console.log(`[PASS] ${desc}`);
        passed++;
      } else {
        console.error(`[FAIL] ${desc}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${desc} - Exception:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await assert('1. Health check (GET /api/v1/health)', async () => {
    const res = await makeRequest('GET', '/api/v1/health');
    return res.status === 200 && res.data.success === true && res.data.status === 'healthy';
  });

  // 2. Request OTP
  await assert('2. Request OTP (POST /api/v1/auth/request-otp)', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/request-otp', { mobile: testMobile });
    return res.status === 200 && res.data.success === true && res.data.demoOtp === '123456';
  });

  // 3. Verify OTP & Obtain Token
  await assert('3. Verify OTP & Obtain JWT (POST /api/v1/auth/verify-otp)', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/verify-otp', { mobile: testMobile, otp: '123456' });
    if (res.status === 200 && res.data.token) {
      testUserToken = res.data.token;
      return true;
    }
    return false;
  });

  // 4. Admin Login with Configured PIN
  await assert('4. Admin Login via backend PIN verification (POST /api/v1/auth/admin-login)', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/admin-login', { pin: config.adminPin || '9545' });
    if (res.status === 200 && res.data.token) {
      adminToken = res.data.token;
      return true;
    }
    return false;
  });

  // 5. Admin Login Rejection on Wrong PIN
  await assert('5. Admin Login rejects invalid PIN (401)', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/admin-login', { pin: 'WRONG_PIN_0000' });
    return res.status === 401 && res.data.success === false;
  });

  // 6. Rate Limiting on OTP Requests (Max 3 per window)
  await assert('6. Rate Limiting: OTP requests throttled after limit (HTTP 429)', async () => {
    // 1st was in step 2. Call twice more then 4th should be 429
    await makeRequest('POST', '/api/v1/auth/request-otp', { mobile: testMobile });
    await makeRequest('POST', '/api/v1/auth/request-otp', { mobile: testMobile });
    const fourthRes = await makeRequest('POST', '/api/v1/auth/request-otp', { mobile: testMobile });
    return fourthRes.status === 429 && fourthRes.data.success === false;
  });

  // 7. Ownership Validation on Loan Enquiry Submission
  await assert('7. Ownership Security: Customer cannot submit loan for another mobile (403)', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/loans/enquiry',
      {
        loanType: 'home',
        requestedAmount: 1000000,
        tenureMonths: 120,
        applicantName: 'Fraud Attempt',
        mobile: otherMobile, // Differs from authenticated testMobile
      },
      testUserToken
    );
    return res.status === 403 && res.data.success === false;
  });

  // 8. Ownership Validation: Valid Submission
  let testAppId = '';
  await assert('8. Loan Enquiry: Customer can submit loan for their own mobile (201)', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/loans/enquiry',
      {
        loanType: 'home',
        requestedAmount: 1000000,
        tenureMonths: 120,
        applicantName: 'Test Customer Safe',
        mobile: testMobile,
      },
      testUserToken
    );
    if (res.status === 201 && res.data.application) {
      testAppId = res.data.application.id;
      return true;
    }
    return false;
  });

  // 9. Ownership Validation: Customer Access to Single Application
  await assert('9. Loan Retrieval: Customer can fetch own application', async () => {
    const res = await makeRequest('GET', `/api/v1/loans/applications/${testAppId}`, undefined, testUserToken);
    return res.status === 200 && res.data.application && res.data.application.id === testAppId;
  });

  // 10. Cross-Customer Access Prevention
  await assert('10. Cross-Customer Access: Another customer cannot access application (403)', async () => {
    const otherCustomerToken = signJwt({
      userId: 'test-user-2',
      mobile: otherMobile,
      role: 'customer',
    });
    const res = await makeRequest('GET', `/api/v1/loans/applications/${testAppId}`, undefined, otherCustomerToken);
    return res.status === 403 && res.data.success === false;
  });

  // 11. Role Authorization: Customer Blocked from Admin Routes (403)
  await assert('11. Role Authorization: Customer token blocked from Admin routes (403)', async () => {
    const res = await makeRequest('GET', '/api/v1/admin/loans', undefined, testUserToken);
    return res.status === 403 && res.data.success === false;
  });

  // 12. Admin Role Access: Admin can access Admin Routes
  await assert('12. Role Authorization: Admin token allowed on Admin routes (200)', async () => {
    const res = await makeRequest('GET', '/api/v1/admin/loans', undefined, adminToken);
    return res.status === 200 && Array.isArray(res.data.applications);
  });

  // 13. Secure ImageKit Authentication Parameters
  await assert('13. Secure ImageKit: Token, Signature & Public Key returned, NO Private Key', async () => {
    const res = await makeRequest('GET', '/api/v1/imagekit/auth', undefined, testUserToken);
    return (
      res.status === 200 &&
      res.data.token &&
      res.data.signature &&
      res.data.publicKey &&
      !res.data.privateKey &&
      !JSON.stringify(res.data).includes('private_')
    );
  });

  server.close();
  console.log(`\n=======================================================`);
  console.log(`Security Verification Suite Complete: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=======================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  if (server) server.close();
  process.exit(1);
});
