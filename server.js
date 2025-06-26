const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Session middleware - stores login state
app.use((req, res, next) => {
  req.session = global.sessions?.[req.headers.cookie?.match(/session=([^;]+)/)?.[1]] || {};
  req.sessionId = req.headers.cookie?.match(/session=([^;]+)/)?.[1] || crypto.randomBytes(16).toString('hex');
  
  if (!global.sessions) global.sessions = {};
  global.sessions[req.sessionId] = req.session;
  
  res.setHeader('Set-Cookie', `session=${req.sessionId}; HttpOnly; Path=/; Max-Age=604800`);
  next();
});

// Auth check middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Initialize database with new schema
async function initDB() {
  try {
    // Drop old tables
    await pool.query(`
      DROP TABLE IF EXISTS message_reactions CASCADE;
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS challenge_participants CASCADE;
      DROP TABLE IF EXISTS daily_progress CASCADE;
      DROP TABLE IF EXISTS daily_progress_v2 CASCADE;
      DROP TABLE IF EXISTS daily_progress_summary CASCADE;
      DROP TABLE IF EXISTS challenges CASCADE;
      DROP TABLE IF EXISTS user_badges CASCADE;
      DROP TABLE IF EXISTS badges CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create new tables for project planner
    
    // Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(10) DEFAULT '📁',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        priority INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP,
        assigned_date DATE,
        is_bonus BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily progress
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_progress (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        completed_date DATE NOT NULL,
        is_daily_task BOOLEAN DEFAULT true,
        points_earned INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id)
      )
    `);

    // Project streaks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_streaks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_completed_date DATE,
        total_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id)
      )
    `);

    // Badges
    await pool.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(10),
        category VARCHAR(50),
        requirement_type VARCHAR(50),
        requirement_value INTEGER,
        theme_class VARCHAR(50),
        points_reward INTEGER DEFAULT 0,
        rarity VARCHAR(20) DEFAULT 'common',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Project badges
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_badges (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        badge_id INTEGER REFERENCES badges(id),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, badge_id)
      )
    `);

    // Global stats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_stats (
        id SERIAL PRIMARY KEY,
        total_points INTEGER DEFAULT 0,
        current_global_streak INTEGER DEFAULT 0,
        longest_global_streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default badges
    await pool.query(`
      INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, theme_class, rarity) VALUES
      ('On Fire', '3 day streak', '🔥', 'streak', 'streak_days', 3, 'theme-fire', 'common'),
      ('Lightning', '7 day streak', '⚡', 'streak', 'streak_days', 7, 'theme-lightning', 'uncommon'),
      ('Diamond Hands', '30 day streak', '💎', 'streak', 'streak_days', 30, 'theme-diamond', 'rare'),
      ('Legendary', '100 day streak', '👑', 'streak', 'streak_days', 100, 'theme-legendary', 'legendary'),
      ('Project Master', 'Complete 50 tasks in one project', '🎯', 'completion', 'total_tasks', 50, null, 'rare'),
      ('Multitasker', 'Work on 5 projects in one day', '🤹', 'daily', 'projects_per_day', 5, null, 'uncommon')
      ON CONFLICT DO NOTHING
    `);

    // Insert initial global stats row
    await pool.query(`
      INSERT INTO global_stats (id, total_points) VALUES (1, 0) 
      ON CONFLICT DO NOTHING
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_project_assigned ON tasks(project_id, assigned_date, is_completed);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(project_id, priority DESC, is_completed);
      CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_progress(completed_date DESC);
      CREATE INDEX IF NOT EXISTS idx_project_streaks_project ON project_streaks(project_id);
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

// === AUTH ENDPOINTS ===

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

console.log('Login attempt:', { username, password, expected: ADMIN_USERNAME });

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.authenticated = false;
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// === PROJECT ENDPOINTS ===

// Get all projects with today's tasks
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        p.*,
        ps.current_streak,
        ps.longest_streak,
        ps.total_points,
        ps.last_completed_date,
        json_build_object(
          'id', t.id,
          'title', t.title,
          'description', t.description,
          'is_completed', t.is_completed
        ) as todays_task,
        (
          SELECT COUNT(*)::int 
          FROM tasks 
          WHERE project_id = p.id AND is_completed = false
        ) as pending_tasks_count
      FROM projects p
      LEFT JOIN project_streaks ps ON p.id = ps.project_id
      LEFT JOIN LATERAL (
        SELECT * FROM tasks 
        WHERE project_id = p.id 
          AND (assigned_date = $1 OR (assigned_date IS NULL AND is_completed = false))
          AND is_bonus = false
        ORDER BY assigned_date DESC NULLS LAST, priority DESC, id ASC
        LIMIT 1
      ) t ON true
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `, [today]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Create new project
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    
    const result = await pool.query(
      'INSERT INTO projects (name, description, color, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', color || '#3B82F6', icon || '📁']
    );
    
    // Initialize project streak record
    await pool.query(
      'INSERT INTO project_streaks (project_id) VALUES ($1)',
      [result.rows[0].id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// === TASK ENDPOINTS ===

// Get tasks for a project
app.get('/api/projects/:projectId/tasks', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { completed } = req.query;
    
    let query = `
      SELECT * FROM tasks 
      WHERE project_id = $1
    `;
    
    const params = [projectId];
    
    if (completed === 'false') {
      query += ' AND is_completed = false';
    } else if (completed === 'true') {
      query += ' AND is_completed = true';
    }
    
    query += ' ORDER BY is_completed ASC, priority DESC, created_at ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Add task to project
app.post('/api/projects/:projectId/tasks', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, assigned_date } = req.body;
    
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, priority, assigned_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, title, description || null, priority || 0, assigned_date || null]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Complete a task
app.post('/api/tasks/:taskId/complete', requireAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { taskId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    // Get task info
    const taskResult = await client.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      throw new Error('Task not found');
    }
    
    const task = taskResult.rows[0];
    
    // Mark task as completed
    await client.query(
      'UPDATE tasks SET is_completed = true, completed_at = NOW() WHERE id = $1',
      [taskId]
    );
    
    // Record in daily progress
    const progressResult = await client.query(
      `INSERT INTO daily_progress (project_id, task_id, completed_date, is_daily_task, points_earned)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [task.project_id, taskId, today, !task.is_bonus, task.is_bonus ? 2 : 1]
    );
    
    // Update project streak
    const streakResult = await client.query(
      'SELECT * FROM project_streaks WHERE project_id = $1',
      [task.project_id]
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let totalPoints = 0;
    
    if (streakResult.rows.length > 0) {
      const streak = streakResult.rows[0];
      const lastCompleted = streak.last_completed_date;
      
      // Calculate streak
      if (lastCompleted) {
        const lastDate = new Date(lastCompleted);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak = streak.current_streak + 1;
        } else if (daysDiff === 0) {
          currentStreak = streak.current_streak; // Same day, keep streak
        } else {
          currentStreak = 1; // Streak broken
        }
      } else {
        currentStreak = 1; // First task
      }
      
      longestStreak = Math.max(currentStreak, streak.longest_streak);
      totalPoints = streak.total_points + progressResult.rows[0].points_earned;
    }
    
    await client.query(
      `UPDATE project_streaks 
       SET current_streak = $1, longest_streak = $2, last_completed_date = $3, total_points = $4
       WHERE project_id = $5`,
      [currentStreak, longestStreak, today, totalPoints, task.project_id]
    );
    
    // Update global stats
    await client.query(
      'UPDATE global_stats SET total_points = total_points + $1 WHERE id = 1',
      [progressResult.rows[0].points_earned]
    );
    
    // Check for badges
    const badges = await checkAndAwardBadges(client, task.project_id, currentStreak);
    
    await client.query('COMMIT');
    
    res.json({
      task: { ...task, is_completed: true },
      progress: progressResult.rows[0],
      streak: { currentStreak, longestStreak, totalPoints },
      newBadges: badges
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Failed to complete task' });
  } finally {
    client.release();
  }
});

// Get next task for project (bonus task after completing daily)
app.get('/api/projects/:projectId/next-task', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM tasks
      WHERE project_id = $1 
        AND is_completed = false
        AND is_bonus = false
        AND (assigned_date IS NULL OR assigned_date > CURRENT_DATE)
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `, [projectId]);
    
    if (result.rows.length > 0) {
      // Mark it as bonus task for today
      await pool.query(
        'UPDATE tasks SET is_bonus = true, assigned_date = CURRENT_DATE WHERE id = $1',
        [result.rows[0].id]
      );
      res.json(result.rows[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('Get next task error:', err);
    res.status(500).json({ error: 'Failed to get next task' });
  }
});

// === STATS ENDPOINTS ===

// Get global stats
app.get('/api/stats/global', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM global_stats WHERE id = 1');
    res.json(result.rows[0] || { total_points: 0 });
  } catch (err) {
    console.error('Get global stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get project-specific stats
app.get('/api/projects/:projectId/stats', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const statsResult = await pool.query(`
      SELECT 
        ps.*,
        COUNT(DISTINCT dp.completed_date) as days_worked,
        COUNT(dp.id) as total_tasks_completed
      FROM project_streaks ps
      LEFT JOIN daily_progress dp ON ps.project_id = dp.project_id
      WHERE ps.project_id = $1
      GROUP BY ps.id
    `, [projectId]);
    
    const badgesResult = await pool.query(`
      SELECT b.* FROM project_badges pb
      JOIN badges b ON pb.badge_id = b.id
      WHERE pb.project_id = $1
      ORDER BY pb.earned_at DESC
    `, [projectId]);
    
    res.json({
      stats: statsResult.rows[0] || {},
      badges: badgesResult.rows
    });
  } catch (err) {
    console.error('Get project stats error:', err);
    res.status(500).json({ error: 'Failed to get project stats' });
  }
});

// Helper function to check and award badges
async function checkAndAwardBadges(client, projectId, currentStreak) {
  const newBadges = [];
  
  // Check streak badges
  const streakBadges = await client.query(
    "SELECT * FROM badges WHERE requirement_type = 'streak_days' AND requirement_value <= $1",
    [currentStreak]
  );
  
  for (const badge of streakBadges.rows) {
    // Check if already has this badge
    const existing = await client.query(
      'SELECT id FROM project_badges WHERE project_id = $1 AND badge_id = $2',
      [projectId, badge.id]
    );
    
    if (existing.rows.length === 0) {
      await client.query(
        'INSERT INTO project_badges (project_id, badge_id) VALUES ($1, $2)',
        [projectId, badge.id]
      );
      newBadges.push(badge);
    }
  }
  
  return newBadges;
}

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Project Planner API is running!' });
});

// Serve the main app (with auth check)
app.get('/', (req, res) => {
  if (!req.session.authenticated) {
    res.redirect('/login');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Project Planner server running on port ${PORT}`);
  });
});
