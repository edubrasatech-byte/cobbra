const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(process.cwd(), 'database', 'cobbra.db');
const db = new Database(dbPath);

try {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@cobbra.com.br');
  if (!user) {
    console.log('❌ User not found in database!');
  } else {
    console.log('👤 User found:', { id: user.id, email: user.email, name: user.name });
    console.log('🔑 Stored Hash:', user.password_hash);
    
    // Test comparing with 'demo'
    const isDemoMatch = bcrypt.compareSync('demo', user.password_hash);
    console.log('❓ Does password "demo" match stored hash?', isDemoMatch);
  }
} catch (e) {
  console.error('❌ Error executing database check:', e.message);
} finally {
  db.close();
}
