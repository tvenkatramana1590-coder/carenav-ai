const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/medications/:patientId
router.get('/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const db = getDb();
        const meds = db.prepare('SELECT * FROM medications WHERE patient_id = ? AND is_active = 1 ORDER BY prescribed_at DESC').all(patientId);

        res.json({
            success: true,
            count: meds.length,
            medications: meds.map(m => ({
                id: m.id,
                patientId: m.patient_id,
                name: m.name,
                frequency: m.frequency,
                purpose: m.purpose,
                prescribedAt: m.prescribed_at
            }))
        });
    } catch (err) {
        console.error('Fetch medications error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve medications.' });
    }
});

// POST /api/medications
router.post('/', (req, res) => {
    try {
        const { patientId, name, frequency, purpose } = req.body;

        if (!patientId || !name || !frequency) {
            return res.status(400).json({ success: false, message: 'Patient ID, medication name, and frequency are required.' });
        }

        const id = 'm-' + Date.now();
        const db = getDb();

        db.prepare(`
            INSERT INTO medications (id, patient_id, name, frequency, purpose, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        `).run(id, patientId, name, frequency, purpose || 'Prescribed therapy');

        res.status(201).json({
            success: true,
            message: 'Medication added successfully.',
            medication: {
                id,
                patientId,
                name,
                frequency,
                purpose: purpose || 'Prescribed therapy'
            }
        });
    } catch (err) {
        console.error('Add medication error:', err);
        res.status(500).json({ success: false, message: 'Failed to add medication.' });
    }
});

// DELETE /api/medications/:id
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const result = db.prepare('DELETE FROM medications WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Medication not found.' });
        }

        res.json({ success: true, message: 'Medication discontinued/removed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
