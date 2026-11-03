import http from 'http';
import app from '../src/app';

const TEST_PORT = 5096;

function makeRequest(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data), headers: res.headers });
          } catch {
            resolve({ status: res.statusCode || 500, body: data, headers: res.headers });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

let passedCount = 0;
let failedCount = 0;

function assertCheck(name: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}: ${detail}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${name}: ${detail}`);
    failedCount++;
  }
}

async function runThreeAuthFlowTests() {
  console.log('========================================================================');
  console.log('🚀 TESTING 3-OPTION AUTHENTICATION & REGISTRATION FLOWS (POS SUITE)');
  console.log('========================================================================\n');

  const server = app.listen(TEST_PORT);

  try {
    // -------------------------------------------------------------------------
    // SUITE 1: OWNER LOGIN & ROLE VERIFICATION
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing Option 1: Owner Login & Verification ---');

    // 1.1 Owner login with valid credentials
    const ownerRes = await makeRequest('POST', '/api/auth/login', {
      username: 'owner',
      password: 'Password@123',
      expectedRole: 'OWNER',
    });
    assertCheck(
      'Owner Valid Login',
      ownerRes.status === 200 && ownerRes.body.data?.user?.role === 'OWNER',
      `HTTP ${ownerRes.status}, role: ${ownerRes.body.data?.user?.role}`
    );
    const ownerToken = ownerRes.body.data?.token;

    // 1.2 Owner tab rejection when employee credentials are used
    const empInOwnerTab = await makeRequest('POST', '/api/auth/login', {
      username: 'emp_rohit',
      password: 'RohitPassword#123',
      expectedRole: 'OWNER',
    });
    assertCheck(
      'Employee In Owner Tab Rejected',
      empInOwnerTab.status === 403 && empInOwnerTab.body.message.includes('Store Owners only'),
      `HTTP ${empInOwnerTab.status} "${empInOwnerTab.body.message}"`
    );

    // 1.3 Owner login with wrong password
    const ownerWrongPass = await makeRequest('POST', '/api/auth/login', {
      username: 'owner',
      password: 'WrongPassword999!',
      expectedRole: 'OWNER',
    });
    assertCheck(
      'Owner Wrong Password Rejected',
      ownerWrongPass.status === 401 && ownerWrongPass.body.message.includes('Invalid username or password'),
      `HTTP ${ownerWrongPass.status} "${ownerWrongPass.body.message}"`
    );

    // -------------------------------------------------------------------------
    // SUITE 2: EMPLOYEE LOGIN & ROLE VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Option 2: Employee Login & Verification ---');

    // 2.1 Employee login with valid credentials
    const empRes = await makeRequest('POST', '/api/auth/login', {
      username: 'emp_rohit',
      password: 'RohitPassword#123',
      expectedRole: 'EMPLOYEE',
    });
    assertCheck(
      'Employee Valid Login',
      empRes.status === 200 && empRes.body.data?.user?.role === 'EMPLOYEE',
      `HTTP ${empRes.status}, role: ${empRes.body.data?.user?.role}`
    );

    // 2.2 Owner credentials rejected in employee tab
    const ownerInEmpTab = await makeRequest('POST', '/api/auth/login', {
      username: 'owner',
      password: 'Password@123',
      expectedRole: 'EMPLOYEE',
    });
    assertCheck(
      'Owner In Employee Tab Rejected',
      ownerInEmpTab.status === 403 && ownerInEmpTab.body.message.includes('Employees only'),
      `HTTP ${ownerInEmpTab.status} "${ownerInEmpTab.body.message}"`
    );

    // 2.3 Employee login with wrong password
    const empWrongPass = await makeRequest('POST', '/api/auth/login', {
      username: 'emp_rohit',
      password: 'WrongEmployeePassword!',
      expectedRole: 'EMPLOYEE',
    });
    assertCheck(
      'Employee Wrong Password Rejected',
      empWrongPass.status === 401 && empWrongPass.body.message.includes('Invalid username or password'),
      `HTTP ${empWrongPass.status} "${empWrongPass.body.message}"`
    );

    // -------------------------------------------------------------------------
    // SUITE 3: EMPLOYEE REGISTRATION, PENDING STATUS & OWNER APPROVAL WORKFLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Option 3: Employee Registration & Owner Approval ---');

    const testRegUsername = `staff_new_${Date.now().toString().slice(-4)}`;
    const testRegPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 3.1 Successful registration creates PENDING account (isActive: false)
    const regRes = await makeRequest('POST', '/api/auth/register-employee', {
      fullName: 'Vikram Rajput',
      username: testRegUsername,
      phone: testRegPhone,
      password: 'VikramPass@2026',
      confirmPassword: 'VikramPass@2026',
    });
    assertCheck(
      'Employee Self-Registration',
      regRes.status === 201 && regRes.body.data?.status === 'PENDING_APPROVAL',
      `HTTP ${regRes.status}, status: ${regRes.body.data?.status}`
    );
    const newEmployeeId = regRes.body.data?.id;

    // 3.2 Pending employee blocked from login before owner approval
    const preApprovalLogin = await makeRequest('POST', '/api/auth/login', {
      username: testRegUsername,
      password: 'VikramPass@2026',
      expectedRole: 'EMPLOYEE',
    });
    assertCheck(
      'Pending Employee Login Blocked',
      preApprovalLogin.status === 403 && preApprovalLogin.body.message.includes('pending approval'),
      `HTTP ${preApprovalLogin.status} "${preApprovalLogin.body.message}"`
    );

    // 3.3 Duplicate username rejection
    const dupUsernameRes = await makeRequest('POST', '/api/auth/register-employee', {
      fullName: 'Duplicate User',
      username: testRegUsername,
      phone: '9998887776',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });
    assertCheck(
      'Duplicate Username Blocked',
      dupUsernameRes.status === 400 && dupUsernameRes.body.message.includes('already taken'),
      `HTTP ${dupUsernameRes.status} "${dupUsernameRes.body.message}"`
    );

    // 3.4 Password mismatch rejection
    const mismatchRes = await makeRequest('POST', '/api/auth/register-employee', {
      fullName: 'Mismatch Tester',
      username: `user_${Date.now()}`,
      phone: '9123456789',
      password: 'Password@123',
      confirmPassword: 'DifferentPassword@123',
    });
    assertCheck(
      'Mismatched Passwords Blocked',
      mismatchRes.status === 400 && mismatchRes.body.message.includes('do not match'),
      `HTTP ${mismatchRes.status} "${mismatchRes.body.message}"`
    );

    // 3.5 Owner approves and activates new employee account
    const approveRes = await makeRequest(
      'PATCH',
      `/api/users/${newEmployeeId}/status`,
      { isActive: true },
      ownerToken
    );
    assertCheck(
      'Owner Approves Employee',
      approveRes.status === 200 && approveRes.body.data?.isActive === true,
      `HTTP ${approveRes.status}, isActive: ${approveRes.body.data?.isActive}`
    );

    // 3.6 Approved employee can now successfully log in
    const postApprovalLogin = await makeRequest('POST', '/api/auth/login', {
      username: testRegUsername,
      password: 'VikramPass@2026',
      expectedRole: 'EMPLOYEE',
    });
    assertCheck(
      'Approved Employee Login Success',
      postApprovalLogin.status === 200 && postApprovalLogin.body.data?.token !== undefined,
      `HTTP ${postApprovalLogin.status}, logged in as: ${postApprovalLogin.body.data?.user?.fullName}`
    );

    // 3.7 Owner deactivates employee
    const deactivateRes = await makeRequest(
      'PATCH',
      `/api/users/${newEmployeeId}/status`,
      { isActive: false },
      ownerToken
    );
    assertCheck(
      'Owner Deactivates Employee',
      deactivateRes.status === 200 && deactivateRes.body.data?.isActive === false,
      `HTTP ${deactivateRes.status}, isActive: false`
    );

    // 3.8 Deactivated employee blocked from login
    const deactivatedLogin = await makeRequest('POST', '/api/auth/login', {
      username: testRegUsername,
      password: 'VikramPass@2026',
      expectedRole: 'EMPLOYEE',
    });
    assertCheck(
      'Deactivated Employee Login Blocked',
      deactivatedLogin.status === 403 && deactivatedLogin.body.message.includes('deactivated'),
      `HTTP ${deactivatedLogin.status} "${deactivatedLogin.body.message}"`
    );

    // -------------------------------------------------------------------------
    // SUITE 4: PRODUCTION 404 RESILIENCE & URL ALIAS VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing URL Aliases & 404 Resilience ---');

    // 4.1 Login at /api/auth/login
    const standardRoute = await makeRequest('POST', '/api/auth/login', {
      username: 'owner',
      password: 'Password@123',
    });
    assertCheck(
      'POST /api/auth/login route',
      standardRoute.status === 200,
      `HTTP ${standardRoute.status}`
    );

    // 4.2 Login at /auth/login (without /api prefix)
    const aliasRoute = await makeRequest('POST', '/auth/login', {
      username: 'owner',
      password: 'Password@123',
    });
    assertCheck(
      'POST /auth/login alias route (no 404)',
      aliasRoute.status === 200,
      `HTTP ${aliasRoute.status}`
    );

    // 4.3 Setup status at /auth/setup-status (without /api prefix)
    const setupAlias = await makeRequest('GET', '/auth/setup-status');
    assertCheck(
      'GET /auth/setup-status alias route (no 404)',
      setupAlias.status === 200,
      `HTTP ${setupAlias.status}`
    );

    console.log('\n========================================================================');
    console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount} CHECKS`);
    console.log('========================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runThreeAuthFlowTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
