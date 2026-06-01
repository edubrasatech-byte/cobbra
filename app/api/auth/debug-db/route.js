import { query } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    let DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
    const OLD_DB_PATH = path.join(process.cwd(), 'database', 'cobroo.db');
    
    let activePath = DB_PATH;
    if (fs.existsSync(OLD_DB_PATH)) {
      if (!fs.existsSync(DB_PATH)) {
        activePath = OLD_DB_PATH;
      } else {
        const oldSize = fs.statSync(OLD_DB_PATH).size;
        const newSize = fs.statSync(DB_PATH).size;
        if (oldSize > newSize) {
          activePath = OLD_DB_PATH;
        }
      }
    }

    const users = query('SELECT id, name, email, role, plan, SUBSTR(password_hash, 1, 12) as hash_prefix FROM users');
    
    let leadsCount = 0;
    try {
      leadsCount = query("SELECT COUNT(*) as count FROM leads_prospects")[0].count;
    } catch (e) {
      leadsCount = 'error: ' + e.message;
    }

    const dumpPath = path.join(process.cwd(), 'public', 'leads_dump.json');

    return Response.json({
      success: true,
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
      activeDatabasePath: activePath,
      cobbraExists: fs.existsSync(DB_PATH),
      cobrooExists: fs.existsSync(OLD_DB_PATH),
      leadsDumpExists: fs.existsSync(dumpPath),
      leadsCount,
      users
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
