const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
const DUMP_PATH = path.join(process.cwd(), 'database', 'leads_dump.json');

console.log('🔄 Exportando leads do banco local...');

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Erro: database/cobbra.db não encontrado!');
  process.exit(1);
}

try {
  const db = new Database(DB_PATH);
  const leads = db.prepare("SELECT * FROM leads_prospects").all();
  db.close();

  console.log(`📊 Encontrados ${leads.length} leads no banco local.`);
  
  fs.writeFileSync(DUMP_PATH, JSON.stringify(leads, null, 2), 'utf-8');
  console.log(`✅ Sucesso! Leads exportados para ${DUMP_PATH}`);
} catch (e) {
  console.error('❌ Erro ao exportar:', e.message);
}
