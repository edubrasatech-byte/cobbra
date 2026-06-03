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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const days = parseInt(period);

    // Build Date Filter Clause
    let dateFilterClause = '';
    const dateParams = [];
    if (startDate) {
      dateFilterClause += " AND DATE(created_at) >= DATE(?)";
      dateParams.push(startDate);
    } else {
      dateFilterClause += ` AND created_at >= date('now', '-${days} days')`;
    }

    if (endDate) {
      dateFilterClause += " AND DATE(created_at) <= DATE(?)";
      dateParams.push(endDate);
    }

    if (type === 'revenue') {
      // Revenue by day
      const dailySql = `
        SELECT DATE(created_at) as date, SUM(amount) as total, COUNT(*) as count
        FROM transactions 
        WHERE user_id = ? AND type = 'income' ${dateFilterClause}
        GROUP BY DATE(created_at) ORDER BY date ASC
      `;
      const daily = query(dailySql, [user.id, ...dateParams]);

      // Revenue by month
      const monthly = query(
        `SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total, COUNT(*) as count
         FROM transactions WHERE user_id = ? AND type = 'income' AND created_at >= date('now', '-365 days')
         GROUP BY strftime('%Y-%m', created_at) ORDER BY month ASC`,
        [user.id]
      );

      // Total
      const totalSql = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND type = 'income' ${dateFilterClause}
      `;
      const total = queryOne(totalSql, [user.id, ...dateParams]);

      // Total expenses
      const totalExpSql = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND type = 'expense' ${dateFilterClause}
      `;
      const totalExp = queryOne(totalExpSql, [user.id, ...dateParams]);

      return Response.json({ daily, monthly, total: total.total, totalExpense: totalExp.total });
    }

    if (type === 'inadimplencia') {
      // Build Date Filter Clause for charges (due_date)
      let chargeDateFilter = '';
      const chargeDateParams = [];
      if (startDate) {
        chargeDateFilter += " AND DATE(due_date) >= DATE(?)";
        chargeDateParams.push(startDate);
      }
      if (endDate) {
        chargeDateFilter += " AND DATE(due_date) <= DATE(?)";
        chargeDateParams.push(endDate);
      }

      // Overdue charges over time
      const overdueByMonth = query(
        `SELECT strftime('%Y-%m', due_date) as month, COUNT(*) as count, SUM(amount) as total
         FROM charges WHERE user_id = ? AND status = 'overdue' ${chargeDateFilter}
         GROUP BY strftime('%Y-%m', due_date) ORDER BY month ASC`,
        [user.id, ...chargeDateParams]
      );

      // Current overdue by client
      const overdueByClient = query(
        `SELECT cl.name, cl.id, COUNT(*) as count, SUM(c.amount) as total
         FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id
         WHERE c.user_id = ? AND c.status = 'overdue' ${chargeDateFilter}
         GROUP BY cl.id ORDER BY total DESC`,
        [user.id, ...chargeDateParams]
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

    if (type === 'vehicles') {
      // Vehicle efficiency / profit report
      const vehicles = query("SELECT * FROM vehicles WHERE user_id = ?", [user.id]);

      const vehicleStats = vehicles.map(v => {
        // Income for this vehicle
        const incSql = `
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM transactions 
          WHERE user_id = ? AND vehicle_id = ? AND type = 'income' ${dateFilterClause}
        `;
        const income = queryOne(incSql, [user.id, v.id, ...dateParams]).total;

        // Expense for this vehicle
        const expSql = `
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM transactions 
          WHERE user_id = ? AND vehicle_id = ? AND type = 'expense' ${dateFilterClause}
        `;
        const expense = queryOne(expSql, [user.id, v.id, ...dateParams]).total;

        return {
          id: v.id,
          model: v.model,
          plate: v.plate,
          color: v.color,
          income,
          expense,
          profit: income - expense,
          margin: income > 0 ? Math.round(((income - expense) / income) * 100) : 0
        };
      });

      // Company general (transactions where vehicle_id IS NULL)
      const companyIncSql = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND vehicle_id IS NULL AND type = 'income' ${dateFilterClause}
      `;
      const companyInc = queryOne(companyIncSql, [user.id, ...dateParams]).total;

      const companyExpSql = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND vehicle_id IS NULL AND type = 'expense' ${dateFilterClause}
      `;
      const companyExp = queryOne(companyExpSql, [user.id, ...dateParams]).total;

      return Response.json({
        vehicles: vehicleStats,
        company: {
          income: companyInc,
          expense: companyExp,
          profit: companyInc - companyExp
        }
      });
    }

    return Response.json({ error: 'Tipo de relatório inválido' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
