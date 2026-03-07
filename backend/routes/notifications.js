/**
 * Notification Routes — CRUD and preferences
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/notifications — User's notifications
 */
router.get('/', (req, res) => {
    const db = getDb();
    const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);

    res.json({ notifications, unread_count: unreadCount.count });
});

/**
 * PUT /api/notifications/:id/read — Mark as read
 */
router.put('/:id/read', (req, res) => {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Marked as read.' });
});

/**
 * PUT /api/notifications/read-all — Mark all as read
 */
router.put('/read-all', (req, res) => {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read.' });
});

/**
 * GET /api/notifications/preferences — Get notification preferences
 */
router.get('/preferences', (req, res) => {
    const db = getDb();
    const prefs = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(req.user.id);
    res.json(prefs || {});
});

/**
 * PUT /api/notifications/preferences — Update notification preferences
 */
router.put('/preferences', (req, res) => {
    const db = getDb();
    const { workout_reminders, hydration_reminders, meal_reminders, daily_checkin, streak_warnings, social_notifications, quiet_hours_start, quiet_hours_end } = req.body;

    const fields = [];
    const values = [];

    if (workout_reminders !== undefined) { fields.push('workout_reminders = ?'); values.push(workout_reminders ? 1 : 0); }
    if (hydration_reminders !== undefined) { fields.push('hydration_reminders = ?'); values.push(hydration_reminders ? 1 : 0); }
    if (meal_reminders !== undefined) { fields.push('meal_reminders = ?'); values.push(meal_reminders ? 1 : 0); }
    if (daily_checkin !== undefined) { fields.push('daily_checkin = ?'); values.push(daily_checkin ? 1 : 0); }
    if (streak_warnings !== undefined) { fields.push('streak_warnings = ?'); values.push(streak_warnings ? 1 : 0); }
    if (social_notifications !== undefined) { fields.push('social_notifications = ?'); values.push(social_notifications ? 1 : 0); }
    if (quiet_hours_start !== undefined) { fields.push('quiet_hours_start = ?'); values.push(quiet_hours_start); }
    if (quiet_hours_end !== undefined) { fields.push('quiet_hours_end = ?'); values.push(quiet_hours_end); }

    if (fields.length > 0) {
        fields.push("updated_at = datetime('now')");
        values.push(req.user.id);
        db.prepare(`UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(req.user.id);
    res.json(updated);
});

module.exports = router;
