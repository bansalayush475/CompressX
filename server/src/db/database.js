const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbDir = path.join(__dirname, '..', '..', 'storage');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'compressx.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'guest',
    type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    original_size INTEGER NOT NULL,
    result_size INTEGER NOT NULL,
    algorithm TEXT NOT NULL,
    space_saved INTEGER NOT NULL,
    space_saved_percentage REAL NOT NULL,
    compression_ratio REAL NOT NULL,
    duration_ms REAL NOT NULL,
    checksum TEXT,
    verified INTEGER DEFAULT 1,
    status TEXT NOT NULL,
    error_message TEXT,
    artifact_path TEXT,
    created_at TEXT NOT NULL
  );
`);

// Safe column migration for existing database
try {
  db.exec(`ALTER TABLE jobs ADD COLUMN user_id TEXT DEFAULT 'guest';`);
} catch (e) {
  // column already exists
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
`);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createUser(username, password) {
  const id = crypto.randomUUID();
  const password_hash = hashPassword(password);
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)`);
  stmt.run(id, username.trim(), password_hash, created_at);
  return { id, username: username.trim(), created_at };
}

function findUserByUsername(username) {
  return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username.trim());
}

function findUserById(id) {
  return db.prepare(`SELECT id, username, created_at FROM users WHERE id = ?`).get(id);
}

function verifyUser(username, password) {
  const user = findUserByUsername(username);
  if (!user) return null;
  const hash = hashPassword(password);
  if (user.password_hash === hash) {
    return { id: user.id, username: user.username, created_at: user.created_at };
  }
  return null;
}

const insertJobStmt = db.prepare(`
  INSERT INTO jobs (
    id, user_id, type, original_filename, original_size, result_size,
    algorithm, space_saved, space_saved_percentage, compression_ratio,
    duration_ms, checksum, verified, status, error_message, artifact_path, created_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?
  )
`);

function insertJob(job) {
  insertJobStmt.run(
    job.id,
    job.user_id || 'guest',
    job.type || 'compress',
    job.original_filename || 'unknown',
    job.original_size || 0,
    job.result_size || 0,
    job.algorithm || 'AUTO',
    job.space_saved || 0,
    job.space_saved_percentage || 0.0,
    job.compression_ratio || 1.0,
    job.duration_ms || 0.0,
    job.checksum || '',
    job.verified ? 1 : 0,
    job.status || 'completed',
    job.error_message || null,
    job.artifact_path || null,
    job.created_at || new Date().toISOString()
  );
  return getJobById(job.id);
}

const getJobStmt = db.prepare(`SELECT * FROM jobs WHERE id = ?`);
function getJobById(id) {
  return getJobStmt.get(id);
}

function deleteJob(id) {
  const job = getJobById(id);
  if (!job) return null;

  if (job.artifact_path && fs.existsSync(job.artifact_path)) {
    try {
      fs.unlinkSync(job.artifact_path);
    } catch (e) {
      console.warn(`Failed to unlink artifact: ${job.artifact_path}`, e);
    }
  }

  db.prepare(`DELETE FROM jobs WHERE id = ?`).run(id);
  return job;
}

function clearUserJobs(userId) {
  let jobsToDelete;
  if (userId) {
    jobsToDelete = db.prepare(`SELECT * FROM jobs WHERE user_id = ?`).all(userId);
    db.prepare(`DELETE FROM jobs WHERE user_id = ?`).run(userId);
  } else {
    jobsToDelete = db.prepare(`SELECT * FROM jobs`).all();
    db.prepare(`DELETE FROM jobs`).run();
  }

  for (const job of jobsToDelete) {
    if (job.artifact_path && fs.existsSync(job.artifact_path)) {
      try {
        fs.unlinkSync(job.artifact_path);
      } catch (e) {
        console.warn(`Failed to unlink artifact: ${job.artifact_path}`, e);
      }
    }
  }
  return jobsToDelete.length;
}

function listJobs({ userId, search, algorithm, status, sortBy = 'created_at', sortOrder = 'DESC', limit = 100, offset = 0 } = {}) {
  let whereClauses = [];
  let params = [];

  if (userId) {
    whereClauses.push(`user_id = ?`);
    params.push(userId);
  }

  if (search) {
    whereClauses.push(`(original_filename LIKE ? OR id LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (algorithm && algorithm !== 'ALL') {
    whereClauses.push(`algorithm LIKE ?`);
    params.push(`%${algorithm}%`);
  }

  if (status && status !== 'ALL') {
    whereClauses.push(`status = ?`);
    params.push(status);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const validSortCols = ['created_at', 'original_size', 'result_size', 'space_saved', 'compression_ratio', 'duration_ms', 'original_filename'];
  const safeSortCol = validSortCols.includes(sortBy) ? sortBy : 'created_at';
  const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const query = `
    SELECT * FROM jobs
    ${whereStr}
    ORDER BY ${safeSortCol} ${safeOrder}
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const countQuery = `SELECT COUNT(*) as total FROM jobs ${whereStr}`;
  const total = db.prepare(countQuery).get(...params.slice(0, -2)).total;

  const rows = db.prepare(query).all(...params);
  return { jobs: rows, total, limit, offset };
}

module.exports = {
  db,
  createUser,
  findUserByUsername,
  findUserById,
  verifyUser,
  insertJob,
  getJobById,
  deleteJob,
  clearUserJobs,
  listJobs
};
