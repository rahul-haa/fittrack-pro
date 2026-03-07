/**
 * Goal Routes — CRUD for fitness goals with progress tracking
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/goals — List all goals for the user
 */
router.get('/', (req, res) => {
    const db = getDb();
    const goals = db.prepare(`
    SELECT *, 
      CASE 
        WHEN target_value > 0 THEN ROUND((current_value / target_value) * 100, 1)
        ELSE 0 
      END as progress_percent
    FROM goals WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
    res.json(goals);
});

/**
 * POST /api/goals — Create a new goal
 */
router.post('/', (req, res) => {
    const { type, target_value, unit, period, end_date } = req.body;

    if (!type || !target_value || !unit) {
        return res.status(400).json({ error: 'Type, target_value, and unit are required.' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
    INSERT INTO goals (id, user_id, type, target_value, unit, period, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, type, target_value, unit, period || 'daily', end_date || null);

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.status(201).json(goal);
});

/**
 * PUT /api/goals/:id — Update a goal
 */
router.put('/:id', (req, res) => {
    const { target_value, current_value, period, end_date } = req.body;
    const db = getDb();

    const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    const fields = [];
    const values = [];

    if (target_value !== undefined) { fields.push('target_value = ?'); values.push(target_value); }
    if (current_value !== undefined) { fields.push('current_value = ?'); values.push(current_value); }
    if (period !== undefined) { fields.push('period = ?'); values.push(period); }
    if (end_date !== undefined) { fields.push('end_date = ?'); values.push(end_date); }

    fields.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    res.json(updated);
});

/**
 * DELETE /api/goals/:id — Delete a goal
 */
router.delete('/:id', (req, res) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Goal not found.' });
    res.json({ message: 'Goal deleted.' });
});

module.exports = router;
