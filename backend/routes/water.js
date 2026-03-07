/**
 * Water Tracking Routes — Primary Feature
 * Intake logging, settings management, smart reminders, and history.
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../utils/checkBadges');

router.use(authenticate);

/**
 * POST /api/water/log — Log water intake
 */
router.post('/log', (req, res) => {
    const { amount_ml } = req.body;

    if (!amount_ml || amount_ml <= 0) {
        return res.status(400).json({ error: 'Valid amount_ml is required (> 0).' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
    INSERT INTO water_logs (id, user_id, amount_ml)
    VALUES (?, ?, ?)
  `).run(id, req.user.id, amount_ml);

    // Get updated today's total
    const today = db.prepare(`
    SELECT COALESCE(SUM(amount_ml), 0) as total
    FROM water_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
  `).get(req.user.id);

    const settings = db.prepare('SELECT * FROM water_settings WHERE user_id = ?').get(req.user.id);
    const progress = settings ? Math.min(100, Math.round((today.total / settings.daily_goal_ml) * 100)) : 0;

    const new_badges = checkAndAwardBadges(req.user.id);
    res.status(201).json({
        logged: { id, amount_ml },
        today_total_ml: today.total,
        daily_goal_ml: settings?.daily_goal_ml || 2500,
        progress_percent: progress,
        new_badges
    });
});

/**
 * GET /api/water/today — Get today's water intake details
 */
router.get('/today', (req, res) => {
    const db = getDb();

    const logs = db.prepare(`
    SELECT id, amount_ml, logged_at
    FROM water_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
    ORDER BY logged_at ASC
  `).all(req.user.id);

    const total = logs.reduce((sum, l) => sum + l.amount_ml, 0);
    const settings = db.prepare('SELECT * FROM water_settings WHERE user_id = ?').get(req.user.id);
    const goal = settings?.daily_goal_ml || 2500;

    // Hourly breakdown
    const hourlyMap = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
    logs.forEach(log => {
        const hour = new Date(log.logged_at).getHours();
        hourlyMap[hour] += log.amount_ml;
    });
    const hourly = Object.entries(hourlyMap).map(([hour, amount]) => ({ hour: parseInt(hour), amount_ml: amount }));

    res.json({
        logs,
        total_ml: total,
        daily_goal_ml: goal,
        progress_percent: Math.min(100, Math.round((total / goal) * 100)),
        cups_logged: logs.length,
        hourly_breakdown: hourly
    });
});

/**
 * GET /api/water/history — Get water history for N days
 */
router.get('/history', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const db = getDb();

    const history = db.prepare(`
    SELECT date(logged_at) as date, SUM(amount_ml) as total_ml, COUNT(*) as entries
    FROM water_logs
    WHERE user_id = ? AND logged_at >= datetime('now', ?)
    GROUP BY date(logged_at)
    ORDER BY date DESC
  `).all(req.user.id, `-${days} days`);

    const settings = db.prepare('SELECT daily_goal_ml FROM water_settings WHERE user_id = ?').get(req.user.id);
    const goal = settings?.daily_goal_ml || 2500;

    const enriched = history.map(day => ({
        ...day,
        goal_ml: goal,
        progress_percent: Math.min(100, Math.round((day.total_ml / goal) * 100)),
        goal_met: day.total_ml >= goal
    }));

    res.json(enriched);
});

/**
 * GET /api/water/settings — Get water settings
 */
router.get('/settings', (req, res) => {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM water_settings WHERE user_id = ?').get(req.user.id);
    const user = db.prepare('SELECT weight, wake_time, sleep_time FROM users WHERE id = ?').get(req.user.id);

    const suggested_goal = user?.weight ? Math.round(user.weight * 0.033 * 1000) : 2500;

    res.json({
        ...settings,
        wake_time: user?.wake_time || '07:00',
        sleep_time: user?.sleep_time || '23:00',
        suggested_goal_ml: suggested_goal
    });
});

/**
 * PUT /api/water/settings — Update water settings
 */
router.put('/settings', (req, res) => {
    const { daily_goal_ml, cup_size_ml, reminder_interval_minutes, reminders_enabled } = req.body;
    const db = getDb();

    const fields = [];
    const values = [];

    if (daily_goal_ml !== undefined) { fields.push('daily_goal_ml = ?'); values.push(daily_goal_ml); }
    if (cup_size_ml !== undefined) { fields.push('cup_size_ml = ?'); values.push(cup_size_ml); }
    if (reminder_interval_minutes !== undefined) { fields.push('reminder_interval_minutes = ?'); values.push(reminder_interval_minutes); }
    if (reminders_enabled !== undefined) { fields.push('reminders_enabled = ?'); values.push(reminders_enabled ? 1 : 0); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    fields.push("updated_at = datetime('now')");
    values.push(req.user.id);

    db.prepare(`UPDATE water_settings SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM water_settings WHERE user_id = ?').get(req.user.id);
    res.json(updated);
});

/**
 * GET /api/water/reminders — Compute smart reminder schedule
 * Returns the times a user should be reminded to drink water today.
 */
router.get('/reminders', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT wake_time, sleep_time FROM users WHERE id = ?').get(req.user.id);
    const settings = db.prepare('SELECT * FROM water_settings WHERE user_id = ?').get(req.user.id);

    const wakeTime = user?.wake_time || '07:00';
    const sleepTime = user?.sleep_time || '23:00';
    const interval = settings?.reminder_interval_minutes || 90;
    const cupSize = settings?.cup_size_ml || 250;
    const dailyGoal = settings?.daily_goal_ml || 2500;

    // Calculate reminder times
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    const [sleepH, sleepM] = sleepTime.split(':').map(Number);

    const wakeMinutes = wakeH * 60 + wakeM;
    const sleepMinutes = sleepH * 60 + sleepM;
    const awakeMinutes = sleepMinutes > wakeMinutes
        ? sleepMinutes - wakeMinutes
        : (24 * 60 - wakeMinutes) + sleepMinutes;

    const reminders = [];
    let currentMinute = wakeMinutes;
    const cupsNeeded = Math.ceil(dailyGoal / cupSize);

    for (let i = 0; i < Math.ceil(awakeMinutes / interval); i++) {
        const mins = (currentMinute + i * interval) % (24 * 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        reminders.push({
            time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            cup_number: i + 1,
            amount_ml: cupSize
        });
    }

    res.json({
        wake_time: wakeTime,
        sleep_time: sleepTime,
        interval_minutes: interval,
        cup_size_ml: cupSize,
        daily_goal_ml: dailyGoal,
        cups_needed: cupsNeeded,
        reminders: reminders.slice(0, cupsNeeded + 2)
    });
});

/**
 * DELETE /api/water/log/:id — Delete a water log entry
 */
router.delete('/log/:id', (req, res) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM water_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Log entry not found.' });
    res.json({ message: 'Water log deleted.' });
});

module.exports = router;
