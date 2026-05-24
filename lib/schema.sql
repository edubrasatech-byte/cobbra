-- =============================================
-- COBROO - Schema do Banco de Dados
-- Micro-SaaS de Cobrança Gentil
-- =============================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin_senior', 'admin', 'user')),
  pix_key TEXT,
  pix_key_type TEXT CHECK(pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  business_name TEXT,
  business_description TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'trial' CHECK(plan IN ('trial', 'starter', 'pro', 'enterprise', 'crescimento', 'cobra_pro')),
  plan_expires_at TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked')),
  onboarding_completed INTEGER DEFAULT 0,
  interest_rate_excellent REAL DEFAULT 0.1,
  interest_rate_regular REAL DEFAULT 0.3,
  interest_rate_risk REAL DEFAULT 0.5,
  score_limit_good REAL DEFAULT 0.2,
  score_limit_regular REAL DEFAULT 0.4,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  category TEXT,
  tags TEXT,
  health_score TEXT DEFAULT 'good' CHECK(health_score IN ('good', 'warning', 'critical')),
  notes TEXT,
  company_name TEXT,
  birthday TEXT,
  address TEXT,
  total_charged REAL DEFAULT 0,
  total_paid REAL DEFAULT 0,
  total_overdue REAL DEFAULT 0,
  last_payment_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Cobranças
CREATE TABLE IF NOT EXISTS charges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reminder_sent', 'paid', 'overdue', 'cancelled')),
  recurrence TEXT DEFAULT 'once' CHECK(recurrence IN ('once', 'weekly', 'monthly', 'quarterly', 'yearly')),
  reminder_channel TEXT DEFAULT 'both' CHECK(reminder_channel IN ('whatsapp', 'email', 'both')),
  payment_method TEXT DEFAULT 'pix' CHECK(payment_method IN ('pix', 'boleto', 'link')),
  daily_interest_rate REAL DEFAULT 0,
  paid_at TEXT,
  paid_amount REAL,
  cancelled_at TEXT,
  cancel_reason TEXT,
  next_reminder_at TEXT,
  reminders_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabela de Lembretes
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  charge_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('whatsapp', 'email')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TEXT DEFAULT (datetime('now')),
  delivered_at TEXT,
  read_at TEXT,
  FOREIGN KEY (charge_id) REFERENCES charges(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabela de Templates de Lembrete
CREATE TABLE IF NOT EXISTS reminder_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  tone TEXT DEFAULT 'gentle' CHECK(tone IN ('gentle', 'neutral', 'firm')),
  timing_days INTEGER DEFAULT -3,
  is_default INTEGER DEFAULT 0,
  channel TEXT DEFAULT 'both' CHECK(channel IN ('whatsapp', 'email', 'both')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'payment', 'reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  read INTEGER DEFAULT 0,
  entity_type TEXT,
  entity_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Log de Atividades
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  UNIQUE(user_id, key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Pagamentos/Transações
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  charge_id TEXT,
  client_id TEXT,
  amount REAL NOT NULL,
  type TEXT DEFAULT 'income' CHECK(type IN ('income', 'refund')),
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (charge_id) REFERENCES charges(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_charges_user_id ON charges(user_id);
CREATE INDEX IF NOT EXISTS idx_charges_client_id ON charges(client_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
CREATE INDEX IF NOT EXISTS idx_charges_due_date ON charges(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_charge_id ON reminders(charge_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Tabela de Faturamento/Cobrança Diária
CREATE TABLE IF NOT EXISTS daily_billing (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  description TEXT,
  interest_rate REAL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_billing_user_id ON daily_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_billing_client_id ON daily_billing(client_id);
