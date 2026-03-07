/**
 * Database Seed Script
 * Populates the fitness database with sample exercises, food items, badges, and a demo user.
 * Run: npm run seed
 */

const { getDb } = require('./schema');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function seed() {
    const db = getDb();
    console.log('🌱 Seeding database...\n');

    // ─── Demo User ──────────────────────────────────────────
    const demoUserId = uuidv4();
    const hashedPassword = await bcrypt.hash('demo1234', 10);

    db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, age, weight, height, gender, fitness_level, xp_points, streak_count)
    VALUES (?, 'demo@fittrack.com', ?, 'Alex Johnson', 28, 75, 178, 'male', 'intermediate', 1250, 7)
  `).run(demoUserId, hashedPassword);

    // Water settings for demo user
    db.prepare(`
    INSERT OR IGNORE INTO water_settings (user_id, daily_goal_ml, cup_size_ml, reminder_interval_minutes)
    VALUES (?, 2475, 250, 90)
  `).run(demoUserId);

    // Notification preferences
    db.prepare(`
    INSERT OR IGNORE INTO notification_preferences (user_id)
    VALUES (?)
  `).run(demoUserId);

    console.log('  ✅ Demo user created (demo@fittrack.com / demo1234)');

    // ─── Exercises Library (50+) ────────────────────────────
    const exercises = [
        // Strength — Chest
        { name: 'Push-ups', muscle_group: 'chest', equipment: 'none', intensity: 'medium', type: 'strength', calories_per_minute: 7, instructions: 'Start in plank position, lower body until chest nearly touches floor, push back up.', sets: 3, reps: 15 },
        { name: 'Bench Press', muscle_group: 'chest', equipment: 'barbell', intensity: 'high', type: 'strength', calories_per_minute: 8, instructions: 'Lie on bench, grip barbell at shoulder width, lower to chest, press up.', sets: 4, reps: 10 },
        { name: 'Dumbbell Flyes', muscle_group: 'chest', equipment: 'dumbbells', intensity: 'medium', type: 'strength', calories_per_minute: 6, instructions: 'Lie on bench with dumbbells, arms extended, lower in arc to sides, squeeze back up.', sets: 3, reps: 12 },
        { name: 'Incline Press', muscle_group: 'chest', equipment: 'dumbbells', intensity: 'high', type: 'strength', calories_per_minute: 8, instructions: 'Set bench to 30-45 degrees, press dumbbells from chest to full extension.', sets: 4, reps: 10 },
        // Strength — Back
        { name: 'Pull-ups', muscle_group: 'back', equipment: 'pull-up bar', intensity: 'high', type: 'strength', calories_per_minute: 9, instructions: 'Hang from bar with overhand grip, pull until chin clears bar, lower controlled.', sets: 3, reps: 8 },
        { name: 'Bent-over Rows', muscle_group: 'back', equipment: 'barbell', intensity: 'high', type: 'strength', calories_per_minute: 7, instructions: 'Hinge at hips, pull barbell to lower chest, squeeze shoulder blades.', sets: 4, reps: 10 },
        { name: 'Lat Pulldown', muscle_group: 'back', equipment: 'cable machine', intensity: 'medium', type: 'strength', calories_per_minute: 6, instructions: 'Sit at machine, pull bar to upper chest, control the return.', sets: 3, reps: 12 },
        { name: 'Deadlift', muscle_group: 'back', equipment: 'barbell', intensity: 'high', type: 'strength', calories_per_minute: 10, instructions: 'Stand over barbell, grip at shoulder width, drive through heels to stand.', sets: 4, reps: 8 },
        // Strength — Legs
        { name: 'Barbell Squats', muscle_group: 'legs', equipment: 'barbell', intensity: 'high', type: 'strength', calories_per_minute: 9, instructions: 'Bar on upper back, feet shoulder-width, squat until thighs are parallel.', sets: 4, reps: 10 },
        { name: 'Lunges', muscle_group: 'legs', equipment: 'none', intensity: 'medium', type: 'strength', calories_per_minute: 7, instructions: 'Step forward, lower back knee toward floor, push back to standing.', sets: 3, reps: 12 },
        { name: 'Leg Press', muscle_group: 'legs', equipment: 'machine', intensity: 'medium', type: 'strength', calories_per_minute: 7, instructions: 'Sit in machine, press platform until legs are nearly extended, lower slowly.', sets: 4, reps: 12 },
        { name: 'Calf Raises', muscle_group: 'legs', equipment: 'none', intensity: 'low', type: 'strength', calories_per_minute: 4, instructions: 'Stand on edge of step, raise heels as high as possible, lower slowly.', sets: 3, reps: 20 },
        { name: 'Bulgarian Split Squats', muscle_group: 'legs', equipment: 'dumbbells', intensity: 'high', type: 'strength', calories_per_minute: 8, instructions: 'Rear foot on bench, front foot forward, lower into lunge.', sets: 3, reps: 10 },
        // Strength — Shoulders
        { name: 'Overhead Press', muscle_group: 'shoulders', equipment: 'barbell', intensity: 'high', type: 'strength', calories_per_minute: 7, instructions: 'Press barbell from shoulders to overhead, lock out arms.', sets: 4, reps: 8 },
        { name: 'Lateral Raises', muscle_group: 'shoulders', equipment: 'dumbbells', intensity: 'medium', type: 'strength', calories_per_minute: 5, instructions: 'Arms at sides, raise dumbbells laterally to shoulder height.', sets: 3, reps: 15 },
        { name: 'Front Raises', muscle_group: 'shoulders', equipment: 'dumbbells', intensity: 'medium', type: 'strength', calories_per_minute: 5, instructions: 'Arms at sides, raise dumbbells forward to shoulder height.', sets: 3, reps: 12 },
        // Strength — Arms
        { name: 'Bicep Curls', muscle_group: 'arms', equipment: 'dumbbells', intensity: 'medium', type: 'strength', calories_per_minute: 5, instructions: 'Stand with dumbbells, curl to shoulders keeping elbows fixed.', sets: 3, reps: 12 },
        { name: 'Tricep Dips', muscle_group: 'arms', equipment: 'parallel bars', intensity: 'high', type: 'strength', calories_per_minute: 7, instructions: 'Support body on bars, lower until elbows at 90°, press back up.', sets: 3, reps: 10 },
        { name: 'Hammer Curls', muscle_group: 'arms', equipment: 'dumbbells', intensity: 'medium', type: 'strength', calories_per_minute: 5, instructions: 'Hold dumbbells with neutral grip, curl to shoulders.', sets: 3, reps: 12 },
        { name: 'Skull Crushers', muscle_group: 'arms', equipment: 'barbell', intensity: 'medium', type: 'strength', calories_per_minute: 5, instructions: 'Lie on bench, lower barbell to forehead, extend arms.', sets: 3, reps: 10 },
        // Strength — Core
        { name: 'Plank', muscle_group: 'core', equipment: 'none', intensity: 'medium', type: 'strength', calories_per_minute: 5, instructions: 'Hold push-up position on forearms, keep body straight, engage core.', sets: 3, reps: 60 },
        { name: 'Crunches', muscle_group: 'core', equipment: 'none', intensity: 'low', type: 'strength', calories_per_minute: 4, instructions: 'Lie on back, hands behind head, curl upper body toward knees.', sets: 3, reps: 20 },
        { name: 'Russian Twists', muscle_group: 'core', equipment: 'none', intensity: 'medium', type: 'strength', calories_per_minute: 6, instructions: 'Sit with knees bent, lean back slightly, rotate torso side to side.', sets: 3, reps: 20 },
        { name: 'Leg Raises', muscle_group: 'core', equipment: 'none', intensity: 'medium', type: 'strength', calories_per_minute: 5, instructions: 'Lie flat, raise straight legs to 90°, lower slowly without touching floor.', sets: 3, reps: 15 },
        { name: 'Mountain Climbers', muscle_group: 'core', equipment: 'none', intensity: 'high', type: 'hiit', calories_per_minute: 10, instructions: 'In plank position, alternate driving knees to chest rapidly.', sets: 3, reps: 30 },
        // Cardio
        { name: 'Running', muscle_group: 'full body', equipment: 'none', intensity: 'high', type: 'cardio', calories_per_minute: 11, instructions: 'Run at moderate to high pace. Maintain proper form and breathing.', sets: 1, reps: 1 },
        { name: 'Jump Rope', muscle_group: 'full body', equipment: 'jump rope', intensity: 'high', type: 'cardio', calories_per_minute: 12, instructions: 'Jump with both feet, swing rope with wrists. Start with 1 min intervals.', sets: 5, reps: 60 },
        { name: 'Cycling', muscle_group: 'legs', equipment: 'bicycle', intensity: 'medium', type: 'cardio', calories_per_minute: 8, instructions: 'Maintain steady cadence. Adjust resistance for intensity.', sets: 1, reps: 1 },
        { name: 'Burpees', muscle_group: 'full body', equipment: 'none', intensity: 'high', type: 'hiit', calories_per_minute: 12, instructions: 'Squat, jump back to plank, push-up, jump forward, jump up. Repeat.', sets: 3, reps: 10 },
        { name: 'High Knees', muscle_group: 'legs', equipment: 'none', intensity: 'high', type: 'hiit', calories_per_minute: 9, instructions: 'Run in place, driving knees as high as possible alternately.', sets: 3, reps: 30 },
        { name: 'Box Jumps', muscle_group: 'legs', equipment: 'plyo box', intensity: 'high', type: 'hiit', calories_per_minute: 10, instructions: 'Stand facing box, jump up landing softly, step back down.', sets: 3, reps: 10 },
        { name: 'Rowing', muscle_group: 'full body', equipment: 'rowing machine', intensity: 'high', type: 'cardio', calories_per_minute: 10, instructions: 'Drive with legs, pull handle to chest, extend arms and slide forward.', sets: 1, reps: 1 },
        { name: 'Swimming', muscle_group: 'full body', equipment: 'pool', intensity: 'medium', type: 'cardio', calories_per_minute: 9, instructions: 'Swim laps at moderate pace. Use freestyle or preferred stroke.', sets: 1, reps: 1 },
        // Yoga
        { name: 'Sun Salutation', muscle_group: 'full body', equipment: 'yoga mat', intensity: 'low', type: 'yoga', calories_per_minute: 4, instructions: 'Flow through: mountain pose, forward fold, plank, cobra, downward dog.', sets: 3, reps: 5 },
        { name: 'Warrior I', muscle_group: 'legs', equipment: 'yoga mat', intensity: 'low', type: 'yoga', calories_per_minute: 3, instructions: 'Lunge position, arms overhead, hips squared forward. Hold 30s each side.', sets: 1, reps: 30 },
        { name: 'Warrior II', muscle_group: 'legs', equipment: 'yoga mat', intensity: 'low', type: 'yoga', calories_per_minute: 3, instructions: 'Wide stance, front knee bent, arms extended parallel to floor.', sets: 1, reps: 30 },
        { name: 'Tree Pose', muscle_group: 'legs', equipment: 'yoga mat', intensity: 'low', type: 'yoga', calories_per_minute: 2, instructions: 'Stand on one leg, other foot on inner thigh, arms overhead.', sets: 1, reps: 30 },
        { name: 'Downward Dog', muscle_group: 'full body', equipment: 'yoga mat', intensity: 'low', type: 'yoga', calories_per_minute: 3, instructions: 'Hands and feet on floor, hips high, body in inverted V shape.', sets: 1, reps: 30 },
        { name: 'Child\'s Pose', muscle_group: 'back', equipment: 'yoga mat', intensity: 'low', type: 'yoga', calories_per_minute: 2, instructions: 'Kneel, sit back on heels, extend arms forward on floor, rest forehead down.', sets: 1, reps: 60 },
        // Stretching
        { name: 'Hamstring Stretch', muscle_group: 'legs', equipment: 'none', intensity: 'low', type: 'stretching', calories_per_minute: 2, instructions: 'Sit on floor, one leg extended, reach for toes. Hold 30s each side.', sets: 1, reps: 30 },
        { name: 'Quad Stretch', muscle_group: 'legs', equipment: 'none', intensity: 'low', type: 'stretching', calories_per_minute: 2, instructions: 'Stand, pull one foot to glute. Hold 30s each side.', sets: 1, reps: 30 },
        { name: 'Shoulder Stretch', muscle_group: 'shoulders', equipment: 'none', intensity: 'low', type: 'stretching', calories_per_minute: 2, instructions: 'Cross one arm across chest, use other hand to press it closer.', sets: 1, reps: 30 },
        { name: 'Hip Flexor Stretch', muscle_group: 'legs', equipment: 'none', intensity: 'low', type: 'stretching', calories_per_minute: 2, instructions: 'Kneel on one knee, push hips forward, feel stretch in front of hip.', sets: 1, reps: 30 },
        { name: 'Cat-Cow Stretch', muscle_group: 'back', equipment: 'yoga mat', intensity: 'low', type: 'stretching', calories_per_minute: 2, instructions: 'On hands and knees, alternate between arching and rounding back.', sets: 1, reps: 10 },
        // HIIT
        { name: 'Jumping Jacks', muscle_group: 'full body', equipment: 'none', intensity: 'medium', type: 'hiit', calories_per_minute: 8, instructions: 'Jump spreading legs and raising arms, jump back together.', sets: 3, reps: 30 },
        { name: 'Squat Jumps', muscle_group: 'legs', equipment: 'none', intensity: 'high', type: 'hiit', calories_per_minute: 10, instructions: 'Squat down, explode upward, land softly and repeat.', sets: 3, reps: 12 },
        { name: 'Kettlebell Swings', muscle_group: 'full body', equipment: 'kettlebell', intensity: 'high', type: 'hiit', calories_per_minute: 12, instructions: 'Hinge at hips, swing kettlebell between legs and up to chest height.', sets: 3, reps: 15 },
        { name: 'Battle Ropes', muscle_group: 'arms', equipment: 'battle ropes', intensity: 'high', type: 'hiit', calories_per_minute: 12, instructions: 'Alternate slamming rope ends up and down as fast as possible.', sets: 3, reps: 30 },
        { name: 'Tuck Jumps', muscle_group: 'legs', equipment: 'none', intensity: 'high', type: 'hiit', calories_per_minute: 11, instructions: 'Jump up, pull knees to chest at peak, land softly. Repeat.', sets: 3, reps: 10 },
        { name: 'Sprint Intervals', muscle_group: 'full body', equipment: 'none', intensity: 'high', type: 'hiit', calories_per_minute: 14, instructions: 'Sprint 20 seconds, walk/jog 40 seconds. Repeat intervals.', sets: 8, reps: 1 },
    ];

    const insertExercise = db.prepare(`
    INSERT OR IGNORE INTO exercises (id, name, muscle_group, equipment, intensity, type, calories_per_minute, instructions, sets, reps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const ex of exercises) {
        insertExercise.run(uuidv4(), ex.name, ex.muscle_group, ex.equipment, ex.intensity, ex.type, ex.calories_per_minute, ex.instructions, ex.sets, ex.reps);
    }
    console.log(`  ✅ ${exercises.length} exercises seeded`);

    // ─── Food Items (sample set) ────────────────────────────
    const foods = [
        { name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, category: 'protein' },
        { name: 'Brown Rice (1 cup)', calories: 216, protein: 5, carbs: 45, fats: 1.8, fiber: 3.5, category: 'grains' },
        { name: 'Broccoli (1 cup)', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, fiber: 5.1, category: 'vegetables' },
        { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fats: 13, fiber: 0, category: 'protein' },
        { name: 'Sweet Potato (medium)', calories: 103, protein: 2, carbs: 24, fats: 0.1, fiber: 3.8, category: 'vegetables' },
        { name: 'Greek Yogurt (plain)', calories: 100, protein: 17, carbs: 6, fats: 0.7, fiber: 0, category: 'dairy' },
        { name: 'Banana (medium)', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, fiber: 3.1, category: 'fruits' },
        { name: 'Almonds (1 oz)', calories: 164, protein: 6, carbs: 6, fats: 14, fiber: 3.5, category: 'nuts' },
        { name: 'Egg (large, boiled)', calories: 78, protein: 6, carbs: 0.6, fats: 5, fiber: 0, category: 'protein' },
        { name: 'Oatmeal (1 cup)', calories: 154, protein: 5.5, carbs: 27, fats: 2.6, fiber: 4, category: 'grains' },
        { name: 'Avocado (half)', calories: 161, protein: 2, carbs: 8.5, fats: 15, fiber: 6.7, category: 'fruits' },
        { name: 'Quinoa (1 cup)', calories: 222, protein: 8, carbs: 39, fats: 3.5, fiber: 5, category: 'grains' },
        { name: 'Tuna (canned, 1 can)', calories: 191, protein: 42, carbs: 0, fats: 1.4, fiber: 0, category: 'protein' },
        { name: 'Spinach (1 cup)', calories: 7, protein: 0.9, carbs: 1.1, fats: 0.1, fiber: 0.7, category: 'vegetables' },
        { name: 'Apple (medium)', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, fiber: 4.4, category: 'fruits' },
        { name: 'Whole Wheat Bread (1 slice)', calories: 69, protein: 3.6, carbs: 12, fats: 1.1, fiber: 1.9, category: 'grains' },
        { name: 'Cottage Cheese (1 cup)', calories: 206, protein: 28, carbs: 6.2, fats: 9, fiber: 0, category: 'dairy' },
        { name: 'Peanut Butter (2 tbsp)', calories: 188, protein: 8, carbs: 6, fats: 16, fiber: 2, category: 'nuts' },
        { name: 'Protein Shake (whey)', calories: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0, category: 'supplements' },
        { name: 'Steak (ribeye, 6oz)', calories: 360, protein: 34, carbs: 0, fats: 24, fiber: 0, category: 'protein' },
        { name: 'White Rice (1 cup)', calories: 206, protein: 4.3, carbs: 45, fats: 0.4, fiber: 0.6, category: 'grains' },
        { name: 'Pasta (1 cup)', calories: 220, protein: 8, carbs: 43, fats: 1.3, fiber: 2.5, category: 'grains' },
        { name: 'Mixed Berries (1 cup)', calories: 70, protein: 1.3, carbs: 17, fats: 0.5, fiber: 4, category: 'fruits' },
        { name: 'Kale (1 cup)', calories: 33, protein: 2.5, carbs: 6, fats: 0.6, fiber: 1.3, category: 'vegetables' },
        { name: 'Turkey Breast (sliced)', calories: 125, protein: 26, carbs: 1, fats: 1.8, fiber: 0, category: 'protein' },
    ];

    const insertFood = db.prepare(`
    INSERT OR IGNORE INTO food_items (id, name, calories, protein, carbs, fats, fiber, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const food of foods) {
        insertFood.run(uuidv4(), food.name, food.calories, food.protein, food.carbs, food.fats, food.fiber, food.category);
    }
    console.log(`  ✅ ${foods.length} food items seeded`);

    // ─── Badges ─────────────────────────────────────────────
    const badges = [
        { name: 'First Workout', description: 'Complete your very first workout', icon: '🏋️', category: 'achievement', requirement_type: 'workouts_completed', requirement_value: 1, xp_reward: 50 },
        { name: 'Week Warrior', description: 'Maintain a 7-day workout streak', icon: '🔥', category: 'streak', requirement_type: 'streak_days', requirement_value: 7, xp_reward: 100 },
        { name: 'Monthly Master', description: '30-day streak achievement', icon: '👑', category: 'streak', requirement_type: 'streak_days', requirement_value: 30, xp_reward: 500 },
        { name: 'Step Star', description: 'Walk 10,000 steps in a single day', icon: '⭐', category: 'achievement', requirement_type: 'daily_steps', requirement_value: 10000, xp_reward: 75 },
        { name: 'Hydration Hero', description: 'Meet your water goal 7 days in a row', icon: '💧', category: 'hydration', requirement_type: 'hydration_streak', requirement_value: 7, xp_reward: 100 },
        { name: 'Calorie Crusher', description: 'Burn 500 calories in one workout', icon: '💪', category: 'achievement', requirement_type: 'calories_burned', requirement_value: 500, xp_reward: 100 },
        { name: 'Early Bird', description: 'Complete a workout before 7 AM', icon: '🌅', category: 'achievement', requirement_type: 'early_workout', requirement_value: 1, xp_reward: 50 },
        { name: 'Social Butterfly', description: 'Follow 10 friends', icon: '🦋', category: 'social', requirement_type: 'following_count', requirement_value: 10, xp_reward: 50 },
        { name: 'Marathon Runner', description: 'Run a total of 42.2 km', icon: '🏃', category: 'achievement', requirement_type: 'total_distance_km', requirement_value: 42.2, xp_reward: 200 },
        { name: 'Iron Will', description: 'Complete 100 workouts', icon: '🛡️', category: 'achievement', requirement_type: 'workouts_completed', requirement_value: 100, xp_reward: 300 },
        { name: 'Zen Master', description: 'Complete 20 yoga sessions', icon: '🧘', category: 'achievement', requirement_type: 'yoga_sessions', requirement_value: 20, xp_reward: 150 },
        { name: 'Night Owl', description: 'Complete a workout after 10 PM', icon: '🦉', category: 'achievement', requirement_type: 'late_workout', requirement_value: 1, xp_reward: 50 },
        { name: 'Protein Pro', description: 'Hit protein goal for 7 consecutive days', icon: '🥩', category: 'nutrition', requirement_type: 'protein_streak', requirement_value: 7, xp_reward: 100 },
        { name: 'Centurion', description: 'Earn 1000 XP points', icon: '🏛️', category: 'xp', requirement_type: 'xp_earned', requirement_value: 1000, xp_reward: 200 },
    ];

    const insertBadge = db.prepare(`
    INSERT OR IGNORE INTO badges (id, name, description, icon, category, requirement_type, requirement_value, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const badge of badges) {
        insertBadge.run(uuidv4(), badge.name, badge.description, badge.icon, badge.category, badge.requirement_type, badge.requirement_value, badge.xp_reward);
    }
    console.log(`  ✅ ${badges.length} badges seeded`);

    // ─── Demo Goals ─────────────────────────────────────────
    const goals = [
        { type: 'daily_steps', target_value: 10000, current_value: 7500, unit: 'steps', period: 'daily' },
        { type: 'calorie_target', target_value: 2200, current_value: 1850, unit: 'kcal', period: 'daily' },
        { type: 'water_intake', target_value: 2475, current_value: 1500, unit: 'ml', period: 'daily' },
        { type: 'weight_loss', target_value: 72, current_value: 75, unit: 'kg', period: 'monthly' },
        { type: 'sleep_hours', target_value: 8, current_value: 7.5, unit: 'hours', period: 'daily' },
    ];

    const insertGoal = db.prepare(`
    INSERT OR IGNORE INTO goals (id, user_id, type, target_value, current_value, unit, period)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    for (const goal of goals) {
        insertGoal.run(uuidv4(), demoUserId, goal.type, goal.target_value, goal.current_value, goal.unit, goal.period);
    }
    console.log(`  ✅ ${goals.length} demo goals seeded`);

    // ─── Demo Water Logs (today) ────────────────────────────
    const waterLogs = [
        { hour: 7, amount: 250 },
        { hour: 9, amount: 250 },
        { hour: 11, amount: 300 },
        { hour: 13, amount: 250 },
        { hour: 15, amount: 200 },
        { hour: 17, amount: 250 },
    ];

    const insertWaterLog = db.prepare(`
    INSERT INTO water_logs (id, user_id, amount_ml, logged_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

    const now = new Date();
    for (const log of waterLogs) {
        const hoursAgo = now.getHours() - log.hour;
        insertWaterLog.run(uuidv4(), demoUserId, log.amount, `-${Math.max(0, hoursAgo)} hours`);
    }
    console.log(`  ✅ ${waterLogs.length} demo water logs seeded`);

    // ─── Demo Workout Logs ─────────────────────────────────
    const workoutLogs = [
        { duration_minutes: 45, calories_burned: 320, steps: 0, activity_type: 'strength', daysAgo: 0 },
        { duration_minutes: 30, calories_burned: 280, steps: 4500, activity_type: 'cardio', daysAgo: 1 },
        { duration_minutes: 60, calories_burned: 450, steps: 0, activity_type: 'hiit', daysAgo: 2 },
        { duration_minutes: 40, calories_burned: 200, steps: 0, activity_type: 'yoga', daysAgo: 3 },
        { duration_minutes: 50, calories_burned: 380, steps: 6000, activity_type: 'cardio', daysAgo: 4 },
        { duration_minutes: 35, calories_burned: 250, steps: 0, activity_type: 'strength', daysAgo: 5 },
        { duration_minutes: 45, calories_burned: 350, steps: 3000, activity_type: 'hiit', daysAgo: 6 },
    ];

    const insertWorkoutLog = db.prepare(`
    INSERT INTO workout_logs (id, user_id, duration_minutes, calories_burned, steps, activity_type, logged_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

    for (const wl of workoutLogs) {
        insertWorkoutLog.run(uuidv4(), demoUserId, wl.duration_minutes, wl.calories_burned, wl.steps, wl.activity_type, `-${wl.daysAgo} days`);
    }
    console.log(`  ✅ ${workoutLogs.length} demo workout logs seeded`);

    // ─── Demo Badges Earned ─────────────────────────────────
    const allBadges = db.prepare('SELECT id, name FROM badges').all();
    const earnedBadges = allBadges.slice(0, 4); // Earn first 4 badges

    const insertUserBadge = db.prepare(`
    INSERT OR IGNORE INTO user_badges (id, user_id, badge_id)
    VALUES (?, ?, ?)
  `);

    for (const badge of earnedBadges) {
        insertUserBadge.run(uuidv4(), demoUserId, badge.id);
    }
    console.log(`  ✅ ${earnedBadges.length} demo badges earned`);

    // ─── Demo Challenges ───────────────────────────────────
    const challenges = [
        { name: '30-Day Plank Challenge', description: 'Hold plank for 1 min longer each day for 30 days', type: 'duration', target_value: 30, participants_count: 847 },
        { name: '10K Steps Daily', description: 'Walk 10,000 steps every day for 2 weeks', type: 'steps', target_value: 140000, participants_count: 1203 },
        { name: 'Hydration Month', description: 'Meet your water intake goal every day this month', type: 'water', target_value: 30, participants_count: 562 },
    ];

    const insertChallenge = db.prepare(`
    INSERT INTO challenges (id, name, description, type, target_value, participants_count, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, date('now'), date('now', '+30 days'))
  `);

    for (const ch of challenges) {
        insertChallenge.run(uuidv4(), ch.name, ch.description, ch.type, ch.target_value, ch.participants_count);
    }
    console.log(`  ✅ ${challenges.length} challenges seeded`);

    console.log('\n✨ Database seeded successfully!');
}

seed().catch(console.error);
