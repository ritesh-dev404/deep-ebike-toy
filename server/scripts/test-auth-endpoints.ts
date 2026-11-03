import http from 'http';
import app from '../src/app';

const TEST_PORT = 5097;

function makeRequest(
  method: string,
  path: string,
  body?: any
): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
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

async function runAuthTests() {
  console.log('========================================================================');
  console.log('🧪 TESTING AUTH & SETUP ENDPOINTS REGISTRATION');
  console.log('========================================================================');

  const server = app.listen(TEST_PORT);
  console.log(`Server started on 127.0.0.1:${TEST_PORT}\n`);

  try {
    // 1. Test GET /api/auth/setup-status
    console.log('1. Testing GET /api/auth/setup-status...');
    const statusRes = await makeRequest('GET', '/api/auth/setup-status');
    console.log(`   HTTP Status: ${statusRes.status}`);
    console.log(`   Response Body:`, JSON.stringify(statusRes.body));
    if (statusRes.status === 200 && statusRes.body.success === true && typeof statusRes.body.data?.setupRequired === 'boolean') {
      console.log('   ✅ PASS: GET /api/auth/setup-status is correctly mounted and returns valid payload.\n');
    } else {
      console.error('   ❌ FAIL: Unexpected response from GET /api/auth/setup-status\n');
      process.exit(1);
    }

    // 2. Test POST /api/auth/setup (Validation / Lock behavior)
    console.log('2. Testing POST /api/auth/setup...');
    const setupRes = await makeRequest('POST', '/api/auth/setup', {
      username: 'test_owner',
      password: 'Password@123',
      fullName: 'Test Owner',
    });
    console.log(`   HTTP Status: ${setupRes.status}`);
    console.log(`   Response Body:`, JSON.stringify(setupRes.body));
    // If users already exist, it MUST return HTTP 400 with "already exists".
    // If users do not exist (0 users), it returns 201.
    if ((setupRes.status === 400 && setupRes.body.message?.includes('already exists')) || setupRes.status === 201) {
      console.log('   ✅ PASS: POST /api/auth/setup is correctly mounted and enforces security rules.\n');
    } else {
      console.error('   ❌ FAIL: Unexpected response from POST /api/auth/setup\n');
      process.exit(1);
    }

    // 3. Test POST /api/auth/login
    console.log('3. Testing POST /api/auth/login...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'owner',
      password: 'Password@123',
    });
    console.log(`   HTTP Status: ${loginRes.status}`);
    console.log(`   Response Body:`, JSON.stringify(loginRes.body));
    if (loginRes.status === 200 && loginRes.body.success === true && loginRes.body.data?.token) {
      console.log('   ✅ PASS: POST /api/auth/login is correctly mounted and authenticates valid users.\n');
    } else {
      console.error('   ❌ FAIL: Unexpected response from POST /api/auth/login\n');
      process.exit(1);
    }

    // 4. Test wrong credentials rejected on POST /api/auth/login
    console.log('4. Testing POST /api/auth/login with invalid password...');
    const wrongLoginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'owner',
      password: 'WrongPassword999!',
    });
    console.log(`   HTTP Status: ${wrongLoginRes.status}`);
    console.log(`   Response Body:`, JSON.stringify(wrongLoginRes.body));
    if (wrongLoginRes.status === 401 && wrongLoginRes.body.success === false) {
      console.log('   ✅ PASS: POST /api/auth/login correctly rejects invalid credentials with 401.\n');
    } else {
      console.error('   ❌ FAIL: Unexpected response for invalid login\n');
      process.exit(1);
    }

    console.log('========================================================================');
    console.log('🏁 ALL 3 AUTH ENDPOINTS TESTED AND VERIFIED LOCALLY: 100% PASS');
    console.log('========================================================================');
  } finally {
    server.close();
  }
}

runAuthTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
