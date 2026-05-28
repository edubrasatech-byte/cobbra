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

    // Dynamic onboarding and niche columns
    addColumnSafe('users', 'business_niche', 'TEXT');
    addColumnSafe('users', 'collection_rigor', "TEXT DEFAULT 'neutral'");
    addColumnSafe('charges', 'vehicle_info', 'TEXT');
    addColumnSafe('charges', 'loan_info', 'TEXT');
    addColumnSafe('charges', 'contract_text', 'TEXT');
    addColumnSafe('charges', 'deposit_amount', 'REAL DEFAULT 0');

    // === VEHICLE RENTAL PREMIUM MODULE TABLES ===
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          investor_name TEXT,
          investor_split_rate REAL,
          model TEXT NOT NULL,
          plate TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL,
          year INTEGER,
          renavam TEXT,
          chassis TEXT,
          current_km INTEGER DEFAULT 0,
          status TEXT DEFAULT 'available',
          oil_change_interval_km INTEGER DEFAULT 10000,
          last_oil_change_km INTEGER DEFAULT 0,
          insurance_policy TEXT,
          insurance_expires_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS contracts_rentals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          vehicle_id TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT,
          rent_amount REAL NOT NULL,
          billing_cycle TEXT DEFAULT 'weekly',
          status TEXT DEFAULT 'active',
          contract_html TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS escrow_deposits (
          id TEXT PRIMARY KEY,
          contract_id TEXT NOT NULL,
          total_target_amount REAL NOT NULL,
          upfront_amount REAL NOT NULL,
          installments_count INTEGER DEFAULT 0,
          installments_amount REAL DEFAULT 0,
          balance_paid REAL DEFAULT 0,
          status TEXT DEFAULT 'pending_accrual',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (contract_id) REFERENCES contracts_rentals(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS vehicle_inspections (
          id TEXT PRIMARY KEY,
          contract_id TEXT NOT NULL,
          type TEXT NOT NULL,
          km INTEGER NOT NULL,
          fuel_level TEXT NOT NULL,
          cleanliness TEXT NOT NULL,
          general_condition_notes TEXT,
          photo_front TEXT,
          photo_back TEXT,
          photo_left TEXT,
          photo_right TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (contract_id) REFERENCES contracts_rentals(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS maintenance_records (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL,
          contract_id TEXT,
          description TEXT NOT NULL,
          total_cost REAL NOT NULL,
          responsibility TEXT DEFAULT 'owner',
          driver_share_amount REAL DEFAULT 0,
          driver_charge_mode TEXT DEFAULT 'direct_charge',
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
          FOREIGN KEY (contract_id) REFERENCES contracts_rentals(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS traffic_fines (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL,
          contract_id TEXT,
          infraction_date TEXT NOT NULL,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          points INTEGER,
          driver_indicated INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
          FOREIGN KEY (contract_id) REFERENCES contracts_rentals(id) ON DELETE SET NULL
        );
      `);
      console.log('✅ Vehicle rental tables created/verified successfully!');
    } catch (e) {
      console.error("Failed to create vehicle rental tables:", e);
    }

    // Add driver/CNH columns to clients table safely
    addColumnSafe('clients', 'cnh_number', 'TEXT');
    addColumnSafe('clients', 'cnh_category', 'TEXT');
    addColumnSafe('clients', 'cnh_expires_at', 'TEXT');
    addColumnSafe('clients', 'security_background_status', "TEXT DEFAULT 'pending'");

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

    // Ensure demo@cobbra.com.br exists on all environments
    try {
      const demoExists = db.prepare("SELECT id FROM users WHERE email = ?").get('demo@cobbra.com.br');
      if (!demoExists) {
        console.log('🚀 demo@cobbra.com.br not found. Seeding demo data...');
        const bcrypt = require('bcryptjs');
        const passwordHash = bcrypt.hashSync('demo', 12);
        const userId = 'user-demo-cobbra';
        
        db.transaction(() => {
          // Clean up if any partial records
          db.prepare('DELETE FROM users WHERE id = ? OR email = ?').run(userId, 'demo@cobbra.com.br');
          
          // Insert User
          db.prepare(`
            INSERT INTO users (
              id, name, email, password_hash, phone, role, 
              pix_key, pix_key_type, business_name, business_description, 
              plan, plan_expires_at, status, onboarding_completed,
              interest_rate_excellent, interest_rate_regular, interest_rate_risk,
              score_limit_good, score_limit_regular
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            userId,
            'Demonstração Cobbra',
            'demo@cobbra.com.br',
            passwordHash,
            '(11) 97777-8888',
            'user',
            'demo@cobbra.com.br',
            'email',
            'Cobbra Demo Pay',
            'Plataforma de Cobrança e Gestão de Pagamentos Inteligentes',
            'pro',
            '2028-12-31T23:59:59.000Z',
            'active',
            1,
            0.1,
            0.3,
            0.5,
            0.2,
            0.4
          );

          // Insert Clients
          const clients = [
            { id: 'demo-cli-001', name: 'Mariana Alves', email: 'mariana@email.com', phone: '(11) 91111-1111', category: 'Aluna', tags: 'mensal,pilates', score: 'good', notes: 'Aluna assídua de Pilates, sempre paga antes do vencimento.', charged: 1350, paid: 900, overdue: 0 },
            { id: 'demo-cli-002', name: 'Rodrigo Pacheco', email: 'rodrigo@email.com', phone: '(11) 92222-2222', category: 'Aluno', tags: 'mensal,musculação', score: 'warning', notes: 'Atrasou a mensalidade de musculação este mês.', charged: 450, paid: 0, overdue: 450 },
            { id: 'demo-cli-003', name: 'Juliana Mendes', email: 'juliana@email.com', phone: '(11) 93333-3333', category: 'Aluna', tags: 'mensal,funcional', score: 'good', notes: 'Paga sempre pontualmente no dia 15.', charged: 1000, paid: 1000, overdue: 0 },
            { id: 'demo-cli-004', name: 'Carlos Eduardo', email: 'carlos@email.com', phone: '(11) 94444-4444', category: 'Aluno', tags: 'mensal,personal', score: 'critical', notes: 'Em atraso crítico há dois meses, não responde às mensagens.', charged: 1200, paid: 0, overdue: 1200 },
            { id: 'demo-cli-005', name: 'Ana Paula Santos', email: 'ana.paula@email.com', phone: '(11) 95555-5555', category: 'Aluna', tags: 'semanal,yoga', score: 'good', notes: 'Pratica yoga e paga de forma antecipada.', charged: 400, paid: 200, overdue: 0 },
            { id: 'demo-cli-006', name: 'Fernando Lima', email: 'fernando@email.com', phone: '(11) 96666-6666', category: 'Aluno', tags: 'mensal,crossfit', score: 'good', notes: 'Pratica crossfit, muito disciplinado.', charged: 350, paid: 350, overdue: 0 },
            { id: 'demo-cli-007', name: 'Beatriz Souza', email: 'beatriz@email.com', phone: '(11) 97777-7777', category: 'Aluna', tags: 'mensal,pilates', score: 'warning', notes: 'Pediu para postergar o vencimento deste mês.', charged: 300, paid: 0, overdue: 0 },
            { id: 'demo-cli-008', name: 'Lucas Ferreira', email: 'lucas.f@email.com', phone: '(11) 98888-8888', category: 'Aluno', tags: 'quinzenal,personal', score: 'good', notes: 'Paga a cada 15 dias sem problemas.', charged: 700, paid: 700, overdue: 0 }
          ];

          const insertClient = db.prepare(`
            INSERT INTO clients (
              id, user_id, name, email, phone, category, tags, health_score, notes, 
              total_charged, total_paid, total_overdue
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const c of clients) {
            insertClient.run(c.id, userId, c.name, c.email, c.phone, c.category, c.tags, c.score, c.notes, c.charged, c.paid, c.overdue);
          }

          // Insert Charges
          const charges = [
            { id: 'demo-chg-001', client_id: 'demo-cli-001', amount: 450, desc: 'Mensalidade Pilates - Maio/2026', due: '2026-05-10', status: 'paid', paid_at: '2026-05-09T14:30:00.000Z', paid_amount: 450, reminders: 1 },
            { id: 'demo-chg-002', client_id: 'demo-cli-003', amount: 500, desc: 'Mensalidade Funcional - Maio/2026', due: '2026-05-15', status: 'paid', paid_at: '2026-05-14T10:00:00.000Z', paid_amount: 500, reminders: 1 },
            { id: 'demo-chg-003', client_id: 'demo-cli-006', amount: 350, desc: 'Mensalidade Crossfit - Maio/2026', due: '2026-05-12', status: 'paid', paid_at: '2026-05-12T09:15:00.000Z', paid_amount: 350, reminders: 1 },
            { id: 'demo-chg-004', client_id: 'demo-cli-008', amount: 700, desc: 'Quinzena Personal - 1ª Mai/2026', due: '2026-05-01', status: 'paid', paid_at: '2026-05-01T08:00:00.000Z', paid_amount: 700, reminders: 0 },
            { id: 'demo-chg-005', client_id: 'demo-cli-001', amount: 450, desc: 'Mensalidade Pilates - Abril/2026', due: '2026-04-10', status: 'paid', paid_at: '2026-04-10T11:20:00.000Z', paid_amount: 450, reminders: 1 },
            { id: 'demo-chg-006', client_id: 'demo-cli-003', amount: 500, desc: 'Mensalidade Funcional - Abril/2026', due: '2026-04-15', status: 'paid', paid_at: '2026-04-15T14:30:00.000Z', paid_amount: 500, reminders: 1 },
            { id: 'demo-chg-007', client_id: 'demo-cli-005', amount: 200, desc: 'Aula Yoga Avulsa', due: '2026-05-20', status: 'paid', paid_at: '2026-05-19T17:00:00.000Z', paid_amount: 200, reminders: 1 },
            { id: 'demo-chg-008', client_id: 'demo-cli-004', amount: 600, desc: 'Mensalidade Personal - Maio/2026', due: '2026-05-05', status: 'overdue', paid_at: null, paid_amount: null, reminders: 3 },
            { id: 'demo-chg-009', client_id: 'demo-cli-002', amount: 450, desc: 'Mensalidade Musculação - Maio/2026', due: '2026-05-10', status: 'overdue', paid_at: null, paid_amount: null, reminders: 2 },
            { id: 'demo-chg-010', client_id: 'demo-cli-004', amount: 600, desc: 'Mensalidade Personal - Abril/2026', due: '2026-04-05', status: 'overdue', paid_at: null, paid_amount: null, reminders: 5 },
            { id: 'demo-chg-011', client_id: 'demo-cli-007', amount: 300, desc: 'Mensalidade Pilates - Junho/2026', due: '2026-05-28', status: 'pending', paid_at: null, paid_amount: null, reminders: 0 },
            { id: 'demo-chg-012', client_id: 'demo-cli-005', amount: 200, desc: 'Aula Yoga Avulsa', due: '2026-05-30', status: 'pending', paid_at: null, paid_amount: null, reminders: 0 },
            { id: 'demo-chg-013', client_id: 'demo-cli-001', amount: 450, desc: 'Mensalidade Pilates - Junho/2026', due: '2026-06-10', status: 'pending', paid_at: null, paid_amount: null, reminders: 0 }
          ];

          const insertCharge = db.prepare(`
            INSERT INTO charges (
              id, user_id, client_id, amount, description, due_date, status, 
              recurrence, reminder_channel, payment_method, daily_interest_rate, 
              paid_at, paid_amount, reminders_sent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'monthly', 'both', 'pix', 0.005, ?, ?, ?)
          `);

          for (const c of charges) {
            insertCharge.run(c.id, userId, c.client_id, c.amount, c.desc, c.due, c.status, c.paid_at, c.paid_amount, c.reminders);
          }

          // Insert Transactions
          const transactions = [
            { id: 'demo-txn-001', chg: 'demo-chg-001', cli: 'demo-cli-001', amount: 450, date: '2026-05-09T14:30:00.000Z', ref: 'PIX-DEMO-001' },
            { id: 'demo-txn-002', chg: 'demo-chg-002', cli: 'demo-cli-003', amount: 500, date: '2026-05-14T10:00:00.000Z', ref: 'PIX-DEMO-002' },
            { id: 'demo-txn-003', chg: 'demo-chg-003', cli: 'demo-cli-006', amount: 350, date: '2026-05-12T09:15:00.000Z', ref: 'PIX-DEMO-003' },
            { id: 'demo-txn-004', chg: 'demo-chg-004', cli: 'demo-cli-008', amount: 700, date: '2026-05-01T08:00:00.000Z', ref: 'PIX-DEMO-004' },
            { id: 'demo-txn-005', chg: 'demo-chg-005', cli: 'demo-cli-001', amount: 450, date: '2026-04-10T11:20:00.000Z', ref: 'PIX-DEMO-005' },
            { id: 'demo-txn-006', chg: 'demo-chg-006', cli: 'demo-cli-003', amount: 500, date: '2026-04-15T14:30:00.000Z', ref: 'PIX-DEMO-006' },
            { id: 'demo-txn-007', chg: 'demo-chg-007', cli: 'demo-cli-005', amount: 200, date: '2026-05-19T17:00:00.000Z', ref: 'PIX-DEMO-007' }
          ];

          const insertTxn = db.prepare(`
            INSERT INTO transactions (
              id, user_id, charge_id, client_id, amount, type, payment_method, reference, created_at
            ) VALUES (?, ?, ?, ?, ?, 'income', 'pix', ?, ?)
          `);

          for (const t of transactions) {
            insertTxn.run(t.id, userId, t.chg, t.cli, t.amount, t.ref, t.date);
          }

          // Insert Reminders
          const reminders = [
            { id: 'demo-rem-001', chg: 'demo-chg-001', cli: 'demo-cli-001', channel: 'whatsapp', msg: 'Oi Mariana! 💚 Lembrete gentil: sua mensalidade de Pilates (R$ 450,00) vence amanhã. Pode pagar pelo Pix no link abaixo. Obrigado! 🙏', status: 'read', sent: '2026-05-09T08:00:00.000Z' },
            { id: 'demo-rem-002', chg: 'demo-chg-008', cli: 'demo-cli-004', channel: 'whatsapp', msg: 'Oi Carlos! 💚 Lembrete gentil: sua mensalidade de Personal Trainer (R$ 600,00) vence amanhã. O Pix está no link. Bons treinos! 💪', status: 'delivered', sent: '2026-05-04T08:00:00.000Z' },
            { id: 'demo-rem-003', chg: 'demo-chg-008', cli: 'demo-cli-004', channel: 'email', msg: 'Prezado Carlos Eduardo, lembramos que sua fatura de R$ 600,00 venceu em 05/05/2026. Por favor, acesse o link de pagamento Pix para regularizar.', status: 'sent', sent: '2026-05-12T08:00:00.000Z' }
          ];

          const insertReminder = db.prepare(`
            INSERT INTO reminders (
              id, charge_id, user_id, client_id, channel, message, status, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const r of reminders) {
            insertReminder.run(r.id, r.chg, userId, r.cli, r.channel, r.msg, r.status, r.sent);
          }

          // Insert Notifications
          const notifications = [
            { id: 'demo-notif-001', type: 'payment', title: 'Pagamento de R$ 500,00 Recebido', msg: 'Juliana Mendes efetuou a quitação da fatura de Funcional via Pix.', read: 0 },
            { id: 'demo-notif-002', type: 'warning', title: 'Cobrança em Atraso Crítico', msg: 'Carlos Eduardo está inadimplente há mais de 15 dias. Lembrete de cobrança firme enviado.', read: 0 },
            { id: 'demo-notif-003', type: 'system', title: 'Ambiente de Demonstração Ativo 🐍', msg: 'Seja bem-vindo ao painel completo da Cobbra. A IA Catarina está online e pronta para responder.', read: 0 }
          ];

          const insertNotif = db.prepare(`
            INSERT INTO notifications (
              id, user_id, type, title, message, read, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `);

          for (const n of notifications) {
            insertNotif.run(n.id, userId, n.type, n.title, n.msg, n.read);
          }

          // Insert Settings
          const settings = [
            { id: 'demo-set-001', key: 'ai_active', val: 'true' },
            { id: 'demo-set-002', key: 'whatsapp_integration', val: 'connected' },
            { id: 'demo-set-003', key: 'interest_rate_mode', val: 'daily' }
          ];

          const insertSetting = db.prepare(`
            INSERT INTO settings (
              id, user_id, key, value
            ) VALUES (?, ?, ?, ?)
          `);

          for (const s of settings) {
            insertSetting.run(s.id, userId, s.key, s.val);
          }

          // Insert Daily Recurrence
          db.prepare(`
            INSERT INTO daily_billing (
              id, user_id, client_id, amount, description, interest_rate, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).run(
            'demo-daily-001',
            userId,
            'demo-cli-005',
            200.00,
            'Mensalidade Yoga Recorrente',
            0.005,
            'active'
          );
        })();
        console.log('✅ demo@cobbra.com.br seeded successfully on start!');
      }
    } catch (e) {
      console.error('❌ Failed to ensure demo user exists:', e);
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
