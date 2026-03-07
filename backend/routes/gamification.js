/**
 * Gamification Routes — Badges, XP, streaks, leaderboard
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/gamification/badges — All available badges with earned status
 */
router.get('/badges', (req, res) => {
    const db = getDb();
    const badges = db.prepare(`
    SELECT b.*,
      CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as earned,
      ub.earned_at
    FROM badges b
    LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
    ORDER BY earned DESC, b.name ASC
  `).all(req.user.id);
    res.json(badges);
});

/**
 * GET /api/gamification/xp — User XP and level
 */
router.get('/xp', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT xp_points FROM users WHERE id = ?').get(req.user.id);

    // Level calculation: level = floor(xp / 100) + 1
    const level = Math.floor((user?.xp_points || 0) / 100) + 1;
    const xpForNextLevel = level * 100;
    const xpProgress = (user?.xp_points || 0) % 100;

    res.json({
        total_xp: user?.xp_points || 0,
        level,
        xp_for_next_level: xpForNextLevel,
        xp_progress: xpProgress,
        xp_progress_percent: xpProgress
    });
});

/**
 * GET /api/gamification/streak — Streak info
 */
router.get('/streak', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT streak_count, streak_freeze_available FROM users WHERE id = ?').get(req.user.id);

    res.json({
        current_streak: user?.streak_count || 0,
        freeze_available: user?.streak_freeze_available || 0,
        streak_description: getStreakDescription(user?.streak_count || 0)
    });
});

/**
 * POST /api/gamification/streak/freeze — Use streak freeze
 */
router.post('/streak/freeze', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT streak_freeze_available FROM users WHERE id = ?').get(req.user.id);

    if (!user || user.streak_freeze_available <= 0) {
        return res.status(400).json({ error: 'No streak freezes available.' });
    }

    db.prepare('UPDATE users SET streak_freeze_available = streak_freeze_available - 1 WHERE id = ?').run(req.user.id);
    res.json({ message: 'Streak freeze applied!', remaining_freezes: user.streak_freeze_available - 1 });
});

/**
 * GET /api/gamification/leaderboard — Weekly leaderboard
 */
router.get('/leaderboard', (req, res) => {
    const type = req.query.type || 'xp'; // xp, steps, calories, workouts
    const db = getDb();

    let leaderboard;
    switch (type) {
        case 'steps':
            leaderboard = db.prepare(`
        SELECT u.id, u.name, u.avatar_url, COALESCE(SUM(wl.steps), 0) as value
        FROM users u
        LEFT JOIN workout_logs wl ON u.id = wl.user_id AND wl.logged_at >= datetime('now', '-7 days')
        GROUP BY u.id
        ORDER BY value DESC
        LIMIT 20
      `).all();
            break;
        case 'calories':
            leaderboard = db.prepare(`
        SELECT u.id, u.name, u.avatar_url, COALESCE(SUM(wl.calories_burned), 0) as value
        FROM users u
        LEFT JOIN workout_logs wl ON u.id = wl.user_id AND wl.logged_at >= datetime('now', '-7 days')
        GROUP BY u.id
        ORDER BY value DESC
        LIMIT 20
      `).all();
            break;
        case 'workouts':
            leaderboard = db.prepare(`
        SELECT u.id, u.name, u.avatar_url, COUNT(wl.id) as value
        FROM users u
        LEFT JOIN workout_logs wl ON u.id = wl.user_id AND wl.logged_at >= datetime('now', '-7 days')
        GROUP BY u.id
        ORDER BY value DESC
        LIMIT 20
      `).all();
            break;
        default:
            leaderboard = db.prepare(`
        SELECT id, name, avatar_url, xp_points as value
        FROM users
        ORDER BY xp_points DESC
        LIMIT 20
      `).all();
    }

    // Add rank
    const ranked = leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry,
        is_current_user: entry.id === req.user.id
    }));

    res.json({ type, leaderboard: ranked });
});

function getStreakDescription(count) {
    if (count >= 365) return '🏆 Legendary! One year+!';
    if (count >= 100) return '💎 Diamond streak!';
    if (count >= 30) return '🔥 On fire!';
    if (count >= 7) return '⚡ Great momentum!';
    if (count >= 3) return '🌱 Growing strong!';
    if (count >= 1) return '✨ Keep going!';
    return '💪 Start your streak today!';
}

module.exports = router;
