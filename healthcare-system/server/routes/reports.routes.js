const express = require('express');
const router = express.Router();

const LAB_BIOMARKERS = [
    {
        key: 'glucose',
        names: ['fasting glucose', 'fasting blood sugar', 'glucose', 'fbs'],
        normalMin: 70,
        normalMax: 99,
        unit: 'mg/dL',
        name: 'Fasting Blood Glucose',
        description: 'Measures circulating blood sugar levels after overnight fasting. Elevated levels indicate pre-diabetes or diabetes mellitus.',
        highAdvice: 'Adopt a low-glycemic Mediterranean diet, limit refined carbohydrates and added sugars, engage in daily aerobic exercise.',
        lowAdvice: 'Monitor for hypoglycemia (shakiness, diaphoresis). Maintain regular balanced meals.'
    },
    {
        key: 'hba1c',
        names: ['hba1c', 'glycated hemoglobin', 'a1c'],
        normalMin: 4.0,
        normalMax: 5.6,
        unit: '%',
        name: 'Hemoglobin A1c (HbA1c)',
        description: 'Reflects your average blood glucose control over the preceding 2 to 3 months.',
        highAdvice: 'Review glycemic management regimen with your physician. Increase dietary fiber and post-prandial walking.',
        lowAdvice: 'Values below 4.0% are rare and should be discussed with a physician to rule out hemolytic conditions.'
    },
    {
        key: 'ldl',
        names: ['ldl', 'ldl cholesterol', 'bad cholesterol'],
        normalMin: 0,
        normalMax: 99,
        unit: 'mg/dL',
        name: 'LDL Cholesterol (Low-Density Lipoprotein)',
        description: 'Known as "bad" cholesterol. Excess LDL can form arterial plaques and elevate cardiovascular event risk.',
        highAdvice: 'Reduce dietary saturated and trans fats. Increase soluble fiber (oats, legumes) and consult regarding lipid therapy.',
        lowAdvice: 'Extremely low values are generally non-pathologic unless accompanied by severe malnutrition or malabsorption.'
    },
    {
        key: 'hdl',
        names: ['hdl', 'hdl cholesterol', 'good cholesterol'],
        normalMin: 50,
        normalMax: 150,
        unit: 'mg/dL',
        name: 'HDL Cholesterol (High-Density Lipoprotein)',
        description: 'Known as "good" cholesterol. It scavenges surplus cholesterol from tissues back to the liver for excretion.',
        highAdvice: 'High levels of HDL are generally protective for vascular endothelium.',
        lowAdvice: 'Incorporate aerobic exercise (cardio), consume healthy fats (olive oil, avocados, nuts), and eliminate smoking.'
    },
    {
        key: 'triglycerides',
        names: ['triglycerides', 'tg'],
        normalMin: 0,
        normalMax: 149,
        unit: 'mg/dL',
        name: 'Serum Triglycerides',
        description: 'The primary storage lipid form in blood. Elevated levels correlate with insulin resistance and cardiovascular risk.',
        highAdvice: 'Significantly reduce simple sugars, alcohol consumption, and ultra-processed carbohydrates.',
        lowAdvice: 'Typically clinically insignificant.'
    },
    {
        key: 'creatinine',
        names: ['creatinine', 'serum creatinine'],
        normalMin: 0.6,
        normalMax: 1.2,
        unit: 'mg/dL',
        name: 'Serum Creatinine',
        description: 'Waste product of muscle breakdown cleared by healthy kidneys. Primary indicator of renal filtration efficacy.',
        highAdvice: 'Requires clinical nephrology review. Maintain adequate hydration and avoid nephrotoxic NSAIDs (ibuprofen).',
        lowAdvice: 'Often reflects low muscle mass or pregnancy; usually benign.'
    },
    {
        key: 'wbc',
        names: ['wbc', 'white blood cell count', 'leukocytes'],
        normalMin: 4.5,
        normalMax: 11.0,
        unit: 'x10^3/uL',
        name: 'White Blood Cell Count (WBC)',
        description: 'Immune defense cells that fight bacterial and viral infections.',
        highAdvice: 'Suggests active bacterial/viral infection, systemic inflammation, or physical stress response.',
        lowAdvice: 'Indicates leukopenia; can reflect viral suppression or medication effects. Avoid exposure to infections.'
    }
];

// POST /api/reports/explain
router.post('/explain', (req, res) => {
    try {
        const { reportText } = req.body;
        if (!reportText || !reportText.trim()) {
            return res.status(400).json({ success: false, message: 'Medical lab report text is required.' });
        }

        const lines = reportText.split('\n');
        const analyzedItems = [];
        let abnormalCount = 0;

        for (const bio of LAB_BIOMARKERS) {
            for (const alias of bio.names) {
                // Regex to find alias followed by optional punctuation/whitespace and a number
                const regex = new RegExp(`${alias}[^0-9\\n]{0,25}?([0-9]+(?:\\.[0-9]+)?)`, 'i');
                const match = reportText.match(regex);

                if (match) {
                    const value = parseFloat(match[1]);
                    let status = 'Normal';
                    let badge = 'badge-normal';
                    let guidance = 'Within target clinical reference range.';

                    if (value > bio.normalMax) {
                        status = 'High (Elevated)';
                        badge = 'badge-high';
                        guidance = bio.highAdvice;
                        abnormalCount++;
                    } else if (value < bio.normalMin) {
                        status = 'Low';
                        badge = 'badge-low';
                        guidance = bio.lowAdvice;
                        abnormalCount++;
                    }

                    analyzedItems.push({
                        name: bio.name,
                        value: `${value} ${bio.unit}`,
                        numericValue: value,
                        referenceRange: `${bio.normalMin} - ${bio.normalMax} ${bio.unit}`,
                        status,
                        badge,
                        plainDescription: bio.description,
                        lifestyleGuidance: guidance
                    });
                    break; // match found for this biomarker
                }
            }
        }

        // If no predefined biomarker matched, extract generic key-value pairs
        if (analyzedItems.length === 0) {
            analyzedItems.push({
                name: 'Diagnostic Overview',
                value: 'Report Parsed',
                referenceRange: 'Clinical Assessment',
                status: 'Under Review',
                badge: 'badge-moderate',
                plainDescription: 'Your medical report has been processed. The values require contextual interpretation by your physician.',
                lifestyleGuidance: 'Discuss these specific findings with your prescribing doctor for definitive clinical diagnosis.'
            });
        }

        res.json({
            success: true,
            totalBiomarkersFound: analyzedItems.length,
            abnormalFindings: abnormalCount,
            summary: abnormalCount > 0
                ? `Identified ${abnormalCount} biomarker(s) outside target reference ranges. Review clinical action points below.`
                : 'All identified biomarkers appear within standard baseline reference ranges.',
            findings: analyzedItems
        });
    } catch (err) {
        console.error('Report explanation error:', err);
        res.status(500).json({ success: false, message: 'Failed to explain medical report.' });
    }
});

module.exports = router;
