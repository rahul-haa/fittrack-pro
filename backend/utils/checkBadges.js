/**
 * Badge checking utility — checks if user has unlocked any new badges
 * after an action like logging a workout or water intake.
 */
const { getDb } = require('../db/schema');
const { v4: uuidv4 } = require('uuid');

function checkAndAwardBadges(userId) {
    const db = getDb();
    const newlyEarned = [];

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return newlyEarned;

    // Get all badges
    const allBadges = db.prepare('SELECT * FROM badges').all();
    const earnedIds = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId).map(b => b.badge_id);

    // Workout stats
    const workoutCount = db.prepare('SELECT COUNT(*) as count FROM workout_logs WHERE user_id = ?').get(userId)?.count || 0;
    const totalCalories = db.prepare('SELECT COALESCE(SUM(calories_burned),0) as total FROM workout_logs WHERE user_id = ?').get(userId)?.total || 0;

    // Water stats
    const todayWater = db.prepare(`SELECT COALESCE(SUM(amount_ml),0) as total FROM water_logs WHERE user_id = ? AND DATE(logged_at)=DATE('now')`).get(userId)?.total || 0;
    const waterSettings = db.prepare('SELECT daily_goal_ml FROM water_settings WHERE user_id = ?').get(userId);
    const waterGoal = waterSettings?.daily_goal_ml || 2500;

    // Badge conditions
    const conditions = {
        'First Steps': workoutCount >= 1,
        'Step Star': (user.xp_points || 0) >= 500,
        'Hydration Hero': todayWater >= waterGoal,
        'Week Warrior': (user.streak_count || 0) >= 7,
        'Monthly Master': (user.streak_count || 0) >= 30,
        'Calorie Crusher': totalCalories >= 5000,
        'Iron Will': workoutCount >= 50,
        'Social Butterfly': false, // handled separately
        'Early Bird': new Date().getHours() < 7,
        'Centurion': workoutCount >= 100,
        'Streak Master': (user.streak_count || 0) >= 100,
        'Perfectionist': todayWater >= waterGoal && workoutCount >= 1,
        'Night Owl': new Date().getHours() >= 22,
        'Community Champion': false, // handled separately
    };

    for (const badge of allBadges) {
        if (earnedIds.includes(badge.id)) continue;
        const shouldEarn = conditions[badge.name];
        if (shouldEarn) {
            const id = uuidv4();
            try {
                db.prepare('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)').run(id, userId, badge.id);
                // Award XP
                db.prepare('UPDATE users SET xp_points = xp_points + ? WHERE id = ?').run(badge.xp_reward || 0, userId);
                // Update badges_earned count
                db.prepare('UPDATE users SET badges_earned = (SELECT COUNT(*) FROM user_badges WHERE user_id = ?) WHERE id = ?').run(userId, userId);
                newlyEarned.push({
                    id: badge.id,
                    name: badge.name,
                    icon: badge.icon,
                    description: badge.description,
                    xp_reward: badge.xp_reward,
                });
            } catch (e) {
                // Already earned, skip
            }
        }
    }

    return newlyEarned;
}

module.exports = { checkAndAwardBadges };
