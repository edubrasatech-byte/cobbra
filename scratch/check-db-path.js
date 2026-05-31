const path = require('path');
const fs = require('fs');

let DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
const OLD_DB_PATH = path.join(process.cwd(), 'database', 'cobroo.db');

console.log('🔍 Path checking...');
console.log('process.cwd():', process.cwd());
console.log('cobbra.db path:', DB_PATH, 'Exists:', fs.existsSync(DB_PATH));
console.log('cobroo.db path:', OLD_DB_PATH, 'Exists:', fs.existsSync(OLD_DB_PATH));

if (fs.existsSync(OLD_DB_PATH)) {
  if (!fs.existsSync(DB_PATH)) {
    console.log('Active DB: cobroo.db (since cobbra.db does not exist)');
    DB_PATH = OLD_DB_PATH;
  } else {
    const oldSize = fs.statSync(OLD_DB_PATH).size;
    const newSize = fs.statSync(DB_PATH).size;
    console.log(`Sizes - cobroo.db: ${oldSize} bytes, cobbra.db: ${newSize} bytes`);
    if (oldSize > newSize) {
      console.log('Active DB: cobroo.db (larger size)');
      DB_PATH = OLD_DB_PATH;
    } else {
      console.log('Active DB: cobbra.db (larger or equal size)');
    }
  }
} else {
  console.log('Active DB: cobbra.db (since cobroo.db does not exist)');
}

const Database = require('better-sqlite3');
const db = new Database(DB_PATH);
const users = db.prepare('SELECT id, name, email, role, plan FROM users').all();
console.log('\n👥 ACTIVE USERS IN ACTIVE DB:');
console.log(users);
db.close();
