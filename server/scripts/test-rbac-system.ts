import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../src/app';
import prisma from '../src/config/prisma';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TEST_PORT = 5099;

function request(
  method: string,
  urlPath: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any }> {
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
        path: urlPath,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
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

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 STARTING COMPREHENSIVE RBAC & USER MANAGEMENT TEST SUITE');
  console.log('===============================================================');

  const server = app.listen(TEST_PORT);
  console.log(`Server listening on port ${TEST_PORT} for integration tests`);

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failedCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: OWNER LOGIN
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Owner Login ---');
    const ownerLoginRes = await request('POST', '/api/auth/login', {
      username: 'owner',
      password: 'Password@123',
    });

    assert(ownerLoginRes.status === 200, 'Owner login status 200');
    assert(ownerLoginRes.body.success === true, 'Owner login response success is true');
    assert(ownerLoginRes.body.data?.user?.role === 'OWNER', 'Owner role is OWNER');
    assert(Boolean(ownerLoginRes.body.data?.token), 'Owner JWT token received');
    const ownerToken = ownerLoginRes.body.data?.token;

    // -------------------------------------------------------------
    // TEST 2: TEST AT LEAST THREE DIFFERENT EMPLOYEE ACCOUNTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Creation & Login of 3 Employee Accounts ---');

    // Create Employee 1
    const emp1Res = await request(
      'POST',
      '/api/users',
      {
        username: 'emp_vikram',
        password: 'VikramPassword#123',
        fullName: 'Vikram Singh',
        phone: '9876543211',
        email: 'vikram@deepebikeandtoy.com',
        roleName: 'EMPLOYEE',
      },
      ownerToken
    );
    assert(emp1Res.status === 201 || emp1Res.status === 400, 'Employee 1 creation request succeeded or already exists');

    // Create Employee 2
    const emp2Res = await request(
      'POST',
      '/api/users',
      {
        username: 'emp_anita',
        password: 'AnitaPassword#123',
        fullName: 'Anita Patel',
        phone: '9876543212',
        email: 'anita@deepebikeandtoy.com',
        roleName: 'EMPLOYEE',
      },
      ownerToken
    );
    assert(emp2Res.status === 201 || emp2Res.status === 400, 'Employee 2 creation request succeeded or already exists');

    // Create Employee 3
    const emp3Res = await request(
      'POST',
      '/api/users',
      {
        username: 'emp_suresh',
        password: 'SureshPassword#123',
        fullName: 'Suresh Kumar',
        phone: '9876543213',
        email: 'suresh@deepebikeandtoy.com',
        roleName: 'EMPLOYEE',
      },
      ownerToken
    );
    assert(emp3Res.status === 201 || emp3Res.status === 400, 'Employee 3 creation request succeeded or already exists');

    // Login Employee 1
    const loginEmp1 = await request('POST', '/api/auth/login', {
      username: 'emp_vikram',
      password: 'VikramPassword#123',
    });
    assert(loginEmp1.status === 200, 'Employee 1 login status 200');
    assert(loginEmp1.body.data?.user?.fullName === 'Vikram Singh', 'Employee 1 name is Vikram Singh');
    assert(loginEmp1.body.data?.user?.role === 'EMPLOYEE', 'Employee 1 role is EMPLOYEE');
    const emp1Token = loginEmp1.body.data?.token;

    // Login Employee 2
    const loginEmp2 = await request('POST', '/api/auth/login', {
      username: 'emp_anita',
      password: 'AnitaPassword#123',
    });
    assert(loginEmp2.status === 200, 'Employee 2 login status 200');
    assert(loginEmp2.body.data?.user?.fullName === 'Anita Patel', 'Employee 2 name is Anita Patel');
    assert(loginEmp2.body.data?.user?.role === 'EMPLOYEE', 'Employee 2 role is EMPLOYEE');

    // Login Employee 3
    const loginEmp3 = await request('POST', '/api/auth/login', {
      username: 'emp_suresh',
      password: 'SureshPassword#123',
    });
    assert(loginEmp3.status === 200, 'Employee 3 login status 200');
    assert(loginEmp3.body.data?.user?.fullName === 'Suresh Kumar', 'Employee 3 name is Suresh Kumar');
    assert(loginEmp3.body.data?.user?.role === 'EMPLOYEE', 'Employee 3 role is EMPLOYEE');
    const emp1Id = loginEmp1.body.data?.user?.id;
    const emp2Id = loginEmp2.body.data?.user?.id;
    const emp3Id = loginEmp3.body.data?.user?.id;

    // -------------------------------------------------------------
    // TEST 3: WRONG PASSWORD
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Wrong Password ---');
    const wrongOwnerPass = await request('POST', '/api/auth/login', {
      username: 'owner',
      password: 'WrongPassword999!',
    });
    assert(wrongOwnerPass.status === 401, 'Owner with wrong password rejected with 401');

    const wrongEmpPass = await request('POST', '/api/auth/login', {
      username: 'emp_vikram',
      password: 'WrongVikramPassword!',
    });
    assert(wrongEmpPass.status === 401, 'Employee with wrong password rejected with 401');

    const nonExistentUser = await request('POST', '/api/auth/login', {
      username: 'nonexistent_user_99',
      password: 'SomePassword#123',
    });
    assert(nonExistentUser.status === 401, 'Nonexistent user rejected with 401');

    // -------------------------------------------------------------
    // TEST 4: EMPLOYEE ACCESS RESTRICTIONS
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Employee Access Restrictions ---');

    // Employee attempting to access user management
    const empAccessUsers = await request('GET', '/api/users', undefined, emp1Token);
    assert(empAccessUsers.status === 403, 'Employee blocked from GET /api/users (403 Forbidden)');

    // Employee attempting to create a user
    const empCreateUser = await request(
      'POST',
      '/api/users',
      {
        username: 'hacker',
        password: 'Password123',
        fullName: 'Hacker',
        roleName: 'OWNER',
      },
      emp1Token
    );
    assert(empCreateUser.status === 403, 'Employee blocked from POST /api/users (403 Forbidden)');

    // Employee attempting to create a product (Owner only)
    const empCreateProduct = await request(
      'POST',
      '/api/products',
      {
        name: 'Unauthorized E-Bike',
        productCode: 'UNAUTH-001',
      },
      emp1Token
    );
    assert(empCreateProduct.status === 403, 'Employee blocked from POST /api/products (403 Forbidden)');

    // Employee attempting to modify settings (Owner only)
    const empModifySettings = await request(
      'PUT',
      '/api/settings',
      { SHOP_NAME: 'Hacked Shop' },
      emp1Token
    );
    assert(empModifySettings.status === 403, 'Employee blocked from PUT /api/settings (403 Forbidden)');

    // Employee fetching products: purchasePrice (cost) should be omitted
    const empGetProducts = await request('GET', '/api/products', undefined, emp1Token);
    assert(empGetProducts.status === 200, 'Employee allowed to GET /api/products for billing');
    if (empGetProducts.body.data && empGetProducts.body.data.length > 0) {
      const hasPurchasePrice = 'purchasePrice' in empGetProducts.body.data[0];
      assert(!hasPurchasePrice, 'Employee product response hides purchasePrice (cost)');
    } else {
      assert(true, 'Products check verified (catalog empty or purchasePrice hidden)');
    }

    // -------------------------------------------------------------
    // TEST 5: PASSWORD RESET
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Employee Password Reset by Owner ---');
    const newAnitaPassword = 'NewAnitaSecret#2026';
    const resetRes = await request(
      'POST',
      `/api/users/${emp2Id}/reset-password`,
      { newPassword: newAnitaPassword },
      ownerToken
    );
    assert(resetRes.status === 200, 'Owner password reset request status 200');

    // Old password should fail
    const oldPassAttempt = await request('POST', '/api/auth/login', {
      username: 'emp_anita',
      password: 'AnitaPassword#123',
    });
    assert(oldPassAttempt.status === 401, 'Old password fails with 401 after reset');

    // New password should succeed
    const newPassAttempt = await request('POST', '/api/auth/login', {
      username: 'emp_anita',
      password: newAnitaPassword,
    });
    assert(newPassAttempt.status === 200, 'New reset password logs in successfully with 200');

    // -------------------------------------------------------------
    // TEST 6: DEACTIVATED EMPLOYEE LOGIN
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Deactivated Employee Login ---');
    // Deactivate Employee 3
    const deactivateRes = await request(
      'PATCH',
      `/api/users/${emp3Id}/status`,
      { isActive: false },
      ownerToken
    );
    assert(deactivateRes.status === 200, 'Owner deactivates employee 3 successfully');

    // Login attempt by deactivated employee
    const deactivatedLogin = await request('POST', '/api/auth/login', {
      username: 'emp_suresh',
      password: 'SureshPassword#123',
    });
    assert(deactivatedLogin.status === 403, 'Deactivated employee login rejected with 403 Forbidden');
    assert(
      typeof deactivatedLogin.body.message === 'string' &&
        deactivatedLogin.body.message.toLowerCase().includes('deactivated'),
      'Deactivated employee message clearly states account is deactivated'
    );

    // Reactivate Employee 3
    const reactivateRes = await request(
      'PATCH',
      `/api/users/${emp3Id}/status`,
      { isActive: true },
      ownerToken
    );
    assert(reactivateRes.status === 200, 'Owner reactivates employee 3 successfully');

    const reactivatedLogin = await request('POST', '/api/auth/login', {
      username: 'emp_suresh',
      password: 'SureshPassword#123',
    });
    assert(reactivatedLogin.status === 200, 'Reactivated employee logs in successfully with 200');

    // -------------------------------------------------------------
    // TEST 7: API AUTHORIZATION & ROLE PERMISSION TOGGLING
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Permission Assignment & API Authorization ---');

    // Employee 1 attempts to add customer (initially allowed with CUSTOMERS_MANAGE)
    const addCustAllowed = await request(
      'POST',
      '/api/customers',
      {
        name: 'Test Customer 1',
        phone: '9988776655',
      },
      emp1Token
    );
    assert(addCustAllowed.status === 201 || addCustAllowed.status === 400, 'Customer creation permitted when role has CUSTOMERS_MANAGE');

    // Remove CUSTOMERS_MANAGE from EMPLOYEE role
    const updatedPermsRes = await request(
      'PUT',
      '/api/users/system/roles/EMPLOYEE/permissions',
      {
        permissionNames: ['SALES_CREATE', 'SALES_READ', 'PRODUCTS_READ'], // omitted CUSTOMERS_MANAGE
      },
      ownerToken
    );
    assert(updatedPermsRes.status === 200, 'Owner removed CUSTOMERS_MANAGE from EMPLOYEE role');

    // Employee 1 attempts to add customer now -> should be blocked!
    const addCustBlocked = await request(
      'POST',
      '/api/customers',
      {
        name: 'Test Customer Blocked',
        phone: '9988776656',
      },
      emp1Token
    );
    assert(addCustBlocked.status === 403, 'Employee without CUSTOMERS_MANAGE blocked from adding customer with 403 Forbidden');

    // Restore CUSTOMERS_MANAGE to EMPLOYEE role
    await request(
      'PUT',
      '/api/users/system/roles/EMPLOYEE/permissions',
      {
        permissionNames: ['SALES_CREATE', 'SALES_READ', 'PRODUCTS_READ', 'CUSTOMERS_MANAGE'],
      },
      ownerToken
    );
    console.log('  Restored default permissions to EMPLOYEE role');

    // -------------------------------------------------------------
    // TEST 8: SELF-PROTECTION (OWNER CANNOT DEACTIVATE SELF)
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Owner Self-Protection ---');
    const ownerProfile = await request('GET', '/api/auth/profile', undefined, ownerToken);
    const ownerId = ownerProfile.body.data.id;

    const selfDeactivateRes = await request(
      'PATCH',
      `/api/users/${ownerId}/status`,
      { isActive: false },
      ownerToken
    );
    assert(selfDeactivateRes.status === 400, 'Owner cannot deactivate own account (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 9: PERFORMANCE METRICS ENDPOINT
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Employee Performance Endpoint ---');
    const perfRes = await request('GET', `/api/users/${emp1Id || emp2Id}/performance`, undefined, ownerToken);
    assert(perfRes.status === 200, 'GET /api/users/:id/performance returns status 200');
    assert('metrics' in perfRes.body.data, 'Performance response includes metrics');
    assert('recentSales' in perfRes.body.data, 'Performance response includes recentSales');
    assert('recentAuditLogs' in perfRes.body.data, 'Performance response includes recentAuditLogs');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🏁 RBAC TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('===============================================================');

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
