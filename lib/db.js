const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
const SCHEMA_PATH = path.join(process.cwd(), 'lib', 'schema.sql');
const SEED_PATH = path.join(process.cwd(), 'lib', 'seed.sql');

let db;

function getDb() {
  if (!db) {
    // Ensure database directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Ensure daily_billing table exists (Version 2.3 schema: no UNIQUE on client_id, and paid_early in status CHECK)
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS daily_billing (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          interest_rate REAL DEFAULT 0,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'paid_early')),
          end_date TEXT,
          exclude_saturdays INTEGER DEFAULT 0,
          exclude_sundays_holidays INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );
      `);
    } catch (e) {
      console.error("Failed to create daily_billing table:", e);
    }

    // Safety Migration for V2.3: Remove UNIQUE constraint on client_id and add paid_early status
    try {
      const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_billing'").get();
      if (tableInfo && tableInfo.sql.includes('UNIQUE')) {
        console.log('🔄 Migrating daily_billing table to remove UNIQUE constraint and expand status...');
        db.exec(`
          BEGIN TRANSACTION;
          ALTER TABLE daily_billing RENAME TO daily_billing_old;
          CREATE TABLE daily_billing (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            client_id TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            interest_rate REAL DEFAULT 0,
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'paid_early')),
            end_date TEXT,
            exclude_saturdays INTEGER DEFAULT 0,
            exclude_sundays_holidays INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
          );
          INSERT INTO daily_billing (id, user_id, client_id, amount, description, interest_rate, status, end_date, exclude_saturdays, exclude_sundays_holidays, created_at, updated_at)
          SELECT id, user_id, client_id, amount, description, interest_rate, status, end_date, exclude_saturdays, exclude_sundays_holidays, created_at, updated_at FROM daily_billing_old;
          DROP TABLE daily_billing_old;
          COMMIT;
        `);
        console.log('✅ daily_billing table migrated successfully to V2.3 schema!');
      }
    } catch (e) {
      try { db.exec('ROLLBACK;'); } catch(_) {}
      console.error("Failed to migrate daily_billing table to V2.3:", e);
    }

    // Ensure columns exist on pre-existing tables
    const addColumnSafe = (table, col, def) => {
      try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch(e) { /* already exists */ }
    };
    addColumnSafe('daily_billing', 'end_date', 'TEXT');
    addColumnSafe('daily_billing', 'exclude_saturdays', 'INTEGER DEFAULT 0');
    addColumnSafe('daily_billing', 'exclude_sundays_holidays', 'INTEGER DEFAULT 0');

    // Ensure user score rate columns exist
    addColumnSafe('users', 'interest_rate_excellent', 'REAL DEFAULT 0.1');
    addColumnSafe('users', 'interest_rate_regular', 'REAL DEFAULT 0.3');
    addColumnSafe('users', 'interest_rate_risk', 'REAL DEFAULT 0.5');
    addColumnSafe('users', 'score_limit_good', 'REAL DEFAULT 0.2');
    addColumnSafe('users', 'score_limit_regular', 'REAL DEFAULT 0.4');
    addColumnSafe('users', 'whatsapp_status', "TEXT DEFAULT 'disconnected'");
    addColumnSafe('users', 'whatsapp_phone', 'TEXT');
    addColumnSafe('users', 'whatsapp_instance', 'TEXT');

    // Initialize schema
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  try {
    // Check if tables exist
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    
    if (!tableCheck) {
      console.log('🗄️ Initializing database...');
      
      // Run schema
      if (fs.existsSync(SCHEMA_PATH)) {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schema);
        console.log('✅ Schema created successfully');
      }

      // Run seed
      if (fs.existsSync(SEED_PATH)) {
        const seed = fs.readFileSync(SEED_PATH, 'utf-8');
        db.exec(seed);
        console.log('✅ Seed data inserted successfully');
      }
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Helper functions
function generateId() {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
}

function query(sql, params = []) {
  const database = getDb();
  return database.prepare(sql).all(...params);
}

function queryOne(sql, params = []) {
  const database = getDb();
  return database.prepare(sql).get(...params);
}

function run(sql, params = []) {
  const database = getDb();
  return database.prepare(sql).run(...params);
}

function transaction(fn) {
  const database = getDb();
  return database.transaction(fn)();
}

module.exports = {
  getDb,
  generateId,
  query,
  queryOne,
  run,
  transaction
};
