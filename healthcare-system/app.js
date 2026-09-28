// ================= INITIAL USERS SEED =================
if (!localStorage.getItem('carenav_users')) {
    const initialUsers = [
        {
            id: "CN-88492",
            name: "Alex Morgan",
            email: "alex.morgan@healthmail.com",
            password: "password123",
            role: "patient",
            age: 34,
            gender: "Male",
            bloodGroup: "O Positive (Rh+)",
            allergies: ["Penicillin", "Peanuts"],
            chronicConditions: ["Mild Asthma", "Pre-diabetes"],
            emergencyContact: "Sarah Morgan (Spouse) - +1 (555) 019-2834",
            primaryCarePhysician: "Dr. Evelyn Reed (St. Jude Hospital)"
        },
        {
            id: "DOC-1029",
            name: "Dr. Evelyn Reed, MD",
            email: "dr.reed@stjude.org",
            password: "doctor123",
            role: "doctor",
            specialty: "General Physician",
            hospital: "St. Jude Memorial Hospital",
            license: "MED-499201"
        }
    ];
    localStorage.setItem('carenav_users', JSON.stringify(initialUsers));
}

// ================= BACKEND REST API CLIENT (EXPRESS + SQLITE) =================
const CareNavAPI = {
    baseURL: (window.location.protocol.startsWith('http') ? window.location.origin : 'http://localhost:5000') + '/api',
    isOnline: false,

    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${this.baseURL}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                this.isOnline = true;
                this.updateBadge(true);
                return data;
            }
        } catch (e) {
            this.isOnline = false;
        }
        this.updateBadge(false);
        return null;
    },

    updateBadge(online) {
        const badge = document.getElementById('serverStatusBadge');
        const dot = document.getElementById('serverStatusDot');
        const text = document.getElementById('serverStatusText');
        if (!badge || !dot || !text) return;

        if (online) {
            badge.style.background = 'rgba(13, 148, 136, 0.12)';
            badge.style.color = 'var(--teal)';
            badge.style.borderColor = 'rgba(13, 148, 136, 0.3)';
            dot.style.background = 'var(--teal)';
            text.textContent = 'SQLite Backend Online';
        } else {
            badge.style.background = 'rgba(234, 179, 8, 0.12)';
            badge.style.color = '#eab308';
            badge.style.borderColor = 'rgba(234, 179, 8, 0.3)';
            dot.style.background = '#eab308';
            text.textContent = 'Offline (Local Storage)';
        }
    },

    async login(email, password, role) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async register(userData) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async getVitals(patientId) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/vitals/${encodeURIComponent(patientId)}`);
            if (res.ok) {
                const data = await res.json();
                return data.vitals;
            }
        } catch (e) {}
        return null;
    },

    async addVital(vitalData) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/vitals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vitalData)
            });
            return await res.json();
        } catch (e) {}
        return null;
    },

    async getMedications(patientId) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/medications/${encodeURIComponent(patientId)}`);
            if (res.ok) {
                const data = await res.json();
                return data.medications;
            }
        } catch (e) {}
        return null;
    },

    async addMedication(medData) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/medications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(medData)
            });
            return await res.json();
        } catch (e) {}
        return null;
    },

    async getDoctors(specialty) {
        if (!this.isOnline) return null;
        try {
            const url = specialty && specialty !== 'All' ? `${this.baseURL}/doctors?specialty=${encodeURIComponent(specialty)}` : `${this.baseURL}/doctors`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                return data.doctors;
            }
        } catch (e) {}
        return null;
    },

    async getAppointments(patientId) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/appointments/patient/${encodeURIComponent(patientId)}`);
            if (res.ok) {
                const data = await res.json();
                return data.appointments;
            }
        } catch (e) {}
        return null;
    },

    async bookAppointment(apptData) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apptData)
            });
            return await res.json();
        } catch (e) {}
        return null;
    },

    async assessTriage(triageData) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/triage/assess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(triageData)
            });
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    },

    async explainReport(reportText) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/reports/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportText })
            });
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    },

    async getStats() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/stats/overview`);
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    },

    async getAllPatients() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/patient`);
            if (res.ok) {
                const data = await res.json();
                return data.patients;
            }
        } catch (e) {}
        return null;
    },

    async getDoctorAppointments(doctorId) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/appointments/doctor/${encodeURIComponent(doctorId)}`);
            if (res.ok) {
                const data = await res.json();
                return data.appointments;
            }
        } catch (e) {}
        return null;
    },

    async updateAppointmentStatus(id, status) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseURL}/appointments/${encodeURIComponent(id)}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    }
};


// ================= SUPABASE CLOUD DATABASE CLIENT (POSTGRESQL) =================
const CareNavSupabase = {
    client: null,
    isReady: false,
    url: '',
    key: '',

    init() {
        this.url = localStorage.getItem('carenav_supabase_url') || 'https://xwexlavqmbrgthnljyeb.supabase.co';
        this.key = localStorage.getItem('carenav_supabase_key') || '';
        if (this.url && this.key && typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
            try {
                this.client = window.supabase.createClient(this.url, this.key);
                this.isReady = true;
                this.updateBadge(true);
                return true;
            } catch (err) {
                console.warn('Supabase initialization warning:', err.message);
                this.updateBadge(false);
            }
        } else {
            this.updateBadge(false);
        }
        return false;
    },

    updateBadge(connected) {
        const badge = document.getElementById('supabaseStatusBadge');
        const dot = document.getElementById('supabaseStatusDot');
        const text = document.getElementById('supabaseStatusText');
        const settingsBadge = document.getElementById('supabaseSettingsBadge');

        if (connected) {
            if (badge) {
                badge.style.background = 'rgba(59, 130, 246, 0.15)';
                badge.style.color = '#2563eb';
                badge.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            }
            if (dot) dot.style.background = '#2563eb';
            if (text) text.innerHTML = '<i class="fa-solid fa-cloud-bolt"></i> Supabase Cloud Active';
            if (settingsBadge) {
                settingsBadge.textContent = 'Connected (Live PostgreSQL)';
                settingsBadge.style.background = 'rgba(34, 197, 94, 0.15)';
                settingsBadge.style.color = '#16a34a';
            }
        } else {
            if (badge) {
                badge.style.background = 'rgba(148, 163, 184, 0.12)';
                badge.style.color = '#64748b';
                badge.style.borderColor = 'rgba(148, 163, 184, 0.3)';
            }
            if (dot) dot.style.background = '#94a3b8';
            if (text) text.innerHTML = '<i class="fa-solid fa-cloud"></i> Supabase Cloud (Connect)';
            if (settingsBadge) {
                settingsBadge.textContent = 'Not Connected';
                settingsBadge.style.background = '#e2e8f0';
                settingsBadge.style.color = '#475569';
            }
        }
    },

    async test(url, key) {
        if (!url || !key) return { success: false, message: 'Supabase URL and Anon API Key are required.' };
        if (typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) {
            return { success: false, message: 'Supabase JS SDK not loaded yet. Check internet connection.' };
        }
        try {
            const testClient = window.supabase.createClient(url, key);
            const { data, error } = await testClient.from('users').select('count', { count: 'exact', head: true });
            if (error) {
                if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
                    return { success: true, message: 'Connected to Supabase! (Database tables not yet created — copy & run supabase_schema.sql in Supabase SQL Editor)' };
                }
                return { success: false, message: error.message };
            }
            return { success: true, message: 'Successfully connected to Supabase PostgreSQL cloud database!' };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    async syncVital(vital) {
        if (!this.isReady || !this.client) return null;
        try {
            const { data, error } = await this.client.from('vitals').insert({
                patient_id: vital.patientId || vital.patient_id,
                systolic_bp: vital.sys || vital.systolic_bp,
                diastolic_bp: vital.dia || vital.diastolic_bp,
                heart_rate: vital.hr || vital.heart_rate,
                glucose_mg_dl: vital.glucose || vital.glucose_mg_dl,
                spo2_percent: vital.spo2 || vital.spo2_percent,
                status: vital.status || 'Normal'
            });
            if (error) console.warn('Supabase syncVital note:', error.message);
            return data;
        } catch (e) {
            console.warn('Supabase syncVital error:', e.message);
            return null;
        }
    },

    async syncMedication(med) {
        if (!this.isReady || !this.client) return null;
        try {
            const { data, error } = await this.client.from('medications').upsert({
                id: med.id || ('m-' + Date.now()),
                patient_id: med.patientId || med.patient_id,
                name: med.name,
                frequency: med.frequency,
                purpose: med.purpose,
                is_active: true
            });
            if (error) console.warn('Supabase syncMedication note:', error.message);
            return data;
        } catch (e) {
            console.warn('Supabase syncMedication error:', e.message);
            return null;
        }
    },

    async syncAppointment(appt) {
        if (!this.isReady || !this.client) return null;
        try {
            const { data, error } = await this.client.from('appointments').upsert({
                id: appt.id || ('apt-' + Date.now()),
                patient_id: appt.patientId || appt.patient_id,
                doctor_id: appt.doctorId || appt.doctor_id || 'DOC-1029',
                doctor_name: appt.doctorName || appt.doctor_name || 'Dr. Evelyn Reed, MD',
                specialty: appt.specialty || 'General Physician',
                appointment_date: appt.date || appt.appointment_date,
                time_slot: appt.slot || appt.time_slot,
                notes: appt.notes || '',
                status: appt.status || 'Confirmed'
            });
            if (error) console.warn('Supabase syncAppointment note:', error.message);
            return data;
        } catch (e) {
            console.warn('Supabase syncAppointment error:', e.message);
            return null;
        }
    },

    async syncAllLocalData() {
        if (!this.isReady || !this.client) {
            throw new Error('Supabase is not connected. Please enter URL and Key first.');
        }

        const users = JSON.parse(localStorage.getItem('carenav_users') || '[]');
        const vitals = JSON.parse(localStorage.getItem('carenav_vitals') || '[]');
        const meds = JSON.parse(localStorage.getItem('carenav_meds') || '[]');
        const appts = JSON.parse(localStorage.getItem('carenav_appts') || '[]');

        let count = 0;
        for (const u of users) {
            if (u.role === 'patient') {
                await this.client.from('patients').upsert({
                    patient_id: u.id,
                    user_id: u.id,
                    age: u.age || 34,
                    gender: u.gender || 'Male',
                    blood_group: u.bloodGroup || 'O Positive (Rh+)',
                    allergies: Array.isArray(u.allergies) ? u.allergies.join(', ') : (u.allergies || ''),
                    chronic_conditions: Array.isArray(u.chronicConditions) ? u.chronicConditions.join(', ') : (u.chronicConditions || ''),
                    emergency_contact: u.emergencyContact || '',
                    primary_physician: u.primaryCarePhysician || ''
                });
                count++;
            }
        }
        for (const v of vitals) {
            await this.syncVital(v);
            count++;
        }
        for (const m of meds) {
            await this.syncMedication(m);
            count++;
        }
        for (const a of appts) {
            await this.syncAppointment(a);
            count++;
        }
        return count;
    }
};


// ================= COMPONENT VISIBILITY MANAGER =================
const UIVisibilityManager = {
    defaults: {
        showDbBtn: false,
        showStatusBadges: false,
        showRoleSwitcher: true,
        showEmergencyBtn: true,
        showVitalsWidget: true,
        showCompanionTab: true,
        showExplainerTab: true
    },

    getSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('carenav_ui_visibility') || '{}');
            return { ...this.defaults, ...saved };
        } catch (e) {
            return { ...this.defaults };
        }
    },

    saveSettings(settings) {
        localStorage.setItem('carenav_ui_visibility', JSON.stringify(settings));
        this.applySettings(settings);
    },

    applySettings(settings = this.getSettings()) {
        const dbBtn = document.getElementById('openDatabaseBtn');
        const serverBadge = document.getElementById('serverStatusBadge');
        const supabaseBadge = document.getElementById('supabaseStatusBadge');
        const roleBtn = document.getElementById('switchRoleBtn');
        const emergencyBtn = document.getElementById('emergencyCardBtn');
        const vitalsWidget = document.getElementById('patientSidebarWidget');
        const companionNav = document.querySelector('[data-tab="chat"]');
        const explainerNav = document.querySelector('[data-tab="explainer"]');

        if (dbBtn) dbBtn.style.display = settings.showDbBtn ? 'inline-flex' : 'none';
        if (serverBadge) serverBadge.style.display = settings.showStatusBadges ? 'flex' : 'none';
        if (supabaseBadge) supabaseBadge.style.display = settings.showStatusBadges ? 'flex' : 'none';
        if (roleBtn) roleBtn.style.display = settings.showRoleSwitcher ? 'flex' : 'none';
        if (emergencyBtn) emergencyBtn.style.display = settings.showEmergencyBtn ? 'inline-flex' : 'none';
        if (vitalsWidget) vitalsWidget.style.display = settings.showVitalsWidget ? 'block' : 'none';
        if (companionNav) companionNav.style.display = settings.showCompanionTab ? 'flex' : 'none';
        if (explainerNav) explainerNav.style.display = settings.showExplainerTab ? 'flex' : 'none';
    },

    syncCheckboxes() {
        const s = this.getSettings();
        const chkDb = document.getElementById('toggleShowDbBtn');
        const chkBadges = document.getElementById('toggleShowStatusBadges');
        const chkRole = document.getElementById('toggleShowRoleSwitcher');
        const chkEm = document.getElementById('toggleShowEmergencyBtn');
        const chkVitals = document.getElementById('toggleShowVitalsWidget');
        const chkChat = document.getElementById('toggleShowCompanionTab');
        const chkExplainer = document.getElementById('toggleShowExplainerTab');

        if (chkDb) chkDb.checked = s.showDbBtn;
        if (chkBadges) chkBadges.checked = s.showStatusBadges;
        if (chkRole) chkRole.checked = s.showRoleSwitcher;
        if (chkEm) chkEm.checked = s.showEmergencyBtn;
        if (chkVitals) chkVitals.checked = s.showVitalsWidget;
        if (chkChat) chkChat.checked = s.showCompanionTab;
        if (chkExplainer) chkExplainer.checked = s.showExplainerTab;
    },

    bindEvents() {
        const toggleMap = [
            { id: 'toggleShowDbBtn', key: 'showDbBtn' },
            { id: 'toggleShowStatusBadges', key: 'showStatusBadges' },
            { id: 'toggleShowRoleSwitcher', key: 'showRoleSwitcher' },
            { id: 'toggleShowEmergencyBtn', key: 'showEmergencyBtn' },
            { id: 'toggleShowVitalsWidget', key: 'showVitalsWidget' },
            { id: 'toggleShowCompanionTab', key: 'showCompanionTab' },
            { id: 'toggleShowExplainerTab', key: 'showExplainerTab' }
        ];

        toggleMap.forEach(({ id, key }) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    const current = this.getSettings();
                    current[key] = el.checked;
                    this.saveSettings(current);
                });
            }
        });

        const resetBtn = document.getElementById('resetVisibilityBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.saveSettings(this.defaults);
                this.syncCheckboxes();
                if (typeof showToast === 'function') showToast('All interface components restored.', 'info');
            });
        }
    }
};

// ================= MODERN CLINICAL TOAST NOTIFICATIONS =================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        alert(message);
        return;
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    else if (type === 'error') iconClass = 'fa-circle-xmark';
    else if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 4000);
}

let activeUser = JSON.parse(localStorage.getItem('carenav_current_user') || 'null');

// ================= INITIAL STATE & MOCK DATABASE =================
const HealthDB = {
    patient: {
        id: activeUser ? activeUser.id : "CN-88492",
        name: activeUser ? activeUser.name : "Alex Morgan",
        age: activeUser ? (activeUser.age || 34) : 34,
        gender: activeUser ? (activeUser.gender || "Male") : "Male",
        bloodGroup: activeUser ? (activeUser.bloodGroup || "O Positive (Rh+)") : "O Positive (Rh+)",
        allergies: activeUser ? (activeUser.allergies || ["Penicillin", "Peanuts"]) : ["Penicillin", "Peanuts"],
        chronicConditions: activeUser ? (activeUser.chronicConditions || ["Mild Asthma", "Pre-diabetes"]) : ["Mild Asthma", "Pre-diabetes"],
        emergencyContact: activeUser ? (activeUser.emergencyContact || "Sarah Morgan (Spouse) - +1 (555) 019-2834") : "Sarah Morgan (Spouse) - +1 (555) 019-2834",
        primaryCarePhysician: activeUser ? (activeUser.primaryCarePhysician || "Dr. Evelyn Reed (St. Jude Hospital)") : "Dr. Evelyn Reed (St. Jude Hospital)",
        role: activeUser ? (activeUser.role || "patient") : "patient"
    },

    vitals: JSON.parse(localStorage.getItem('carenav_vitals') || JSON.stringify([
        { date: "2026-09-07 08:30 AM", bp: "120/80", hr: 74, glucose: 96, spo2: 99, status: "Normal" },
        { date: "2026-09-05 06:15 PM", bp: "124/82", hr: 78, glucose: 104, spo2: 98, status: "Normal" },
        { date: "2026-09-02 09:00 AM", bp: "135/88", hr: 82, glucose: 112, spo2: 98, status: "Elevated" },
        { date: "2026-08-28 08:15 AM", bp: "122/80", hr: 72, glucose: 98, spo2: 99, status: "Normal" }
    ])),

    medications: JSON.parse(localStorage.getItem('carenav_meds') || JSON.stringify([
        { id: "m1", name: "Metformin 500mg", frequency: "Twice daily with meals", purpose: "Pre-diabetes blood glucose control" },
        { id: "m2", name: "Albuterol Inhaler (90mcg)", frequency: "As needed (PRN)", purpose: "Asthma rescue inhaler for bronchospasms" },
        { id: "m3", name: "Vitamin D3 (2000 IU)", frequency: "Once daily in morning", purpose: "Nutritional bone & immune support" }
    ])),

    doctors: [
        {
            id: "d1",
            name: "Dr. Evelyn Reed, MD",
            specialty: "General Physician",
            experience: "14 years exp.",
            hospital: "St. Jude Memorial Hospital",
            rating: "4.9 ★ (180+ reviews)",
            availability: "Today & Tomorrow",
            icon: "fa-user-doctor"
        },
        {
            id: "d2",
            name: "Dr. Marcus Vance, FACC",
            specialty: "Cardiologist",
            experience: "18 years exp.",
            hospital: "Metro Heart & Vascular Institute",
            rating: "4.95 ★ (240+ reviews)",
            availability: "Tomorrow, 10:00 AM",
            icon: "fa-heart-pulse"
        },
        {
            id: "d3",
            name: "Dr. Sophia Chen, MD",
            specialty: "Gastroenterologist",
            experience: "12 years exp.",
            hospital: "City Center Digestive Health",
            rating: "4.85 ★ (110+ reviews)",
            availability: "Wednesday, 02:00 PM",
            icon: "fa-stethoscope"
        },
        {
            id: "d4",
            name: "Dr. Robert Sterling, MD",
            specialty: "Pulmonologist",
            experience: "16 years exp.",
            hospital: "Crestview Pulmonary & Sleep Clinic",
            rating: "4.9 ★ (95+ reviews)",
            availability: "Available Thursday",
            icon: "fa-lungs"
        },
        {
            id: "d5",
            name: "Dr. Maya Lin, MD",
            specialty: "Neurologist",
            experience: "11 years exp.",
            hospital: "NeuroScience Center of Excellence",
            rating: "4.9 ★ (130+ reviews)",
            availability: "Friday, 11:30 AM",
            icon: "fa-brain"
        },
        {
            id: "d6",
            name: "Dr. Jordan Hayes, FAAD",
            specialty: "Dermatologist",
            experience: "9 years exp.",
            hospital: "Advanced Skin & Allergy Center",
            rating: "4.8 ★ (160+ reviews)",
            availability: "Tomorrow, 03:00 PM",
            icon: "fa-allergies"
        },
        {
            id: "d7",
            name: "Dr. Daniel Carter, MD",
            specialty: "Orthopedic",
            experience: "15 years exp.",
            hospital: "Orthopedic & Spine Specialists",
            rating: "4.9 ★ (210+ reviews)",
            availability: "Thursday, 09:00 AM",
            icon: "fa-bone"
        }
    ],

    appointments: JSON.parse(localStorage.getItem('carenav_appts') || '[]'),
    geminiApiKey: localStorage.getItem('carenav_gemini_key') || '',

    doctorPatients: JSON.parse(localStorage.getItem('carenav_doctor_patients') || JSON.stringify([
        {
            id: "CN-88492",
            name: "Alex Morgan",
            email: "alex.morgan@healthmail.com",
            age: 34,
            gender: "Male",
            bloodGroup: "O Positive (Rh+)",
            allergies: ["Penicillin", "Peanuts"],
            chronicConditions: ["Mild Asthma", "Pre-diabetes"],
            emergencyContact: "Sarah Morgan (Spouse) - +1 (555) 019-2834",
            primaryCarePhysician: "Dr. Evelyn Reed (St. Jude Hospital)",
            latest_vitals: { bp: "120/80", hr: 74, glucose: 96, spo2: 99, status: "Normal" },
            medications_count: 3
        },
        {
            id: "CN-73910",
            name: "Sarah Jenkins",
            email: "sarah.jenkins@healthmail.com",
            age: 48,
            gender: "Female",
            bloodGroup: "A Positive (Rh+)",
            allergies: ["Sulfa Drugs", "Codeine"],
            chronicConditions: ["Hypertension", "Dyslipidemia"],
            emergencyContact: "Robert Jenkins (Spouse) - +1 (555) 018-9123",
            primaryCarePhysician: "Dr. Evelyn Reed (St. Jude Hospital)",
            latest_vitals: { bp: "128/84", hr: 76, glucose: 102, spo2: 98, status: "Normal" },
            medications_count: 1
        },
        {
            id: "CN-51204",
            name: "Marcus Bell",
            email: "marcus.bell@healthmail.com",
            age: 62,
            gender: "Male",
            bloodGroup: "B Positive (Rh+)",
            allergies: ["Aspirin", "Iodine Contrast"],
            chronicConditions: ["Type 2 Diabetes", "Coronary Artery Disease"],
            emergencyContact: "David Bell (Son) - +1 (555) 012-4491",
            primaryCarePhysician: "Dr. Evelyn Reed (St. Jude Hospital)",
            latest_vitals: { bp: "142/92", hr: 88, glucose: 145, spo2: 96, status: "Elevated" },
            medications_count: 2
        }
    ])),

    doctorAppointments: JSON.parse(localStorage.getItem('carenav_doctor_appts') || JSON.stringify([
        {
            id: "apt-101",
            patient_id: "CN-88492",
            patient_name: "Alex Morgan",
            doctor_id: "DOC-1029",
            appointment_date: "2026-09-15",
            time_slot: "10:00 AM",
            notes: "Follow-up HbA1c review & asthma assessment",
            type: "Telehealth Video Call",
            status: "Confirmed"
        },
        {
            id: "apt-102",
            patient_id: "CN-73910",
            patient_name: "Sarah Jenkins",
            doctor_id: "DOC-1029",
            appointment_date: "2026-09-15",
            time_slot: "11:30 AM",
            notes: "Hypertension blood pressure check and medication titration",
            type: "In-Clinic Consultation",
            status: "Confirmed"
        },
        {
            id: "apt-103",
            patient_id: "CN-51204",
            patient_name: "Marcus Bell",
            doctor_id: "DOC-1029",
            appointment_date: "2026-09-16",
            time_slot: "02:00 PM",
            notes: "Cardiometabolic risk evaluation and lipid panel discussion",
            type: "Telehealth Video Call",
            status: "Confirmed"
        }
    ])),

    doctorPrescriptions: JSON.parse(localStorage.getItem('carenav_doctor_prescriptions') || JSON.stringify([
        {
            id: "rx-201",
            patient_id: "CN-88492",
            patient_name: "Alex Morgan",
            med_name: "Metformin 500mg",
            dosage: "Twice daily with meals",
            purpose: "Pre-diabetes glycemic control",
            date: "2026-09-01",
            status: "Active - Transmitted to Walgreens"
        },
        {
            id: "rx-202",
            patient_id: "CN-88492",
            patient_name: "Alex Morgan",
            med_name: "Albuterol Inhaler (90mcg)",
            dosage: "2 puffs every 4-6h PRN",
            purpose: "Bronchospasm rescue",
            date: "2026-08-20",
            status: "Active - Transmitted to CVS"
        },
        {
            id: "rx-203",
            patient_id: "CN-73910",
            patient_name: "Sarah Jenkins",
            med_name: "Lisinopril 10mg",
            dosage: "Once daily in morning",
            purpose: "Essential Hypertension",
            date: "2026-09-03",
            status: "Active - Transmitted to Walgreens"
        },
        {
            id: "rx-204",
            patient_id: "CN-51204",
            patient_name: "Marcus Bell",
            med_name: "Atorvastatin 20mg",
            dosage: "Once daily at bedtime",
            purpose: "Dyslipidemia & CAD prophylaxis",
            date: "2026-08-15",
            status: "Active - Transmitted to RiteAid"
        }
    ]))
};

// ================= DOM INITIALIZATION =================
document.addEventListener('DOMContentLoaded', async () => {
    initAuthModule();
    initNavigation();
    renderVitals();
    renderMedications();
    renderDoctors();
    initTriageModule();
    initExplainerModule();
    initChatModule();
    initModals();
    initDoctorStation();

    // Check backend API connection
    await CareNavAPI.checkHealth();
    CareNavSupabase.init();
    UIVisibilityManager.applySettings();
    UIVisibilityManager.bindEvents();

    // Check login state
    const current = JSON.parse(localStorage.getItem('carenav_current_user') || 'null');
    if (current && current.name) {
        await loginUser(current, false);
    } else {
        showScreen('auth');
    }
});

// ================= SCREEN SWITCHER (AUTH vs DASHBOARD) =================
function showScreen(screen) {
    const authScreen = document.getElementById('authScreen');
    const appScreen = document.getElementById('appScreen');
    if (!authScreen || !appScreen) return;

    if (screen === 'auth') {
        authScreen.style.display = 'flex';
        appScreen.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        authScreen.style.display = 'none';
        appScreen.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ================= USER LOGIN / SESSION HANDLER =================
async function loginUser(user, saveToStorage = true) {
    if (saveToStorage) {
        localStorage.setItem('carenav_current_user', JSON.stringify(user));
    }
    activeUser = user;
    HealthDB.patient = {
        id: user.id,
        name: user.name,
        age: user.age || 34,
        gender: user.gender || "Male",
        bloodGroup: user.bloodGroup || "O Positive (Rh+)",
        allergies: user.allergies || ["Penicillin", "Peanuts"],
        chronicConditions: user.chronicConditions || ["Mild Asthma", "Pre-diabetes"],
        emergencyContact: user.emergencyContact || "Contact on file",
        primaryCarePhysician: user.primaryCarePhysician || "Dr. Evelyn Reed (St. Jude Hospital)",
        role: user.role || "patient"
    };

    // Update Navbar Profile & Portal Elements
    const nameEl = document.getElementById('currentPatientName');
    const subEl = document.getElementById('currentPatientSub');
    const avatarEl = document.getElementById('navAvatar');
    const badgeEl = document.getElementById('patientBadge');
    const switchRoleBtn = document.getElementById('switchRoleBtn');
    const switchRoleText = document.getElementById('switchRoleText');
    const providerStatusBtn = document.getElementById('providerStatusBtn');
    const emergencyCardBtn = document.getElementById('emergencyCardBtn');
    const patientNavMenu = document.getElementById('patientNavMenu');
    const doctorNavMenu = document.getElementById('doctorNavMenu');
    const patientSidebarWidget = document.getElementById('patientSidebarWidget');
    const doctorSidebarWidget = document.getElementById('doctorSidebarWidget');
    const sidebarDisclaimerText = document.getElementById('sidebarDisclaimerText');

    if (nameEl) nameEl.textContent = user.name;

    const isDoctor = user.role === 'doctor';

    if (isDoctor) {
        if (subEl) subEl.innerHTML = `Lic: #${user.license || user.id || 'MED-499201'} &bull; ${user.specialty || 'Attending Physician'}`;
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-doctor"></i>';
        if (badgeEl) {
            badgeEl.style.borderColor = 'var(--teal)';
            badgeEl.title = 'Attending Physician Provider Station';
        }
        if (patientNavMenu) patientNavMenu.style.display = 'none';
        if (doctorNavMenu) doctorNavMenu.style.display = 'flex';
        if (patientSidebarWidget) patientSidebarWidget.style.display = 'none';
        if (doctorSidebarWidget) doctorSidebarWidget.style.display = 'block';
        if (providerStatusBtn) providerStatusBtn.style.display = 'inline-flex';
        if (emergencyCardBtn) emergencyCardBtn.style.display = 'none';
        if (switchRoleBtn) switchRoleBtn.style.display = 'inline-flex';
        if (switchRoleText) switchRoleText.textContent = 'Switch to Patient View';
        if (sidebarDisclaimerText) sidebarDisclaimerText.textContent = 'Physician workstation active. Encrypted clinical access under HIPAA/HITECH regulations.';

        // Select Doctor Station tab by default
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const docDashNav = document.querySelector('#doctorNavMenu .nav-item[data-tab="doc-dashboard"]');
        if (docDashNav) docDashNav.classList.add('active');
        const docDashPane = document.getElementById('tab-doc-dashboard');
        if (docDashPane) docDashPane.classList.add('active');

        // Load Doctor station data
        await renderDoctorStation();
        await renderDoctorPatients();
        await renderDoctorSchedule();
        await renderDoctorPrescriptions();
    } else {
        if (subEl) subEl.innerHTML = `ID: #${user.id} &bull; Age: ${user.age || 34} &bull; Blood: ${user.bloodGroup || 'O+'}`;
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-injured"></i>';
        if (badgeEl) {
            badgeEl.style.borderColor = 'var(--border-color)';
            badgeEl.title = 'Patient Health Records';
        }
        if (patientNavMenu) patientNavMenu.style.display = 'flex';
        if (doctorNavMenu) doctorNavMenu.style.display = 'none';
        if (patientSidebarWidget) patientSidebarWidget.style.display = 'block';
        if (doctorSidebarWidget) doctorSidebarWidget.style.display = 'none';
        if (providerStatusBtn) providerStatusBtn.style.display = 'none';
        if (emergencyCardBtn) emergencyCardBtn.style.display = 'inline-flex';
        if (switchRoleBtn) switchRoleBtn.style.display = 'inline-flex';
        if (switchRoleText) switchRoleText.textContent = 'Switch to Doctor Station';
        if (sidebarDisclaimerText) sidebarDisclaimerText.textContent = 'CareNav AI assists with health management & navigation. In immediate life-threatening emergencies, call 911 or visit the nearest ER.';

        // Select Triage tab by default
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const triageNav = document.querySelector('#patientNavMenu .nav-item[data-tab="triage"]');
        if (triageNav) triageNav.classList.add('active');
        const triagePane = document.getElementById('tab-triage');
        if (triagePane) triagePane.classList.add('active');

        // Sync from SQLite if online
        if (CareNavAPI.isOnline && user.id) {
            try {
                const [vitals, meds, appts, docs] = await Promise.all([
                    CareNavAPI.getVitals(user.id),
                    CareNavAPI.getMedications(user.id),
                    CareNavAPI.getAppointments(user.id),
                    CareNavAPI.getDoctors()
                ]);
                if (vitals && Array.isArray(vitals) && vitals.length > 0) {
                    HealthDB.vitals = vitals;
                }
                if (meds && Array.isArray(meds) && meds.length > 0) {
                    HealthDB.medications = meds;
                }
                if (appts && Array.isArray(appts) && appts.length > 0) {
                    HealthDB.appointments = appts;
                }
                if (docs && Array.isArray(docs) && docs.length > 0) {
                    HealthDB.doctors = docs;
                }
            } catch (e) {
                console.warn('Sync with SQLite failed, using cached data:', e);
            }
        }

        renderVitals();
        renderMedications();
        renderDoctors();
    }

    showScreen('app');
}

// ================= AUTH MODULE (LOGIN & SIGN UP LOGIC) =================
function initAuthModule() {
    let currentRole = 'patient';
    const alertBox = document.getElementById('authAlert');

    function showAlert(msg, isSuccess = false) {
        if (!alertBox) return;
        alertBox.textContent = msg;
        alertBox.className = `alert-box ${isSuccess ? 'alert-success' : 'alert-error'}`;
        alertBox.style.display = 'block';
        setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
    }

    // Tabs
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabSignupBtn = document.getElementById('tabSignupBtn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (tabLoginBtn && tabSignupBtn) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabSignupBtn.classList.remove('active');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
            if (alertBox) alertBox.style.display = 'none';
        });

        tabSignupBtn.addEventListener('click', () => {
            tabSignupBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
            if (alertBox) alertBox.style.display = 'none';
        });
    }

    // Role Selection
    const rolePatient = document.getElementById('rolePatient');
    const roleDoctor = document.getElementById('roleDoctor');
    const patientFields = document.getElementById('patientSpecificFields');
    const doctorFields = document.getElementById('doctorSpecificFields');
    const ageWrapper = document.getElementById('ageFieldWrapper');

    if (rolePatient && roleDoctor) {
        rolePatient.addEventListener('click', () => {
            currentRole = 'patient';
            rolePatient.classList.add('active');
            roleDoctor.classList.remove('active');
            if (patientFields) patientFields.style.display = 'block';
            if (doctorFields) doctorFields.style.display = 'none';
            if (ageWrapper) ageWrapper.style.display = 'block';
        });

        roleDoctor.addEventListener('click', () => {
            currentRole = 'doctor';
            roleDoctor.classList.add('active');
            rolePatient.classList.remove('active');
            if (patientFields) patientFields.style.display = 'none';
            if (doctorFields) doctorFields.style.display = 'block';
            if (ageWrapper) ageWrapper.style.display = 'none';
        });
    }

    // Login Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;

            // Try SQLite API first if online
            if (CareNavAPI.isOnline) {
                const apiRes = await CareNavAPI.login(email, password, currentRole);
                if (apiRes && apiRes.success && apiRes.user) {
                    showAlert(`Welcome back, ${apiRes.user.name}! (Connected to SQLite Database)`, true);
                    setTimeout(() => { loginUser(apiRes.user, true); }, 400);
                    return;
                } else if (apiRes && !apiRes.success) {
                    showAlert(apiRes.message || 'Invalid email or password.');
                    return;
                }
            }

            // Fallback to LocalStorage
            const users = JSON.parse(localStorage.getItem('carenav_users') || '[]');
            const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

            if (user) {
                if (user.role !== currentRole) {
                    showAlert(`This account is registered as a ${user.role}. Please switch to the ${user.role} tab above.`);
                    return;
                }
                showAlert(`Welcome, ${user.name}! Loading health portal...`, true);
                setTimeout(() => {
                    loginUser(user, true);
                }, 500);
            } else {
                showAlert('Invalid email or password. Please check your credentials or click Quick Demo Login.');
            }
        });
    }

    const forgotPwdLink = document.getElementById('forgotPasswordLink');
    if (forgotPwdLink) {
        forgotPwdLink.addEventListener('click', (e) => {
            e.preventDefault();
            const emailVal = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value.trim() : '';
            const target = emailVal || 'your registered address';
            showAlert(`Password reset instructions have been dispatched to ${target}. Please check your inbox.`, true);
            showToast(`Reset email sent to ${target}`, 'info');
        });
    }

    // Sign Up Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const password = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('signupConfirmPassword').value;

            if (password !== confirm) {
                showAlert('Passwords do not match! Please check again.');
                return;
            }

            let newUser = {
                id: (currentRole === 'doctor' ? 'DOC-' : 'CN-') + Math.floor(10000 + Math.random() * 90000),
                name: name,
                email: email,
                password: password,
                role: currentRole
            };

            if (currentRole === 'patient') {
                const age = parseInt(document.getElementById('signupAge').value) || 30;
                const blood = document.getElementById('signupBloodGroup').value;
                const allergiesRaw = document.getElementById('signupAllergies').value.trim();
                const allergies = allergiesRaw ? allergiesRaw.split(',').map(s => s.trim()) : ["None reported"];

                newUser.age = age;
                newUser.bloodGroup = blood;
                newUser.allergies = allergies;
                newUser.chronicConditions = ["None recorded"];
                newUser.emergencyContact = "Contact on file";
            } else {
                newUser.specialty = document.getElementById('signupSpecialty').value;
                newUser.license = document.getElementById('signupLicense').value.trim() || 'MED-VERIFIED';
                newUser.hospital = "CareNav Affiliated Hospital";
            }

            // Try SQLite API first if online
            if (CareNavAPI.isOnline) {
                const apiRes = await CareNavAPI.register(newUser);
                if (apiRes && apiRes.success && apiRes.user) {
                    showAlert(`Account registered in SQLite Database! Welcome, ${name}.`, true);
                    setTimeout(() => { loginUser(apiRes.user, true); }, 500);
                    return;
                } else if (apiRes && !apiRes.success) {
                    showAlert(apiRes.message || 'Registration failed.');
                    return;
                }
            }

            // Fallback to LocalStorage
            const users = JSON.parse(localStorage.getItem('carenav_users') || '[]');
            if (users.some(u => u.email.toLowerCase() === email)) {
                showAlert('An account with this email already exists. Please sign in instead.');
                return;
            }

            users.push(newUser);
            localStorage.setItem('carenav_users', JSON.stringify(users));

            showAlert(`Account successfully created! Welcome, ${name}.`, true);
            setTimeout(() => {
                loginUser(newUser, true);
            }, 600);
        });
    }

    // Demo Buttons
    const demoPatientBtn = document.getElementById('demoPatientBtn');
    const demoDoctorBtn = document.getElementById('demoDoctorBtn');

    if (demoPatientBtn) {
        demoPatientBtn.addEventListener('click', async () => {
            if (CareNavAPI.isOnline) {
                showAlert("Signing in as Demo Patient (Alex Morgan) via SQLite API...", true);
                const res = await CareNavAPI.login("alex.morgan@healthmail.com", "password123", "patient");
                if (res && res.success) {
                    setTimeout(() => { loginUser(res.user, true); }, 400);
                    return;
                }
            }
            const users = JSON.parse(localStorage.getItem('carenav_users') || '[]');
            const alex = users.find(u => u.email === "alex.morgan@healthmail.com") || users[0];
            if (alex) {
                showAlert("Signing in as Demo Patient: Alex Morgan...", true);
                setTimeout(() => { loginUser(alex, true); }, 400);
            }
        });
    }

    if (demoDoctorBtn) {
        demoDoctorBtn.addEventListener('click', async () => {
            if (CareNavAPI.isOnline) {
                showAlert("Signing in as Demo Doctor (Dr. Evelyn Reed) via SQLite API...", true);
                const res = await CareNavAPI.login("dr.reed@stjude.org", "doctor123", "doctor");
                if (res && res.success) {
                    setTimeout(() => { loginUser(res.user, true); }, 400);
                    return;
                }
            }
            const users = JSON.parse(localStorage.getItem('carenav_users') || '[]');
            const reed = users.find(u => u.email === "dr.reed@stjude.org") || users[1];
            if (reed) {
                showAlert("Signing in as Demo Doctor: Dr. Evelyn Reed...", true);
                setTimeout(() => { loginUser(reed, true); }, 400);
            }
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const current = JSON.parse(localStorage.getItem('carenav_current_user') || '{}');
            if (confirm(`Are you sure you want to sign out, ${current.name || 'User'}?`)) {
                localStorage.removeItem('carenav_current_user');
                showScreen('auth');
            }
        });
    }
}

// ================= TAB NAVIGATION =================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(i => i.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            item.classList.add('active');
            const activePane = document.getElementById(`tab-${targetTab}`);
            if (activePane) activePane.classList.add('active');

            // Trigger tab-specific renders for doctor station
            if (targetTab === 'doc-dashboard' && typeof renderDoctorStation === 'function') renderDoctorStation();
            else if (targetTab === 'doc-patients' && typeof renderDoctorPatients === 'function') renderDoctorPatients();
            else if (targetTab === 'doc-schedule' && typeof renderDoctorSchedule === 'function') renderDoctorSchedule();
            else if (targetTab === 'doc-prescriptions' && typeof renderDoctorPrescriptions === 'function') renderDoctorPrescriptions();
        });
    });
}

// ================= MODULE 1: AI CARE TRIAGE & NAVIGATION =================
function initTriageModule() {
    const runBtn = document.getElementById('runTriageBtn');
    const symptomInput = document.getElementById('symptomInput');
    const durationSelect = document.getElementById('durationSelect');
    const severityRange = document.getElementById('severityRange');
    const severityVal = document.getElementById('severityVal');
    const quickPills = document.querySelectorAll('.badge-pill');

    severityRange.addEventListener('input', (e) => {
        severityVal.textContent = e.target.value;
    });

    quickPills.forEach(pill => {
        pill.addEventListener('click', () => {
            symptomInput.value = pill.getAttribute('data-symptom');
            severityRange.value = pill.getAttribute('data-sev');
            severityVal.textContent = pill.getAttribute('data-sev');
            assessSymptoms();
        });
    });

    runBtn.addEventListener('click', assessSymptoms);

    document.getElementById('bookSpecialistBtn').addEventListener('click', () => {
        const specName = document.getElementById('recommendedSpecialist').textContent.trim();
        // Switch to doctors tab and filter
        document.querySelector('.nav-item[data-tab="doctors"]').click();
        const filterEl = document.getElementById('specialtyFilter');
        if (specName.includes('Cardio')) filterEl.value = 'Cardiologist';
        else if (specName.includes('Gastro')) filterEl.value = 'Gastroenterologist';
        else if (specName.includes('Pulmon')) filterEl.value = 'Pulmonologist';
        else if (specName.includes('Derma')) filterEl.value = 'Dermatologist';
        else if (specName.includes('Neuro')) filterEl.value = 'Neurologist';
        else if (specName.includes('Ortho')) filterEl.value = 'Orthopedic';
        else filterEl.value = 'General Physician';
        renderDoctors();
    });
}

function assessSymptoms() {
    const text = document.getElementById('symptomInput').value.trim();
    const severity = parseInt(document.getElementById('severityRange').value);
    const duration = document.getElementById('durationSelect').value;

    if (!text) {
        showToast('Please describe your clinical symptoms first.', 'warning');
        return;
    }

    const lower = text.toLowerCase();
    const emptyState = document.getElementById('triageEmptyState');
    const outputArea = document.getElementById('triageOutput');

    // Assessment Rule Engine
    let urgency = "routine";
    let urgencyTitle = "Routine Primary Care (Code Green)";
    let urgencyAdvice = "Schedule an appointment with your primary care provider within 3-5 days.";
    let specialist = "General Physician / Internist";
    let differential = [];
    let selfCare = "";
    let doctorQuestions = [];

    // Red Flag Emergencies (Code Red)
    const isChestPain = lower.includes('chest pain') || lower.includes('crushing') || (lower.includes('heart') && lower.includes('pain')) || lower.includes('radiating to left arm');
    const isSevereBreathing = (lower.includes('shortness of breath') || lower.includes('breath')) && severity >= 8;
    const isStrokeSign = lower.includes('slurred') || lower.includes('facial droop') || lower.includes('sudden numbness') || lower.includes('thunderclap');

    if (isChestPain || isStrokeSign || (isSevereBreathing && severity >= 8) || severity === 10) {
        urgency = "emergency";
        urgencyTitle = "🚨 Immediate Emergency (Code Red)";
        urgencyAdvice = "Potential life-threatening condition. Call 911 or go to the nearest Emergency Department immediately. Do NOT drive yourself.";
        specialist = isChestPain ? "Emergency Physician & Interventional Cardiologist" : "Emergency Physician & Stroke Neurologist";
        differential = [
            "Acute Coronary Syndrome / Myocardial Infarction",
            "Pulmonary Embolism or Aortic Dissection",
            "Acute Ischemic Neurological Event (if neurological signs present)"
        ];
        selfCare = "Rest quietly in a seated position. Avoid exertion. Loosen tight clothing. If directed by 911 dispatch and not allergic, chew one adult aspirin (325mg). Have your Emergency Card ready for paramedics.";
        doctorQuestions = [
            "What do my EKG and cardiac troponin biomarker tests indicate?",
            "Do I require urgent coronary angiography or stabilization?",
            "Are there medication interactions with my asthma inhaler or metformin?"
        ];
    }
    // Urgent Care (Code Yellow)
    else if (lower.includes('appendix') || lower.includes('lower right abdomen') || (lower.includes('abdomen') && severity >= 7) || (lower.includes('fever') && severity >= 7)) {
        urgency = "urgent";
        urgencyTitle = "⚠️ Urgent Medical Evaluation Needed (Code Yellow)";
        urgencyAdvice = "Assessment needed within 6 to 12 hours at an Urgent Care center or acute ambulatory clinic.";
        specialist = "Gastroenterologist / Acute General Surgeon";
        differential = [
            "Acute Appendicitis",
            "Acute Gastroenteritis with inflammatory reaction",
            "Biliary colic or mesenteric adenitis"
        ];
        selfCare = "Do NOT eat solid foods or drink large quantities of fluids in case imaging or surgical consultation is required. Do NOT take strong pain medications or laxatives, as they can mask diagnostic tenderness.";
        doctorQuestions = [
            "Is an abdominal ultrasound or contrast CT scan indicated today?",
            "Could this be an atypical presentation of appendicitis or bowel inflammation?",
            "What signs should prompt me to transition directly to the emergency room?"
        ];
    }
    // Pulmonology / Respiratory
    else if (lower.includes('cough') || lower.includes('throat') || lower.includes('wheezing') || lower.includes('lungs')) {
        urgency = severity >= 7 ? "urgent" : "routine";
        urgencyTitle = urgency === "urgent" ? "Urgent Respiratory Care" : "Primary Care Evaluation (Code Green)";
        urgencyAdvice = "Consult a physician within 24-48 hours. Monitor oxygen levels with a pulse oximeter.";
        specialist = "Pulmonologist / General Physician";
        differential = [
            "Upper Respiratory Tract Viral Infection",
            "Acute Bronchitis or Asthma Exacerbation",
            "Community-Acquired Pneumonia"
        ];
        selfCare = "Stay well hydrated with warm liquids. Use prescribed Albuterol inhaler if wheezing or tight chest develops as per asthma action plan. Rest voice and sleep with head elevated.";
        doctorQuestions = [
            "Is my mild asthma complicating this respiratory episode?",
            "Do you hear focal crackles or rales indicating a bacterial pneumonia?",
            "Would a short course of oral bronchodilator or inhaled steroid be appropriate?"
        ];
    }
    // Dermatology
    else if (lower.includes('rash') || lower.includes('itch') || lower.includes('skin') || lower.includes('redness')) {
        urgency = "routine";
        urgencyTitle = "Non-Urgent Dermatologic Care (Code Green)";
        urgencyAdvice = "Book an outpatient appointment. Seek immediate care if accompanied by facial swelling or difficulty breathing.";
        specialist = "Dermatologist / Allergy Specialist";
        differential = [
            "Acute Contact Dermatitis (Poison ivy or irritant)",
            "Allergic Urticaria (Hives)",
            "Atopic or Eczematous Flare"
        ];
        selfCare = "Wash area gently with cool water and mild non-fragranced soap. Apply a cool compress or topical over-the-counter hydrocortisone 1% cream. Avoid scratching to prevent secondary bacterial infection.";
        doctorQuestions = [
            "Could this be linked to my known penicillin or peanut allergies?",
            "Is this consistent with contact dermatitis or a systemic allergic manifestation?",
            "Do I need a prescription-strength topical corticosteroid or oral antihistamine?"
        ];
    }
    // Neurology / Headache
    else if (lower.includes('headache') || lower.includes('migraine') || lower.includes('throbbing') || lower.includes('light sensitivity')) {
        urgency = severity >= 8 ? "urgent" : "routine";
        urgencyTitle = urgency === "urgent" ? "Urgent Neurological Review" : "Primary Care / Outpatient Care (Code Green)";
        urgencyAdvice = "Rest in a quiet, dark environment. Schedule evaluation if symptoms are refractory.";
        specialist = "Neurologist / Primary Care Physician";
        differential = [
            "Migraine without Aura",
            "Tension-Type Headache with peripheral myofascial spasm",
            "Cervicogenic or Sinus Headache"
        ];
        selfCare = "Retire to a quiet, dimly lit room. Apply cold gel pack across forehead or nape of neck. Maintain hydration. Avoid screen time and bright LED lights.";
        doctorQuestions = [
            "Does my presentation fit classic migraine or cluster criteria?",
            "Would a triptan medication or preventative therapy be suitable for me?",
            "Are there any 'red flags' (such as new visual aura) I should monitor?"
        ];
    }
    // Orthopedic
    else if (lower.includes('back') || lower.includes('joint') || lower.includes('knee') || lower.includes('sprain') || lower.includes('lifting')) {
        urgency = "routine";
        urgencyTitle = "Musculoskeletal Care (Code Green)";
        urgencyAdvice = "Routine outpatient consultation with orthopedic specialist or physical therapist.";
        specialist = "Orthopedic Specialist / Physical Therapist";
        differential = [
            "Acute Lumbar Muscular Strain / Ligamentous Sprain",
            "Early Lumbar Disc Degeneration / Bulge",
            "Facet Joint Irritation"
        ];
        selfCare = "Apply ice packs for 15-20 minutes every 2 hours during the first 48 hours. Avoid heavy lifting and twisting motions. Gentle walking helps maintain spinal mobility.";
        doctorQuestions = [
            "Do I need plain film X-rays or an MRI to rule out disc herniation?",
            "What physical therapy exercises can strengthen my core to protect my lower back?",
            "Should I use heat or cold therapy at this stage?"
        ];
    }
    // General Default
    else {
        urgency = severity >= 7 ? "urgent" : "routine";
        urgencyTitle = urgency === "urgent" ? "Urgent Care Evaluation" : "Primary Care Evaluation (Code Green)";
        urgencyAdvice = "Schedule an appointment with an outpatient primary care physician.";
        specialist = "General Physician / Internist";
        differential = [
            "Systemic or Functional Symptom Pattern",
            "Viral or Metabolic etiology",
            "Stress-induced somatic response"
        ];
        selfCare = "Ensure adequate hydration, balanced nutrition, and quality sleep. Keep a daily log of symptom occurrence and intensity.";
        doctorQuestions = [
            "What diagnostic blood work or screening tests do you recommend?",
            "Could my pre-diabetes or asthma be playing a role in these symptoms?",
            "What follow-up timeline do you recommend if symptoms persist?"
        ];
    }

    // Render Output
    const banner = document.getElementById('urgencyBanner');
    banner.className = `urgency-banner ${urgency}`;

    const icon = document.getElementById('urgencyIcon');
    icon.innerHTML = urgency === 'emergency' ? '<i class="fa-solid fa-triangle-exclamation"></i>' :
                     urgency === 'urgent' ? '<i class="fa-solid fa-circle-exclamation"></i>' :
                     '<i class="fa-solid fa-circle-check"></i>';

    document.getElementById('urgencyLevel').textContent = urgencyTitle;
    document.getElementById('urgencyAdvice').textContent = urgencyAdvice;
    document.getElementById('recommendedSpecialist').textContent = specialist;

    // Conditions
    const condList = document.getElementById('potentialConditionsList');
    condList.innerHTML = differential.map(c => `<li><strong>${c}</strong></li>`).join('');

    // Self-care
    document.getElementById('selfCareAdvice').textContent = selfCare;

    // Questions
    const qList = document.getElementById('questionsToDoctorList');
    qList.innerHTML = doctorQuestions.map(q => `<li>${q}</li>`).join('');

    emptyState.style.display = 'none';
    outputArea.style.display = 'block';
}

// ================= MODULE 2: HEALTH RECORDS (EHR) =================
function renderVitals() {
    const tableBody = document.getElementById('vitalsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = HealthDB.vitals.map(v => `
        <tr>
            <td><strong>${v.date}</strong></td>
            <td>${v.bp}</td>
            <td>${v.hr} bpm</td>
            <td>${v.glucose} mg/dL</td>
            <td>${v.spo2}%</td>
            <td><span class="status-pill status-${v.status.toLowerCase()}">${v.status}</span></td>
        </tr>
    `).join('');

    // Update Mini Widget
    if (HealthDB.vitals.length > 0) {
        const latest = HealthDB.vitals[0];
        document.getElementById('miniBp').textContent = `${latest.bp} mmHg`;
        document.getElementById('miniHr').textContent = `${latest.hr} bpm`;
        document.getElementById('miniGl').textContent = `${latest.glucose} mg/dL`;
        document.getElementById('miniSpo2').textContent = `${latest.spo2}%`;
    }
}

function renderMedications() {
    const list = document.getElementById('medicationsList');
    if (!list) return;

    list.innerHTML = HealthDB.medications.map(m => `
        <div class="med-item">
            <div>
                <div class="med-name">${m.name}</div>
                <div class="med-sub"><i class="fa-solid fa-circle-info"></i> ${m.purpose}</div>
            </div>
            <span class="med-frequency">${m.frequency}</span>
        </div>
    `).join('');
}

// ================= MODULE 3: AI REPORT EXPLAINER =================
function initExplainerModule() {
    const explainBtn = document.getElementById('explainReportBtn');
    const reportTextInput = document.getElementById('reportTextInput');
    const presets = document.querySelectorAll('.report-preset-btn');

    const sampleReports = {
        lipid: `Comprehensive Lipid Panel:
- Total Cholesterol: 242 mg/dL (Desirable: <200)
- HDL Cholesterol: 38 mg/dL (Desirable: >40)
- LDL Cholesterol: 165 mg/dL (Optimal: <100)
- Triglycerides: 195 mg/dL (Normal: <150)
- Total/HDL Ratio: 6.37 (Normal: <5.0)`,

        cbc: `Complete Blood Count (CBC) with Differential:
- White Blood Cell (WBC): 13.8 x10^3/uL (Reference: 4.5 - 11.0)
- Red Blood Cell (RBC): 4.6 x10^6/uL (Reference: 4.3 - 5.9)
- Hemoglobin: 11.4 g/dL (Reference: 13.5 - 17.5)
- Hematocrit: 35.2 % (Reference: 41.0 - 50.0)
- Platelets: 235 x10^3/uL (Reference: 150 - 450)
- Neutrophils: 78 % (Reference: 40 - 70)`,

        diabetic: `Diabetic Assessment & Metabolic Panel:
- Hemoglobin A1c (HbA1c): 6.9 % (Normal: <5.7, Pre-diabetes: 5.7-6.4, Diabetes: >=6.5)
- Fasting Plasma Glucose: 134 mg/dL (Normal: 70 - 99, Impaired: 100 - 125)
- Estimated Average Glucose (eAG): 151 mg/dL`,

        thyroid: `Thyroid Function Assessment:
- Thyroid Stimulating Hormone (TSH): 5.85 uIU/mL (Reference: 0.40 - 4.50)
- Free Thyroxine (Free T4): 0.92 ng/dL (Reference: 0.82 - 1.77)
- Total T3: 110 ng/dL (Reference: 71 - 180)`
    };

    presets.forEach(p => {
        p.addEventListener('click', () => {
            const key = p.getAttribute('data-preset');
            reportTextInput.value = sampleReports[key];
            analyzeReport();
        });
    });

    explainBtn.addEventListener('click', analyzeReport);
}

function analyzeReport() {
    const text = document.getElementById('reportTextInput').value.trim();
    if (!text) {
        showToast('Please select a preset or paste your lab report text.', 'warning');
        return;
    }

    const empty = document.getElementById('explainerEmptyState');
    const output = document.getElementById('explainerOutput');
    const container = document.getElementById('labItemsContainer');
    const stepsList = document.getElementById('lifestyleStepsList');
    const lower = text.toLowerCase();

    let title = "Clinical Laboratory Analysis";
    let risk = "Review Recommended";
    let overview = "Here is a patient-friendly breakdown of your test results, explaining what each biomarker represents in everyday language.";
    let items = [];
    let steps = [];

    // Lipid Profile Detection
    if (lower.includes('cholesterol') || lower.includes('ldl') || lower.includes('lipid')) {
        title = "Comprehensive Lipid Panel Translation";
        risk = "Moderate Cardiovascular Risk (Elevation Detected)";
        overview = "Your blood test indicates elevated LDL ('bad' cholesterol) and higher triglycerides, with slightly low protective HDL ('good' cholesterol). This pattern increases the buildup of fatty plaques inside blood vessels over time.";
        items = [
            {
                name: "Total Cholesterol (242 mg/dL)",
                status: "High (Optimal is below 200)",
                desc: "Total measure of all cholesterol types circulating in your blood. At 242 mg/dL, it sits in the 'High Risk' bracket."
            },
            {
                name: "LDL Cholesterol (165 mg/dL)",
                status: "High (Optimal is below 100)",
                desc: "Known as 'bad cholesterol'. High levels can deposit along artery walls. Reducing dietary saturated fats and increasing soluble fiber helps lower LDL."
            },
            {
                name: "HDL Cholesterol (38 mg/dL)",
                status: "Below Desirable (Ideal is 40-60+)",
                desc: "Known as 'good cholesterol'. Acts as a vacuum cleaner carrying excess cholesterol back to the liver. Aerobic exercise raises HDL."
            },
            {
                name: "Triglycerides (195 mg/dL)",
                status: "Borderline High (Normal < 150)",
                desc: "A type of fat from unburned calories, refined carbohydrates, and sugary beverages. Reducing simple sugars helps normalize this."
            }
        ];
        steps = [
            "Adopt Mediterranean-style nutrition: emphasize extra virgin olive oil, walnuts, oats, legumes, and omega-3 rich fish (salmon, sardines).",
            "Engage in 150 minutes of moderate cardiovascular exercise weekly (e.g. 30 minutes brisk walking 5 days/week).",
            "Discuss with Dr. Evelyn Reed whether lipid-lowering pharmacotherapy (e.g. low-dose Statin) is warranted based on your 10-year ASCVD risk."
        ];
    }
    // CBC Detection
    else if (lower.includes('wbc') || lower.includes('hemoglobin') || lower.includes('cbc')) {
        title = "Complete Blood Count (CBC) Translation";
        risk = "Inflammatory / Mild Anemia Pattern";
        overview = "Your blood counts show an elevated White Blood Cell count (indicating active immune fight against infection/inflammation) and slightly reduced Hemoglobin indicating mild anemia.";
        items = [
            {
                name: "White Blood Cells - WBC (13.8 x10^3/uL)",
                status: "Elevated (Normal: 4.5 - 11.0)",
                desc: "Your body's immune soldier cells. Elevated levels typically mean the body is currently fighting a viral or bacterial infection or acute inflammation."
            },
            {
                name: "Hemoglobin (11.4 g/dL)",
                status: "Mildly Low (Normal for adult males: 13.5 - 17.5)",
                desc: "The iron-rich protein inside red blood cells responsible for transporting oxygen throughout your body. Low levels can cause feelings of fatigue or sluggishness."
            },
            {
                name: "Platelets (235 x10^3/uL)",
                status: "Optimal / Normal",
                desc: "Cells vital for standard blood clotting and wound healing. Your count is within the healthy safe zone."
            }
        ];
        steps = [
            "Maintain high fluid intake and adequate rest while your immune system resolves the elevated WBC trigger.",
            "Ask your doctor to check Ferritin and Serum Iron levels to evaluate if iron-deficiency is causing the borderline low hemoglobin.",
            "Increase intake of iron-rich greens (spinach, kale), lentils, and lean proteins accompanied by vitamin C (lemon/oranges) to maximize absorption."
        ];
    }
    // Diabetic Detection
    else if (lower.includes('hba1c') || lower.includes('glucose')) {
        title = "Diabetic & Glycemic Control Analysis";
        risk = "Early Type 2 Diabetes / Pre-diabetes Range";
        overview = "An HbA1c of 6.9% reflects your average blood sugar levels over the past 90 days. Because glucose chemically binds to red blood cells, this test is the gold-standard diagnostic marker.";
        items = [
            {
                name: "HbA1c (6.9%)",
                status: "Elevated (Normal <5.7%, Diabetes >=6.5%)",
                desc: "Indicates that average blood sugars have been running around 151 mg/dL over recent months. Tight control prevents microvascular and nerve complications."
            },
            {
                name: "Fasting Blood Glucose (134 mg/dL)",
                status: "Above Fasting Target (Normal 70-99 mg/dL)",
                desc: "Your morning glucose after 8 hours of sleep without food. Indicates liver output of glucose is slightly elevated."
            }
        ];
        steps = [
            "Continue taking prescribed Metformin as directed; verify dosage with Dr. Reed at your next checkup.",
            "Focus on low-glycemic foods: prioritize leafy vegetables, whole grains, and protein while avoiding refined flour and sweetened sodas.",
            "Schedule an annual diabetic retinal eye exam and microalbuminuria urine test to ensure kidney and eye health protection."
        ];
    }
    // Default
    else {
        title = "Medical Document Analysis";
        risk = "Informational Summary";
        overview = "The AI evaluated your submitted clinical observations and parsed relevant physiological parameters.";
        items = [
            {
                name: "Submitted Clinical Text",
                status: "Parsed Successfully",
                desc: "The values and clinical terms were reviewed against reference databases. Please review these observations with your care provider."
            }
        ];
        steps = [
            "Bring this printout or digital record to your next scheduled consultation.",
            "Maintain regular vital sign tracking (Blood Pressure, Heart Rate) in your CareNav Health Record."
        ];
    }

    // Render Explainer
    document.getElementById('reportTitle').textContent = title;
    document.getElementById('reportRiskBadge').textContent = risk;
    document.getElementById('reportOverviewText').textContent = overview;

    container.innerHTML = items.map(item => `
        <div class="lab-item-card">
            <div class="lab-item-head">
                <span class="lab-item-name">${item.name}</span>
                <span class="lab-item-val" style="color: var(--primary-dark);">${item.status}</span>
            </div>
            <div class="lab-item-desc">${item.desc}</div>
        </div>
    `).join('');

    stepsList.innerHTML = steps.map(s => `<li>${s}</li>`).join('');

    empty.style.display = 'none';
    output.style.display = 'block';
}

// ================= MODULE 4: DOCTORS & APPOINTMENT BOOKING =================
function renderDoctors() {
    const grid = document.getElementById('doctorsGrid');
    const filter = document.getElementById('specialtyFilter').value;
    if (!grid) return;

    const filtered = filter === 'all' 
        ? HealthDB.doctors 
        : HealthDB.doctors.filter(d => d.specialty.toLowerCase().includes(filter.toLowerCase()));

    grid.innerHTML = filtered.map(doc => `
        <div class="doctor-card">
            <div class="doc-header">
                <div class="doc-avatar">
                    <i class="fa-solid ${doc.icon}"></i>
                </div>
                <div>
                    <div class="doc-name">${doc.name}</div>
                    <div class="doc-spec">${doc.specialty}</div>
                    <div class="doc-exp">${doc.experience}</div>
                </div>
            </div>
            <div class="doc-meta">
                <span><i class="fa-solid fa-hospital"></i> ${doc.hospital}</span>
                <span><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${doc.rating}</span>
                <span><i class="fa-solid fa-clock"></i> Next Available: ${doc.availability}</span>
            </div>
            <div class="doc-actions">
                <button class="btn btn-primary btn-block btn-book-doc" data-id="${doc.id}">
                    <i class="fa-solid fa-calendar-plus"></i> Book Consultation
                </button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.btn-book-doc').forEach(btn => {
        btn.addEventListener('click', () => {
            const docId = btn.getAttribute('data-id');
            openBookingModal(docId);
        });
    });
}

let activeBookingDoctor = null;
function openBookingModal(docId) {
    const doc = HealthDB.doctors.find(d => d.id === docId);
    if (!doc) return;
    activeBookingDoctor = doc;

    const info = document.getElementById('selectedDocInfo');
    info.innerHTML = `
        <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--border-color);">
            <strong style="font-size: 1rem; color: var(--primary-dark);">${doc.name}</strong>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${doc.specialty} &bull; ${doc.hospital}</div>
        </div>
    `;

    // Set tomorrow's date as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('apptDate').value = tomorrow.toISOString().split('T')[0];

    document.getElementById('bookingModal').classList.add('open');
}

// ================= MODULE 5: AI HEALTH COMPANION CHAT =================
function initChatModule() {
    const sendBtn = document.getElementById('sendChatBtn');
    const input = document.getElementById('chatInput');
    const pills = document.querySelectorAll('.pill-chat');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            input.value = pill.getAttribute('data-q');
            handleSendMessage();
        });
    });

    sendBtn.addEventListener('click', handleSendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    });
}

async function handleSendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    appendChatMessage('user', text);

    // Typing placeholder
    const typingId = appendChatMessage('bot', 'CareNav AI is thinking...');

    try {
        if (HealthDB.geminiApiKey) {
            // Live Gemini LLM Query
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${HealthDB.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are CareNav AI, an intelligent, empathetic medical record assistant and clinical care navigator for patient Alex Morgan (Age 34, Pre-diabetes, Asthma, Penicillin allergy). Answer the user's healthcare query clearly and concisely with empathetic clinical best practices. Provide disclaimers when relevant.\n\nUser Question: ${text}`
                        }]
                    }]
                })
            });

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I could not generate an answer right now.";
            updateChatMessage(typingId, reply);
        } else {
            // Built-in Medical Logic Q&A
            setTimeout(() => {
                const answer = getSmartChatResponse(text);
                updateChatMessage(typingId, answer);
            }, 600);
        }
    } catch (e) {
        updateChatMessage(typingId, getSmartChatResponse(text));
    }
}

function getSmartChatResponse(q) {
    const lower = q.toLowerCase();

    if (lower.includes('fast') || lower.includes('lipid') || lower.includes('eating')) {
        return "Yes, for a Comprehensive Lipid Panel, standard clinical guidance requires 9 to 12 hours of fasting prior to blood draw. You can drink plain water, but avoid all food, coffee, juice, and alcohol, as recent fat and sugar intake artificially elevates triglyceride readings.";
    } else if (lower.includes('metformin') || lower.includes('side effect')) {
        return "Common initial side effects of Metformin include mild digestive symptoms such as nausea, stomach upset, or loose stools. Taking your tablet with meals significantly reduces these side effects. If you experience persistent vomiting or muscle pain, alert Dr. Reed promptly.";
    } else if (lower.includes('blood pressure') || lower.includes('lower')) {
        return "Clinically proven steps to lower blood pressure include: 1) The DASH diet (reducing sodium intake below 2,000 mg/day, increasing potassium via bananas and avocados), 2) 30 minutes of aerobic exercise daily, 3) Practicing deep diaphragmatic breathing to lower sympathetic nerve tone, and 4) Limiting caffeine and alcohol.";
    } else if (lower.includes('missed') || lower.includes('dose')) {
        return "General clinical rule: If you miss a dose, take it as soon as you remember. However, if it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. NEVER double up or take two doses at once to make up for a missed pill.";
    } else if (lower.includes('penicillin') || lower.includes('allergy')) {
        return "Your records highlight a documented Penicillin allergy. If prescribed antibiotics, always inform the physician and pharmacist so they avoid beta-lactams and select safe alternatives (such as Macrolides or Fluoroquinolones depending on the infection).";
    } else {
        return "Thank you for asking! For your safety, remember that CareNav AI provides medical guidance and health navigation. If you are experiencing concerning symptoms, please use our AI Care Triage tab or schedule an appointment with one of our verified physicians.";
    }
}

function appendChatMessage(sender, text) {
    const container = document.getElementById('chatMessages');
    const msgId = 'msg-' + Date.now();
    const isBot = sender === 'bot';

    const div = document.createElement('div');
    div.className = `chat-bubble ${sender}`;
    div.id = msgId;
    div.innerHTML = `
        <div class="chat-avatar"><i class="fa-solid ${isBot ? 'fa-robot' : 'fa-user'}"></i></div>
        <div class="chat-text">${text.replace(/\n/g, '<br>')}</div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return msgId;
}

function updateChatMessage(id, text) {
    const el = document.getElementById(id);
    if (el) {
        const textEl = el.querySelector('.chat-text');
        if (textEl) textEl.innerHTML = text.replace(/\n/g, '<br>');
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    }
}

// ================= MODULE 6: MODALS & FORMS =================
function initModals() {
    // Emergency Modal
    const emergencyBtn = document.getElementById('emergencyCardBtn');
    const emergencyModal = document.getElementById('emergencyModal');
    const closeEmBtn = document.getElementById('closeEmergencyModal');

    emergencyBtn.addEventListener('click', () => emergencyModal.classList.add('open'));
    closeEmBtn.addEventListener('click', () => emergencyModal.classList.remove('open'));

    // Add Vital Modal
    const addVitalModal = document.getElementById('addVitalModal');
    const openVitalBtn = document.getElementById('openAddVitalModal');
    const closeVitalBtn = document.getElementById('closeAddVitalModal');
    const vitalForm = document.getElementById('addVitalForm');

    openVitalBtn.addEventListener('click', () => addVitalModal.classList.add('open'));
    closeVitalBtn.addEventListener('click', () => addVitalModal.classList.remove('open'));

    vitalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sys = parseInt(document.getElementById('bpSystolic').value);
        const dia = parseInt(document.getElementById('bpDiastolic').value);
        const hr = parseInt(document.getElementById('heartRateInput').value);
        const gl = parseInt(document.getElementById('glucoseInput').value);
        const spo2 = parseInt(document.getElementById('spo2Input').value);

        let status = "Normal";
        if (sys >= 140 || dia >= 90 || gl >= 140 || spo2 < 95) status = "High";
        else if (sys >= 125 || dia >= 84 || gl >= 105) status = "Elevated";

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        HealthDB.vitals.unshift({
            date: dateStr,
            bp: `${sys}/${dia}`,
            hr: hr,
            glucose: gl,
            spo2: spo2,
            status: status
        });

        if (CareNavAPI.isOnline && activeUser) {
            CareNavAPI.addVital({
                patientId: activeUser.id,
                sys, dia, hr, glucose: gl, spo2, date: dateStr
            }).then(res => {
                if (res && res.success) console.log('Vital recorded in SQLite:', res.vital);
            });
        }

        if (CareNavSupabase.isReady && activeUser) {
            CareNavSupabase.syncVital({
                patientId: activeUser.id,
                sys, dia, hr, glucose: gl, spo2
            });
        }

        localStorage.setItem('carenav_vitals', JSON.stringify(HealthDB.vitals));
        renderVitals();
        addVitalModal.classList.remove('open');
        vitalForm.reset();
        showToast('New vital signs recorded and synchronized to health record!', 'success');
    });

    // Add Med Modal
    const addMedModal = document.getElementById('addMedModal');
    const openMedBtn = document.getElementById('openAddMedModal');
    const closeMedBtn = document.getElementById('closeAddMedModal');
    const medForm = document.getElementById('addMedForm');

    openMedBtn.addEventListener('click', () => addMedModal.classList.add('open'));
    closeMedBtn.addEventListener('click', () => addMedModal.classList.remove('open'));

    medForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('medName').value.trim();
        const freq = document.getElementById('medFrequency').value;
        const purpose = document.getElementById('medPurpose').value.trim();

        const medObj = {
            id: 'm-' + Date.now(),
            name: name,
            frequency: freq,
            purpose: purpose
        };

        HealthDB.medications.push(medObj);

        if (CareNavAPI.isOnline && activeUser) {
            CareNavAPI.addMedication({
                patientId: activeUser.id,
                name: name,
                frequency: freq,
                purpose: purpose
            }).then(res => {
                if (res && res.success) console.log('Medication recorded in SQLite:', res.medication);
            });
        }

        if (CareNavSupabase.isReady && activeUser) {
            CareNavSupabase.syncMedication({ id: medObj.id, patientId: activeUser.id, name, frequency: freq, purpose });
        }

        localStorage.setItem('carenav_meds', JSON.stringify(HealthDB.medications));
        renderMedications();
        addMedModal.classList.remove('open');
        medForm.reset();
        showToast(`Medication "${name}" added to active regimen!`, 'success');
    });

    // Booking Appointment Modal
    const bookingModal = document.getElementById('bookingModal');
    const closeBookingBtn = document.getElementById('closeBookingModal');
    const apptForm = document.getElementById('appointmentForm');

    closeBookingBtn.addEventListener('click', () => bookingModal.classList.remove('open'));
    apptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('apptDate').value;
        const slot = document.getElementById('apptSlot').value;
        const notes = document.getElementById('apptNotes').value;

        const record = {
            id: 'apt-' + Date.now(),
            doctor: activeBookingDoctor ? activeBookingDoctor.name : "Physician",
            specialty: activeBookingDoctor ? activeBookingDoctor.specialty : "Clinic",
            date: date,
            slot: slot,
            notes: notes || "General Consultation"
        };

        HealthDB.appointments.push(record);

        if (CareNavAPI.isOnline && activeUser) {
            CareNavAPI.bookAppointment({
                patientId: activeUser.id,
                doctorId: activeBookingDoctor ? activeBookingDoctor.id : null,
                doctorName: record.doctor,
                specialty: record.specialty,
                date: record.date,
                slot: record.slot,
                notes: record.notes
            }).then(res => {
                if (res && res.success) console.log('Appointment booked in SQLite:', res.appointment);
            });
        }

        if (CareNavSupabase.isReady && activeUser) {
            CareNavSupabase.syncAppointment({ id: record.id, patientId: activeUser.id, doctorId: activeBookingDoctor ? activeBookingDoctor.id : 'DOC-1029', doctorName: record.doctor, specialty: record.specialty, date: record.date, slot: record.slot, notes: record.notes });
        }

        localStorage.setItem('carenav_appts', JSON.stringify(HealthDB.appointments));
        bookingModal.classList.remove('open');
        showToast(`Appointment confirmed with ${record.doctor} on ${record.date} at ${record.slot}!`, 'success');
    });

    // Settings Modal & Supabase Cloud Database Configuration
    const settingsModal = document.getElementById('settingsModal');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsModal');
    const geminiInput = document.getElementById('geminiKey');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const removeKeyBtn = document.getElementById('removeKeyBtn');

    // Supabase Settings elements
    const supabaseUrlInput = document.getElementById('supabaseUrl');
    const supabaseKeyInput = document.getElementById('supabaseKey');
    const testSupabaseBtn = document.getElementById('testSupabaseBtn');
    const saveSupabaseBtn = document.getElementById('saveSupabaseBtn');
    const syncSupabaseNowBtn = document.getElementById('syncSupabaseNowBtn');
    const removeSupabaseBtn = document.getElementById('removeSupabaseBtn');
    const supabaseTestStatus = document.getElementById('supabaseTestStatus');
    const supabaseStatusBadge = document.getElementById('supabaseStatusBadge');
    const openSupabaseSettingsFromDbBtn = document.getElementById('openSupabaseSettingsFromDbBtn');

    function refreshSettingsModal() {
        UIVisibilityManager.syncCheckboxes();
        if (geminiInput) geminiInput.value = HealthDB.geminiApiKey || '';
        if (supabaseUrlInput) supabaseUrlInput.value = localStorage.getItem('carenav_supabase_url') || 'https://xwexlavqmbrgthnljyeb.supabase.co';
        if (supabaseKeyInput) supabaseKeyInput.value = localStorage.getItem('carenav_supabase_key') || '';
        if (supabaseTestStatus) supabaseTestStatus.style.display = 'none';

        const isConfigured = Boolean(localStorage.getItem('carenav_supabase_url') && localStorage.getItem('carenav_supabase_key'));
        if (syncSupabaseNowBtn) syncSupabaseNowBtn.style.display = isConfigured ? 'inline-flex' : 'none';
        if (removeSupabaseBtn) removeSupabaseBtn.style.display = isConfigured ? 'inline-flex' : 'none';
    }

    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            refreshSettingsModal();
            settingsModal.classList.add('open');
        });
    }

    if (supabaseStatusBadge) {
        supabaseStatusBadge.addEventListener('click', () => {
            refreshSettingsModal();
            settingsModal.classList.add('open');
        });
    }

    if (openSupabaseSettingsFromDbBtn) {
        openSupabaseSettingsFromDbBtn.addEventListener('click', () => {
            const dbModal = document.getElementById('databaseModal');
            if (dbModal) dbModal.classList.remove('open');
            refreshSettingsModal();
            settingsModal.classList.add('open');
        });
    }

    const openDbFromSettingsBtn = document.getElementById('openDbFromSettingsBtn');
    if (openDbFromSettingsBtn) {
        openDbFromSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('open');
            if (typeof renderDatabaseTab === 'function') renderDatabaseTab('users');
            const dbModal = document.getElementById('databaseModal');
            if (dbModal) dbModal.classList.add('open');
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));
    }

    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const val = geminiInput.value.trim();
            HealthDB.geminiApiKey = val;
            localStorage.setItem('carenav_gemini_key', val);
            showToast('Gemini API Key saved securely.', 'success');
            settingsModal.classList.remove('open');
        });
    }

    if (removeKeyBtn) {
        removeKeyBtn.addEventListener('click', () => {
            HealthDB.geminiApiKey = '';
            localStorage.removeItem('carenav_gemini_key');
            geminiInput.value = '';
            showToast('Gemini API Key removed.', 'info');
        });
    }

    if (testSupabaseBtn) {
        testSupabaseBtn.addEventListener('click', async () => {
            const url = supabaseUrlInput ? supabaseUrlInput.value.trim() : '';
            const key = supabaseKeyInput ? supabaseKeyInput.value.trim() : '';

            if (!url || !key) {
                if (supabaseTestStatus) {
                    supabaseTestStatus.style.display = 'block';
                    supabaseTestStatus.style.background = 'rgba(239, 68, 68, 0.1)';
                    supabaseTestStatus.style.color = 'var(--danger)';
                    supabaseTestStatus.textContent = 'Please enter both the Supabase URL and Anon API Key.';
                }
                return;
            }

            testSupabaseBtn.disabled = true;
            testSupabaseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';
            if (supabaseTestStatus) {
                supabaseTestStatus.style.display = 'block';
                supabaseTestStatus.style.background = 'rgba(59, 130, 246, 0.1)';
                supabaseTestStatus.style.color = '#2563eb';
                supabaseTestStatus.textContent = 'Verifying connection to Supabase PostgreSQL cluster...';
            }

            const result = await CareNavSupabase.test(url, key);
            testSupabaseBtn.disabled = false;
            testSupabaseBtn.innerHTML = '<i class="fa-solid fa-plug"></i> Test Connection';

            if (supabaseTestStatus) {
                supabaseTestStatus.style.display = 'block';
                if (result.success) {
                    supabaseTestStatus.style.background = 'rgba(34, 197, 94, 0.1)';
                    supabaseTestStatus.style.color = '#16a34a';
                    supabaseTestStatus.textContent = '✅ ' + result.message;
                } else {
                    supabaseTestStatus.style.background = 'rgba(239, 68, 68, 0.1)';
                    supabaseTestStatus.style.color = 'var(--danger)';
                    supabaseTestStatus.textContent = '❌ Connection failed: ' + result.message;
                }
            }
        });
    }

    if (saveSupabaseBtn) {
        saveSupabaseBtn.addEventListener('click', async () => {
            const url = supabaseUrlInput ? supabaseUrlInput.value.trim() : '';
            const key = supabaseKeyInput ? supabaseKeyInput.value.trim() : '';

            if (!url || !key) {
                showToast('Please enter both Supabase URL and Anon API Key.', 'warning');
                return;
            }

            saveSupabaseBtn.disabled = true;
            saveSupabaseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';

            const testResult = await CareNavSupabase.test(url, key);
            saveSupabaseBtn.disabled = false;
            saveSupabaseBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save & Connect';

            localStorage.setItem('carenav_supabase_url', url);
            localStorage.setItem('carenav_supabase_key', key);
            CareNavSupabase.init();

            if (testResult.success) {
                showToast('Supabase PostgreSQL Cloud Database connected successfully!', 'success');
            } else {
                showToast('Credentials saved! Note: ' + testResult.message, 'warning');
            }

            refreshSettingsModal();
            settingsModal.classList.remove('open');
        });
    }

    if (removeSupabaseBtn) {
        removeSupabaseBtn.addEventListener('click', () => {
            localStorage.removeItem('carenav_supabase_url');
            localStorage.removeItem('carenav_supabase_key');
            CareNavSupabase.client = null;
            CareNavSupabase.isReady = false;
            CareNavSupabase.updateBadge(false);
            if (supabaseUrlInput) supabaseUrlInput.value = '';
            if (supabaseKeyInput) supabaseKeyInput.value = '';
            refreshSettingsModal();
            showToast('Supabase Cloud Database disconnected. Reverted to SQLite.', 'info');
        });
    }

    if (syncSupabaseNowBtn) {
        syncSupabaseNowBtn.addEventListener('click', async () => {
            syncSupabaseNowBtn.disabled = true;
            syncSupabaseNowBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
            try {
                const syncedCount = await CareNavSupabase.syncAllLocalData();
                showToast('Synchronized ' + syncedCount + ' records to Supabase PostgreSQL!', 'success');
            } catch (err) {
                showToast('Sync failed: ' + err.message, 'error');
            } finally {
                syncSupabaseNowBtn.disabled = false;
                syncSupabaseNowBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Sync Data Now';
            }
        });
    }

    // Database Modal & Live Inspector
    const databaseModal = document.getElementById('databaseModal');
    const openDbBtn = document.getElementById('openDatabaseBtn');
    const closeDbBtn = document.getElementById('closeDatabaseModal');
    const dbTabs = document.querySelectorAll('.db-tab-btn');
    const dbViewer = document.getElementById('dbViewerContent');
    const exportDbBtn = document.getElementById('exportDbJsonBtn');
    const resetDbBtn = document.getElementById('resetDemoDbBtn');

    const sqlSchemaText = `-- CareNav AI Relational Database (SQLite)
-- Schema file: healthcare-system/database/schema.sql

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin'))
);

CREATE TABLE patients (
    patient_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    age INT,
    gender VARCHAR(20),
    blood_group VARCHAR(20) NOT NULL,
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact VARCHAR(255),
    primary_physician VARCHAR(150)
);

CREATE TABLE vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
    systolic_bp INT NOT NULL,
    diastolic_bp INT NOT NULL,
    heart_rate INT NOT NULL,
    glucose_mg_dl INT NOT NULL,
    spo2_percent INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Normal'
);

CREATE TABLE appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Confirmed'
);`;

    const supabaseSqlSchemaText = `-- ==========================================================
-- CareNav AI Enterprise Supabase PostgreSQL Schema
-- Run in Supabase Dashboard > SQL Editor > New Query
-- File: healthcare-system/database/supabase_schema.sql
-- ==========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT 'password123',
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    patient_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age > 0),
    gender TEXT DEFAULT 'Not specified',
    blood_group TEXT NOT NULL DEFAULT 'O Positive (Rh+)',
    allergies TEXT DEFAULT 'None reported',
    chronic_conditions TEXT DEFAULT 'None recorded',
    emergency_contact TEXT,
    primary_physician TEXT DEFAULT 'Dr. Evelyn Reed (St. Jude Hospital)',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    doctor_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    hospital_affiliation TEXT DEFAULT 'St. Jude Memorial Hospital',
    experience_years INTEGER DEFAULT 10,
    rating NUMERIC(3, 2) DEFAULT 4.90,
    icon TEXT DEFAULT 'fa-user-doctor',
    availability TEXT DEFAULT 'Today & Tomorrow',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. VITALS TABLE
CREATE TABLE IF NOT EXISTS public.vitals (
    id BIGSERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
    systolic_bp INTEGER NOT NULL,
    diastolic_bp INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    glucose_mg_dl INTEGER NOT NULL,
    spo2_percent INTEGER NOT NULL,
    status TEXT DEFAULT 'Normal' CHECK (status IN ('Normal', 'Elevated', 'High', 'Critical')),
    recorded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. MEDICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.medications (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    frequency TEXT NOT NULL,
    purpose TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    prescribed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES public.doctors(doctor_id) ON DELETE SET NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 8. REALTIME REPLICATION PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;`;


    async function renderDatabaseTab(tab) {
        if (!dbViewer) return;
        if (CareNavAPI.isOnline) {
            dbViewer.textContent = `Querying live SQLite database (carenav.db) for [${tab}]...`;
            try {
                if (tab === 'users') {
                    const stats = await CareNavAPI.getStats();
                    const demoRes = await fetch(`${CareNavAPI.baseURL}/auth/demo-users`).then(r => r.json());
                    dbViewer.textContent = JSON.stringify({
                        storageEngine: 'SQLite Native (carenav.db)',
                        systemMetrics: stats ? stats.stats : {},
                        sampleAccounts: demoRes
                    }, null, 2);
                    return;
                } else if (tab === 'vitals') {
                    const vitals = await CareNavAPI.getVitals(activeUser ? activeUser.id : 'CN-88492');
                    dbViewer.textContent = JSON.stringify({
                        storageEngine: 'SQLite Native (carenav.db) - Table: vitals',
                        patientId: activeUser ? activeUser.id : 'CN-88492',
                        records: vitals
                    }, null, 2);
                    return;
                } else if (tab === 'medications') {
                    const meds = await CareNavAPI.getMedications(activeUser ? activeUser.id : 'CN-88492');
                    dbViewer.textContent = JSON.stringify({
                        storageEngine: 'SQLite Native (carenav.db) - Table: medications',
                        patientId: activeUser ? activeUser.id : 'CN-88492',
                        activePrescriptions: meds
                    }, null, 2);
                    return;
                } else if (tab === 'appointments') {
                    const appts = await CareNavAPI.getAppointments(activeUser ? activeUser.id : 'CN-88492');
                    dbViewer.textContent = JSON.stringify({
                        storageEngine: 'SQLite Native (carenav.db) - Table: appointments',
                        patientId: activeUser ? activeUser.id : 'CN-88492',
                        scheduledAppointments: appts
                    }, null, 2);
                    return;
                } else if (tab === 'schema') {
                    dbViewer.textContent = sqlSchemaText;
                    return;
                } else if (tab === 'supabase') {
                    const isConfig = Boolean(localStorage.getItem('carenav_supabase_url') && localStorage.getItem('carenav_supabase_key'));
                    const header = isConfig
                        ? '-- [STATUS: CONNECTED] Supabase PostgreSQL Cloud is Active\n-- Project URL: ' + localStorage.getItem('carenav_supabase_url') + '\n\n'
                        : '-- [STATUS: UNCONFIGURED] Click "Supabase Settings" below to connect your project\n\n';
                    dbViewer.textContent = header + supabaseSqlSchemaText;
                    return;
                }
            } catch (err) {
                console.warn('Live SQLite query failed, falling back to local storage:', err);
            }
        }

        // Fallback to local storage
        if (tab === 'users') {
            const users = JSON.parse(localStorage.getItem('carenav_users') || '[]');
            dbViewer.textContent = JSON.stringify(users, null, 2);
        } else if (tab === 'vitals') {
            const vitals = JSON.parse(localStorage.getItem('carenav_vitals') || '[]');
            dbViewer.textContent = JSON.stringify(vitals, null, 2);
        } else if (tab === 'medications') {
            const meds = JSON.parse(localStorage.getItem('carenav_meds') || '[]');
            dbViewer.textContent = JSON.stringify(meds, null, 2);
        } else if (tab === 'appointments') {
            const appts = JSON.parse(localStorage.getItem('carenav_appts') || '[]');
            dbViewer.textContent = JSON.stringify(appts, null, 2);
        } else if (tab === 'schema') {
            dbViewer.textContent = sqlSchemaText;
        } else if (tab === 'supabase') {
            const isConfig = Boolean(localStorage.getItem('carenav_supabase_url') && localStorage.getItem('carenav_supabase_key'));
            const header = isConfig
                ? '-- [STATUS: CONNECTED] Supabase PostgreSQL Cloud is Active\n-- Project URL: ' + localStorage.getItem('carenav_supabase_url') + '\n\n'
                : '-- [STATUS: UNCONFIGURED] Click "Supabase Settings" below to connect your project\n\n';
            dbViewer.textContent = header + supabaseSqlSchemaText;
        }
    }

    if (openDbBtn && databaseModal) {
        openDbBtn.addEventListener('click', () => {
            renderDatabaseTab('users');
            dbTabs.forEach(t => t.classList.remove('active'));
            if (dbTabs[0]) dbTabs[0].classList.add('active');
            databaseModal.classList.add('open');
        });
    }

    if (closeDbBtn && databaseModal) {
        closeDbBtn.addEventListener('click', () => databaseModal.classList.remove('open'));
    }

    dbTabs.forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            dbTabs.forEach(t => t.classList.remove('active'));
            tabBtn.classList.add('active');
            renderDatabaseTab(tabBtn.getAttribute('data-table'));
        });
    });

    if (exportDbBtn) {
        exportDbBtn.addEventListener('click', () => {
            const dump = {
                users: JSON.parse(localStorage.getItem('carenav_users') || '[]'),
                vitals: JSON.parse(localStorage.getItem('carenav_vitals') || '[]'),
                medications: JSON.parse(localStorage.getItem('carenav_meds') || '[]'),
                appointments: JSON.parse(localStorage.getItem('carenav_appts') || '[]'),
                exported_at: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'carenav_database_export.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    if (resetDbBtn) {
        resetDbBtn.addEventListener('click', () => {
            if (confirm('Reset database to clean initial state?')) {
                localStorage.removeItem('carenav_users');
                localStorage.removeItem('carenav_vitals');
                localStorage.removeItem('carenav_meds');
                localStorage.removeItem('carenav_appts');
                localStorage.removeItem('carenav_current_user');
                showToast('Database reset to defaults. Reloading portal...', 'info');
                setTimeout(() => window.location.reload(), 600);
            }
        });
    }

    // Close on backdrop click
    const patientChartModal = document.getElementById('patientChartModal');
    const telehealthModal = document.getElementById('telehealthModal');
    [emergencyModal, addVitalModal, addMedModal, bookingModal, settingsModal, databaseModal, patientChartModal, telehealthModal].forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) {
                    m.classList.remove('open');
                    if (m === telehealthModal && typeof stopTelehealthTimer === 'function') stopTelehealthTimer();
                }
            });
        }
    });

    // Doctor filter change
    document.getElementById('specialtyFilter').addEventListener('change', renderDoctors);
}

// ================= MODULE: DOCTOR PROVIDER STATION & CLINICAL CASELOAD =================

let telehealthTimerInterval = null;
let telehealthSeconds = 272; // default simulated elapsed seconds (04:32)
let currentChartPatientId = null;

function initDoctorStation() {
    // 1. Role Switcher Button in Navbar
    const switchRoleBtn = document.getElementById('switchRoleBtn');
    if (switchRoleBtn) {
        switchRoleBtn.addEventListener('click', async () => {
            const users = JSON.parse(localStorage.getItem('carenav_users') || '[]');
            if (activeUser && activeUser.role === 'doctor') {
                // Switch to demo patient
                let patientUser = users.find(u => u.role === 'patient');
                if (!patientUser) {
                    patientUser = {
                        id: "CN-88492",
                        name: "Alex Morgan",
                        email: "alex.morgan@healthmail.com",
                        role: "patient",
                        age: 34,
                        gender: "Male",
                        bloodGroup: "O Positive (Rh+)",
                        allergies: ["Penicillin", "Peanuts"],
                        chronicConditions: ["Mild Asthma", "Pre-diabetes"]
                    };
                }
                showToast("Switching to Patient Portal view...", "info");
                await loginUser(patientUser, true);
            } else {
                // Switch to demo doctor
                let doctorUser = users.find(u => u.role === 'doctor');
                if (!doctorUser) {
                    doctorUser = {
                        id: "DOC-1029",
                        name: "Dr. Evelyn Reed, MD",
                        email: "dr.reed@stjude.org",
                        role: "doctor",
                        specialty: "General Physician",
                        hospital: "St. Jude Memorial Hospital",
                        license: "MED-499201"
                    };
                }
                showToast("Switching to Doctor / Provider Station...", "info");
                await loginUser(doctorUser, true);
            }
        });
    }

    // 2. Quick buttons in Doctor Station Banner
    const docQuickPrescribeBtn = document.getElementById('docQuickPrescribeBtn');
    if (docQuickPrescribeBtn) {
        docQuickPrescribeBtn.addEventListener('click', () => {
            switchToDoctorTab('doc-prescriptions');
        });
    }

    const docQuickScheduleBtn = document.getElementById('docQuickScheduleBtn');
    if (docQuickScheduleBtn) {
        docQuickScheduleBtn.addEventListener('click', () => {
            switchToDoctorTab('doc-schedule');
        });
    }

    const viewFullScheduleBtn = document.getElementById('viewFullScheduleBtn');
    if (viewFullScheduleBtn) {
        viewFullScheduleBtn.addEventListener('click', () => {
            switchToDoctorTab('doc-schedule');
        });
    }

    // 3. Patient Search & Filter buttons
    const docPatientSearch = document.getElementById('docPatientSearch');
    if (docPatientSearch) {
        docPatientSearch.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            const activeFilterBtn = document.querySelector('.filter-patient-btn.active');
            const filter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
            renderDoctorPatients(filter, query);
        });
    }

    const patientFilterBtns = document.querySelectorAll('.filter-patient-btn');
    patientFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            patientFilterBtns.forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline');
            });
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline');
            const filter = btn.getAttribute('data-filter');
            const query = docPatientSearch ? docPatientSearch.value.trim().toLowerCase() : '';
            renderDoctorPatients(filter, query);
        });
    });

    // 4. Consultation Filter Buttons
    const apptFilterBtns = document.querySelectorAll('.doc-appt-filter');
    apptFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            apptFilterBtns.forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline');
            });
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline');
            const filter = btn.getAttribute('data-filter');
            renderDoctorSchedule(filter);
        });
    });

    // 5. e-Prescribing Form Submission
    const doctorPrescribeForm = document.getElementById('doctorPrescribeForm');
    if (doctorPrescribeForm) {
        doctorPrescribeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const patientId = document.getElementById('rxPatientSelect').value;
            const medName = document.getElementById('rxMedName').value.trim();
            const dosage = document.getElementById('rxDosage').value.trim();
            const purpose = document.getElementById('rxPurpose').value.trim();
            const refills = document.getElementById('rxRefills').value;
            const instructions = document.getElementById('rxInstructions').value.trim();

            if (!patientId || !medName || !dosage) {
                showToast("Please complete all required prescription fields.", "warning");
                return;
            }

            const patients = HealthDB.doctorPatients || [];
            const patient = patients.find(p => p.id === patientId);
            const patientName = patient ? patient.name : "Patient";

            const newRx = {
                id: 'rx-' + Date.now(),
                patient_id: patientId,
                patient_name: patientName,
                med_name: medName,
                dosage: dosage,
                purpose: purpose,
                instructions: instructions,
                refills: refills,
                date: new Date().toISOString().split('T')[0],
                status: "Active - Transmitted to Pharmacy"
            };

            HealthDB.doctorPrescriptions.unshift(newRx);
            localStorage.setItem('carenav_doctor_prescriptions', JSON.stringify(HealthDB.doctorPrescriptions));

            // Sync with backend API if online
            if (CareNavAPI.isOnline) {
                CareNavAPI.addMedication({
                    patientId: patientId,
                    name: medName,
                    frequency: dosage,
                    purpose: purpose
                }).catch(err => console.warn('SQLite Rx sync note:', err));
            }

            renderDoctorPrescriptions();
            renderDoctorStation();
            doctorPrescribeForm.reset();
            showToast(`e-Prescription for ${medName} authorized & transmitted for ${patientName}!`, "success");
        });
    }

    // 6. CDSS Presets & Engine Trigger
    const presetBtns = document.querySelectorAll('.cdss-preset-btn');
    const caseInput = document.getElementById('cdssCaseInput');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            if (preset === 'htn') {
                caseInput.value = "62-year-old male with persistent headache, systolic BP 142-152 mmHg, mild bilateral pedal edema, history of Type 2 Diabetes and Coronary Artery Disease. Current medications: Atorvastatin 20mg, Metformin. Allergies: Aspirin, Iodine contrast.";
            } else if (preset === 'asthma') {
                caseInput.value = "29-year-old female presenting with nocturnal cough and exertional dyspnea. Peak expiratory flow (PEF) 74% of predicted. Using rescue albuterol inhaler >4 times weekly. No fever, clear lung auscultation with mild end-expiratory wheezing bilaterally.";
            } else if (preset === 'metabolic') {
                caseInput.value = "34-year-old male presenting for annual cardiometabolic check. BMI 28.6, resting BP 124/82 mmHg, fasting glucose 106 mg/dL, HbA1c 5.8%. Reports mild daytime fatigue and intermittent postprandial somnolence. Strong maternal history of T2D.";
            }
        });
    });

    const runCdssBtn = document.getElementById('runCdssBtn');
    if (runCdssBtn) {
        runCdssBtn.addEventListener('click', runCdssAnalysis);
    }

    // 7. Modals: Patient Chart & Telehealth
    const closeChartModal = document.getElementById('closePatientChartModal');
    const patientChartModal = document.getElementById('patientChartModal');
    if (closeChartModal && patientChartModal) {
        closeChartModal.addEventListener('click', () => patientChartModal.classList.remove('open'));
    }

    const chartPrintBtn = document.getElementById('chartPrintBtn');
    if (chartPrintBtn) {
        chartPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const chartPrescribeBtn = document.getElementById('chartPrescribeBtn');
    if (chartPrescribeBtn) {
        chartPrescribeBtn.addEventListener('click', () => {
            if (patientChartModal) patientChartModal.classList.remove('open');
            switchToDoctorTab('doc-prescriptions');
            if (currentChartPatientId) {
                const rxSelect = document.getElementById('rxPatientSelect');
                if (rxSelect) rxSelect.value = currentChartPatientId;
            }
        });
    }

    const closeTeleModal = document.getElementById('closeTelehealthModal');
    const telehealthModal = document.getElementById('telehealthModal');
    if (closeTeleModal && telehealthModal) {
        closeTeleModal.addEventListener('click', () => {
            telehealthModal.classList.remove('open');
            stopTelehealthTimer();
        });
    }

    const endTelehealthCallBtn = document.getElementById('endTelehealthCallBtn');
    if (endTelehealthCallBtn) {
        endTelehealthCallBtn.addEventListener('click', () => {
            if (telehealthModal) telehealthModal.classList.remove('open');
            stopTelehealthTimer();
            showToast("Telehealth encounter ended. Clinical SOAP note archived to EHR.", "info");
        });
    }

    const saveSoapNoteBtn = document.getElementById('saveSoapNoteBtn');
    if (saveSoapNoteBtn) {
        saveSoapNoteBtn.addEventListener('click', () => {
            const noteVal = document.getElementById('telehealthSoapNotes').value.trim();
            if (!noteVal) {
                showToast("Please enter clinical notes before signing.", "warning");
                return;
            }
            showToast("SOAP encounter note electronically signed and stored to chart.", "success");
        });
    }

    const toggleMicBtn = document.getElementById('toggleMicBtn');
    if (toggleMicBtn) {
        toggleMicBtn.addEventListener('click', () => {
            const isMuted = toggleMicBtn.classList.toggle('active');
            toggleMicBtn.style.background = isMuted ? 'var(--danger)' : '#334155';
            showToast(isMuted ? "Microphone muted" : "Microphone active", "info");
        });
    }

    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', () => {
            const isPaused = toggleVideoBtn.classList.toggle('active');
            toggleVideoBtn.style.background = isPaused ? 'var(--danger)' : '#334155';
            showToast(isPaused ? "Video feed stopped" : "Video feed restored", "info");
        });
    }

    const toggleShareBtn = document.getElementById('toggleShareBtn');
    if (toggleShareBtn) {
        toggleShareBtn.addEventListener('click', () => {
            showToast("Patient medical chart shared to virtual screen presentation.", "info");
        });
    }
}

function switchToDoctorTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (navItem) navItem.classList.add('active');

    const pane = document.getElementById(`tab-${tabId}`);
    if (pane) pane.classList.add('active');

    if (tabId === 'doc-dashboard') renderDoctorStation();
    else if (tabId === 'doc-patients') renderDoctorPatients();
    else if (tabId === 'doc-schedule') renderDoctorSchedule();
    else if (tabId === 'doc-prescriptions') renderDoctorPrescriptions();
}

// 8. Render Doctor Command Center (KPIs, Queue, Alerts)
async function renderDoctorStation() {
    let patients = HealthDB.doctorPatients || [];
    let appts = HealthDB.doctorAppointments || [];
    let prescriptions = HealthDB.doctorPrescriptions || [];

    // Sync from SQLite if online
    if (CareNavAPI.isOnline) {
        try {
            const [apiPatients, apiAppts] = await Promise.all([
                CareNavAPI.getAllPatients(),
                CareNavAPI.getDoctorAppointments('DOC-1029')
            ]);
            if (apiPatients && Array.isArray(apiPatients) && apiPatients.length > 0) {
                patients = apiPatients;
                HealthDB.doctorPatients = apiPatients;
            }
            if (apiAppts && Array.isArray(apiAppts) && apiAppts.length > 0) {
                appts = apiAppts;
                HealthDB.doctorAppointments = apiAppts;
            }
        } catch (e) {
            console.warn('SQLite doctor sync note:', e);
        }
    }

    // Update KPI numbers
    const kpiCaseload = document.getElementById('docKpiCaseload');
    const kpiConsults = document.getElementById('docKpiConsults');
    const kpiAlerts = document.getElementById('docKpiAlerts');
    const kpiMeds = document.getElementById('docKpiMeds');
    const miniDocPatientsCount = document.getElementById('miniDocPatientsCount');

    if (kpiCaseload) kpiCaseload.textContent = patients.length;
    if (kpiConsults) kpiConsults.textContent = appts.filter(a => a.status !== 'Cancelled').length;
    const criticalPatients = patients.filter(p => p.latest_vitals && (p.latest_vitals.status === 'Elevated' || p.latest_vitals.status === 'Critical' || p.latest_vitals.status === 'High'));
    if (kpiAlerts) kpiAlerts.textContent = criticalPatients.length;
    if (kpiMeds) kpiMeds.textContent = prescriptions.length;
    if (miniDocPatientsCount) miniDocPatientsCount.textContent = `${patients.length} Patients`;

    // Render Today's Schedule Queue in dashboard
    const schedContainer = document.getElementById('docDashboardScheduleList');
    if (schedContainer) {
        if (appts.length === 0) {
            schedContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No consultation visits scheduled for today.</div>`;
        } else {
            schedContainer.innerHTML = appts.map(a => {
                const patient = patients.find(p => p.id === a.patient_id);
                const pName = a.patient_name || (patient ? patient.name : 'Alex Morgan');
                const isTele = (a.type && a.type.includes('Telehealth')) || a.notes.toLowerCase().includes('telehealth') || a.id === 'apt-101';
                return `
                    <div class="consultation-card" style="margin-bottom: 0; padding: 14px 16px;">
                        <div class="consult-patient-meta">
                            <div class="consult-avatar" style="width: 38px; height: 38px; font-size: 1rem;">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div class="consult-info">
                                <h4 style="font-size: 0.92rem;">${pName}</h4>
                                <p style="font-size: 0.78rem;">
                                    <i class="fa-solid fa-clock" style="color: var(--primary);"></i> ${a.time_slot || '10:00 AM'} &bull;
                                    <span style="color: ${isTele ? 'var(--teal)' : 'var(--primary)'}; font-weight: 600;">
                                        ${isTele ? 'Virtual Telehealth' : 'In-Clinic'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div class="consult-actions">
                            <button class="btn btn-outline btn-sm" onclick="openPatientChartModal('${a.patient_id || 'CN-88492'}')" title="Open EHR Chart">
                                <i class="fa-solid fa-file-waveform"></i> Chart
                            </button>
                            ${isTele ? `
                                <button class="btn btn-primary btn-sm" onclick="openTelehealthModal('${a.patient_id || 'CN-88492'}', '${a.id}')" style="background: var(--teal); border-color: var(--teal);">
                                    <i class="fa-solid fa-video"></i> Launch
                                </button>
                            ` : `
                                <button class="btn btn-primary btn-sm" onclick="markAppointmentDone('${a.id}')">
                                    <i class="fa-solid fa-check"></i> Complete
                                </button>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Render Priority Alerts in dashboard
    const alertsContainer = document.getElementById('docDashboardAlertsList');
    if (alertsContainer) {
        alertsContainer.innerHTML = `
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="status-pill status-critical" style="font-size: 0.72rem;"><i class="fa-solid fa-triangle-exclamation"></i> Stage 1 HTN Alert</span>
                        <strong style="font-size: 0.92rem; color: #9f1239;">Marcus Bell (62 M)</strong>
                    </div>
                    <p style="font-size: 0.8rem; color: #881337; margin-top: 4px;">
                        BP: <strong>142/92 mmHg</strong> &bull; HR: 88 bpm &bull; SpO2: 96%. Recommended action: Review ACEi / ARB titration.
                    </p>
                </div>
                <button class="btn btn-sm" onclick="openPatientChartModal('CN-51204')" style="background: #e11d48; color: #ffffff; flex-shrink: 0;">
                    Review Chart
                </button>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="status-pill status-elevated" style="font-size: 0.72rem;"><i class="fa-solid fa-clock"></i> Routine Follow-up</span>
                        <strong style="font-size: 0.92rem; color: #92400e;">Sarah Jenkins (48 F)</strong>
                    </div>
                    <p style="font-size: 0.8rem; color: #78350f; margin-top: 4px;">
                        BP: <strong>128/84 mmHg</strong> &bull; Stable. Scheduled today at 11:30 AM for hypertension check.
                    </p>
                </div>
                <button class="btn btn-outline btn-sm" onclick="openPatientChartModal('CN-73910')" style="color: #b45309; border-color: #f59e0b; flex-shrink: 0;">
                    Examine
                </button>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="status-pill status-stable" style="font-size: 0.72rem;"><i class="fa-solid fa-circle-check"></i> Vitals Controlled</span>
                        <strong style="font-size: 0.92rem; color: #166534;">Alex Morgan (34 M)</strong>
                    </div>
                    <p style="font-size: 0.8rem; color: #14532d; margin-top: 4px;">
                        BP: <strong>120/80 mmHg</strong> &bull; SpO2: 99% &bull; Glucose: 96 mg/dL. Pre-diabetes HbA1c review pending.
                    </p>
                </div>
                <button class="btn btn-outline btn-sm" onclick="openPatientChartModal('CN-88492')" style="color: #15803d; border-color: #22c55e; flex-shrink: 0;">
                    View Chart
                </button>
            </div>
        `;
    }
}

// 9. Render Patient Caseload Table
function renderDoctorPatients(filter = 'all', searchQuery = '') {
    const tbody = document.getElementById('doctorPatientsTableBody');
    if (!tbody) return;

    let patients = HealthDB.doctorPatients || [];

    // Filter by risk
    if (filter === 'critical') {
        patients = patients.filter(p => p.latest_vitals && (p.latest_vitals.status === 'Elevated' || p.latest_vitals.status === 'Critical' || p.latest_vitals.status === 'High'));
    } else if (filter === 'stable') {
        patients = patients.filter(p => !p.latest_vitals || (p.latest_vitals.status !== 'Elevated' && p.latest_vitals.status !== 'Critical' && p.latest_vitals.status !== 'High'));
    }

    // Filter by search query
    if (searchQuery) {
        patients = patients.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            p.id.toLowerCase().includes(searchQuery) ||
            (p.chronicConditions && p.chronicConditions.some(c => c.toLowerCase().includes(searchQuery)))
        );
    }

    if (patients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No patients match the selected filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = patients.map(p => {
        const v = p.latest_vitals || { bp: "120/80", hr: 74, spo2: 99, status: "Normal" };
        const isCritical = v.status === 'Elevated' || v.status === 'Critical' || v.status === 'High';
        const statusClass = isCritical ? 'status-critical' : 'status-stable';
        const conditionsHtml = (p.chronicConditions || ['None recorded']).map(c =>
            `<span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; margin: 1px;">${c}</span>`
        ).join(' ');

        return `
            <tr>
                <td>
                    <strong style="color: var(--text-primary); font-size: 0.92rem;">${p.name}</strong><br>
                    <small style="color: var(--text-muted); font-family: monospace;">${p.id}</small>
                </td>
                <td>
                    ${p.age} y/o &bull; ${p.gender}<br>
                    <small style="color: var(--text-secondary);">Blood: <strong>${p.bloodGroup || 'O+'}</strong></small>
                </td>
                <td style="max-width: 220px;">
                    ${conditionsHtml}
                </td>
                <td>
                    <strong>${v.bp}</strong> mmHg<br>
                    <small style="color: var(--text-secondary);">HR: ${v.hr} bpm &bull; SpO2: ${v.spo2}%</small>
                </td>
                <td>
                    <span class="badge badge-info" style="font-size: 0.75rem;">${p.medications_count || 2} Active Rx</span>
                </td>
                <td>
                    <span class="status-pill ${statusClass}">
                        <i class="fa-solid ${isCritical ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
                        ${isCritical ? 'Flagged Vitals' : 'Stable'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-outline btn-sm" onclick="openPatientChartModal('${p.id}')" title="Inspect Medical Chart">
                            <i class="fa-solid fa-file-waveform"></i> Chart
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="quickPrescribeForPatient('${p.id}')" title="Author e-Prescription" style="background: #9333ea; border-color: #9333ea;">
                            <i class="fa-solid fa-prescription"></i> e-Rx
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 10. Render Consultations & Telehealth Schedule
function renderDoctorSchedule(filter = 'all') {
    const container = document.getElementById('doctorConsultationsContainer');
    if (!container) return;

    let appts = HealthDB.doctorAppointments || [];
    const patients = HealthDB.doctorPatients || [];

    if (filter === 'confirmed') {
        appts = appts.filter(a => a.status === 'Confirmed');
    } else if (filter === 'completed') {
        appts = appts.filter(a => a.status === 'Completed');
    }

    if (appts.length === 0) {
        container.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">No appointments found under this filter.</div>`;
        return;
    }

    container.innerHTML = appts.map(apt => {
        const patient = patients.find(p => p.id === apt.patient_id);
        const pName = apt.patient_name || (patient ? patient.name : 'Alex Morgan');
        const isTele = (apt.type && apt.type.includes('Telehealth')) || apt.notes.toLowerCase().includes('telehealth') || apt.id === 'apt-101' || apt.id === 'apt-103';
        const isCompleted = apt.status === 'Completed';

        return `
            <div class="consultation-card" style="opacity: ${isCompleted ? 0.75 : 1};">
                <div class="consult-patient-meta">
                    <div class="consult-avatar" style="${isTele ? 'background: rgba(13, 148, 136, 0.12); color: var(--teal);' : ''}">
                        <i class="fa-solid ${isTele ? 'fa-video' : 'fa-hospital-user'}"></i>
                    </div>
                    <div class="consult-info">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h4>${pName}</h4>
                            <span class="status-pill ${isTele ? 'status-stable' : ''}" style="font-size: 0.7rem;">
                                ${isTele ? '<i class=\"fa-solid fa-video\"></i> Virtual Telehealth' : '<i class=\"fa-solid fa-building\"></i> In-Clinic Visit'}
                            </span>
                            <span class="badge ${isCompleted ? 'badge-success' : 'badge-info'}" style="font-size: 0.72rem;">${apt.status}</span>
                        </div>
                        <p style="margin-top: 4px;">
                            <strong>Date:</strong> ${apt.appointment_date} at <strong>${apt.time_slot}</strong> &bull;
                            <strong>Reason:</strong> ${apt.notes}
                        </p>
                    </div>
                </div>
                <div class="consult-actions">
                    <button class="btn btn-outline btn-sm" onclick="openPatientChartModal('${apt.patient_id || 'CN-88492'}')">
                        <i class="fa-solid fa-notes-medical"></i> View Chart
                    </button>
                    ${!isCompleted ? `
                        ${isTele ? `
                            <button class="btn btn-primary btn-sm" onclick="openTelehealthModal('${apt.patient_id || 'CN-88492'}', '${apt.id}')" style="background: var(--teal); border-color: var(--teal);">
                                <i class="fa-solid fa-video"></i> Start Telehealth Call
                            </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" onclick="markAppointmentDone('${apt.id}')" style="color: var(--teal); border-color: var(--teal);">
                            <i class="fa-solid fa-check"></i> Mark Done
                        </button>
                    ` : `
                        <span style="font-size: 0.8rem; color: var(--teal); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Encounter Archived</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// 11. Render Issued Outpatient Prescriptions
function renderDoctorPrescriptions() {
    const container = document.getElementById('doctorIssuedRxList');
    const badge = document.getElementById('docRxCountBadge');
    if (!container) return;

    const list = HealthDB.doctorPrescriptions || [];
    if (badge) badge.textContent = `${list.length} Active Rx`;

    if (list.length === 0) {
        container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No active prescriptions issued yet. Authorize one on the left.</div>`;
        return;
    }

    container.innerHTML = list.map(rx => `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
            <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="color: var(--text-primary); font-size: 0.95rem;">${rx.med_name}</strong>
                    <span class="status-pill status-stable" style="font-size: 0.7rem;">Active e-Rx</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">
                    <strong>Patient:</strong> ${rx.patient_name || 'Alex Morgan'} &bull;
                    <strong>Dosage:</strong> ${rx.dosage}
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                    Indication: ${rx.purpose} &bull; Authorized: ${rx.date || '2026-09-01'}
                </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="discontinueRx('${rx.id}')" style="color: var(--danger); border-color: var(--danger); flex-shrink: 0;" title="Discontinue Prescription">
                <i class="fa-solid fa-ban"></i> Discontinue
            </button>
        </div>
    `).join('');
}

function quickPrescribeForPatient(patientId) {
    switchToDoctorTab('doc-prescriptions');
    const rxSelect = document.getElementById('rxPatientSelect');
    if (rxSelect) rxSelect.value = patientId;
}

function markAppointmentDone(apptId) {
    const appts = HealthDB.doctorAppointments || [];
    const appt = appts.find(a => a.id === apptId);
    if (appt) {
        appt.status = 'Completed';
        localStorage.setItem('carenav_doctor_appts', JSON.stringify(appts));
        if (CareNavAPI.isOnline) {
            CareNavAPI.updateAppointmentStatus(apptId, 'Completed').catch(e => console.warn(e));
        }
        renderDoctorSchedule();
        renderDoctorStation();
        showToast("Appointment visit completed and encounter archived.", "success");
    }
}

function discontinueRx(rxId) {
    HealthDB.doctorPrescriptions = HealthDB.doctorPrescriptions.filter(r => r.id !== rxId);
    localStorage.setItem('carenav_doctor_prescriptions', JSON.stringify(HealthDB.doctorPrescriptions));
    renderDoctorPrescriptions();
    renderDoctorStation();
    showToast("Prescription marked as discontinued.", "info");
}

// 12. Open EHR Patient Chart Inspector Modal
function openPatientChartModal(patientId) {
    currentChartPatientId = patientId;
    const modal = document.getElementById('patientChartModal');
    const body = document.getElementById('patientChartBody');
    const title = document.getElementById('chartModalPatientName');
    const meta = document.getElementById('chartModalPatientMeta');
    if (!modal || !body) return;

    const patients = HealthDB.doctorPatients || [];
    const p = patients.find(pt => pt.id === patientId) || {
        id: patientId,
        name: "Alex Morgan",
        age: 34,
        gender: "Male",
        bloodGroup: "O Positive (Rh+)",
        allergies: ["Penicillin", "Peanuts"],
        chronicConditions: ["Mild Asthma", "Pre-diabetes"],
        emergencyContact: "Sarah Morgan (Spouse) - +1 (555) 019-2834"
    };

    if (title) title.textContent = `${p.name} — Medical Record Chart`;
    if (meta) meta.textContent = `ID: ${p.id} • ${p.age} y/o • ${p.gender} • Blood Group: ${p.bloodGroup}`;

    const allergiesHtml = (p.allergies || ['None']).map(a =>
        `<span style="background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 0.75rem; margin-right: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> ${a}</span>`
    ).join('');

    const conditionsHtml = (p.chronicConditions || ['None']).map(c =>
        `<span style="background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 0.75rem; margin-right: 4px;">${c}</span>`
    ).join('');

    // Recent vitals
    const vitals = (p.id === 'CN-88492' ? HealthDB.vitals : [
        { date: "2026-09-08 09:15 AM", bp: p.latest_vitals ? p.latest_vitals.bp : "120/80", hr: p.latest_vitals ? p.latest_vitals.hr : 74, glucose: p.latest_vitals ? p.latest_vitals.glucose : 96, spo2: p.latest_vitals ? p.latest_vitals.spo2 : 99, status: p.latest_vitals ? p.latest_vitals.status : "Normal" }
    ]);

    body.innerHTML = `
        <!-- Patient Summary Card -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; font-size: 0.85rem;">
                <div><span style="color: var(--text-muted);">Legal Name:</span> <strong>${p.name}</strong></div>
                <div><span style="color: var(--text-muted);">Medical ID:</span> <code>${p.id}</code></div>
                <div><span style="color: var(--text-muted);">Age / Gender:</span> <strong>${p.age} y/o &bull; ${p.gender}</strong></div>
                <div><span style="color: var(--text-muted);">Blood Type:</span> <strong>${p.bloodGroup}</strong></div>
                <div><span style="color: var(--text-muted);">Emergency Contact:</span> <strong>${p.emergencyContact || 'On file'}</strong></div>
                <div><span style="color: var(--text-muted);">Primary Facility:</span> <strong>St. Jude Memorial Hospital</strong></div>
            </div>
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px;">
                <div><strong style="color: var(--danger); font-size: 0.82rem;">DOCUMENTED ALLERGIES:</strong> ${allergiesHtml}</div>
                <div><strong style="color: var(--primary); font-size: 0.82rem;">CHRONIC DIAGNOSES:</strong> ${conditionsHtml}</div>
            </div>
        </div>

        <!-- Biometric Telemetry History -->
        <div style="margin-bottom: 20px;">
            <h4 style="font-size: 0.95rem; margin-bottom: 10px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-heart-pulse" style="color: var(--danger);"></i> Biometric Vitals History & Trend
            </h4>
            <div class="doctor-table-wrapper">
                <table class="doctor-table">
                    <thead>
                        <tr>
                            <th>Date / Time</th>
                            <th>Blood Pressure</th>
                            <th>Heart Rate</th>
                            <th>Glucose</th>
                            <th>SpO2</th>
                            <th>Assessment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vitals.map(v => `
                            <tr>
                                <td>${v.date}</td>
                                <td><strong>${v.bp}</strong> mmHg</td>
                                <td>${v.hr} bpm</td>
                                <td>${v.glucose} mg/dL</td>
                                <td>${v.spo2}%</td>
                                <td>
                                    <span class="status-pill ${v.status === 'Normal' ? 'status-stable' : 'status-critical'}">
                                        ${v.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Active Medications -->
        <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 10px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-prescription-bottle-medical" style="color: #9333ea;"></i> Active Formularies Overseen
            </h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${(HealthDB.doctorPrescriptions.filter(r => r.patient_id === p.id).length > 0 ?
                    HealthDB.doctorPrescriptions.filter(r => r.patient_id === p.id).map(r => `
                        <div style="padding: 10px 14px; background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${r.med_name}</strong> &bull; <small style="color: var(--text-secondary);">${r.dosage}</small>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Indication: ${r.purpose}</div>
                            </div>
                            <span class="status-pill status-stable" style="font-size: 0.7rem;">Active</span>
                        </div>
                    `).join('')
                    : `<div style="padding: 12px; color: var(--text-muted); font-size: 0.85rem;">No active medications prescribed specifically for this patient. Click 'Prescribe Medication' below to author.</div>`
                )}
            </div>
        </div>
    `;

    modal.classList.add('open');
}

// 13. Open Virtual Telehealth Encounter Modal
function openTelehealthModal(patientId, appointmentId) {
    const modal = document.getElementById('telehealthModal');
    if (!modal) return;

    const patients = HealthDB.doctorPatients || [];
    const p = patients.find(pt => pt.id === patientId) || {
        name: "Alex Morgan",
        latest_vitals: { bp: "120/80", hr: 74, spo2: 99, glucose: 96 }
    };

    const nameEl = document.getElementById('telehealthPatientName');
    const bpEl = document.getElementById('telehealthBp');
    const hrEl = document.getElementById('telehealthHr');
    const spo2El = document.getElementById('telehealthSpo2');
    const glEl = document.getElementById('telehealthGl');

    if (nameEl) nameEl.textContent = p.name;
    const v = p.latest_vitals || { bp: "120/80", hr: 74, spo2: 99, glucose: 96 };
    if (bpEl) bpEl.textContent = `${v.bp} mmHg`;
    if (hrEl) hrEl.textContent = `${v.hr} bpm`;
    if (spo2El) spo2El.textContent = `${v.spo2}%`;
    if (glEl) glEl.textContent = `${v.glucose || 96} mg/dL`;

    // Pre-fill SOAP note
    const soapNotes = document.getElementById('telehealthSoapNotes');
    if (soapNotes) {
        soapNotes.value = `SUBJECTIVE (S):\nPatient presents for scheduled virtual telehealth consultation. Denies acute chest pain, shortness of breath, or adverse reactions.\n\nOBJECTIVE (O):\nBiometrics: BP ${v.bp} mmHg, HR ${v.hr} bpm, SpO2 ${v.spo2}%, Fasting Glucose ${v.glucose || 96} mg/dL. General appearance: alert, conversational.\n\nASSESSMENT (A):\n1. Chronic outpatient status stable.\n2. Adherence to prescribed pharmacotherapy verified.\n\nPLAN (P):\n1. Continue current regimen without modification.\n2. Scheduled routine interval review in 90 days.`;
    }

    startTelehealthTimer();
    modal.classList.add('open');
}

function startTelehealthTimer() {
    stopTelehealthTimer();
    telehealthSeconds = 272; // start at 04:32 for realism
    const timerEl = document.getElementById('telehealthTimer');
    telehealthTimerInterval = setInterval(() => {
        telehealthSeconds++;
        const mins = Math.floor(telehealthSeconds / 60).toString().padStart(2, '0');
        const secs = (telehealthSeconds % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTelehealthTimer() {
    if (telehealthTimerInterval) {
        clearInterval(telehealthTimerInterval);
        telehealthTimerInterval = null;
    }
}

// 14. CDSS Differential Diagnosis AI Copilot
function runCdssAnalysis() {
    const input = document.getElementById('cdssCaseInput').value.trim();
    const output = document.getElementById('cdssOutputArea');
    const statusBadge = document.getElementById('cdssStatusBadge');
    if (!input) {
        showToast("Please enter or select a clinical case presentation to analyze.", "warning");
        return;
    }

    if (statusBadge) {
        statusBadge.className = 'status-pill status-elevated';
        statusBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing GDMT Guidelines...';
    }

    setTimeout(() => {
        if (statusBadge) {
            statusBadge.className = 'status-pill status-stable';
            statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Analysis Complete';
        }

        const lower = input.toLowerCase();
        let primaryDx = "Stage 1 Essential Hypertension (ICD-10 I10)";
        let primaryPct = "86%";
        let secDx = "Secondary Hypertension (Renovascular / Hyperaldosteronism)";
        let secPct = "24%";
        let redFlag = "Monitor for hypertensive urgency (BP > 180/120) or acute end-organ damage symptoms (headache, visual changes, chest tightness).";
        let guideline = "ACC/AHA 2024 Guidelines: Initiate first-line therapy with ACE inhibitor (Lisinopril 10mg) or ARB (Losartan 50mg). Target BP < 130/80 mmHg. Recommend dietary sodium restriction < 2,000 mg/day.";
        let labWorkup = ["Comprehensive Metabolic Panel (CMP)", "Serum Creatinine & eGFR", "Spot Urine Albumin-to-Creatinine Ratio (uACR)", "12-Lead Resting Electrocardiogram (ECG)", "Fasting Lipid Panel"];

        if (lower.includes('cough') || lower.includes('wheezing') || lower.includes('asthma') || lower.includes('pef')) {
            primaryDx = "Moderate Persistent Asthma with Bronchospasm (ICD-10 J45.40)";
            primaryPct = "91%";
            secDx = "Cough-Variant Asthma vs. Post-Infectious Airway Hyperreactivity";
            secPct = "28%";
            redFlag = "Assess for acute severe exacerbation (silent chest, PEF < 50%, accessory muscle use). Escalate immediately if refractory to SABA.";
            guideline = "GINA 2024 Guidelines: Step 3 therapy indicated. Initiate low-dose ICS-formoterol maintenance and reliever therapy (SMART). Avoid SABA-only monotherapy.";
            labWorkup = ["Pre- and Post-Bronchodilator Spirometry", "Fractional Exhaled Nitric Oxide (FeNO)", "Complete Blood Count (CBC with differential for eosinophils)", "Chest Radiograph (PA/Lateral)"];
        } else if (lower.includes('glucose') || lower.includes('hba1c') || lower.includes('metabolic') || lower.includes('t2d')) {
            primaryDx = "Metabolic Syndrome & Impaired Fasting Glucose / Pre-diabetes (ICD-10 R73.03)";
            primaryPct = "89%";
            secDx = "Early Type 2 Diabetes Mellitus with Insulin Resistance";
            secPct = "32%";
            redFlag = "Screen for microvascular complications (retinopathy, microalbuminuria, distal symmetrical polyneuropathy).";
            guideline = "ADA Standards of Care 2024: Target HbA1c < 7.0%. Initiate Metformin 500mg titration along with structured lifestyle intervention (150 min/week moderate aerobic exercise). Consider GLP-1 RA or SGLT2i if established ASCVD.";
            labWorkup = ["Repeat HbA1c in 3 months", "Comprehensive Lipid Profile (LDL-C target < 70 mg/dL)", "Urine Microalbumin / Creatinine Ratio", "Estimated Glomerular Filtration Rate (eGFR)", "Serum ALT/AST for hepatic steatosis screening"];
        }

        output.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Differential Diagnosis Probabilities -->
                <div>
                    <h4 style="font-size: 0.88rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Differential Diagnostic Considerations</h4>
                    <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 6px;">
                            <span>1. ${primaryDx}</span>
                            <span style="color: var(--teal);">${primaryPct} Probability</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${primaryPct}; height: 100%; background: var(--teal);"></div>
                        </div>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 14px;">
                        <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">
                            <span>2. ${secDx}</span>
                            <span style="color: var(--primary);">${secPct} Probability</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${secPct}; height: 100%; background: var(--primary);"></div>
                        </div>
                    </div>
                </div>

                <!-- Contraindication / Safety Alert -->
                <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: var(--radius-sm); padding: 12px 14px;">
                    <strong style="color: #be123c; font-size: 0.82rem; display: block; margin-bottom: 4px;">
                        <i class="fa-solid fa-triangle-exclamation"></i> Clinical Contraindication & Red Flags:
                    </strong>
                    <p style="font-size: 0.8rem; color: #881337; line-height: 1.4;">${redFlag}</p>
                </div>

                <!-- Guideline Recommendation (GDMT) -->
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-sm); padding: 12px 14px;">
                    <strong style="color: #15803d; font-size: 0.82rem; display: block; margin-bottom: 4px;">
                        <i class="fa-solid fa-book-medical"></i> Guideline-Directed Medical Therapy (GDMT):
                    </strong>
                    <p style="font-size: 0.8rem; color: #14532d; line-height: 1.4;">${guideline}</p>
                </div>

                <!-- Recommended Diagnostic Workup -->
                <div>
                    <h4 style="font-size: 0.88rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Recommended Diagnostic Workup Orders</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
                        ${labWorkup.map(item => `
                            <li style="font-size: 0.82rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-circle-check" style="color: var(--teal); font-size: 0.8rem;"></i> ${item}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }, 450);
}
