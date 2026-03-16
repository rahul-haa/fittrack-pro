/**
 * Fitness Application — Server Entry Point
 * Initializes Express, mounts all route modules, starts the API server.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database on startup
const { getDb } = require('./db/schema');
getDb();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
    origin: true, // This reflects the incoming origin, preventing CORS errors
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (dev mode) ────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`  ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
        });
        next();
    });
}

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/water', require('./routes/water'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/nutrition', require('./routes/nutrition'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/social', require('./routes/social'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── 404 Handler ──────────────────────────────────────────
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});

// ─── Serve Frontend (Production) ──────────────────────────
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🏋️  Fitness App API Server              ║
  ║  📡  http://localhost:${PORT}               ║
  ║  🔧  Environment: ${process.env.NODE_ENV || 'development'}        ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
