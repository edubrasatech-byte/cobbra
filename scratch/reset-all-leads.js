const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
const DUMP_PATH = path.join(process.cwd(), 'public', 'leads_dump.json');

console.log('🔄 Reiniciando toda a fila de prospecção no banco local...');

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Erro: database/cobbra.db não encontrado!');
  process.exit(1);
}

try {
  const db = new Database(DB_PATH);
  
  // Atualizar todos os status para 'ready_to_send' e resetar tentativas
  const result = db.prepare("UPDATE leads_prospects SET status = 'ready_to_send', attempts = 0, sent_at = NULL").run();
  console.log(`✅ Fila reiniciada! ${result.changes} leads redefinidos para 'ready_to_send'.`);

  // Exportar a fila limpa para leads_dump.json
  const leads = db.prepare("SELECT * FROM leads_prospects").all();
  fs.writeFileSync(DUMP_PATH, JSON.stringify(leads, null, 2), 'utf-8');
  console.log(`📊 Exportados ${leads.length} leads atualizados com status limpo para ${DUMP_PATH}`);

  db.close();
} catch (e) {
  console.error('❌ Erro ao reiniciar leads:', e.message);
}
