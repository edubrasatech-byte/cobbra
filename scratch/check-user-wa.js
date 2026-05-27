const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const cobbraDbPath = path.join(process.cwd(), 'database', 'cobbra.db');
const cobrooDbPath = path.join(process.cwd(), 'database', 'cobroo.db');

function checkDb(dbPath, name) {
  console.log(`=== CHECKING ${name} ===`);
  if (!fs.existsSync(dbPath)) {
    console.log(`${name} does not exist`);
    return;
  }
  const db = new Database(dbPath);
  try {
    const users = db.prepare('SELECT id, name, email, plan, whatsapp_status, whatsapp_instance, whatsapp_phone FROM users').all();
    console.log(users);
  } catch (e) {
    console.error('Error reading:', e.message);
  } finally {
    db.close();
  }
}

checkDb(cobbraDbPath, 'cobbra.db');
checkDb(cobrooDbPath, 'cobroo.db');
