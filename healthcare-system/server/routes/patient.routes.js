const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/patient (Doctor Patient Roster)
router.get('/', (req, res) => {
    try {
        const db = getDb();
        const rows = db.prepare(`
            SELECT u.id, u.name, u.email, p.age, p.gender, p.blood_group, p.allergies, p.chronic_conditions, p.emergency_contact, p.primary_physician
            FROM users u
            JOIN patients p ON u.id = p.patient_id
            WHERE u.role = 'patient'
            ORDER BY u.created_at DESC
        `).all();

        const patientsWithVitals = rows.map(p => {
            const latestVital = db.prepare('SELECT * FROM vitals WHERE patient_id = ? ORDER BY id DESC LIMIT 1').get(p.id);
            const activeMeds = db.prepare('SELECT * FROM medications WHERE patient_id = ? AND is_active = 1').all(p.id);
            return {
                id: p.id,
                name: p.name,
                email: p.email,
                age: p.age || 34,
                gender: p.gender || 'Male',
                bloodGroup: p.blood_group || 'O+',
                allergies: p.allergies ? p.allergies.split(',').map(s => s.trim()) : [],
                chronicConditions: p.chronic_conditions ? p.chronic_conditions.split(',').map(s => s.trim()) : [],
                emergencyContact: p.emergency_contact || 'On file',
                primaryPhysician: p.primary_physician || 'Dr. Evelyn Reed (St. Jude Hospital)',
                latestVital: latestVital || null,
                medicationsCount: activeMeds.length
            };
        });

        res.json({
            success: true,
            count: patientsWithVitals.length,
            patients: patientsWithVitals
        });
    } catch (err) {
        console.error('Fetch all patients error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve patient roster.' });
    }
});

// GET /api/patient/:id
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ?').get(id);
        const vitals = db.prepare('SELECT * FROM vitals WHERE patient_id = ? ORDER BY id DESC').all(id);
        const medications = db.prepare('SELECT * FROM medications WHERE patient_id = ? AND is_active = 1').all(id);

        res.json({
            success: true,
            patient: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                age: patient ? patient.age : 34,
                gender: patient ? patient.gender : 'Male',
                bloodGroup: patient ? patient.blood_group : 'O Positive (Rh+)',
                allergies: patient && patient.allergies ? patient.allergies.split(',').map(s => s.trim()) : [],
                chronicConditions: patient && patient.chronic_conditions ? patient.chronic_conditions.split(',').map(s => s.trim()) : [],
                emergencyContact: patient ? patient.emergency_contact : 'Contact on file',
                primaryCarePhysician: patient ? patient.primary_physician : 'Unassigned',
                vitals: vitals || [],
                medications: medications || []
            }
        });
    } catch (err) {
        console.error('Fetch patient error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve patient record.' });
    }
});

// PUT /api/patient/:id
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { age, gender, bloodGroup, allergies, chronicConditions, emergencyContact, primaryPhysician } = req.body;
        const db = getDb();

        const allergiesStr = Array.isArray(allergies) ? allergies.join(', ') : (allergies || '');
        const conditionsStr = Array.isArray(chronicConditions) ? chronicConditions.join(', ') : (chronicConditions || '');

        db.prepare(`
            UPDATE patients SET
                age = COALESCE(?, age),
                gender = COALESCE(?, gender),
                blood_group = COALESCE(?, blood_group),
                allergies = COALESCE(?, allergies),
                chronic_conditions = COALESCE(?, chronic_conditions),
                emergency_contact = COALESCE(?, emergency_contact),
                primary_physician = COALESCE(?, primary_physician)
            WHERE patient_id = ?
        `).run(age, gender, bloodGroup, allergiesStr, conditionsStr, emergencyContact, primaryPhysician, id);

        res.json({ success: true, message: 'Patient medical profile updated successfully.' });
    } catch (err) {
        console.error('Update patient error:', err);
        res.status(500).json({ success: false, message: 'Failed to update patient record.' });
    }
});

// GET /api/patient/:id/emergency
router.get('/:id/emergency', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const row = db.prepare(`
            SELECT u.name, p.age, p.gender, p.blood_group, p.allergies, p.chronic_conditions, p.emergency_contact, p.primary_physician
            FROM users u
            JOIN patients p ON u.id = p.patient_id
            WHERE u.id = ?
        `).get(id);

        if (!row) {
            return res.status(404).json({ success: false, message: 'Emergency profile not found.' });
        }

        res.json({
            success: true,
            emergencyCard: {
                patientId: id,
                name: row.name,
                age: row.age,
                gender: row.gender,
                bloodGroup: row.blood_group,
                allergies: row.allergies ? row.allergies.split(',').map(s => s.trim()) : [],
                chronicConditions: row.chronic_conditions ? row.chronic_conditions.split(',').map(s => s.trim()) : [],
                emergencyContact: row.emergency_contact,
                primaryPhysician: row.primary_physician
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
