/**
 * Fitness Application — Database Schema
 * SQLite database initialization with all tables for the fitness platform.
 * Designed to be trivially portable to PostgreSQL.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'fitness.db');

function initializeDatabase() {
    const db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // ─── Users ───────────────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT DEFAULT NULL,
      age INTEGER,
      weight REAL,
      height REAL,
      gender TEXT CHECK(gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
      fitness_level TEXT CHECK(fitness_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
      role TEXT CHECK(role IN ('user', 'trainer', 'admin')) DEFAULT 'user',
      subscription TEXT CHECK(subscription IN ('free', 'pro', 'elite')) DEFAULT 'free',
      xp_points INTEGER DEFAULT 0,
      streak_count INTEGER DEFAULT 0,
      streak_freeze_available INTEGER DEFAULT 1,
      wake_time TEXT DEFAULT '07:00',
      sleep_time TEXT DEFAULT '23:00',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Refresh Tokens ─────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Goals ──────────────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('weight_loss', 'muscle_gain', 'daily_steps', 'calorie_target', 'water_intake', 'sleep_hours')),
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,
      unit TEXT NOT NULL,
      period TEXT CHECK(period IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
      start_date TEXT DEFAULT (date('now')),
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Water Intake Logs ──────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS water_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_ml REAL NOT NULL,
      logged_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Water Settings ─────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS water_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      daily_goal_ml REAL DEFAULT 2500,
      cup_size_ml REAL DEFAULT 250,
      reminder_interval_minutes INTEGER DEFAULT 90,
      reminders_enabled INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Exercises (Library) ────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      muscle_group TEXT NOT NULL,
      equipment TEXT DEFAULT 'none',
      intensity TEXT CHECK(intensity IN ('low', 'medium', 'high')) DEFAULT 'medium',
      type TEXT CHECK(type IN ('hiit', 'yoga', 'strength', 'cardio', 'stretching')) DEFAULT 'strength',
      duration_seconds INTEGER,
      calories_per_minute REAL DEFAULT 5,
      image_url TEXT,
      video_url TEXT,
      instructions TEXT,
      modifications TEXT,
      sets INTEGER,
      reps INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Workout Plans ──────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
      duration_weeks INTEGER DEFAULT 4,
      is_ai_generated INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Workout Plan Exercises ─────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS workout_plan_exercises (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      day_of_week INTEGER,
      order_index INTEGER DEFAULT 0,
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      rest_seconds INTEGER DEFAULT 60
    )
  `);

    // ─── Workout Logs ──────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES exercises(id),
      plan_id TEXT REFERENCES workout_plans(id),
      duration_minutes REAL,
      calories_burned REAL,
      distance_km REAL,
      steps INTEGER,
      avg_heart_rate INTEGER,
      notes TEXT,
      activity_type TEXT DEFAULT 'workout',
      logged_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Nutrition / Food Items ─────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      serving_size TEXT DEFAULT '100g',
      calories REAL NOT NULL,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fats REAL DEFAULT 0,
      fiber REAL DEFAULT 0,
      barcode TEXT,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Nutrition Logs ─────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      food_item_id TEXT REFERENCES food_items(id),
      meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) DEFAULT 'snack',
      servings REAL DEFAULT 1,
      calories REAL,
      protein REAL,
      carbs REAL,
      fats REAL,
      fiber REAL,
      logged_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Badges ─────────────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT NOT NULL,
      category TEXT DEFAULT 'achievement',
      requirement_type TEXT,
      requirement_value REAL,
      xp_reward INTEGER DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── User Badges ────────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, badge_id)
    )
  `);

    // ─── Social Posts ───────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS social_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      post_type TEXT DEFAULT 'workout',
      workout_log_id TEXT REFERENCES workout_logs(id),
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Social Comments ───────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS social_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Social Likes ──────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS social_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(post_id, user_id)
    )
  `);

    // ─── Followers ─────────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS followers (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(follower_id, following_id)
    )
  `);

    // ─── Notifications ──────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Notification Preferences ───────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      workout_reminders INTEGER DEFAULT 1,
      hydration_reminders INTEGER DEFAULT 1,
      meal_reminders INTEGER DEFAULT 1,
      daily_checkin INTEGER DEFAULT 1,
      streak_warnings INTEGER DEFAULT 1,
      social_notifications INTEGER DEFAULT 1,
      quiet_hours_start TEXT DEFAULT '22:00',
      quiet_hours_end TEXT DEFAULT '07:00',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Community Challenges ───────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'steps',
      target_value REAL,
      start_date TEXT,
      end_date TEXT,
      participants_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // ─── Challenge Participants ─────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS challenge_participants (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      progress REAL DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(challenge_id, user_id)
    )
  `);

    return db;
}

// Singleton pattern — reuse the same connection
let dbInstance = null;
function getDb() {
    if (!dbInstance) {
        dbInstance = initializeDatabase();
    }
    return dbInstance;
}

module.exports = { getDb, initializeDatabase };
