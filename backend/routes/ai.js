/**
 * AI Coach Routes — Rule-based AI workout and meal plan generation
 * Uses existing exercise and food databases to create personalized plans.
 */
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * POST /api/ai/generate-workout — Generate personalized workout plan
 */
router.post('/generate-workout', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const { days = 5, focus = 'balanced', duration_minutes = 45 } = req.body;

    const level = user.fitness_level || 'beginner';
    const intensityMap = { beginner: 'low', intermediate: 'medium', advanced: 'high' };
    const targetIntensity = intensityMap[level] || 'medium';

    // Get exercises matching user level
    const exercises = db.prepare(`
    SELECT * FROM exercises
    WHERE (intensity = ? OR intensity = 'medium')
    ORDER BY RANDOM()
  `).all(targetIntensity);

    // Group by type
    const byType = {};
    exercises.forEach(e => {
        if (!byType[e.type]) byType[e.type] = [];
        byType[e.type].push(e);
    });

    // Day templates based on focus
    const dayTemplates = {
        balanced: ['strength', 'cardio', 'strength', 'hiit', 'yoga'],
        strength: ['strength', 'strength', 'strength', 'cardio', 'strength'],
        cardio: ['cardio', 'hiit', 'cardio', 'cardio', 'yoga'],
        flexibility: ['yoga', 'stretching', 'yoga', 'stretching', 'yoga'],
    };

    const template = dayTemplates[focus] || dayTemplates.balanced;
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const plan = [];
    for (let i = 0; i < Math.min(days, 7); i++) {
        const dayType = template[i % template.length];
        const available = byType[dayType] || byType['strength'] || exercises;
        const numExercises = Math.min(available.length, level === 'advanced' ? 6 : level === 'intermediate' ? 5 : 4);

        // Shuffle and pick
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, numExercises);

        const totalCals = selected.reduce((sum, e) => sum + (e.calories_per_minute * (duration_minutes / numExercises)), 0);

        plan.push({
            day: dayNames[i],
            type: dayType,
            exercises: selected.map(e => ({
                name: e.name,
                type: e.type,
                muscle_group: e.muscle_group,
                sets: e.sets || (level === 'advanced' ? 4 : 3),
                reps: e.reps || (level === 'advanced' ? 12 : 10),
                duration_minutes: Math.round(duration_minutes / numExercises),
                calories_estimate: Math.round(e.calories_per_minute * (duration_minutes / numExercises)),
                instructions: e.instructions,
            })),
            total_duration: duration_minutes,
            estimated_calories: Math.round(totalCals),
        });
    }

    // Add rest days
    if (days < 7) {
        const restDays = dayNames.slice(days).map(d => ({ day: d, type: 'rest', exercises: [], total_duration: 0, estimated_calories: 0 }));
        plan.push(...restDays);
    }

    res.json({
        plan_type: 'workout',
        user_level: level,
        focus,
        days_per_week: days,
        weekly_plan: plan,
        tips: getWorkoutTips(level, focus),
    });
});

/**
 * POST /api/ai/generate-meal — Generate personalized meal plan
 */
router.post('/generate-meal', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const { daily_calories = 2000, goal = 'maintain' } = req.body;

    // Adjust calories based on goal
    let targetCals = daily_calories;
    if (goal === 'lose') targetCals = Math.round(daily_calories * 0.8);
    if (goal === 'gain') targetCals = Math.round(daily_calories * 1.2);

    // Macro split
    const macroSplits = {
        lose: { protein: 0.35, carbs: 0.35, fats: 0.30 },
        maintain: { protein: 0.30, carbs: 0.40, fats: 0.30 },
        gain: { protein: 0.30, carbs: 0.45, fats: 0.25 },
    };
    const split = macroSplits[goal] || macroSplits.maintain;

    const targetMacros = {
        protein: Math.round((targetCals * split.protein) / 4),
        carbs: Math.round((targetCals * split.carbs) / 4),
        fats: Math.round((targetCals * split.fats) / 9),
    };

    // Get foods by category
    const foods = db.prepare('SELECT * FROM food_items ORDER BY RANDOM()').all();
    const byCategory = {};
    foods.forEach(f => {
        if (!byCategory[f.category]) byCategory[f.category] = [];
        byCategory[f.category].push(f);
    });

    const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
    const calSplit = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };

    const dayPlan = meals.map(meal => {
        const mealCals = Math.round(targetCals * calSplit[meal]);
        const available = [...foods].sort(() => Math.random() - 0.5);
        const selected = [];
        let accumulated = 0;

        for (const food of available) {
            if (accumulated >= mealCals) break;
            const servings = Math.max(0.5, Math.min(2, (mealCals - accumulated) / food.calories_per_serving));
            selected.push({
                name: food.name,
                category: food.category,
                servings: Math.round(servings * 10) / 10,
                calories: Math.round(food.calories_per_serving * servings),
                protein: Math.round(food.protein * servings * 10) / 10,
                carbs: Math.round(food.carbs * servings * 10) / 10,
                fats: Math.round(food.fats * servings * 10) / 10,
            });
            accumulated += food.calories_per_serving * servings;
            if (selected.length >= (meal === 'snack' ? 1 : 3)) break;
        }

        return {
            meal_type: meal,
            target_calories: mealCals,
            items: selected,
            total_calories: selected.reduce((s, f) => s + f.calories, 0),
        };
    });

    res.json({
        plan_type: 'meal',
        goal,
        daily_target_calories: targetCals,
        target_macros: targetMacros,
        meals: dayPlan,
        total_calories: dayPlan.reduce((s, m) => s + m.total_calories, 0),
        tips: getMealTips(goal),
    });
});

function getWorkoutTips(level, focus) {
    const tips = {
        beginner: [
            '💡 Start with lighter weights and focus on form',
            '⏱️ Rest 60-90 seconds between sets',
            '🧊 Don\'t forget to warm up and cool down',
            '📈 Increase intensity gradually over weeks',
        ],
        intermediate: [
            '💪 Progressive overload is key — increase weights weekly',
            '⏱️ Rest 45-60 seconds between sets',
            '🔄 Mix compound and isolation exercises',
            '🥤 Stay hydrated throughout your workout',
        ],
        advanced: [
            '🔥 Try supersets and drop sets for intensity',
            '⏱️ Rest 30-45 seconds for hypertrophy',
            '📊 Track your PRs and progressive overload',
            '🧠 Mind-muscle connection matters',
        ],
    };
    return tips[level] || tips.beginner;
}

function getMealTips(goal) {
    const tips = {
        lose: [
            '🥗 Focus on high-protein, low-calorie foods',
            '💧 Drink water before meals to feel fuller',
            '⏰ Avoid late-night eating',
            '🥦 Fill half your plate with vegetables',
        ],
        maintain: [
            '⚖️ Balance your macros throughout the day',
            '🍎 Eat whole foods over processed alternatives',
            '🕐 Space meals 3-4 hours apart',
            '🥤 Stay hydrated with 2-3L water daily',
        ],
        gain: [
            '🍗 Prioritize protein with every meal',
            '🥜 Add calorie-dense foods like nuts and avocado',
            '⏰ Eat every 3 hours to maintain surplus',
            '🥛 Consider a protein shake post-workout',
        ],
    };
    return tips[goal] || tips.maintain;
}

module.exports = router;
