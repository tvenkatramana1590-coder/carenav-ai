const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/doctors
router.get('/', (req, res) => {
    try {
        const { specialty } = req.query;
        const db = getDb();

        let query = 'SELECT * FROM doctors';
        let params = [];
        if (specialty && specialty !== 'All') {
            query += ' WHERE LOWER(specialty) LIKE LOWER(?)';
            params.push(`%${specialty}%`);
        }
        query += ' ORDER BY rating DESC';

        const doctors = db.prepare(query).all(...params);

        res.json({
            success: true,
            count: doctors.length,
            doctors: doctors.map(d => ({
                id: d.doctor_id,
                name: d.name,
                specialty: d.specialty,
                license: d.license_number,
                hospital: d.hospital_affiliation,
                experience: `${d.experience_years} years exp.`,
                rating: `${d.rating} ★`,
                icon: d.icon || 'fa-user-doctor',
                availability: d.availability || 'Available Today'
            }))
        });
    } catch (err) {
        console.error('Fetch doctors error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve doctors directory.' });
    }
});

// GET /api/doctors/:id
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const doc = db.prepare('SELECT * FROM doctors WHERE doctor_id = ?').get(id);

        if (!doc) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        res.json({
            success: true,
            doctor: {
                id: doc.doctor_id,
                name: doc.name,
                specialty: doc.specialty,
                license: doc.license_number,
                hospital: doc.hospital_affiliation,
                experience: `${doc.experience_years} years exp.`,
                rating: `${doc.rating} ★`,
                icon: doc.icon,
                availability: doc.availability
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
