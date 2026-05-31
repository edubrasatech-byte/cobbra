const { query } = require('../lib/db');

try {
  console.log("--- LEADS SEARCH QUEUE ---");
  const queue = query("SELECT * FROM leads_search_queue");
  console.table(queue);

  console.log("\n--- LEADS PROSPECTS ---");
  const prospects = query("SELECT id, name, phone, niche, city, status, sent_at, attempts FROM leads_prospects LIMIT 20");
  console.table(prospects);

  console.log("\n--- STATS BY STATUS ---");
  const stats = query("SELECT status, COUNT(*) as count FROM leads_prospects GROUP BY status");
  console.table(stats);
} catch (e) {
  console.error("Error reading database:", e);
}
