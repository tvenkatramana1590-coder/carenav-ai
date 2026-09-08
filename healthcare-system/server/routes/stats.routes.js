const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/stats/overview
router.get('/overview', (req, res) => {
    try {
        const db = getDb();
        const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
        const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
        const vitalsCount = db.prepare('SELECT COUNT(*) as count FROM vitals').get().count;
        const medsCount = db.prepare('SELECT COUNT(*) as count FROM medications WHERE is_active = 1').get().count;
        const apptsCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
        const triageCount = db.prepare('SELECT COUNT(*) as count FROM triage_logs').get().count;

        res.json({
            success: true,
            stats: {
                patients: patientCount,
                doctors: doctorCount,
                vitalsRecorded: vitalsCount,
                activeMedications: medsCount,
                appointmentsScheduled: apptsCount,
                triageConsultations: triageCount,
                databaseEngine: 'SQLite Native (carenav.db)',
                serverStatus: 'Operational'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
