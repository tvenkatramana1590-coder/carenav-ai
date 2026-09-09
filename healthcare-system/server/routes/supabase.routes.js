const express = require('express');
const router = express.Router();
const SupabaseService = require('../supabase');
const { getDb } = require('../db');

// GET /api/supabase/status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        isConfigured: SupabaseService.isConfigured,
        url: SupabaseService.url ? SupabaseService.url.replace(/https?:\/\//, '').split('.')[0] + '...' : null,
        mode: SupabaseService.isConfigured ? 'Supabase PostgreSQL Cloud' : 'SQLite Local Native (carenav.db)'
    });
});

// POST /api/supabase/test
router.post('/test', async (req, res) => {
    try {
        const { url, key } = req.body || {};
        const result = await SupabaseService.testConnection(url, key);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/supabase/sync
router.post('/sync', async (req, res) => {
    try {
        const { url, key } = req.body || {};
        const test = await SupabaseService.testConnection(url, key);
        if (!test.success) {
            return res.status(400).json({ success: false, message: 'Cannot sync: ' + test.message });
        }

        const db = getDb();
        const patients = db.prepare('SELECT * FROM patients').all();
        const vitals = db.prepare('SELECT * FROM vitals').all();
        const meds = db.prepare('SELECT * FROM medications').all();
        const appts = db.prepare('SELECT * FROM appointments').all();

        let syncedPatients = 0;
        let syncedVitals = 0;
        let syncedMeds = 0;
        let syncedAppts = 0;

        for (const p of patients) {
            await SupabaseService.syncPatient(p);
            syncedPatients++;
        }
        for (const v of vitals) {
            await SupabaseService.syncVital(v);
            syncedVitals++;
        }
        for (const m of meds) {
            await SupabaseService.syncMedication(m);
            syncedMeds++;
        }
        for (const a of appts) {
            await SupabaseService.syncAppointment(a);
            syncedAppts++;
        }

        res.json({
            success: true,
            message: 'Successfully synchronized data with Supabase PostgreSQL cloud database.',
            synced: {
                patients: syncedPatients,
                vitals: syncedVitals,
                medications: syncedMeds,
                appointments: syncedAppts
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
