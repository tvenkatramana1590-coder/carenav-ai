const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const db = getDb();
        const appts = db.prepare('SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date ASC').all(patientId);

        res.json({
            success: true,
            count: appts.length,
            appointments: appts.map(a => ({
                id: a.id,
                doctor: a.doctor_name,
                specialty: a.specialty,
                date: a.appointment_date,
                slot: a.time_slot,
                notes: a.notes,
                status: a.status
            }))
        });
    } catch (err) {
        console.error('Fetch appointments error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve appointments.' });
    }
});

// GET /api/appointments/doctor/:doctorId
router.get('/doctor/:doctorId', (req, res) => {
    try {
        const { doctorId } = req.params;
        const db = getDb();
        const altId = doctorId === 'DOC-1029' ? 'd1' : (doctorId === 'd1' ? 'DOC-1029' : doctorId);
        const appts = db.prepare(`
            SELECT a.*, p.blood_group, p.allergies, COALESCE(u.name, 'Alex Morgan') as patient_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.patient_id
            LEFT JOIN users u ON a.patient_id = u.id
            WHERE a.doctor_id = ? OR a.doctor_id = ?
            ORDER BY a.appointment_date ASC
        `).all(doctorId, altId);

        res.json({
            success: true,
            count: appts.length,
            appointments: appts
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/appointments
router.post('/', (req, res) => {
    try {
        const { patientId, doctorId, doctorName, specialty, date, slot, time, time_slot, timeSlot, notes } = req.body;
        const resolvedSlot = slot || time || time_slot || timeSlot;

        if (!patientId || !doctorName || !date || !resolvedSlot) {
            return res.status(400).json({ success: false, message: 'Patient, Doctor, Date, and Time Slot are required.' });
        }

        const id = 'apt-' + Date.now();
        const db = getDb();

        db.prepare(`
            INSERT INTO appointments (id, patient_id, doctor_id, doctor_name, specialty, appointment_date, time_slot, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
        `).run(id, patientId, doctorId || null, doctorName, specialty || 'General Medicine', date, resolvedSlot, notes || 'General Consultation');

        res.status(201).json({
            success: true,
            message: `Appointment confirmed with ${doctorName} on ${date} at ${slot}!`,
            appointment: {
                id,
                patientId,
                doctor: doctorName,
                specialty: specialty || 'General Medicine',
                date,
                slot,
                notes: notes || 'General Consultation',
                status: 'Confirmed'
            }
        });
    } catch (err) {
        console.error('Book appointment error:', err);
        res.status(500).json({ success: false, message: 'Failed to book appointment.' });
    }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required.' });
        }

        const db = getDb();
        const result = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        res.json({ success: true, message: `Appointment status updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/appointments/:id
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        res.json({ success: true, message: 'Appointment cancelled successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
