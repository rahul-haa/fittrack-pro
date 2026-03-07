/**
 * Auth Routes — Registration, Login, Token Refresh, Logout
 * JWT-based authentication with secure refresh token rotation.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/** Generate access + refresh token pair */
function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRY }
    );
    return { accessToken, refreshToken };
}

/**
 * POST /api/auth/register
 * Creates a new user with onboarding data.
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, age, weight, height, gender, fitness_level } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required.' });
        }

        const db = getDb();

        // Check if email already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = uuidv4();

        db.prepare(`
      INSERT INTO users (id, email, password_hash, name, age, weight, height, gender, fitness_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, name, age || null, weight || null, height || null, gender || null, fitness_level || 'beginner');

        // Auto-create water settings based on weight
        const dailyGoal = weight ? Math.round(weight * 0.033 * 1000) : 2500;
        db.prepare(`
      INSERT INTO water_settings (user_id, daily_goal_ml)
      VALUES (?, ?)
    `).run(userId, dailyGoal);

        // Auto-create notification preferences
        db.prepare(`INSERT INTO notification_preferences (user_id) VALUES (?)`).run(userId);

        const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(userId);
        const tokens = generateTokens(user);

        // Store refresh token
        const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), userId, tokens.refreshToken, refreshExpiry);

        res.status(201).json({
            message: 'Registration successful',
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            ...tokens
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT pair.
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const tokens = generateTokens(user);

        // Store refresh token
        const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), user.id, tokens.refreshToken, refreshExpiry);

        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url },
            ...tokens
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

/**
 * POST /api/auth/refresh
 * Issues a new access token using a valid refresh token.
 */
router.post('/refresh', (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required.' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const db = getDb();

        const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?').get(refreshToken, decoded.id);
        if (!stored) {
            return res.status(403).json({ error: 'Invalid refresh token.' });
        }

        const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Rotate: delete old, issue new
        db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);

        const tokens = generateTokens(user);
        const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), user.id, tokens.refreshToken, refreshExpiry);

        res.json(tokens);
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(403).json({ error: 'Invalid or expired refresh token.' });
    }
});

/**
 * POST /api/auth/logout
 * Invalidates refresh token.
 */
router.post('/logout', (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        const db = getDb();
        db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    }
    res.json({ message: 'Logged out successfully.' });
});

/**
 * POST /api/auth/google
 * Google OAuth — verify Google ID token & auto-register/login
 */
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential required.' });
        }

        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        const db = getDb();
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            // Auto-register new Google user
            const userId = uuidv4();
            const randomPassword = await bcrypt.hash(uuidv4(), 12);
            db.prepare(`
                INSERT INTO users (id, email, password_hash, name, avatar_url, oauth_provider, oauth_id)
                VALUES (?, ?, ?, ?, ?, 'google', ?)
            `).run(userId, email, randomPassword, name, picture || null, googleId);

            // Auto-create defaults
            db.prepare('INSERT INTO water_settings (user_id, daily_goal_ml) VALUES (?, 2500)').run(userId);
            db.prepare('INSERT INTO notification_preferences (user_id) VALUES (?)').run(userId);

            user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        }

        const tokens = generateTokens(user);
        const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(uuidv4(), user.id, tokens.refreshToken, refreshExpiry);

        res.json({
            message: 'Google login successful',
            user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url },
            ...tokens
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(401).json({ error: 'Google authentication failed.' });
    }
});

module.exports = router;
