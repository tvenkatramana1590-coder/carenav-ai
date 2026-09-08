const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_DIR = path.resolve(__dirname, '../database');
const DB_PATH = path.join(DB_DIR, 'carenav.db');
const SEED_DATA_PATH = path.join(DB_DIR, 'data.json');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance = null;

function getDb() {
    if (!dbInstance) {
        dbInstance = new DatabaseSync(DB_PATH);
        dbInstance.exec('PRAGMA foreign_keys = ON;');
        dbInstance.exec('PRAGMA journal_mode = WAL;');
        initSchema(dbInstance);
    }
    return dbInstance;
}

function initSchema(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS patients (
            patient_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            age INTEGER,
            gender TEXT DEFAULT 'Not specified',
            blood_group TEXT NOT NULL,
            allergies TEXT DEFAULT 'None reported',
            chronic_conditions TEXT DEFAULT 'None recorded',
            emergency_contact TEXT DEFAULT 'Contact on file',
            primary_physician TEXT DEFAULT 'Unassigned',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            license_number TEXT UNIQUE NOT NULL,
            hospital_affiliation TEXT DEFAULT 'CareNav Affiliated Hospital',
            experience_years INTEGER DEFAULT 5,
            rating REAL DEFAULT 4.9,
            icon TEXT DEFAULT 'fa-user-doctor',
            availability TEXT DEFAULT 'Today & Tomorrow',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS vitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            date TEXT NOT NULL,
            bp TEXT NOT NULL,
            hr INTEGER NOT NULL,
            glucose INTEGER NOT NULL,
            spo2 INTEGER NOT NULL,
            status TEXT DEFAULT 'Normal',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS medications (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            name TEXT NOT NULL,
            frequency TEXT NOT NULL,
            purpose TEXT,
            is_active INTEGER DEFAULT 1,
            prescribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT,
            doctor_name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            appointment_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            notes TEXT,
            status TEXT DEFAULT 'Confirmed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS triage_logs (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            symptoms_text TEXT NOT NULL,
            pain_severity INTEGER DEFAULT 1,
            urgency_level TEXT NOT NULL,
            urgency_score INTEGER DEFAULT 0,
            recommended_specialist TEXT,
            potential_differentials TEXT,
            assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        );
    `);

    // Seed database if users table is empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        seedDatabase(db);
    }
}

function seedDatabase(db) {
    console.log('Seeding initial CareNav AI healthcare records from data.json...');

    let seedData = null;
    if (fs.existsSync(SEED_DATA_PATH)) {
        try {
            seedData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf8'));
        } catch (e) {
            console.error('Failed to parse data.json for seeding:', e.message);
        }
    }

    // Default Seed Fallback
    const users = (seedData && seedData.users) ? seedData.users : [
        {
            id: "CN-88492",
            name: "Alex Morgan",
            email: "alex.morgan@healthmail.com",
            password: "password123",
            role: "patient",
            age: 34,
            gender: "Male",
            bloodGroup: "O Positive (Rh+)",
            allergies: ["Penicillin", "Peanuts"],
            chronicConditions: ["Mild Asthma", "Pre-diabetes"],
            emergencyContact: "Sarah Morgan (Spouse) - +1 (555) 019-2834",
            primaryCarePhysician: "Dr. Evelyn Reed (St. Jude Hospital)"
        },
        {
            id: "DOC-1029",
            name: "Dr. Evelyn Reed, MD",
            email: "dr.reed@stjude.org",
            password: "doctor123",
            role: "doctor",
            specialty: "General Physician",
            hospital: "St. Jude Memorial Hospital",
            license: "MED-499201"
        }
    ];

    const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
    const insertPatient = db.prepare(`
        INSERT INTO patients (patient_id, user_id, age, gender, blood_group, allergies, chronic_conditions, emergency_contact, primary_physician)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertDoctor = db.prepare(`
        INSERT INTO doctors (doctor_id, user_id, name, specialty, license_number, hospital_affiliation, experience_years, rating, icon, availability)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of users) {
        insertUser.run(u.id, u.name, u.email.toLowerCase(), u.password, u.role);
        if (u.role === 'patient') {
            insertPatient.run(
                u.id,
                u.id,
                u.age || 34,
                u.gender || 'Male',
                u.bloodGroup || 'O Positive (Rh+)',
                Array.isArray(u.allergies) ? u.allergies.join(', ') : (u.allergies || 'Penicillin, Peanuts'),
                Array.isArray(u.chronicConditions) ? u.chronicConditions.join(', ') : (u.chronicConditions || 'Mild Asthma, Pre-diabetes'),
                u.emergencyContact || 'Sarah Morgan (Spouse) - +1 (555) 019-2834',
                u.primaryCarePhysician || 'Dr. Evelyn Reed (St. Jude Hospital)'
            );
        } else if (u.role === 'doctor') {
            insertDoctor.run(
                u.id,
                u.id,
                u.name,
                u.specialty || 'General Physician',
                u.license || 'MED-499201',
                u.hospital || 'St. Jude Memorial Hospital',
                14,
                4.9,
                'fa-user-doctor',
                'Today & Tomorrow'
            );
        }
    }

    // Seed doctors catalog
    const doctors = (seedData && seedData.doctors) ? seedData.doctors : [
        { id: "d1", name: "Dr. Evelyn Reed, MD", specialty: "General Physician", hospital: "St. Jude Memorial Hospital", experience: 14, rating: 4.9, icon: "fa-user-doctor", availability: "Today & Tomorrow", license: "MED-499201", email: "dr.reed@stjude.org" },
        { id: "d2", name: "Dr. Marcus Vance, FACC", specialty: "Cardiologist", hospital: "Metro Heart & Vascular Institute", experience: 18, rating: 4.95, icon: "fa-heart-pulse", availability: "Tomorrow, 10:00 AM", license: "MED-338291", email: "dr.vance@metroheart.org" },
        { id: "d3", name: "Dr. Sophia Chen, MD", specialty: "Gastroenterologist", hospital: "City Center Digestive Health", experience: 12, rating: 4.85, icon: "fa-stethoscope", availability: "Wednesday, 02:00 PM", license: "MED-281943", email: "dr.chen@citydigestive.org" },
        { id: "d4", name: "Dr. Robert Sterling, MD", specialty: "Pulmonologist", hospital: "Crestview Pulmonary Clinic", experience: 16, rating: 4.9, icon: "fa-lungs", availability: "Available Thursday", license: "MED-519283", email: "dr.sterling@crestview.org" },
        { id: "d5", name: "Dr. Maya Lin, MD", specialty: "Neurologist", hospital: "NeuroScience Center", experience: 11, rating: 4.9, icon: "fa-brain", availability: "Friday, 11:30 AM", license: "MED-882734", email: "dr.lin@neurocenter.org" },
        { id: "d6", name: "Dr. Jordan Hayes, FAAD", specialty: "Dermatologist", hospital: "Advanced Skin & Allergy Center", experience: 9, rating: 4.8, icon: "fa-allergies", availability: "Tomorrow, 03:00 PM", license: "MED-628190", email: "dr.hayes@advancedskin.org" },
        { id: "d7", name: "Dr. Daniel Carter, MD", specialty: "Orthopedic", hospital: "Orthopedic & Spine Specialists", experience: 15, rating: 4.9, icon: "fa-bone", availability: "Thursday, 09:00 AM", license: "MED-771920", email: "dr.carter@orthospine.org" }
    ];

    for (const d of doctors) {
        // Check if user already exists
        const exists = db.prepare('SELECT doctor_id FROM doctors WHERE doctor_id = ?').get(d.id);
        if (!exists) {
            // Also ensure user row exists
            const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(d.id);
            if (!userExists) {
                insertUser.run(d.id, d.name, (d.email || `${d.id}@carenav.org`).toLowerCase(), 'doctor123', 'doctor');
            }
            insertDoctor.run(
                d.id,
                d.id,
                d.name,
                d.specialty,
                d.license || ('MED-' + Math.floor(100000 + Math.random() * 900000)),
                d.hospital || 'CareNav Affiliated Hospital',
                parseInt(d.experience) || 10,
                parseFloat(d.rating) || 4.9,
                d.icon || 'fa-user-doctor',
                d.availability || 'Available Daily'
            );
        }
    }

    // Seed vitals
    const vitals = (seedData && seedData.vitals) ? seedData.vitals : [
        { patient_id: "CN-88492", date: "2026-09-07 08:30 AM", bp: "120/80", hr: 74, glucose: 96, spo2: 99, status: "Normal" },
        { patient_id: "CN-88492", date: "2026-09-05 06:15 PM", bp: "124/82", hr: 78, glucose: 104, spo2: 98, status: "Normal" },
        { patient_id: "CN-88492", date: "2026-09-02 09:00 AM", bp: "135/88", hr: 82, glucose: 112, spo2: 98, status: "Elevated" },
        { patient_id: "CN-88492", date: "2026-08-28 08:15 AM", bp: "122/80", hr: 72, glucose: 98, spo2: 99, status: "Normal" }
    ];

    const insertVital = db.prepare(`
        INSERT INTO vitals (patient_id, date, bp, hr, glucose, spo2, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const v of vitals) {
        insertVital.run(v.patient_id, v.date, v.bp, v.hr, v.glucose, v.spo2, v.status);
    }

    // Seed medications
    const medications = (seedData && seedData.medications) ? seedData.medications : [
        { id: "m1", patient_id: "CN-88492", name: "Metformin 500mg", frequency: "Twice daily with meals", purpose: "Pre-diabetes blood glucose control" },
        { id: "m2", patient_id: "CN-88492", name: "Albuterol Inhaler (90mcg)", frequency: "As needed (PRN)", purpose: "Asthma rescue inhaler for bronchospasms" },
        { id: "m3", patient_id: "CN-88492", name: "Vitamin D3 (2000 IU)", frequency: "Once daily in morning", purpose: "Nutritional bone & immune support" }
    ];

    const insertMed = db.prepare(`
        INSERT INTO medications (id, patient_id, name, frequency, purpose, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    `);
    for (const m of medications) {
        insertMed.run(m.id, m.patient_id || "CN-88492", m.name, m.frequency, m.purpose);
    }

    console.log('Database seeded successfully with initial patients, doctors, vitals, and medications!');
}

module.exports = {
    getDb,
    DB_PATH
};
