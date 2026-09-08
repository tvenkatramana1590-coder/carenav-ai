const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/vitals/:patientId
router.get('/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const db = getDb();
        const vitals = db.prepare('SELECT * FROM vitals WHERE patient_id = ? ORDER BY id DESC').all(patientId);

        res.json({
            success: true,
            count: vitals.length,
            vitals: vitals.map(v => ({
                id: v.id,
                date: v.date,
                bp: v.bp,
                hr: v.hr,
                glucose: v.glucose,
                spo2: v.spo2,
                status: v.status,
                recordedAt: v.created_at
            }))
        });
    } catch (err) {
        console.error('Fetch vitals error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve vitals.' });
    }
});

// POST /api/vitals
router.post('/', (req, res) => {
    try {
        let { patientId, sys, dia, bp, hr, glucose, spo2, date } = req.body;

        if (bp && (sys === undefined || dia === undefined)) {
            const parts = String(bp).split('/');
            if (parts.length === 2) {
                sys = parts[0].trim();
                dia = parts[1].trim();
            }
        }

        if (!patientId || sys === undefined || dia === undefined || hr === undefined || glucose === undefined || spo2 === undefined) {
            return res.status(400).json({ success: false, message: 'All vital parameters (sys, dia, hr, glucose, spo2) are required.' });
        }

        const sysNum = parseInt(sys);
        const diaNum = parseInt(dia);
        const hrNum = parseInt(hr);
        const glNum = parseInt(glucose);
        const spo2Num = parseInt(spo2);

        // Clinical status classification
        let status = 'Normal';
        if (sysNum >= 140 || diaNum >= 90 || glNum >= 140 || spo2Num < 95) {
            status = 'High';
        } else if (sysNum >= 125 || diaNum >= 84 || glNum >= 105) {
            status = 'Elevated';
        }

        const now = new Date();
        const dateStr = date || (now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const bpStr = `${sysNum}/${diaNum}`;

        const db = getDb();
        const result = db.prepare(`
            INSERT INTO vitals (patient_id, date, bp, hr, glucose, spo2, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(patientId, dateStr, bpStr, hrNum, glNum, spo2Num, status);

        res.status(201).json({
            success: true,
            message: 'Vital sign recorded successfully.',
            vital: {
                id: Number(result.lastInsertRowid),
                patientId,
                date: dateStr,
                bp: bpStr,
                hr: hrNum,
                glucose: glNum,
                spo2: spo2Num,
                status
            }
        });
    } catch (err) {
        console.error('Record vitals error:', err);
        res.status(500).json({ success: false, message: 'Failed to record vital signs.' });
    }
});

// DELETE /api/vitals/:id
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const result = db.prepare('DELETE FROM vitals WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Vital entry not found.' });
        }

        res.json({ success: true, message: 'Vital reading deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
