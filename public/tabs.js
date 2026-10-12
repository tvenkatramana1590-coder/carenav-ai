
// ═══════════════════════════════════════════════════════════════
//  CareNav-AI — New Tab Handlers (Phase 3–16 JS)
//  Loaded after existing app.js logic; wires up all new tabs.
// ═══════════════════════════════════════════════════════════════

// ── Helper: get current logged-in user ───────────────────────
function getCurrentUser() {
    try {
        const raw = localStorage.getItem('carenav_current_user');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

// ── Helper: get greeting based on time ───────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

// ── Helper: format date ───────────────────────────────────────
function fmtDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── DASHBOARD TAB ─────────────────────────────────────────────
function renderDashboardTab() {
    const user = getCurrentUser();
    const greeting = getGreeting();

    // Greeting
    const nameEl = document.getElementById('greetingName');
    const greetEl = document.getElementById('dashboardGreeting');
    if (greetEl) {
        const firstWord = user && user.name ? user.name.split(' ')[0] : 'there';
        greetEl.innerHTML = `<span style="font-weight:700;">${greeting}, ${firstWord} 👋</span>
            <div style="font-size:0.88rem;font-weight:400;color:var(--text-secondary);margin-top:4px;">Here's your health overview for today — ${new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}.</div>`;
    }

    // Stats
    const vitals = HealthDB.vitals || [];
    const meds = HealthDB.medications || [];
    const appts = HealthDB.appointments || [];

    const statRecords = document.getElementById('statRecords');
    const statAppts = document.getElementById('statAppts');
    const statMeds = document.getElementById('statMeds');

    if (statRecords) statRecords.textContent = vitals.length + ' vitals';
    if (statAppts) statAppts.textContent = appts.length + ' total';
    if (statMeds) statMeds.textContent = meds.filter(m => m.is_active || m.isActive !== false).length + ' active';

    // Latest vitals on dashboard
    if (vitals.length > 0) {
        const latest = vitals[vitals.length - 1];
        const sys = latest.systolic_bp || latest.sys || '—';
        const dia = latest.diastolic_bp || latest.dia || '—';
        const hr  = latest.heart_rate || latest.hr || '—';
        const gl  = latest.glucose_mg_dl || latest.glucose || '—';
        const sp  = latest.spo2_percent || latest.spo2 || '—';
        const dashBp   = document.getElementById('dashBp');
        const dashHr   = document.getElementById('dashHr');
        const dashGl   = document.getElementById('dashGl');
        const dashSpo2 = document.getElementById('dashSpo2');
        if (dashBp)   dashBp.textContent   = sys && dia ? `${sys}/${dia}` : '—';
        if (dashHr)   dashHr.textContent   = hr ? `${hr} bpm` : '—';
        if (dashGl)   dashGl.textContent   = gl ? `${gl} mg/dL` : '—';
        if (dashSpo2) dashSpo2.textContent = sp ? `${sp}%` : '—';
    }

    // Health timeline
    renderHealthTimeline();
}

function renderHealthTimeline() {
    const tl = document.getElementById('healthTimeline');
    if (!tl) return;

    const vitals = HealthDB.vitals || [];
    const appts  = HealthDB.appointments || [];
    const meds   = HealthDB.medications  || [];

    const events = [];
    vitals.forEach(v => events.push({ date: v.created_at || v.date || new Date().toISOString(), label: 'Vitals recorded', icon: 'fa-heart-pulse', color: 'var(--primary)' }));
    appts.forEach(a  => events.push({ date: a.appointment_date || a.date || new Date().toISOString(), label: `Appointment — ${a.doctor_name || a.doctorName || 'Doctor'}`, icon: 'fa-calendar-check', color: 'var(--teal)' }));
    meds.forEach(m   => events.push({ date: m.created_at || new Date().toISOString(), label: `Medication added — ${m.name}`, icon: 'fa-pills', color: 'var(--warning)' }));

    if (events.length === 0) {
        tl.innerHTML = `<div class="empty-state" style="padding:40px 20px;"><i class="fa-solid fa-clock-rotate-left"></i><h4>No records yet</h4><p>Add vitals or book appointments to see your timeline here.</p></div>`;
        return;
    }

    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = events.slice(0, 8);
    tl.innerHTML = recent.map(ev => `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:12px 0;border-bottom:1px solid var(--border-subtle);">
            <div style="width:34px;height:34px;border-radius:50%;background:${ev.color}22;color:${ev.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fa-solid ${ev.icon}" style="font-size:0.9rem;"></i>
            </div>
            <div>
                <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">${ev.label}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${fmtDate(ev.date)}</div>
            </div>
        </div>`).join('');
}

// ── AI HEALTH TAB ─────────────────────────────────────────────
async function renderAIHealthTab() {
    const summaryEl      = document.getElementById('aiSummaryText');
    const observationsEl = document.getElementById('aiObservationsList');
    const nextStepsEl    = document.getElementById('aiNextStepsList');

    if (summaryEl) summaryEl.textContent = 'Generating AI summary…';

    const vitals = HealthDB.vitals || [];
    const meds   = HealthDB.medications || [];
    const appts  = HealthDB.appointments || [];

    // Build observations from real data
    const observations = [];
    const nextSteps    = [];

    if (vitals.length === 0) {
        observations.push('No vitals recorded yet. Add vitals in Health Records to enable AI analysis.');
        nextSteps.push('Record your blood pressure, heart rate and glucose using the "Record New Vital" button in Health Records.');
    } else {
        const latest = vitals[vitals.length - 1];
        const sys = parseInt(latest.systolic_bp || latest.sys || 0);
        const dia = parseInt(latest.diastolic_bp || latest.dia || 0);
        const hr  = parseInt(latest.heart_rate || latest.hr || 0);
        const gl  = parseInt(latest.glucose_mg_dl || latest.glucose || 0);
        const sp  = parseInt(latest.spo2_percent || latest.spo2 || 0);

        if (sys >= 130) { observations.push('⚠️ Elevated systolic blood pressure detected in latest reading.'); nextSteps.push('Monitor blood pressure daily; consider consulting your primary care physician.'); }
        else if (sys > 0) { observations.push('✅ Blood pressure within normal range in latest reading.'); }
        if (hr > 100) { observations.push('⚠️ Resting heart rate above normal range (>100 bpm) in latest reading.'); nextSteps.push('Discuss elevated resting heart rate with your cardiologist.'); }
        else if (hr > 0) { observations.push('✅ Heart rate within normal range.'); }
        if (gl > 126) { observations.push('⚠️ Fasting glucose elevated above 126 mg/dL — discuss with your physician.'); nextSteps.push('Schedule an HbA1c test and consult your physician about glucose management.'); }
        else if (gl > 0) { observations.push('✅ Blood glucose within normal fasting range.'); }
        if (sp > 0 && sp < 95) { observations.push('⚠️ SpO2 below 95% — monitor closely and seek medical advice if this persists.'); }
        else if (sp >= 95) { observations.push('✅ SpO2 oxygen saturation is healthy (≥95%).'); }
        if (vitals.length > 1) { nextSteps.push('Continue logging vitals regularly to enable trend analysis and personalized AI insights.'); }
    }

    if (meds.length === 0) nextSteps.push('Log your medications in the Medications tab to track your regimen.');
    if (appts.length === 0) nextSteps.push('Book a routine check-up in the Appointments section.');
    else nextSteps.push(`You have ${appts.length} appointment(s) on record. Review your upcoming schedule in the Appointments tab.`);

    const summaryText = vitals.length > 0
        ? `Based on your ${vitals.length} recorded vital(s), your latest health data has been reviewed. ${observations.filter(o => o.startsWith('✅')).length} parameter(s) are within normal range. ${observations.filter(o => o.startsWith('⚠️')).length} observation(s) require attention. Review the observations below and follow the recommended next steps. Remember — this is informational guidance only and does not replace professional medical advice.`
        : 'No health data recorded yet. Start by adding your vitals in Health Records, logging your medications, and booking an appointment to enable full AI health analysis.';

    if (summaryEl) summaryEl.textContent = summaryText;

    if (observationsEl) {
        observationsEl.innerHTML = observations.length
            ? observations.map(o => `<li>${o}</li>`).join('')
            : '<li>No observations available — add vitals to generate AI analysis.</li>';
    }
    if (nextStepsEl) {
        nextStepsEl.innerHTML = nextSteps.length
            ? nextSteps.map(s => `<li>${s}</li>`).join('')
            : '<li>Record health data to generate personalized next steps.</li>';
    }
}

// Refresh button
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshAiSummaryBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', renderAIHealthTab);
});

// ── HEALTH INSIGHTS (CHARTS) TAB ─────────────────────────────
let bpChartInstance = null, glucoseChartInstance = null, hrChartInstance = null;

function renderInsightsCharts() {
    const vitals = HealthDB.vitals || [];
    if (vitals.length === 0) {
        ['bpChart','glucoseChart','hrChart'].forEach(id => {
            const ctx = document.getElementById(id);
            if (ctx) {
                const parent = ctx.parentElement;
                if (!parent.querySelector('.empty-state')) {
                    const es = document.createElement('div');
                    es.className = 'empty-state';
                    es.style.padding = '40px 20px';
                    es.innerHTML = '<i class="fa-solid fa-chart-line"></i><h4>No data yet</h4><p>Record vitals in Health Records to see trends here.</p>';
                    parent.appendChild(es);
                }
            }
        });
        const summaryEl = document.getElementById('insightSummaryText');
        if (summaryEl) summaryEl.textContent = 'Record vitals to see AI-generated trend insights here.';
        return;
    }

    const days = parseInt(document.getElementById('insightRangeSelect')?.value || '30');
    const cutoff = new Date(Date.now() - days * 86400000);
    const filtered = vitals.filter(v => {
        const d = new Date(v.created_at || v.date || Date.now());
        return d >= cutoff;
    });

    const labels = filtered.map(v => fmtDate(v.created_at || v.date));
    const sysData = filtered.map(v => v.systolic_bp || v.sys || null);
    const diaData = filtered.map(v => v.diastolic_bp || v.dia || null);
    const glData  = filtered.map(v => v.glucose_mg_dl || v.glucose || null);
    const hrData  = filtered.map(v => v.heart_rate || v.hr || null);

    const chartDefaults = {
        responsive: true,
        plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        scales: { y: { beginAtZero: false }, x: { ticks: { maxRotation: 45 } } }
    };

    // BP Chart
    const bpCtx = document.getElementById('bpChart')?.getContext('2d');
    if (bpCtx) {
        if (bpChartInstance) bpChartInstance.destroy();
        bpChartInstance = new Chart(bpCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Systolic (mmHg)', data: sysData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true },
                    { label: 'Diastolic (mmHg)', data: diaData, borderColor: '#0284c7', backgroundColor: 'rgba(2,132,199,0.08)', tension: 0.4, fill: true }
                ]
            },
            options: { ...chartDefaults }
        });
    }

    // Glucose Chart
    const glCtx = document.getElementById('glucoseChart')?.getContext('2d');
    if (glCtx) {
        if (glucoseChartInstance) glucoseChartInstance.destroy();
        glucoseChartInstance = new Chart(glCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [{ label: 'Blood Glucose (mg/dL)', data: glData, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.4, fill: true }]
            },
            options: { ...chartDefaults }
        });
    }

    // Heart Rate Chart
    const hrCtx = document.getElementById('hrChart')?.getContext('2d');
    if (hrCtx) {
        if (hrChartInstance) hrChartInstance.destroy();
        hrChartInstance = new Chart(hrCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [{ label: 'Heart Rate (bpm)', data: hrData, borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.1)', tension: 0.4, fill: true }]
            },
            options: { ...chartDefaults }
        });
    }

    // Summary text
    const summaryEl = document.getElementById('insightSummaryText');
    if (summaryEl && filtered.length > 0) {
        const avgSys = Math.round(sysData.filter(Boolean).reduce((a,b) => a+b, 0) / (sysData.filter(Boolean).length || 1));
        const avgHr  = Math.round(hrData.filter(Boolean).reduce((a,b) => a+b, 0) / (hrData.filter(Boolean).length || 1));
        const avgGl  = Math.round(glData.filter(Boolean).reduce((a,b) => a+b, 0) / (glData.filter(Boolean).length || 1));
        summaryEl.textContent = `Over the past ${days} days, your average systolic BP was ${avgSys || '—'} mmHg, heart rate ${avgHr || '—'} bpm, and fasting glucose ${avgGl || '—'} mg/dL (${filtered.length} readings). ${avgSys >= 130 ? 'Blood pressure appears elevated — consider scheduling a physician review.' : 'Overall vitals trend looks stable.'}`;
    }
}

// ── CARE NAVIGATOR TAB ────────────────────────────────────────
function renderCareNavTab() {
    const user = getCurrentUser();
    const specialistList = document.getElementById('recommendedSpecialistsList');

    // Generate smart specialist recs based on vitals
    const vitals = HealthDB.vitals || [];
    const specialists = [];

    if (vitals.length > 0) {
        const latest = vitals[vitals.length - 1];
        const sys = parseInt(latest.systolic_bp || latest.sys || 0);
        const gl  = parseInt(latest.glucose_mg_dl || latest.glucose || 0);

        if (sys >= 130) specialists.push({ name: 'Cardiologist', reason: 'Elevated blood pressure detected in your recent vitals.', icon: 'fa-heart-pulse', color: 'var(--danger)' });
        if (gl >= 126) specialists.push({ name: 'Endocrinologist', reason: 'Elevated blood glucose detected — diabetes management may be needed.', icon: 'fa-droplet', color: 'var(--warning)' });
    }
    specialists.push({ name: 'Primary Care Physician (PCP)', reason: 'Routine wellness check-up and prescription management.', icon: 'fa-user-doctor', color: 'var(--primary)' });
    specialists.push({ name: 'Dietitian / Nutritionist', reason: 'Personalized nutrition guidance to support your health goals.', icon: 'fa-apple-whole', color: 'var(--teal)' });

    if (specialistList) {
        specialistList.innerHTML = specialists.map(s => `
            <li style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-subtle);">
                <div style="width:36px;height:36px;border-radius:50%;background:${s.color}22;color:${s.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fa-solid ${s.icon}"></i>
                </div>
                <div>
                    <div style="font-weight:700;color:var(--text-primary);font-size:0.9rem;">${s.name}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">${s.reason}</div>
                </div>
            </li>`).join('');
    }
}

function generateCarePathText() {
    const el = document.getElementById('carePathText');
    if (!el) return;
    const vitals = HealthDB.vitals || [];
    const meds   = HealthDB.medications || [];
    const appts  = HealthDB.appointments || [];

    let path = '🩺 Recommended Care Pathway:\n\n';
    path += '1. Complete a comprehensive health assessment with your Primary Care Physician.\n';
    if (vitals.length > 0) path += '2. Continue monitoring vitals — aim for weekly readings.\n';
    else path += '2. Begin tracking vitals (BP, glucose, heart rate) regularly.\n';
    if (meds.length > 0) path += '3. Review current medication adherence and refill schedule with your pharmacist.\n';
    else path += '3. Discuss any needed medications with your doctor.\n';
    path += '4. Schedule specialist consultations as recommended below.\n';
    path += '5. Return for a follow-up health review in 30–60 days.';

    el.style.whiteSpace = 'pre-line';
    el.textContent = path;
    showToast('Care pathway generated from your health profile.', 'success');
}

// ── DOCTOR VISIT SUMMARY TAB ──────────────────────────────────
function renderDoctorSummaryTab() {
    const user   = getCurrentUser();
    const vitals = HealthDB.vitals || [];
    const meds   = HealthDB.medications || [];

    // Patient overview
    const overviewEl = document.getElementById('doctorPatientOverview');
    if (overviewEl && user) {
        const items = [
            { label: 'Name', value: user.name || '—', icon: 'fa-user' },
            { label: 'Age', value: user.age ? `${user.age} years` : '—', icon: 'fa-birthday-cake' },
            { label: 'Blood Group', value: user.bloodGroup || '—', icon: 'fa-droplet' },
            { label: 'Allergies', value: Array.isArray(user.allergies) ? user.allergies.join(', ') : (user.allergies || 'None'), icon: 'fa-triangle-exclamation' },
            { label: 'Conditions', value: Array.isArray(user.chronicConditions) ? user.chronicConditions.join(', ') : (user.chronicConditions || 'None recorded'), icon: 'fa-heart-pulse' },
        ];
        overviewEl.innerHTML = items.map(it => `
            <div style="padding:14px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-md);">
                <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;"><i class="fa-solid ${it.icon}" style="margin-right:4px;"></i>${it.label}</div>
                <div style="font-size:0.95rem;font-weight:700;color:var(--text-primary);">${it.value}</div>
            </div>`).join('');
    }

    // Recent vitals
    const vitalsEl = document.getElementById('summaryRecentVitals');
    if (vitalsEl) {
        if (vitals.length === 0) {
            vitalsEl.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="fa-solid fa-heart-pulse"></i><h4>No vitals</h4></div>';
        } else {
            const recent = vitals.slice(-3).reverse();
            vitalsEl.innerHTML = recent.map(v => `
                <div style="padding:10px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:8px;font-size:0.82rem;">
                    <div style="color:var(--text-muted);font-size:0.72rem;margin-bottom:4px;">${fmtDate(v.created_at || v.date)}</div>
                    <div>BP: <strong>${v.systolic_bp||v.sys||'—'}/${v.diastolic_bp||v.dia||'—'}</strong> &bull; HR: <strong>${v.heart_rate||v.hr||'—'} bpm</strong> &bull; Glucose: <strong>${v.glucose_mg_dl||v.glucose||'—'} mg/dL</strong></div>
                </div>`).join('');
        }
    }

    // Meds
    const medsEl = document.getElementById('summaryMeds');
    if (medsEl) {
        if (meds.length === 0) {
            medsEl.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="fa-solid fa-pills"></i><h4>No medications</h4></div>';
        } else {
            medsEl.innerHTML = meds.filter(m => m.is_active || m.isActive !== false).map(m => `
                <div style="padding:10px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:8px;font-size:0.82rem;">
                    <strong style="color:var(--text-primary);">${m.name}</strong> — ${m.frequency || m.dosage || 'as prescribed'}
                    ${m.purpose ? `<div style="color:var(--text-muted);font-size:0.75rem;margin-top:2px;">For: ${m.purpose}</div>` : ''}
                </div>`).join('');
        }
    }

    // Doctor questions
    const questionsEl = document.getElementById('summaryDoctorQuestions');
    if (questionsEl) {
        const qs = [
            'Are my current medications the right choice for my conditions?',
            'What lifestyle changes would most improve my key health metrics?',
            'Should I get any blood tests or lab work done this visit?',
            'Are there any interactions between my current medications?',
            'What are my target ranges for blood pressure and glucose?',
            'When should I schedule my next follow-up appointment?'
        ];
        questionsEl.innerHTML = qs.map(q => `<li>${q}</li>`).join('');
    }
}

// Print doctor summary
document.addEventListener('DOMContentLoaded', () => {
    const printBtn = document.getElementById('printDoctorSummaryBtn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
});

// ── MEDICATIONS TAB (NEW) ─────────────────────────────────────
function renderMedicationsTab() {
    const meds    = HealthDB.medications || [];
    const listEl  = document.getElementById('medicationsListNew');
    const countEl = document.getElementById('medsCount');
    const emptyEl = document.getElementById('medsEmptyState');

    if (!listEl) return;

    const active = meds.filter(m => m.is_active || m.isActive !== false);

    if (countEl) countEl.textContent = `${active.length} medication${active.length !== 1 ? 's' : ''}`;

    if (active.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = active.map(m => `
        <div class="med-item" style="margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:42px;height:42px;border-radius:var(--radius-md);background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">
                    <i class="fa-solid fa-pills"></i>
                </div>
                <div>
                    <div class="med-name">${m.name}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${m.frequency || m.dosage || 'As prescribed'} ${m.purpose ? '· For: ' + m.purpose : ''}</div>
                </div>
            </div>
            <span class="status-pill status-normal">Active</span>
        </div>`).join('');
}

// ── APPOINTMENTS TAB ──────────────────────────────────────────
function renderAppointmentsTab() {
    const appts     = HealthDB.appointments || [];
    const now       = new Date();
    const upcoming  = appts.filter(a => new Date(a.appointment_date || a.date || 0) >= now);
    const past      = appts.filter(a => new Date(a.appointment_date || a.date || 0) < now);

    const upEl      = document.getElementById('upcomingApptsList');
    const pastEl    = document.getElementById('pastApptsList');
    const upCount   = document.getElementById('upcomingCount');
    const upEmpty   = document.getElementById('upcomingEmpty');
    const pastEmpty = document.getElementById('pastEmpty');

    if (upCount) upCount.textContent = `${upcoming.length} upcoming`;

    function renderApptItem(a) {
        return `<li style="padding:14px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:40px;height:40px;border-radius:50%;background:var(--teal-light);color:var(--teal);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">
                    <i class="fa-solid fa-calendar-check"></i>
                </div>
                <div>
                    <div style="font-weight:700;color:var(--text-primary);font-size:0.9rem;">${a.doctor_name || a.doctorName || 'Doctor'}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${a.specialty || 'Specialist'} · ${fmtDate(a.appointment_date || a.date)} ${a.time_slot || a.slot ? '· ' + (a.time_slot || a.slot) : ''}</div>
                    ${a.notes ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">${a.notes}</div>` : ''}
                </div>
            </div>
            <span class="status-pill ${a.status === 'Confirmed' ? 'status-normal' : 'status-elevated'}">${a.status || 'Confirmed'}</span>
        </li>`;
    }

    if (upEl) {
        if (upcoming.length === 0) {
            upEl.innerHTML = '';
            if (upEmpty) upEmpty.style.display = 'block';
        } else {
            if (upEmpty) upEmpty.style.display = 'none';
            upEl.innerHTML = upcoming.sort((a,b) => new Date(a.appointment_date||a.date) - new Date(b.appointment_date||b.date)).map(renderApptItem).join('');
        }
    }

    if (pastEl) {
        if (past.length === 0) {
            pastEl.innerHTML = '';
            if (pastEmpty) pastEmpty.style.display = 'block';
        } else {
            if (pastEmpty) pastEmpty.style.display = 'none';
            pastEl.innerHTML = past.slice(-5).reverse().map(renderApptItem).join('');
        }
    }
}

// ── SETTINGS TAB ─────────────────────────────────────────────
function initSettingsTab() {
    // Populate from current user
    const user = getCurrentUser();
    if (user) {
        const pfName  = document.getElementById('profileName');
        const pfEmail = document.getElementById('profileEmail');
        const pfAge   = document.getElementById('profileAge');
        if (pfName)  pfName.value  = user.name  || '';
        if (pfEmail) pfEmail.value = user.email || '';
        if (pfAge)   pfAge.value   = user.age   || '';
    }

    // Save profile
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = getCurrentUser() || {};
            u.name  = document.getElementById('profileName')?.value || u.name;
            u.email = document.getElementById('profileEmail')?.value || u.email;
            u.age   = parseInt(document.getElementById('profileAge')?.value) || u.age;
            localStorage.setItem('carenav_current_user', JSON.stringify(u));
            // Update navbar display
            const nameEl = document.getElementById('currentPatientName');
            if (nameEl) nameEl.textContent = u.name;
            showToast('Profile updated successfully!', 'success');
        });
    }

    // Theme toggle in settings
    const themeSettingsBtn = document.getElementById('themeToggleBtnSettings');
    if (themeSettingsBtn) {
        themeSettingsBtn.addEventListener('click', () => {
            const themeBtn = document.getElementById('themeToggleBtn');
            if (themeBtn) themeBtn.click();
        });
    }

    // Notification settings
    const saveNotifBtn = document.getElementById('saveNotifSettings');
    if (saveNotifBtn) {
        saveNotifBtn.addEventListener('click', () => {
            const notifPrefs = {
                email: document.getElementById('notifyEmail')?.checked ?? true,
                meds:  document.getElementById('notifyMedReminders')?.checked ?? true
            };
            localStorage.setItem('carenav_notif_prefs', JSON.stringify(notifPrefs));
            showToast('Notification preferences saved.', 'success');
        });
    }

    // Clear all local data
    const clearBtn = document.getElementById('clearAllDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('⚠️ This will clear ALL locally stored health data. This cannot be undone. Continue?')) {
                const keysToKeep = ['carenav_users', 'carenav_current_user'];
                Object.keys(localStorage).forEach(k => {
                    if (!keysToKeep.some(keep => k.includes(keep.replace('carenav_', '')))) {
                        localStorage.removeItem(k);
                    }
                });
                showToast('All local health data cleared.', 'info');
            }
        });
    }
}

// ── WIRE UP "Add Med" BUTTON in Medications tab ───────────────
document.addEventListener('DOMContentLoaded', () => {
    const addMedNewBtn = document.getElementById('openAddMedModalNew');
    if (addMedNewBtn) {
        addMedNewBtn.addEventListener('click', () => {
            const existingBtn = document.getElementById('openAddMedModal');
            if (existingBtn) existingBtn.click();
        });
    }

    // Generate Care Path button
    const genCareBtn = document.getElementById('generateCarePathBtn');
    if (genCareBtn) genCareBtn.addEventListener('click', generateCarePathText);
});

// ── ENHANCED TAB SWITCHING — hook into existing switchToTab ──
(function patchTabSwitching() {
    // Hook into the existing nav item click logic
    const origSwitchToTab = window.switchToTab;

    function onTabChange(tabId) {
        switch (tabId) {
            case 'dashboard':     renderDashboardTab(); break;
            case 'aihealth':      renderAIHealthTab();  break;
            case 'insights':      renderInsightsCharts(); break;
            case 'carenav':       renderCareNavTab();   break;
            case 'doctorsummary': renderDoctorSummaryTab(); break;
            case 'medications':   renderMedicationsTab(); break;
            case 'appointments':  renderAppointmentsTab(); break;
            case 'settings':      initSettingsTab();    break;
        }
    }

    // Patch existing switchToTab if it exists
    if (typeof window.switchToTab === 'function') {
        window.switchToTab = function(tabId) {
            origSwitchToTab(tabId);
            onTabChange(tabId);
        };
    }

    // Also hook into nav-item clicks directly (belt and suspenders)
    document.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item[data-tab]');
        if (navItem) {
            const tabId = navItem.getAttribute('data-tab');
            setTimeout(() => onTabChange(tabId), 50);
        }
    });

    // Range select on insights
    document.addEventListener('change', (e) => {
        if (e.target.id === 'insightRangeSelect') renderInsightsCharts();
    });
})();

// ── RENDER DASHBOARD ON APP STARTUP ──────────────────────────
// Called after HealthDB is populated by loginUser()
const _origLoginUser = window.loginUser;
if (typeof window.loginUser === 'function') {
    window.loginUser = async function(...args) {
        await _origLoginUser(...args);
        setTimeout(renderDashboardTab, 300);
    };
}

// Also run dashboard render if the dashboard tab is already active on load
window.addEventListener('load', () => {
    const dashPane = document.getElementById('tab-dashboard');
    if (dashPane && dashPane.classList.contains('active')) {
        setTimeout(renderDashboardTab, 600);
    }
    initSettingsTab();
});

console.log('✅ CareNav-AI Phase 3-16: All tab handlers loaded');
