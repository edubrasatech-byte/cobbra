const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbs = ['cobbra.db', 'cobroo.db'];

for (const dbName of dbs) {
  const dbPath = path.join(process.cwd(), 'database', dbName);
  if (fs.existsSync(dbPath)) {
    try {
      const db = new Database(dbPath);
      // Check if table exists
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='leads_prospects'").get();
      if (tableCheck) {
        const count = db.prepare("SELECT COUNT(*) as count FROM leads_prospects").get().count;
        const sample = db.prepare("SELECT name, phone, niche, city, status FROM leads_prospects LIMIT 3").all();
        console.log(`📊 DB: ${dbName} | Total prospects: ${count}`);
        if (count > 0) {
          console.log("Sample prospects:", sample);
        }
      } else {
        console.log(`❌ DB: ${dbName} | leads_prospects table does not exist!`);
      }
      db.close();
    } catch (e) {
      console.log(`❌ DB: ${dbName} | Error: ${e.message}`);
    }
  } else {
    console.log(`ℹ️ DB: ${dbName} | File does not exist.`);
  }
}
