const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// Clinical symptom evaluation rules engine
function evaluateSymptoms(symptomsText, painScale = 1, duration = '', vitals = null) {
    const text = (symptomsText || '').toLowerCase();
    const pain = parseInt(painScale) || 1;

    let urgencyLevel = 'Low / Self-Care';
    let urgencyScore = 25;
    let badgeClass = 'badge-low';
    let specialist = 'General Physician';
    let differentials = [];
    let redFlags = [];
    let recommendedActions = [];

    // Red flag emergency rules
    const emergencyTriggers = [
        { regex: /chest pain|pressure in chest|crushing chest|angina/i, reason: 'Suspected acute coronary syndrome / myocardial ischemia' },
        { regex: /shortness of breath|cannot breathe|struggling to breathe|gasping/i, reason: 'Severe acute respiratory distress' },
        { regex: /slurred speech|face droop|arm weakness|facial numbness/i, reason: 'Suspected acute stroke / cerebrovascular accident (FAST)' },
        { regex: /anaphylaxis|throat swelling|unable to swallow|lip swelling/i, reason: 'Severe acute anaphylactic allergic reaction' },
        { regex: /unconscious|fainted|loss of consciousness|seizure/i, reason: 'Altered mental status or acute seizure episode' },
        { regex: /coughing blood|vomiting blood|severe hemorrhage|black tarry stool/i, reason: 'Significant active internal hemorrhage' }
    ];

    for (const trig of emergencyTriggers) {
        if (trig.regex.test(text)) {
            redFlags.push(trig.reason);
        }
    }

    if (pain >= 9) {
        redFlags.push('Extreme pain score (9-10/10) requires immediate clinical assessment');
    }

    if (redFlags.length > 0) {
        urgencyLevel = 'EMERGENCY / CRITICAL';
        urgencyScore = 95;
        badgeClass = 'badge-critical';
        specialist = 'Emergency Medicine Physician';
        recommendedActions = [
            'Call Emergency Medical Services (911 / 112) or proceed to the nearest Emergency Department immediately.',
            'Do not drive yourself to the hospital.',
            'Keep emergency medical identity card accessible for first responders.'
        ];
        differentials = ['Acute Coronary Syndrome', 'Pulmonary Embolism', 'Acute CVA / TIA', 'Severe Anaphylaxis'];
    } else if (pain >= 7 || text.includes('high fever') || text.includes('severe headache') || text.includes('stiff neck') || text.includes('vomiting persistently')) {
        urgencyLevel = 'Urgent (Within 24 Hours)';
        urgencyScore = 75;
        badgeClass = 'badge-high';
        specialist = 'General Physician / Urgent Care';
        recommendedActions = [
            'Schedule a same-day clinical consultation or visit an Urgent Care Center.',
            'Monitor vitals closely (temperature, blood pressure, oxygen saturation).',
            'Seek emergency care immediately if symptoms suddenly worsen.'
        ];
        differentials = ['Acute Bacterial Infection', 'Severe Migraine with Aura', 'Acute Gastroenteritis with Dehydration'];
    } else if (pain >= 4 || text.includes('fever') || text.includes('cough') || text.includes('sore throat') || text.includes('joint pain') || text.includes('rash')) {
        urgencyLevel = 'Moderate (Schedule Consult)';
        urgencyScore = 50;
        badgeClass = 'badge-moderate';
        specialist = 'General Physician';
        recommendedActions = [
            'Book an appointment with a primary care physician in the next 2-3 days.',
            'Stay well hydrated and maintain symptomatic rest.',
            'Track symptom progression and vital signs.'
        ];
        differentials = ['Viral Upper Respiratory Infection', 'Musculoskeletal Strain', 'Contact Dermatitis'];
    } else {
        urgencyLevel = 'Low / Routine Care';
        urgencyScore = 20;
        badgeClass = 'badge-low';
        specialist = 'General Physician';
        recommendedActions = [
            'Supportive home care: adequate hydration, nutrition, and rest.',
            'Log symptoms if they persist beyond 5-7 days.',
            'Schedule routine primary care check-up.'
        ];
        differentials = ['Mild tension discomfort', 'Transient fatigue', 'Minor allergic rhinitis'];
    }

    // Specialist Mapping
    if (text.includes('heart') || text.includes('palpitations') || text.includes('fluttering')) {
        specialist = 'Cardiologist';
        differentials.push('Arrhythmia / Palpitations');
    } else if (text.includes('stomach') || text.includes('acidity') || text.includes('diarrhea') || text.includes('acid reflux') || text.includes('bloating')) {
        specialist = 'Gastroenterologist';
        differentials.push('GERD / Gastritis');
    } else if (text.includes('lungs') || text.includes('wheezing') || text.includes('asthma') || text.includes('bronchitis')) {
        specialist = 'Pulmonologist';
        differentials.push('Asthma exacerbation / Bronchospasm');
    } else if (text.includes('rash') || text.includes('itching') || text.includes('eczema') || text.includes('skin lesion')) {
        specialist = 'Dermatologist';
        differentials.push('Dermatitis / Eczema');
    } else if (text.includes('bone') || text.includes('knee') || text.includes('shoulder') || text.includes('fracture') || text.includes('sprain')) {
        specialist = 'Orthopedic';
        differentials.push('Ligamentous sprain / Arthralgia');
    } else if (text.includes('headache') || text.includes('migraine') || text.includes('dizziness') || text.includes('vertigo')) {
        specialist = 'Neurologist';
        differentials.push('Migraine / Benign Positional Vertigo');
    }

    return {
        urgencyLevel,
        urgencyScore,
        badgeClass,
        recommendedSpecialist: specialist,
        potentialDifferentials: differentials.slice(0, 4),
        redFlags,
        recommendedActions,
        clinicalSummary: `Clinical assessment based on reported symptoms "${symptomsText.slice(0, 100)}..." and pain severity ${pain}/10.`
    };
}

// POST /api/triage/assess
router.post('/assess', (req, res) => {
    try {
        const { symptoms, pain = 1, duration, patientId } = req.body;

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({ success: false, message: 'Symptoms description is required.' });
        }

        const assessment = evaluateSymptoms(symptoms, pain, duration);

        // Optionally auto-log if patientId provided
        if (patientId) {
            const db = getDb();
            const logId = 'tri-' + Date.now();
            try {
                db.prepare(`
                    INSERT INTO triage_logs (id, patient_id, symptoms_text, pain_severity, urgency_level, urgency_score, recommended_specialist, potential_differentials)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    logId,
                    patientId,
                    symptoms,
                    parseInt(pain) || 1,
                    assessment.urgencyLevel,
                    assessment.urgencyScore,
                    assessment.recommendedSpecialist,
                    assessment.potentialDifferentials.join(', ')
                );
                assessment.logId = logId;
            } catch (err) {
                console.warn('Failed to auto-log triage assessment:', err.message);
            }
        }

        res.json({
            success: true,
            assessment
        });
    } catch (err) {
        console.error('Triage assessment error:', err);
        res.status(500).json({ success: false, message: 'Failed to perform triage assessment.' });
    }
});

// GET /api/triage/history/:patientId
router.get('/history/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const db = getDb();
        const logs = db.prepare('SELECT * FROM triage_logs WHERE patient_id = ? ORDER BY assessed_at DESC LIMIT 20').all(patientId);

        res.json({
            success: true,
            count: logs.length,
            history: logs
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
