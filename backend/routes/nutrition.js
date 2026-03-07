/**
 * Nutrition Routes — Food logging, macros, meal planning
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/nutrition/foods — Search food database
 */
router.get('/foods', (req, res) => {
    const { search, category } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM food_items WHERE 1=1';
    const params = [];

    if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }
    if (category) { query += ' AND category = ?'; params.push(category); }

    query += ' ORDER BY name ASC LIMIT 50';
    const foods = db.prepare(query).all(...params);
    res.json(foods);
});

/**
 * POST /api/nutrition/log — Log food intake
 */
router.post('/log', (req, res) => {
    const { food_item_id, meal_type, servings, calories, protein, carbs, fats, fiber } = req.body;
    const db = getDb();
    const id = uuidv4();

    // If food_item_id provided, look up macros
    let macros = { calories: calories || 0, protein: protein || 0, carbs: carbs || 0, fats: fats || 0, fiber: fiber || 0 };
    if (food_item_id) {
        const food = db.prepare('SELECT * FROM food_items WHERE id = ?').get(food_item_id);
        if (food) {
            const mult = servings || 1;
            macros = {
                calories: food.calories * mult,
                protein: food.protein * mult,
                carbs: food.carbs * mult,
                fats: food.fats * mult,
                fiber: food.fiber * mult
            };
        }
    }

    db.prepare(`
    INSERT INTO nutrition_logs (id, user_id, food_item_id, meal_type, servings, calories, protein, carbs, fats, fiber)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, food_item_id || null, meal_type || 'snack', servings || 1, macros.calories, macros.protein, macros.carbs, macros.fats, macros.fiber);

    const log = db.prepare('SELECT * FROM nutrition_logs WHERE id = ?').get(id);
    res.status(201).json(log);
});

/**
 * GET /api/nutrition/today — Today's nutrition summary
 */
router.get('/today', (req, res) => {
    const db = getDb();

    const logs = db.prepare(`
    SELECT nl.*, fi.name as food_name
    FROM nutrition_logs nl
    LEFT JOIN food_items fi ON nl.food_item_id = fi.id
    WHERE nl.user_id = ? AND date(nl.logged_at) = date('now')
    ORDER BY nl.logged_at ASC
  `).all(req.user.id);

    const totals = logs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fats: acc.fats + (log.fats || 0),
        fiber: acc.fiber + (log.fiber || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

    // Group by meal type
    const byMeal = {};
    logs.forEach(log => {
        if (!byMeal[log.meal_type]) byMeal[log.meal_type] = [];
        byMeal[log.meal_type].push(log);
    });

    res.json({ logs, totals, by_meal: byMeal });
});

/**
 * GET /api/nutrition/history — Nutrition history
 */
router.get('/history', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const db = getDb();

    const history = db.prepare(`
    SELECT date(logged_at) as date,
      SUM(calories) as total_calories,
      SUM(protein) as total_protein,
      SUM(carbs) as total_carbs,
      SUM(fats) as total_fats,
      SUM(fiber) as total_fiber,
      COUNT(*) as entries
    FROM nutrition_logs
    WHERE user_id = ? AND logged_at >= datetime('now', ?)
    GROUP BY date(logged_at)
    ORDER BY date DESC
  `).all(req.user.id, `-${days} days`);

    res.json(history);
});

/**
 * GET /api/nutrition/categories — Food categories
 */
router.get('/categories', (req, res) => {
    const db = getDb();
    const cats = db.prepare('SELECT DISTINCT category FROM food_items WHERE category IS NOT NULL ORDER BY category').all();
    res.json(cats.map(c => c.category));
});

/**
 * DELETE /api/nutrition/log/:id — Delete nutrition log
 */
router.delete('/log/:id', (req, res) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM nutrition_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Log not found.' });
    res.json({ message: 'Nutrition log deleted.' });
});

module.exports = router;
