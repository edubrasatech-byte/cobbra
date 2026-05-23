import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/dashboard/stats - Dashboard statistics
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // Total received this month
    const received = queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = ? AND type = 'income' AND created_at >= ? AND created_at <= ?`,
      [user.id, firstOfMonth, lastOfMonth]
    );

    // Pending charges
    const pending = queryOne(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM charges 
       WHERE user_id = ? AND status IN ('pending', 'reminder_sent')`,
      [user.id]
    );

    // Overdue charges
    const overdue = queryOne(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM charges 
       WHERE user_id = ? AND status = 'overdue'`,
      [user.id]
    );

    // Payment rate
    const totalCharges = queryOne(
      `SELECT COUNT(*) as total FROM charges WHERE user_id = ? AND status != 'cancelled'`,
      [user.id]
    );
    const paidCharges = queryOne(
      `SELECT COUNT(*) as total FROM charges WHERE user_id = ? AND status = 'paid'`,
      [user.id]
    );
    const paymentRate = totalCharges.total > 0 ? Math.round((paidCharges.total / totalCharges.total) * 100) : 0;

    // Reminders sent today
    const today = now.toISOString().split('T')[0];
    const remindersToday = queryOne(
      `SELECT COUNT(*) as count FROM reminders WHERE user_id = ? AND DATE(sent_at) = ?`,
      [user.id, today]
    );

    // Total clients
    const clientCount = queryOne('SELECT COUNT(*) as count FROM clients WHERE user_id = ?', [user.id]);

    // Revenue last 30 days (for chart)
    const revenueData = query(
      `SELECT DATE(created_at) as date, SUM(amount) as total 
       FROM transactions 
       WHERE user_id = ? AND type = 'income' AND created_at >= date('now', '-30 days')
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [user.id]
    );

    // Status distribution
    const statusDist = query(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
       FROM charges WHERE user_id = ? AND status != 'cancelled'
       GROUP BY status`,
      [user.id]
    );

    // Recent activity
    const recentActivity = query(
      `SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [user.id]
    );

    // AR Aging
    const arAging = {
      current: queryOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM charges WHERE user_id = ? AND status = 'overdue' AND due_date >= date('now', '-30 days')`, [user.id]),
      days30: queryOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM charges WHERE user_id = ? AND status = 'overdue' AND due_date < date('now', '-30 days') AND due_date >= date('now', '-60 days')`, [user.id]),
      days60: queryOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM charges WHERE user_id = ? AND status = 'overdue' AND due_date < date('now', '-60 days') AND due_date >= date('now', '-90 days')`, [user.id]),
      days90: queryOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM charges WHERE user_id = ? AND status = 'overdue' AND due_date < date('now', '-90 days')`, [user.id]),
    };

    // At-risk clients
    const atRiskClients = query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM charges WHERE client_id = c.id AND status = 'overdue') as overdue_count,
        (SELECT MIN(due_date) FROM charges WHERE client_id = c.id AND status = 'overdue') as oldest_overdue_date
       FROM clients c 
       WHERE c.user_id = ? AND c.health_score IN ('warning', 'critical')
       ORDER BY c.total_overdue DESC LIMIT 5`,
      [user.id]
    );

    // Total received today
    const receivedToday = queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = ? AND type = 'income' AND DATE(created_at) = DATE('now')`,
      [user.id]
    );

    // Due today
    const dueToday = queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM charges 
       WHERE user_id = ? AND status IN ('pending', 'reminder_sent') AND due_date = DATE('now')`,
      [user.id]
    );

    // Due tomorrow
    const dueTomorrow = queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM charges 
       WHERE user_id = ? AND status IN ('pending', 'reminder_sent') AND due_date = DATE('now', '+1 day')`,
      [user.id]
    );

    // Daily billing stats
    const dailyBillingStats = queryOne(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
       FROM daily_billing 
       WHERE user_id = ? AND status = 'active'`,
      [user.id]
    );

    return Response.json({
      totalReceived: received.total,
      pendingCount: pending.count,
      pendingTotal: pending.total,
      overdueCount: overdue.count,
      overdueTotal: overdue.total,
      paymentRate,
      remindersSentToday: remindersToday.count,
      totalClients: clientCount.count,
      revenueData,
      statusDistribution: statusDist,
      recentActivity,
      arAging,
      atRiskClients,
      receivedToday: receivedToday.total,
      dueToday: dueToday.total,
      dueTomorrow: dueTomorrow.total,
      dailyBillingTotal: dailyBillingStats.total,
      dailyBillingCount: dailyBillingStats.count
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
