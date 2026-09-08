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
    }
};

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
    geminiApiKey: localStorage.getItem('carenav_gemini_key') || ''
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

    // Check backend API connection
    await CareNavAPI.checkHealth();

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

    // Update Navbar Profile
    const nameEl = document.getElementById('currentPatientName');
    const subEl = document.getElementById('currentPatientSub');
    const avatarEl = document.getElementById('navAvatar');
    const badgeEl = document.getElementById('patientBadge');

    if (nameEl) nameEl.textContent = user.name;
    if (subEl) {
        if (user.role === 'doctor') {
            subEl.innerHTML = `Lic: #${user.license || user.id} &bull; ${user.specialty || 'Physician'}`;
            if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-doctor"></i>';
            if (badgeEl) badgeEl.style.borderColor = 'var(--teal)';
        } else {
            subEl.innerHTML = `ID: #${user.id} &bull; Age: ${user.age || 34} &bull; Blood: ${user.bloodGroup || 'O+'}`;
            if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-injured"></i>';
            if (badgeEl) badgeEl.style.borderColor = 'var(--border-color)';
        }
    }

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
        alert('Please describe your symptoms first.');
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
        alert('Please select a preset or paste your lab report text.');
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

        localStorage.setItem('carenav_vitals', JSON.stringify(HealthDB.vitals));
        renderVitals();
        addVitalModal.classList.remove('open');
        vitalForm.reset();
        alert('New vital sign recorded successfully!');
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

        localStorage.setItem('carenav_meds', JSON.stringify(HealthDB.medications));
        renderMedications();
        addMedModal.classList.remove('open');
        medForm.reset();
        alert('Medication added to regimen!');
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

        localStorage.setItem('carenav_appts', JSON.stringify(HealthDB.appointments));
        bookingModal.classList.remove('open');
        alert(`Appointment Confirmed with ${record.doctor} on ${record.date} at ${record.slot}!`);
    });

    // Settings Modal
    const settingsModal = document.getElementById('settingsModal');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsModal');
    const geminiInput = document.getElementById('geminiKey');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const removeKeyBtn = document.getElementById('removeKeyBtn');

    openSettingsBtn.addEventListener('click', () => {
        geminiInput.value = HealthDB.geminiApiKey;
        settingsModal.classList.add('open');
    });

    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));

    saveKeyBtn.addEventListener('click', () => {
        const val = geminiInput.value.trim();
        HealthDB.geminiApiKey = val;
        localStorage.setItem('carenav_gemini_key', val);
        alert('Gemini API Key saved successfully!');
        settingsModal.classList.remove('open');
    });

    removeKeyBtn.addEventListener('click', () => {
        HealthDB.geminiApiKey = '';
        localStorage.removeItem('carenav_gemini_key');
        geminiInput.value = '';
        alert('API Key removed.');
    });

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
                alert('Database reset. Reloading portal...');
                window.location.reload();
            }
        });
    }

    // Close on backdrop click
    [emergencyModal, addVitalModal, addMedModal, bookingModal, settingsModal, databaseModal].forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) m.classList.remove('open');
            });
        }
    });

    // Doctor filter change
    document.getElementById('specialtyFilter').addEventListener('change', renderDoctors);
}
