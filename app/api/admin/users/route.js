import { getUserFromRequest, isAdminSenior } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/admin/users - Advanced administrative SaaS dashboard stats & user list
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || !isAdminSenior(user)) {
      return Response.json({ error: 'Acesso negado. Apenas admin senior.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');
    const planFilter = searchParams.get('plan');
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

    if (statusFilter) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(statusFilter);
      countParams.push(statusFilter);
    }

    if (planFilter) {
      sql += ' AND plan = ?';
      countSql += ' AND plan = ?';
      params.push(planFilter);
      countParams.push(planFilter);
    }

    const { total } = queryOne(countSql, countParams);
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = query(sql, params);

    // Global counts
    const totalUsers = queryOne('SELECT COUNT(*) as count FROM users');
    const activeUsers = queryOne("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
    const totalRevenue = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'");
    const totalCharges = queryOne('SELECT COUNT(*) as count FROM charges');
    const totalClients = queryOne('SELECT COUNT(*) as count FROM clients');
    const newUsersThisWeek = queryOne("SELECT COUNT(*) as count FROM users WHERE created_at >= date('now', '-7 days')");
    const newUsersThisMonth = queryOne("SELECT COUNT(*) as count FROM users WHERE created_at >= date('now', '-30 days')");

    // Dynamic Financial Metrics (MRR, Churn, LTV) - Frente 14
    const planPrices = {
      trial: 0,
      starter: 9.90,
      crescimento: 19.90,
      pro: 29.90,
      cobra_pro: 49.90,
      enterprise: 99.90
    };
    
    const planCounts = query(`
      SELECT plan, COUNT(*) as count 
      FROM users 
      WHERE status = 'active'
      GROUP BY plan
    `);
    
    let mrr = 0;
    for (const pc of planCounts) {
      const price = planPrices[pc.plan] || 0;
      mrr += price * pc.count;
    }

    const inactiveCount = queryOne("SELECT COUNT(*) as count FROM users WHERE status != 'active'").count;
    const totalCountVal = totalUsers.count || 1;
    const churnRate = (inactiveCount / totalCountVal) * 100;

    const activeCountVal = activeUsers.count || 1;
    const arpu = mrr / activeCountVal;
    const ltv = churnRate > 0 ? arpu / (churnRate / 100) : arpu * 24; // 24 months projection fallback if 0 churn

    // 1. ACTIVE ONLINE USERS (distinct users active in the last 10 minutes)
    const onlineUsers = queryOne(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM activity_log 
      WHERE created_at >= datetime('now', '-10 minutes')
    `);

    // 2. PLAN DISTRIBUTION
    const planDistributionRaw = query(`
      SELECT plan, COUNT(*) as count 
      FROM users 
      GROUP BY plan
    `);

    // 3. DAILY REGISTRATIONS OVER LAST 7 DAYS
    const recentRegistrations = query(`
      SELECT date(created_at) as register_day, COUNT(*) as count 
      FROM users 
      WHERE created_at >= date('now', '-7 days') 
      GROUP BY register_day 
      ORDER BY register_day ASC
    `);

    // 4. INFRASTRUCTURE DISPATCH COUNTS (WhatsApp vs Email)
    const waSent = queryOne("SELECT COUNT(*) as count FROM reminders WHERE channel = 'whatsapp'");
    const emailSent = queryOne("SELECT COUNT(*) as count FROM reminders WHERE channel = 'email'");

    // 5. AUDIT LOG TIMELINE
    const auditLogs = query(`
      SELECT a.*, u.name as user_name, u.email as user_email 
      FROM activity_log a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT 20
    `);

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
        newUsersThisMonth: newUsersThisMonth.count,
        onlineUsers: onlineUsers.count || 0,
        whatsappSent: waSent?.count || 0,
        emailSent: emailSent?.count || 0,
        mrr: mrr || 0,
        churnRate: churnRate || 0,
        ltv: ltv || 0
      },
      planDistribution: planDistributionRaw,
      recentRegistrations,
      auditLogs
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/users - Administrative actions to override plans, roles, status
export async function PUT(request) {
  try {
    const adminUser = getUserFromRequest(request);
    if (!adminUser || !isAdminSenior(adminUser)) {
      return Response.json({ error: 'Acesso negado. Apenas admin senior.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, plan, status, plan_expires_at } = body;

    if (!userId) {
      return Response.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const targetUser = queryOne("SELECT id, name, role, plan, status FROM users WHERE id = ?", [userId]);
    if (!targetUser) {
      return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const updatedRole = role !== undefined ? role : targetUser.role;
    const updatedPlan = plan !== undefined ? plan : targetUser.plan;
    const updatedStatus = status !== undefined ? status : targetUser.status;
    const expiresVal = plan_expires_at !== undefined ? plan_expires_at : null;

    // Strict validation
    if (role && !['admin_senior', 'admin', 'user'].includes(role)) {
      return Response.json({ error: 'Cargo (role) inválido.' }, { status: 400 });
    }
    if (plan && !['trial', 'starter', 'pro', 'enterprise', 'crescimento', 'cobra_pro'].includes(plan)) {
      return Response.json({ error: 'Plano inválido.' }, { status: 400 });
    }
    if (status && !['active', 'inactive', 'blocked'].includes(status)) {
      return Response.json({ error: 'Status de conta inválido.' }, { status: 400 });
    }

    run(
      `UPDATE users SET 
        role = ?, 
        plan = ?, 
        status = ?, 
        plan_expires_at = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
      [updatedRole, updatedPlan, updatedStatus, expiresVal, userId]
    );

    // Audit trace in database
    const actionDetails = `Alt. por admin ${adminUser.name}: cargo=${updatedRole}, plano=${updatedPlan}, status=${updatedStatus}.`;
    run(
      "INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, 'user', ?, ?)",
      [generateId(), adminUser.id, 'admin_update_user', userId, actionDetails]
    );

    // In-app Notification for the updated user
    run(
      "INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, 'system', '⚙️ Conta Atualizada', 'Sua conta foi atualizada pelo suporte técnico do Cobbra.')",
      [generateId(), userId]
    );

    return Response.json({ success: true, message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
