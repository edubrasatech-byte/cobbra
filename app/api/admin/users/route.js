import { getUserFromRequest, isAdminSenior } from '@/lib/auth';
import { query, queryOne, run } from '@/lib/db';

// GET /api/admin/users - List all users (admin only)
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || !isAdminSenior(user)) {
      return Response.json({ error: 'Acesso negado. Apenas admin senior.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `SELECT id, name, email, phone, role, plan, status, business_name, created_at, updated_at,
               (SELECT COUNT(*) FROM clients WHERE user_id = users.id) as client_count,
               (SELECT COUNT(*) FROM charges WHERE user_id = users.id) as charge_count,
               (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = users.id AND type = 'income') as total_revenue
               FROM users WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR business_name LIKE ?)';
      countSql += ' AND (name LIKE ? OR email LIKE ? OR business_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    const { total } = queryOne(countSql, countParams);
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = query(sql, params);

    // Global stats
    const totalUsers = queryOne('SELECT COUNT(*) as count FROM users');
    const activeUsers = queryOne('SELECT COUNT(*) as count FROM users WHERE status = "active"');
    const totalRevenue = queryOne('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "income"');
    const totalCharges = queryOne('SELECT COUNT(*) as count FROM charges');
    const totalClients = queryOne('SELECT COUNT(*) as count FROM clients');
    const newUsersThisWeek = queryOne('SELECT COUNT(*) as count FROM users WHERE created_at >= date("now", "-7 days")');
    const newUsersThisMonth = queryOne('SELECT COUNT(*) as count FROM users WHERE created_at >= date("now", "-30 days")');

    return Response.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      globalStats: {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count,
        totalRevenue: totalRevenue.total,
        totalCharges: totalCharges.count,
        totalClients: totalClients.count,
        newUsersThisWeek: newUsersThisWeek.count,
        newUsersThisMonth: newUsersThisMonth.count
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
