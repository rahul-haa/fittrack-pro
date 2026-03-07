/**
 * Dashboard Routes — Aggregated data for the main dashboard view
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/dashboard — Main dashboard data
 * Returns all summary data in a single call for performance.
 */
router.get('/', (req, res) => {
    const period = req.query.period || 'daily'; // daily, weekly, monthly
    const db = getDb();
    const userId = req.user.id;

    let dateFilter;
    switch (period) {
        case 'weekly': dateFilter = '-7 days'; break;
        case 'monthly': dateFilter = '-30 days'; break;
        default: dateFilter = '-1 days'; break;
    }

    // User info
    const user = db.prepare(`
    SELECT name, avatar_url, xp_points, streak_count, streak_freeze_available, subscription
    FROM users WHERE id = ?
  `).get(userId);

    // Calories burned (workout logs)
    const calorieData = db.prepare(`
    SELECT date(logged_at) as date, SUM(calories_burned) as calories
    FROM workout_logs
    WHERE user_id = ? AND logged_at >= datetime('now', ?)
    GROUP BY date(logged_at)
    ORDER BY date ASC
  `).all(userId, dateFilter);

    // Active minutes
    const activeMinutes = db.prepare(`
    SELECT date(logged_at) as date, SUM(duration_minutes) as minutes
    FROM workout_logs
    WHERE user_id = ? AND logged_at >= datetime('now', ?)
    GROUP BY date(logged_at)
    ORDER BY date ASC
  `).all(userId, dateFilter);

    // Step count (total from workout logs)
    const steps = db.prepare(`
    SELECT COALESCE(SUM(steps), 0) as total_steps
    FROM workout_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
  `).get(userId);

    // Water intake today
    const water = db.prepare(`
    SELECT COALESCE(SUM(amount_ml), 0) as total_ml
    FROM water_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
  `).get(userId);

    const waterSettings = db.prepare('SELECT daily_goal_ml FROM water_settings WHERE user_id = ?').get(userId);

    // Workouts completed this period
    const workoutsCompleted = db.prepare(`
    SELECT COUNT(*) as count
    FROM workout_logs
    WHERE user_id = ? AND logged_at >= datetime('now', ?)
  `).get(userId, dateFilter);

    // Calories consumed today
    const caloriesConsumed = db.prepare(`
    SELECT COALESCE(SUM(calories), 0) as total
    FROM nutrition_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
  `).get(userId);

    // Recent badges
    const recentBadges = db.prepare(`
    SELECT b.name, b.icon, b.description, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.earned_at DESC
    LIMIT 5
  `).all(userId);

    // Goals progress
    const goals = db.prepare(`
    SELECT type, target_value, current_value, unit,
      CASE WHEN target_value > 0 THEN ROUND((current_value / target_value) * 100, 1) ELSE 0 END as progress_percent
    FROM goals WHERE user_id = ?
  `).all(userId);

    // Weekly calorie trend (for chart)
    const weeklyCalories = db.prepare(`
    SELECT date(logged_at) as date, SUM(calories_burned) as burned
    FROM workout_logs
    WHERE user_id = ? AND logged_at >= datetime('now', '-7 days')
    GROUP BY date(logged_at)
    ORDER BY date ASC
  `).all(userId);

    // Weekly water trend
    const weeklyWater = db.prepare(`
    SELECT date(logged_at) as date, SUM(amount_ml) as total_ml
    FROM water_logs
    WHERE user_id = ? AND logged_at >= datetime('now', '-7 days')
    GROUP BY date(logged_at)
    ORDER BY date ASC
  `).all(userId);

    res.json({
        user,
        summary: {
            streak: user.streak_count,
            xp: user.xp_points,
            workouts_completed: workoutsCompleted.count,
            calories_burned_today: calorieData.reduce((sum, d) => sum + d.calories, 0),
            calories_consumed_today: caloriesConsumed.total,
            steps_today: steps.total_steps,
            water_today_ml: water.total_ml,
            water_goal_ml: waterSettings?.daily_goal_ml || 2500,
            water_progress: Math.min(100, Math.round((water.total_ml / (waterSettings?.daily_goal_ml || 2500)) * 100))
        },
        charts: {
            calories: calorieData,
            active_minutes: activeMinutes,
            weekly_calories: weeklyCalories,
            weekly_water: weeklyWater
        },
        goals,
        recent_badges: recentBadges,
        period
    });
});

/**
 * GET /api/dashboard/activity — Detailed activity feed
 */
router.get('/activity', (req, res) => {
    const db = getDb();
    const userId = req.user.id;

    const activities = db.prepare(`
    SELECT 'workout' as type, id, activity_type as subtype, duration_minutes, calories_burned, logged_at
    FROM workout_logs WHERE user_id = ?
    UNION ALL
    SELECT 'water' as type, id, 'hydration' as subtype, amount_ml as duration_minutes, 0 as calories_burned, logged_at
    FROM water_logs WHERE user_id = ?
    UNION ALL
    SELECT 'nutrition' as type, id, meal_type as subtype, calories as duration_minutes, 0 as calories_burned, logged_at
    FROM nutrition_logs WHERE user_id = ?
    ORDER BY logged_at DESC
    LIMIT 20
  `).all(userId, userId, userId);

    res.json(activities);
});

module.exports = router;
