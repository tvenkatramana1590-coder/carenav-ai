const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (role && user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `This account is registered as a ${user.role}. Please switch to the ${user.role} tab.`
            });
        }

        let profile = { ...user };
        delete profile.password;

        if (user.role === 'patient') {
            const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ?').get(user.id);
            if (patient) {
                profile.age = patient.age;
                profile.gender = patient.gender;
                profile.bloodGroup = patient.blood_group;
                profile.allergies = patient.allergies ? patient.allergies.split(',').map(s => s.trim()) : [];
                profile.chronicConditions = patient.chronic_conditions ? patient.chronic_conditions.split(',').map(s => s.trim()) : [];
                profile.emergencyContact = patient.emergency_contact;
                profile.primaryCarePhysician = patient.primary_physician;
            }
        } else if (user.role === 'doctor') {
            const doc = db.prepare('SELECT * FROM doctors WHERE doctor_id = ?').get(user.id);
            if (doc) {
                profile.specialty = doc.specialty;
                profile.license = doc.license_number;
                profile.hospital = doc.hospital_affiliation;
                profile.rating = doc.rating;
                profile.experience = doc.experience_years;
            }
        }

        res.json({ success: true, user: profile });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role = 'patient',
            age,
            bloodGroup = 'O Positive (Rh+)',
            allergies = '',
            chronicConditions = '',
            emergencyContact = 'Contact on file',
            specialty = 'General Physician',
            license = '',
            hospital = 'CareNav Affiliated Hospital'
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const id = (role === 'doctor' ? 'DOC-' : 'CN-') + Math.floor(10000 + Math.random() * 90000);

        db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
            id,
            name,
            email.toLowerCase(),
            password,
            role
        );

        if (role === 'patient') {
            const formattedAllergies = Array.isArray(allergies) ? allergies.join(', ') : allergies;
            const formattedConditions = Array.isArray(chronicConditions) ? chronicConditions.join(', ') : chronicConditions;
            db.prepare(`
                INSERT INTO patients (patient_id, user_id, age, gender, blood_group, allergies, chronic_conditions, emergency_contact, primary_physician)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                id,
                id,
                parseInt(age) || 30,
                'Not specified',
                bloodGroup,
                formattedAllergies || 'None reported',
                formattedConditions || 'None recorded',
                emergencyContact || 'Contact on file',
                'Unassigned'
            );
        } else if (role === 'doctor') {
            db.prepare(`
                INSERT INTO doctors (doctor_id, user_id, name, specialty, license_number, hospital_affiliation, experience_years, rating, icon, availability)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                id,
                id,
                name,
                specialty,
                license || ('MED-' + Math.floor(100000 + Math.random() * 900000)),
                hospital,
                5,
                4.9,
                'fa-user-doctor',
                'Today & Tomorrow'
            );
        }

        res.status(201).json({
            success: true,
            message: 'User account created successfully.',
            user: {
                id,
                name,
                email: email.toLowerCase(),
                role,
                bloodGroup,
                age: parseInt(age) || 30,
                allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
                chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : (chronicConditions ? [chronicConditions] : []),
                specialty: role === 'doctor' ? specialty : undefined
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Failed to create user account.' });
    }
});

// GET /api/auth/demo-users
router.get('/demo-users', (req, res) => {
    try {
        const db = getDb();
        const demoPatient = db.prepare('SELECT u.id, u.name, u.email, u.role, p.age, p.blood_group, p.allergies, p.chronic_conditions FROM users u JOIN patients p ON u.id = p.patient_id WHERE u.role = ? LIMIT 1').get('patient');
        const demoDoctor = db.prepare('SELECT u.id, u.name, u.email, u.role, d.specialty, d.hospital_affiliation FROM users u JOIN doctors d ON u.id = d.doctor_id WHERE u.role = ? LIMIT 1').get('doctor');

        res.json({
            success: true,
            patient: demoPatient,
            doctor: demoDoctor
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
