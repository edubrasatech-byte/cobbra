const db = require('better-sqlite3')('database/cobroo.db');

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'budgeting' CHECK(status IN ('budgeting', 'in_progress', 'completed')),
  total_value REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT DEFAULT 'budget' CHECK(type IN ('budget', 'contract', 'daily_report', 'photo_report')),
  content_html TEXT,
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

console.log('Tabelas projects e documents criadas com sucesso!');
