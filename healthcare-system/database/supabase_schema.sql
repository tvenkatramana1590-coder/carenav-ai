-- ==========================================================
-- CareNav AI — Supabase PostgreSQL Schema & Realtime Setup
-- Copy and paste this directly into your Supabase SQL Editor
-- (https://app.supabase.com -> Select Project -> SQL Editor)
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
    doctor_id TEXT NOT NULL REFERENCES public.doctors(doctor_id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. TRIAGE_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.triage_logs (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
    symptoms_text TEXT NOT NULL,
    pain_severity INTEGER CHECK (pain_severity BETWEEN 1 AND 10),
    urgency_level TEXT NOT NULL,
    urgency_score INTEGER DEFAULT 0,
    recommended_specialist TEXT,
    potential_differentials TEXT,
    assessed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies for CareNav AI Web Client & API
-- ==========================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow public insert patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update patients" ON public.patients FOR UPDATE USING (true);

CREATE POLICY "Allow public read doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Allow public insert doctors" ON public.doctors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read vitals" ON public.vitals FOR SELECT USING (true);
CREATE POLICY "Allow public insert vitals" ON public.vitals FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read medications" ON public.medications FOR SELECT USING (true);
CREATE POLICY "Allow public insert medications" ON public.medications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update medications" ON public.medications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete medications" ON public.medications FOR DELETE USING (true);

CREATE POLICY "Allow public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update appointments" ON public.appointments FOR UPDATE USING (true);

CREATE POLICY "Allow public read triage_logs" ON public.triage_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert triage_logs" ON public.triage_logs FOR INSERT WITH CHECK (true);

-- ==========================================================
-- SUPABASE REALTIME REPLICATION
-- Enables live sync for vitals telemetry and appointments
-- ==========================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals, public.appointments, public.medications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- ==========================================================
-- SEED INITIAL CLINICAL DATA
-- ==========================================================

INSERT INTO public.users (id, name, email, password_hash, role) VALUES
('CN-88492', 'Alex Morgan', 'alex.morgan@healthmail.com', 'password123', 'patient'),
('CN-73910', 'Sarah Jenkins', 'sarah.jenkins@healthmail.com', 'password123', 'patient'),
('CN-51204', 'Marcus Bell', 'marcus.bell@healthmail.com', 'password123', 'patient'),
('DOC-1029', 'Dr. Evelyn Reed, MD', 'dr.reed@stjude.org', 'doctor123', 'doctor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.patients (patient_id, user_id, age, gender, blood_group, allergies, chronic_conditions, emergency_contact, primary_physician) VALUES
('CN-88492', 'CN-88492', 34, 'Male', 'O Positive (Rh+)', 'Penicillin, Peanuts', 'Mild Asthma, Pre-diabetes', 'Sarah Morgan (Spouse) - +1 (555) 019-2834', 'Dr. Evelyn Reed (St. Jude Hospital)'),
('CN-73910', 'CN-73910', 48, 'Female', 'A Positive (Rh+)', 'Sulfa Drugs, Codeine', 'Hypertension, Dyslipidemia', 'Robert Jenkins (Spouse) - +1 (555) 018-9123', 'Dr. Evelyn Reed (St. Jude Hospital)'),
('CN-51204', 'CN-51204', 62, 'Male', 'B Positive (Rh+)', 'Aspirin, Iodine Contrast', 'Type 2 Diabetes, Coronary Artery Disease', 'David Bell (Son) - +1 (555) 012-4491', 'Dr. Evelyn Reed (St. Jude Hospital)')
ON CONFLICT (patient_id) DO NOTHING;

INSERT INTO public.doctors (doctor_id, user_id, name, specialty, license_number, hospital_affiliation, experience_years, rating, icon, availability) VALUES
('DOC-1029', 'DOC-1029', 'Dr. Evelyn Reed, MD', 'General Physician', 'MED-499201', 'St. Jude Memorial Hospital', 14, 4.90, 'fa-user-doctor', 'Today & Tomorrow')
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO public.vitals (patient_id, systolic_bp, diastolic_bp, heart_rate, glucose_mg_dl, spo2_percent, status) VALUES
('CN-88492', 120, 80, 74, 96, 99, 'Normal'),
('CN-73910', 128, 84, 76, 102, 98, 'Normal'),
('CN-51204', 142, 92, 88, 145, 96, 'Elevated')
ON CONFLICT DO NOTHING;

INSERT INTO public.medications (id, patient_id, name, frequency, purpose, is_active) VALUES
('m1', 'CN-88492', 'Metformin 500mg', 'Twice daily with meals', 'Pre-diabetes glycemic control', TRUE),
('m2', 'CN-88492', 'Albuterol Inhaler (90mcg)', 'As needed (PRN)', 'Asthma rescue inhaler for bronchospasms', TRUE),
('m3', 'CN-73910', 'Lisinopril 10mg', 'Once daily in morning', 'Essential Hypertension', TRUE),
('m4', 'CN-51204', 'Atorvastatin 20mg', 'Once daily at bedtime', 'Dyslipidemia and plaque stabilization', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.appointments (id, patient_id, doctor_id, doctor_name, specialty, appointment_date, time_slot, notes, status) VALUES
('apt-101', 'CN-88492', 'DOC-1029', 'Dr. Evelyn Reed, MD', 'General Physician', '2026-09-15', '10:00 AM', 'Follow-up HbA1c review & asthma assessment', 'Confirmed'),
('apt-102', 'CN-73910', 'DOC-1029', 'Dr. Evelyn Reed, MD', 'General Physician', '2026-09-15', '11:30 AM', 'Hypertension blood pressure check and medication titration', 'Confirmed'),
('apt-103', 'CN-51204', 'DOC-1029', 'Dr. Evelyn Reed, MD', 'General Physician', '2026-09-16', '02:00 PM', 'Cardiometabolic risk evaluation and lipid panel discussion', 'Confirmed')
ON CONFLICT (id) DO NOTHING;
