const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const cobbraDbPath = path.join(process.cwd(), 'database', 'cobbra.db');
const cobrooDbPath = path.join(process.cwd(), 'database', 'cobroo.db');

console.log('--- CHECKING COBBRA.DB ---');
if (fs.existsSync(cobbraDbPath)) {
  const db = new Database(cobbraDbPath);
  try {
    const users = db.prepare('SELECT id, name, email, plan FROM users').all();
    console.log('Users in cobbra.db:', users);
  } catch (e) {
    console.error('Error reading cobbra.db:', e.message);
  } finally {
    db.close();
  }
} else {
  console.log('cobbra.db does not exist');
}

console.log('--- CHECKING COBROO.DB ---');
if (fs.existsSync(cobrooDbPath)) {
  const db = new Database(cobrooDbPath);
  try {
    const users = db.prepare('SELECT id, name, email, plan FROM users').all();
    console.log('Users in cobroo.db:', users);
  } catch (e) {
    console.error('Error reading cobroo.db:', e.message);
  } finally {
    db.close();
  }
} else {
  console.log('cobroo.db does not exist');
}
