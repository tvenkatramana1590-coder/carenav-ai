require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { getDb, DB_PATH } = require('./db');

const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const vitalsRoutes = require('./routes/vitals.routes');
const medicationsRoutes = require('./routes/medications.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const triageRoutes = require('./routes/triage.routes');
const reportsRoutes = require('./routes/reports.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
const db = getDb();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stats', statsRoutes);

// Health Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        system: 'CareNav AI Healthcare Platform',
        version: '1.0.0',
        database: 'SQLite Native (carenav.db)',
        timestamp: new Date().toISOString()
    });
});

// Serve Frontend Static Assets (index.html, style.css, app.js)
const clientPath = path.resolve(__dirname, '..');
app.use(express.static(clientPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(clientPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
});

if (!process.env.VERCEL && require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n=============================================================`);
        console.log(`  🏥 CareNav AI Healthcare System — Express & SQLite Server`);
        console.log(`=============================================================`);
        console.log(`  🚀 Web Application : http://localhost:${PORT}`);
        console.log(`  📡 REST API Base   : http://localhost:${PORT}/api`);
        console.log(`  📊 System Health   : http://localhost:${PORT}/api/health`);
        console.log(`  💾 Database Engine : SQLite (${DB_PATH})`);
        console.log(`=============================================================\n`);
    });
}

module.exports = app;
