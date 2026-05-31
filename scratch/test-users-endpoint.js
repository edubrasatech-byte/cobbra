const { query, queryOne, run } = require('../lib/db');

try {
  console.log("Starting DB connection and query testing...");
  
  console.log("1. totalUsers...");
  const totalUsers = queryOne('SELECT COUNT(*) as count FROM users');
  console.log("totalUsers:", totalUsers);

  console.log("2. activeUsers...");
  const activeUsers = queryOne("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
  console.log("activeUsers:", activeUsers);

  console.log("3. totalRevenue...");
  const totalRevenue = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'");
  console.log("totalRevenue:", totalRevenue);

  console.log("4. totalCharges...");
  const totalCharges = queryOne('SELECT COUNT(*) as count FROM charges');
  console.log("totalCharges:", totalCharges);

  console.log("5. totalClients...");
  const totalClients = queryOne('SELECT COUNT(*) as count FROM clients');
  console.log("totalClients:", totalClients);

  console.log("6. newUsersThisWeek...");
  const newUsersThisWeek = queryOne("SELECT COUNT(*) as count FROM users WHERE created_at >= date('now', '-7 days')");
  console.log("newUsersThisWeek:", newUsersThisWeek);

  console.log("7. newUsersThisMonth...");
  const newUsersThisMonth = queryOne("SELECT COUNT(*) as count FROM users WHERE created_at >= date('now', '-30 days')");
  console.log("newUsersThisMonth:", newUsersThisMonth);

  console.log("8. planCounts...");
  const planCounts = query(`
    SELECT plan, COUNT(*) as count 
    FROM users 
    WHERE status = 'active'
    GROUP BY plan
  `);
  console.log("planCounts:", planCounts);

  console.log("9. inactiveCount...");
  const inactiveCount = queryOne("SELECT COUNT(*) as count FROM users WHERE status != 'active'").count;
  console.log("inactiveCount:", inactiveCount);

  console.log("10. onlineUsers...");
  const onlineUsers = queryOne(`
    SELECT COUNT(DISTINCT user_id) as count 
    FROM activity_log 
    WHERE created_at >= datetime('now', '-10 minutes')
  `);
  console.log("onlineUsers:", onlineUsers);

  console.log("11. planDistributionRaw...");
  const planDistributionRaw = query(`
    SELECT plan, COUNT(*) as count 
    FROM users 
    GROUP BY plan
  `);
  console.log("planDistributionRaw:", planDistributionRaw);

  console.log("12. recentRegistrations...");
  const recentRegistrations = query(`
    SELECT date(created_at) as register_day, COUNT(*) as count 
    FROM users 
    WHERE created_at >= date('now', '-7 days') 
    GROUP BY register_day 
    ORDER BY register_day ASC
  `);
  console.log("recentRegistrations:", recentRegistrations);

  console.log("13. waSent...");
  const waSent = queryOne("SELECT COUNT(*) as count FROM reminders WHERE channel = 'whatsapp'");
  console.log("waSent:", waSent);

  console.log("14. emailSent...");
  const emailSent = queryOne("SELECT COUNT(*) as count FROM reminders WHERE channel = 'email'");
  console.log("emailSent:", emailSent);

  console.log("15. auditLogs...");
  const auditLogs = query(`
    SELECT a.*, u.name as user_name, u.email as user_email 
    FROM activity_log a 
    LEFT JOIN users u ON a.user_id = u.id 
    ORDER BY a.created_at DESC 
    LIMIT 20
  `);
  console.log("auditLogs:", auditLogs);

  console.log("16. user list query...");
  let sql = `SELECT id, name, email, phone, role, plan, status, business_name, created_at, updated_at,
             (SELECT COUNT(*) FROM clients WHERE user_id = users.id) as client_count,
             (SELECT COUNT(*) FROM charges WHERE user_id = users.id) as charge_count,
             (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = users.id AND type = 'income') as total_revenue
             FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 0`;
  const users = query(sql);
  console.log("users count:", users.length);

  console.log("SUCCESS! All queries executed successfully.");
} catch (e) {
  console.error("ERROR EXECUTING QUERIES:", e);
}
