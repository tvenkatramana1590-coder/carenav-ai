-- ==========================================================
-- CareNav AI — Relational Healthcare Database Schema (SQL)
-- Compatible with PostgreSQL, MySQL, and SQLite
-- ==========================================================

-- 1. USERS TABLE (Authentication & Role Management)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENTS TABLE (Demographics & Medical Profile)
CREATE TABLE patients (
    patient_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    age INT CHECK (age > 0),
    gender VARCHAR(20),
    blood_group VARCHAR(20) NOT NULL,
    allergies TEXT,                       -- JSON or comma-separated list
    chronic_conditions TEXT,              -- JSON or comma-separated list
    emergency_contact VARCHAR(255),
    primary_physician VARCHAR(150),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. DOCTORS TABLE (Specialties & Hospital Affiliation)
CREATE TABLE doctors (
    doctor_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    hospital_affiliation VARCHAR(150),
    experience_years INT DEFAULT 5,
    rating DECIMAL(3, 2) DEFAULT 4.90,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. VITALS TABLE (Biometric Monitoring & Longitudinal EHR)
CREATE TABLE vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,     -- (In PostgreSQL use SERIAL)
    patient_id VARCHAR(50) NOT NULL,
    systolic_bp INT NOT NULL,              -- e.g. 120 mmHg
    diastolic_bp INT NOT NULL,             -- e.g. 80 mmHg
    heart_rate INT NOT NULL,               -- e.g. 74 bpm
    glucose_mg_dl INT NOT NULL,            -- e.g. 96 mg/dL
    spo2_percent INT NOT NULL,             -- e.g. 99%
    status VARCHAR(20) DEFAULT 'Normal' CHECK (status IN ('Normal', 'Elevated', 'High')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- 5. MEDICATIONS TABLE (Active Prescription Regimens)
CREATE TABLE medications (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,            -- e.g. Metformin 500mg
    frequency VARCHAR(100) NOT NULL,       -- e.g. Twice daily with meals
    purpose TEXT,                          -- e.g. Pre-diabetes glycemic control
    is_active BOOLEAN DEFAULT TRUE,
    prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- 6. APPOINTMENTS TABLE (Care Navigation & Clinical Bookings)
CREATE TABLE appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Completed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- 7. TRIAGE_LOGS TABLE (AI Clinical Symptom Assessments)
CREATE TABLE triage_logs (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    symptoms_text TEXT NOT NULL,
    pain_severity INT CHECK (pain_severity BETWEEN 1 AND 10),
    urgency_level VARCHAR(50) NOT NULL,    -- Emergency, Urgent, Routine, Self-Care
    recommended_specialist VARCHAR(100),
    potential_differentials TEXT,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- ==========================================================
-- SAMPLE SEED DATA
-- ==========================================================

-- Seed Users
INSERT INTO users (id, name, email, password_hash, role) VALUES
('CN-88492', 'Alex Morgan', 'alex.morgan@healthmail.com', 'password123', 'patient'),
('DOC-1029', 'Dr. Evelyn Reed, MD', 'dr.reed@stjude.org', 'doctor123', 'doctor');

-- Seed Patient
INSERT INTO patients (patient_id, user_id, age, gender, blood_group, allergies, chronic_conditions, emergency_contact, primary_physician) VALUES
('CN-88492', 'CN-88492', 34, 'Male', 'O Positive (Rh+)', 'Penicillin, Peanuts', 'Mild Asthma, Pre-diabetes', 'Sarah Morgan (+1 555-019-2834)', 'Dr. Evelyn Reed (St. Jude Hospital)');

-- Seed Doctor
INSERT INTO doctors (doctor_id, user_id, specialty, license_number, hospital_affiliation, experience_years, rating) VALUES
('DOC-1029', 'DOC-1029', 'General Physician', 'MED-499201', 'St. Jude Memorial Hospital', 14, 4.90);

-- Seed Vitals
INSERT INTO vitals (patient_id, systolic_bp, diastolic_bp, heart_rate, glucose_mg_dl, spo2_percent, status) VALUES
('CN-88492', 120, 80, 74, 96, 99, 'Normal'),
('CN-88492', 124, 82, 78, 104, 98, 'Normal'),
('CN-88492', 135, 88, 82, 112, 98, 'Elevated');

-- Seed Medications
INSERT INTO medications (id, patient_id, name, frequency, purpose) VALUES
('m1', 'CN-88492', 'Metformin 500mg', 'Twice daily with meals', 'Pre-diabetes blood glucose control'),
('m2', 'CN-88492', 'Albuterol Inhaler (90mcg)', 'As needed (PRN)', 'Asthma rescue inhaler'),
('m3', 'CN-88492', 'Vitamin D3 (2000 IU)', 'Once daily in morning', 'Nutritional bone & immune support');
