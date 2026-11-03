const http = require('http');
const fs = require('fs');
const path = require('path');

// Test runner helper
async function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Multipart form-data generator for testing image uploads
function createMultipartFormData(fields, fileField, filePath) {
  const boundary = '----CivicReportBoundary' + Date.now();
  let parts = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    );
  }

  if (fileField && filePath && fs.existsSync(filePath)) {
    const filename = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const headerBuf = Buffer.from(header, 'utf-8');
    const footerBuf = Buffer.from(footer, 'utf-8');
    const fullBody = Buffer.concat([
      Buffer.from(parts.join(''), 'utf-8'),
      headerBuf,
      fileContent,
      footerBuf,
    ]);
    return { boundary, body: fullBody };
  }

  parts.push(`--${boundary}--\r\n`);
  return { boundary, body: Buffer.from(parts.join(''), 'utf-8') };
}

async function runTests() {
  console.log('🚀 Starting Civic Issue Platform API Verification Tests...\n');
  const BASE = 'http://localhost:5000/api';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  try {
    const health = await request('http://localhost:5000/');
    assert(health.status === 200, 'Server is running and root responds with 200');
  } catch (err) {
    console.error('Cannot connect to server at http://localhost:5000. Is it running?', err.message);
    process.exit(1);
  }

  // 2. Admin Login
  console.log('\n--- Test Group 1: Authentication ---');
  let adminToken = '';
  const adminLoginRes = await request(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({
    email: 'admin@civic.com',
    password: 'admin123',
    role: 'admin',
  }));
  assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Admin login with valid credentials succeeds');
  adminToken = adminLoginRes.data.token;

  // 3. Admin portal role guard test
  const adminWrongPortal = await request(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({
    email: 'admin@civic.com',
    password: 'admin123',
    role: 'user', // Wrong role portal
  }));
  assert(adminWrongPortal.status === 403, 'Admin cannot log in through User portal');

  // 4. Register new citizen user
  const uniqueEmail = `citizen_${Date.now()}@example.com`;
  const registerRes = await request(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({
    name: 'Ravi Kumar',
    email: uniqueEmail,
    password: 'password123',
    phone: '9876543210',
  }));
  assert(registerRes.status === 201 && registerRes.data.token, 'Citizen registration creates user and returns JWT');
  const userToken = registerRes.data.token;

  // 5. User login through user portal
  const userLoginRes = await request(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({
    email: uniqueEmail,
    password: 'password123',
    role: 'user',
  }));
  assert(userLoginRes.status === 200 && userLoginRes.data.user.role === 'user', 'Citizen user login succeeds');

  // 6. User Login through Admin portal guard
  const userWrongPortal = await request(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({
    email: uniqueEmail,
    password: 'password123',
    role: 'admin',
  }));
  assert(userWrongPortal.status === 403, 'Citizen user cannot log in through Admin portal');

  // 7. Get Me
  const meRes = await request(`${BASE}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(meRes.status === 200 && meRes.data.user?.email === uniqueEmail, 'GET /api/auth/me returns citizen profile');

  // 8. Create Civic Issue (Garbage Overflow)
  console.log('\n--- Test Group 2: Issue Reporting & Geolocation ---');
  // Create a dummy image for testing upload
  const testImagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(testImagePath, Buffer.from('fake-png-data'));

  const multipart = createMultipartFormData(
    {
      title: 'Garbage Overflow near Metro Station',
      description: 'Severe garbage accumulation spilling onto the main walkway causing health hazards.',
      category: 'Garbage Overflow',
      'location[address]': 'MG Road, Pillar 142',
      'location[city]': 'Bengaluru',
      'location[state]': 'Karnataka',
      'location[pincode]': '560001',
    },
    'image',
    testImagePath
  );

  const createIssueRes = await request(`${BASE}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': `multipart/form-data; boundary=${multipart.boundary}`,
      'Content-Length': multipart.body.length,
    },
  }, multipart.body);

  assert(createIssueRes.status === 201 && createIssueRes.data._id, 'Citizen can report an issue with location and photo upload');
  const createdIssue = createIssueRes.data;
  assert(createdIssue.status === 'Pending', 'New issue status defaults to Pending');
  assert(createdIssue.location?.city === 'Bengaluru', 'Issue location fields stored correctly');

  // 9. Create Second Civic Issue (Damaged Roads)
  const damagedRoadMultipart = createMultipartFormData({
    title: 'Huge Pothole on 100ft Ring Road',
    description: 'Deep road damage causing accidents during rainy conditions.',
    category: 'Damaged Roads',
    'location[address]': '2nd Main, Indiranagar',
    'location[city]': 'Bengaluru',
    'location[state]': 'Karnataka',
    'location[pincode]': '560038',
  });

  const roadIssueRes = await request(`${BASE}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': `multipart/form-data; boundary=${damagedRoadMultipart.boundary}`,
      'Content-Length': damagedRoadMultipart.body.length,
    },
  }, damagedRoadMultipart.body);
  assert(roadIssueRes.status === 201, 'Citizen can report Damaged Roads issue');

  // 10. Get User's Own Issues
  const myIssuesRes = await request(`${BASE}/issues/my`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(Array.isArray(myIssuesRes.data) && myIssuesRes.data.length >= 2, 'GET /api/issues/my returns submitted complaints');

  // 11. Admin Issue Management & Department Assignment
  console.log('\n--- Test Group 3: Admin Management & Department Routing ---');
  const allIssuesRes = await request(`${BASE}/issues`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(Array.isArray(allIssuesRes.data) && allIssuesRes.data.length >= 2, 'Admin GET /api/issues returns all civic complaints');

  // 12. Filter by category
  const filterCatRes = await request(`${BASE}/issues?category=Garbage+Overflow`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(filterCatRes.data.every((i) => i.category === 'Garbage Overflow'), 'Category filter returns matching issues');

  // 13. Admin Dashboard Statistics & Aggregations
  const statsRes = await request(`${BASE}/issues/stats`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(statsRes.status === 200 && statsRes.data.total >= 2, 'Admin stats return total counts and category breakdown');

  // 14. Admin Assigns Issue to Sanitation Dept & sets In Progress with tracking remarks
  const updateRes = await request(`${BASE}/issues/${createdIssue._id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  }, JSON.stringify({
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'Sanitation Dept',
    adminRemarks: 'Assigned to Ward 45 Sanitation Inspector. Sanitation truck dispatched.',
  }));
  assert(updateRes.status === 200 && updateRes.data.assignedTo === 'Sanitation Dept', 'Admin assigns issue to Sanitation Dept');
  assert(updateRes.data.status === 'In Progress', 'Status updated to In Progress');

  // 15. User views real-time tracking update
  const userTrackRes = await request(`${BASE}/issues/${createdIssue._id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(
    userTrackRes.data.status === 'In Progress' &&
    userTrackRes.data.assignedTo === 'Sanitation Dept' &&
    userTrackRes.data.adminRemarks.includes('Sanitation truck dispatched'),
    'Citizen receives real-time tracking update with assigned department and remarks'
  );

  // 16. Admin marks issue as Resolved
  const resolveRes = await request(`${BASE}/issues/${createdIssue._id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  }, JSON.stringify({
    status: 'Resolved',
    adminRemarks: 'Waste cleared completely. Area disinfected.',
  }));
  assert(resolveRes.data.status === 'Resolved', 'Admin marks issue as Resolved');

  // Clean up test file
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed === 0) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(console.error);
