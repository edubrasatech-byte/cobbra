const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

['cobbra.db', 'cobroo.db'].forEach(dbName => {
  const dbPath = path.join(process.cwd(), 'database', dbName);
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    try {
      const qCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='whatsapp_queue'").get();
      if (qCheck) {
        const total = db.prepare('SELECT COUNT(*) as count FROM whatsapp_queue').get().count;
        const pending = db.prepare("SELECT COUNT(*) as count FROM whatsapp_queue WHERE status = 'pending'").get().count;
        const sent = db.prepare("SELECT COUNT(*) as count FROM whatsapp_queue WHERE status = 'sent'").get().count;
        const failed = db.prepare("SELECT COUNT(*) as count FROM whatsapp_queue WHERE status = 'failed'").get().count;
        console.log(dbName, 'Total:', total, 'Pending:', pending, 'Sent:', sent, 'Failed:', failed);
      } else {
        console.log(dbName, 'whatsapp_queue table does not exist.');
      }
    } catch(e) { 
      console.error(dbName, e.message); 
    }
    db.close();
  }
});
