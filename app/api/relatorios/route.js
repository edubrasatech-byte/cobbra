import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/relatorios - Financial reports
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'revenue';
    const period = searchParams.get('period') || '30';
    const days = parseInt(period);

    if (type === 'revenue') {
      // Revenue by day
      const daily = query(
        `SELECT DATE(created_at) as date, SUM(amount) as total, COUNT(*) as count
         FROM transactions WHERE user_id = ? AND type = 'income' AND created_at >= date('now', '-${days} days')
         GROUP BY DATE(created_at) ORDER BY date ASC`,
        [user.id]
      );

      // Revenue by month
      const monthly = query(
        `SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total, COUNT(*) as count
         FROM transactions WHERE user_id = ? AND type = 'income' AND created_at >= date('now', '-365 days')
         GROUP BY strftime('%Y-%m', created_at) ORDER BY month ASC`,
        [user.id]
      );

      // Total
      const total = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income'", [user.id]);

      return Response.json({ daily, monthly, total: total.total });
    }

    if (type === 'inadimplencia') {
      // Overdue charges over time
      const overdueByMonth = query(
        `SELECT strftime('%Y-%m', due_date) as month, COUNT(*) as count, SUM(amount) as total
         FROM charges WHERE user_id = ? AND status = 'overdue'
         GROUP BY strftime('%Y-%m', due_date) ORDER BY month ASC`,
        [user.id]
      );

      // Current overdue by client
      const overdueByClient = query(
        `SELECT cl.name, cl.id, COUNT(*) as count, SUM(c.amount) as total
         FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id
         WHERE c.user_id = ? AND c.status = 'overdue'
         GROUP BY cl.id ORDER BY total DESC`,
        [user.id]
      );

      return Response.json({ overdueByMonth, overdueByClient });
    }

    if (type === 'clients') {
      // Top paying clients
      const topPayers = query(
        `SELECT cl.name, cl.id, cl.total_paid, cl.total_charged, cl.health_score,
                ROUND(cl.total_paid * 100.0 / NULLIF(cl.total_charged, 0), 1) as payment_rate
         FROM clients cl WHERE cl.user_id = ?
         ORDER BY cl.total_paid DESC LIMIT 10`,
        [user.id]
      );

      // Top debtors
      const topDebtors = query(
        `SELECT cl.name, cl.id, cl.total_overdue, cl.health_score
         FROM clients cl WHERE cl.user_id = ? AND cl.total_overdue > 0
         ORDER BY cl.total_overdue DESC LIMIT 10`,
        [user.id]
      );

      return Response.json({ topPayers, topDebtors });
    }

    if (type === 'reminders') {
      // Reminder effectiveness
      const stats = query(
        `SELECT channel, status, COUNT(*) as count
         FROM reminders WHERE user_id = ?
         GROUP BY channel, status`,
        [user.id]
      );

      const totalSent = queryOne('SELECT COUNT(*) as count FROM reminders WHERE user_id = ?', [user.id]);
      const totalRead = queryOne("SELECT COUNT(*) as count FROM reminders WHERE user_id = ? AND status = 'read'", [user.id]);

      return Response.json({
        stats,
        totalSent: totalSent.count,
        totalRead: totalRead.count,
        readRate: totalSent.count > 0 ? Math.round((totalRead.count / totalSent.count) * 100) : 0
      });
    }

    return Response.json({ error: 'Tipo de relatório inválido' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
