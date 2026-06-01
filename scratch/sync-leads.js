const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const COBBRA_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
const COBROO_PATH = path.join(process.cwd(), 'database', 'cobroo.db');

console.log('🔄 Iniciando sincronização de leads...');

if (!fs.existsSync(COBBRA_PATH)) {
  console.error('❌ Erro: database/cobbra.db não encontrado!');
  process.exit(1);
}

if (!fs.existsSync(COBROO_PATH)) {
  console.log('ℹ️ cobroo.db não existe. A base ativa já deve ser o cobbra.db. Nenhuma sincronização necessária.');
  process.exit(0);
}

try {
  const dbCobbra = new Database(COBBRA_PATH);
  const dbCobroo = new Database(COBROO_PATH);

  // 1. Garantir que a tabela existe no cobroo.db
  dbCobroo.exec(`
    CREATE TABLE IF NOT EXISTS leads_prospects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      niche TEXT NOT NULL,
      city TEXT NOT NULL,
      offer_details TEXT,
      facebook_url TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'generating', 'ready_to_send', 'sent', 'failed', 'responded')),
      custom_message TEXT,
      attempts INTEGER DEFAULT 0,
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela leads_prospects garantida no cobroo.db.');

  // 2. Buscar todos os leads do cobbra.db
  const leads = dbCobbra.prepare("SELECT * FROM leads_prospects").all();
  console.log(`📊 Total de leads no cobbra.db: ${leads.length}`);

  if (leads.length === 0) {
    console.log('ℹ️ Nenhum lead para copiar.');
    process.exit(0);
  }

  // 3. Inserir/Mesclar no cobroo.db com segurança (INSERT OR IGNORE para evitar conflito de chave única)
  const insertStmt = dbCobroo.prepare(`
    INSERT OR IGNORE INTO leads_prospects (
      id, name, phone, niche, city, offer_details, facebook_url, status, custom_message, attempts, sent_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let insertedCount = 0;
  dbCobroo.transaction(() => {
    for (const l of leads) {
      const res = insertStmt.run(
        l.id,
        l.name,
        l.phone,
        l.niche,
        l.city,
        l.offer_details,
        l.facebook_url,
        l.status,
        l.custom_message,
        l.attempts,
        l.sent_at,
        l.created_at,
        l.updated_at
      );
      if (res.changes > 0) {
        insertedCount++;
      }
    }
  })();

  console.log(`🎉 Sucesso! Copiados/Sincronizados ${insertedCount} leads novos para o cobroo.db.`);
  
  dbCobbra.close();
  dbCobroo.close();
} catch (e) {
  console.error('❌ Erro na sincronização:', e.message);
}
