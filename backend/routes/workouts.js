/**
 * Workout & Exercise Routes — Library browsing, workout logging, plans
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../utils/checkBadges');

router.use(authenticate);

/**
 * GET /api/workouts/exercises — Browse exercise library
 * Query params: muscle_group, type, intensity, equipment, search
 */
router.get('/exercises', (req, res) => {
  const { muscle_group, type, intensity, equipment, search } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM exercises WHERE 1=1';
  const params = [];

  if (muscle_group) { query += ' AND muscle_group = ?'; params.push(muscle_group); }
  if (type) { query += ' AND type = ?'; params.push(type); }
  if (intensity) { query += ' AND intensity = ?'; params.push(intensity); }
  if (equipment) { query += ' AND equipment = ?'; params.push(equipment); }
  if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }

  query += ' ORDER BY name ASC';
  const exercises = db.prepare(query).all(...params);
  res.json(exercises);
});

/**
 * GET /api/workouts/exercises/:id — Single exercise detail
 */
router.get('/exercises/:id', (req, res) => {
  const db = getDb();
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });
  res.json(exercise);
});

/**
 * POST /api/workouts/log — Log a workout session
 */
router.post('/log', (req, res) => {
  const { exercise_id, plan_id, duration_minutes, calories_burned, distance_km, steps, avg_heart_rate, notes, activity_type } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO workout_logs (id, user_id, exercise_id, plan_id, duration_minutes, calories_burned, distance_km, steps, avg_heart_rate, notes, activity_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, exercise_id || null, plan_id || null, duration_minutes || 0, calories_burned || 0, distance_km || null, steps || null, avg_heart_rate || null, notes || null, activity_type || 'workout');

  // Award XP for workout
  const xp = Math.round((calories_burned || 50) / 10);
  db.prepare('UPDATE users SET xp_points = xp_points + ? WHERE id = ?').run(xp, req.user.id);

  const log = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(id);
  const new_badges = checkAndAwardBadges(req.user.id);
  res.status(201).json({ ...log, xp_earned: xp, new_badges });
});

/**
 * GET /api/workouts/history — Workout history
 */
router.get('/history', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const db = getDb();

  const logs = db.prepare(`
    SELECT wl.*, e.name as exercise_name, e.muscle_group, e.type as exercise_type
    FROM workout_logs wl
    LEFT JOIN exercises e ON wl.exercise_id = e.id
    WHERE wl.user_id = ? AND wl.logged_at >= datetime('now', ?)
    ORDER BY wl.logged_at DESC
  `).all(req.user.id, `-${days} days`);

  res.json(logs);
});

/**
 * GET /api/workouts/stats — Workout statistics
 */
router.get('/stats', (req, res) => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(calories_burned), 0) as total_calories, COALESCE(SUM(duration_minutes), 0) as total_minutes FROM workout_logs WHERE user_id = ?').get(req.user.id);

  const thisWeek = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(calories_burned), 0) as calories
    FROM workout_logs
    WHERE user_id = ? AND logged_at >= datetime('now', '-7 days')
  `).get(req.user.id);

  const byType = db.prepare(`
    SELECT activity_type, COUNT(*) as count, SUM(calories_burned) as calories
    FROM workout_logs
    WHERE user_id = ?
    GROUP BY activity_type
  `).all(req.user.id);

  res.json({
    total_workouts: total.count,
    total_calories: total.total_calories,
    total_minutes: total.total_minutes,
    this_week: thisWeek,
    by_type: byType
  });
});

/**
 * GET /api/workouts/plans — User's workout plans
 */
router.get('/plans', (req, res) => {
  const db = getDb();
  const plans = db.prepare(`
    SELECT wp.*, COUNT(wpe.id) as exercise_count
    FROM workout_plans wp
    LEFT JOIN workout_plan_exercises wpe ON wp.id = wpe.plan_id
    WHERE wp.user_id = ?
    GROUP BY wp.id
    ORDER BY wp.created_at DESC
  `).all(req.user.id);
  res.json(plans);
});

/**
 * POST /api/workouts/plans — Create a custom workout plan
 */
router.post('/plans', (req, res) => {
  const { name, description, difficulty, exercises } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO workout_plans (id, user_id, name, description, difficulty)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, description || '', difficulty || 'beginner');

  if (exercises && exercises.length > 0) {
    const insertExercise = db.prepare(`
      INSERT INTO workout_plan_exercises (id, plan_id, exercise_id, day_of_week, order_index, sets, reps, rest_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    exercises.forEach((ex, index) => {
      insertExercise.run(uuidv4(), id, ex.exercise_id, ex.day_of_week || 1, index, ex.sets || 3, ex.reps || 10, ex.rest_seconds || 60);
    });
  }

  const plan = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(id);
  res.status(201).json(plan);
});

/**
 * GET /api/workouts/muscle-groups — Available muscle groups
 */
router.get('/muscle-groups', (req, res) => {
  const db = getDb();
  const groups = db.prepare('SELECT DISTINCT muscle_group FROM exercises ORDER BY muscle_group').all();
  res.json(groups.map(g => g.muscle_group));
});

module.exports = router;
