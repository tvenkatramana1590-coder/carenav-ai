// ==========================================================
// CareNav AI — Supabase Cloud Database Integration Service
// Supports real-time PostgreSQL replication, cloud storage & sync
// ==========================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_KEY) {
    try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
        });
        console.log('✅ Supabase Cloud PostgreSQL Client initialized:', SUPABASE_URL);
    } catch (err) {
        console.warn('⚠️ Failed to initialize Supabase client:', err.message);
    }
} else {
    console.log('ℹ️ Supabase environment variables not set. Using SQLite / Local Storage.');
}

const SupabaseService = {
    isConfigured: !!supabaseClient,
    url: SUPABASE_URL,

    getClient() {
        return supabaseClient;
    },

    async testConnection(customUrl, customKey) {
        try {
            const client = (customUrl && customKey) 
                ? createClient(customUrl, customKey, { auth: { persistSession: false } })
                : supabaseClient;

            if (!client) {
                return { success: false, message: 'Supabase client is not configured.' };
            }

            const { data, error } = await client.from('users').select('count', { count: 'exact', head: true });
            if (error) {
                return { success: false, message: error.message };
            }

            return { 
                success: true, 
                message: 'Successfully connected to Supabase PostgreSQL Database!',
                userCount: data || 0
            };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    async syncPatient(patient) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('patients')
                .upsert({
                    patient_id: patient.id || patient.patient_id,
                    user_id: patient.id || patient.user_id,
                    age: patient.age || 34,
                    gender: patient.gender || 'Male',
                    blood_group: patient.bloodGroup || patient.blood_group || 'O Positive (Rh+)',
                    allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
                    chronic_conditions: Array.isArray(patient.chronicConditions) ? patient.chronicConditions.join(', ') : (patient.chronicConditions || ''),
                    emergency_contact: patient.emergencyContact || patient.emergency_contact || '',
                    primary_physician: patient.primaryCarePhysician || patient.primary_physician || ''
                });
            if (error) console.warn('Supabase syncPatient warning:', error.message);
            return data;
        } catch (e) {
            console.warn('Supabase syncPatient error:', e.message);
            return null;
        }
    },

    async syncVital(vital) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('vitals')
                .insert({
                    patient_id: vital.patientId || vital.patient_id,
                    systolic_bp: vital.sys || vital.systolic_bp,
                    diastolic_bp: vital.dia || vital.diastolic_bp,
                    heart_rate: vital.hr || vital.heart_rate,
                    glucose_mg_dl: vital.glucose || vital.glucose_mg_dl,
                    spo2_percent: vital.spo2 || vital.spo2_percent,
                    status: vital.status || 'Normal'
                });
            if (error) console.warn('Supabase syncVital warning:', error.message);
            return data;
        } catch (e) {
            console.warn('Supabase syncVital error:', e.message);
            return null;
        }
    },

    async syncMedication(med) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('medications')
                .upsert({
                    id: med.id || ('m-' + Date.now()),
                    patient_id: med.patientId || med.patient_id,
                    name: med.name,
                    frequency: med.frequency,
                    purpose: med.purpose,
                    is_active: true
                });
            if (error) console.warn('Supabase syncMedication warning:', error.message);
            return data;
        } catch (e) {
            console.warn('Supabase syncMedication error:', e.message);
            return null;
        }
    },

    async syncAppointment(appt) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('appointments')
                .upsert({
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
            if (error) console.warn('Supabase syncAppointment warning:', error.message);
            return data;
        } catch (e) {
            console.warn('Supabase syncAppointment error:', e.message);
            return null;
        }
    }
};

module.exports = SupabaseService;
