const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'database', 'cobbra.db');

if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath);
  try {
    const clients = db.prepare("SELECT * FROM clients WHERE name LIKE '%Correa%' OR name LIKE '%Corrêa%'").all();
    console.log('Clients matching Correa:', clients);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    db.close();
  }
} else {
  console.log('cobbra.db does not exist');
}
