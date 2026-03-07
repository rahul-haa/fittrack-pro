/**
 * User Routes — Profile management
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users/me — Get current user profile
 */
router.get('/me', (req, res) => {
    const db = getDb();
    const user = db.prepare(`
    SELECT id, email, name, avatar_url, age, weight, height, gender,
           fitness_level, role, subscription, xp_points, streak_count,
           streak_freeze_available, wake_time, sleep_time, created_at
    FROM users WHERE id = ?
  `).get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Get earned badges count
    const badgeCount = db.prepare('SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?').get(req.user.id);
    // Get total workouts
    const workoutCount = db.prepare('SELECT COUNT(*) as count FROM workout_logs WHERE user_id = ?').get(req.user.id);

    res.json({
        ...user,
        badges_earned: badgeCount.count,
        total_workouts: workoutCount.count
    });
});

/**
 * PUT /api/users/me — Update user profile
 */
router.put('/me', (req, res) => {
    const { name, age, weight, height, gender, fitness_level, avatar_url, wake_time, sleep_time } = req.body;
    const db = getDb();

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (age !== undefined) { fields.push('age = ?'); values.push(age); }
    if (weight !== undefined) { fields.push('weight = ?'); values.push(weight); }
    if (height !== undefined) { fields.push('height = ?'); values.push(height); }
    if (gender !== undefined) { fields.push('gender = ?'); values.push(gender); }
    if (fitness_level !== undefined) { fields.push('fitness_level = ?'); values.push(fitness_level); }
    if (avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(avatar_url); }
    if (wake_time !== undefined) { fields.push('wake_time = ?'); values.push(wake_time); }
    if (sleep_time !== undefined) { fields.push('sleep_time = ?'); values.push(sleep_time); }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update.' });
    }

    fields.push("updated_at = datetime('now')");
    values.push(req.user.id);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // If weight changed, update water goal suggestion
    if (weight !== undefined) {
        const newGoal = Math.round(weight * 0.033 * 1000);
        db.prepare('UPDATE water_settings SET daily_goal_ml = ? WHERE user_id = ?').run(newGoal, req.user.id);
    }

    const updated = db.prepare('SELECT id, email, name, avatar_url, age, weight, height, gender, fitness_level, xp_points, streak_count FROM users WHERE id = ?').get(req.user.id);
    res.json(updated);
});

/**
 * GET /api/users/leaderboard — XP leaderboard
 */
router.get('/leaderboard', (req, res) => {
    const db = getDb();
    const leaderboard = db.prepare(`
    SELECT id, name, avatar_url, xp_points, streak_count
    FROM users
    ORDER BY xp_points DESC
    LIMIT 20
  `).all();

    res.json(leaderboard);
});

module.exports = router;
