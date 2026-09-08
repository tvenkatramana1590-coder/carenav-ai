const http = require('http');
const app = require('./server');

const TEST_PORT = 5055;
let server;

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request({
            hostname: 'localhost',
            port: TEST_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 Starting CareNav AI API Automated Integration Tests...\n');
    let passed = 0;
    let failed = 0;

    async function assert(name, fn) {
        try {
            await fn();
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
            failed++;
        }
    }

    server = app.listen(TEST_PORT, async () => {
        try {
            // Test 1: Health Check
            await assert('Health Check GET /api/health', async () => {
                const res = await request('GET', '/api/health');
                if (res.status !== 200 || res.body.status !== 'online') {
                    throw new Error(`Expected 200 online, got ${res.status}`);
                }
            });

            // Test 2: Demo Patient Login
            await assert('Auth Login POST /api/auth/login (Patient)', async () => {
                const res = await request('POST', '/api/auth/login', {
                    email: 'alex.morgan@healthmail.com',
                    password: 'password123',
                    role: 'patient'
                });
                if (res.status !== 200 || !res.body.success || res.body.user.role !== 'patient') {
                    throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
                }
            });

            // Test 3: Demo Doctor Login
            await assert('Auth Login POST /api/auth/login (Doctor)', async () => {
                const res = await request('POST', '/api/auth/login', {
                    email: 'dr.reed@stjude.org',
                    password: 'doctor123',
                    role: 'doctor'
                });
                if (res.status !== 200 || !res.body.success || res.body.user.role !== 'doctor') {
                    throw new Error(`Doctor login failed: ${JSON.stringify(res.body)}`);
                }
            });

            // Test 4: Fetch Patient Profile & Vitals
            await assert('Fetch Vitals GET /api/vitals/CN-88492', async () => {
                const res = await request('GET', '/api/vitals/CN-88492');
                if (res.status !== 200 || !Array.isArray(res.body.vitals)) {
                    throw new Error(`Vitals array missing: ${res.status}`);
                }
            });

            // Test 5: Add New Vital Reading
            await assert('Add Vital POST /api/vitals', async () => {
                const res = await request('POST', '/api/vitals', {
                    patientId: 'CN-88492',
                    sys: 120,
                    dia: 80,
                    hr: 72,
                    glucose: 95,
                    spo2: 99
                });
                if (res.status !== 201 || !res.body.success || res.body.vital.status !== 'Normal') {
                    throw new Error(`Vital recording failed: ${JSON.stringify(res.body)}`);
                }
            });

            // Test 6: Fetch Medications
            await assert('Fetch Medications GET /api/medications/CN-88492', async () => {
                const res = await request('GET', '/api/medications/CN-88492');
                if (res.status !== 200 || !Array.isArray(res.body.medications)) {
                    throw new Error(`Medications array missing: ${res.status}`);
                }
            });

            // Test 7: Add Medication
            await assert('Add Medication POST /api/medications', async () => {
                const res = await request('POST', '/api/medications', {
                    patientId: 'CN-88492',
                    name: 'Omega-3 Fish Oil 1000mg',
                    frequency: 'Daily with meal',
                    purpose: 'Cardiovascular support'
                });
                if (res.status !== 201 || !res.body.success) {
                    throw new Error(`Failed to add medication: ${JSON.stringify(res.body)}`);
                }
            });

            // Test 8: Doctors Directory
            await assert('Doctors Directory GET /api/doctors', async () => {
                const res = await request('GET', '/api/doctors');
                if (res.status !== 200 || res.body.doctors.length === 0) {
                    throw new Error(`Doctors list empty or status != 200`);
                }
            });

            // Test 9: Book Appointment
            await assert('Book Appointment POST /api/appointments', async () => {
                const res = await request('POST', '/api/appointments', {
                    patientId: 'CN-88492',
                    doctorId: 'd1',
                    doctorName: 'Dr. Evelyn Reed, MD',
                    specialty: 'General Physician',
                    date: '2026-09-15',
                    slot: '10:30 AM',
                    notes: 'Routine biannual checkup'
                });
                if (res.status !== 201 || !res.body.success) {
                    throw new Error(`Booking failed: ${JSON.stringify(res.body)}`);
                }
            });

            // Test 10: Clinical Triage Assessment
            await assert('Triage Assessment POST /api/triage/assess', async () => {
                const res = await request('POST', '/api/triage/assess', {
                    symptoms: 'Experiencing sudden mild cough and slight sore throat for 2 days',
                    pain: 3,
                    patientId: 'CN-88492'
                });
                if (res.status !== 200 || !res.body.assessment || !res.body.assessment.urgencyLevel) {
                    throw new Error(`Triage evaluation failed: ${JSON.stringify(res.body)}`);
                }
            });

            // Test 11: Medical Report Explainer
            await assert('Report Explainer POST /api/reports/explain', async () => {
                const res = await request('POST', '/api/reports/explain', {
                    reportText: 'Comprehensive Metabolic Panel:\nFasting Blood Sugar: 118 mg/dL\nSerum Creatinine: 0.9 mg/dL\nTotal WBC: 6.8 x10^3/uL\nHbA1c: 5.8%'
                });
                if (res.status !== 200 || !res.body.findings || res.body.findings.length < 3) {
                    throw new Error(`Report analysis incomplete: ${JSON.stringify(res.body)}`);
                }
            });

            // Test 12: Overview System Stats
            await assert('System Stats GET /api/stats/overview', async () => {
                const res = await request('GET', '/api/stats/overview');
                if (res.status !== 200 || !res.body.stats.patients) {
                    throw new Error(`Stats endpoint failed: ${JSON.stringify(res.body)}`);
                }
            });

            console.log(`\n==============================================`);
            console.log(`  🏁 Tests Complete: ${passed} Passed, ${failed} Failed`);
            console.log(`==============================================\n`);
        } finally {
            server.close(() => {
                process.exit(failed > 0 ? 1 : 0);
            });
        }
    });
}

runTests();
