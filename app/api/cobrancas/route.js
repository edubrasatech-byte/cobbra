import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/cobrancas - List charges
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let sql = `SELECT c.*, cl.name as client_name, cl.email as client_email, cl.phone as client_phone 
               FROM charges c 
               LEFT JOIN clients cl ON c.client_id = cl.id 
               WHERE c.user_id = ?`;
    let countSql = `SELECT COUNT(*) as total FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id WHERE c.user_id = ?`;
    const params = [user.id];
    const countParams = [user.id];

    if (status) {
      sql += ` AND c.status = ?`;
      countSql += ` AND c.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (clientId) {
      sql += ` AND c.client_id = ?`;
      countSql += ` AND c.client_id = ?`;
      params.push(clientId);
      countParams.push(clientId);
    }

    if (search) {
      sql += ` AND (c.description LIKE ? OR cl.name LIKE ?)`;
      countSql += ` AND (c.description LIKE ? OR cl.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const { total } = queryOne(countSql, countParams);
    
    sql += ` ORDER BY c.due_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const charges = query(sql, params);

    return Response.json({
      charges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cobrancas - Create charge
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { client_id, amount, description, due_date, recurrence, reminder_channel, payment_method, daily_interest_rate } = body;

    if (!client_id || !amount || !due_date) {
      return Response.json({ error: 'Cliente, valor e vencimento são obrigatórios' }, { status: 400 });
    }

    // Limit check by user plan
    const userPlan = user.plan || 'starter';
    if (userPlan === 'starter' || userPlan === 'crescimento') {
      const activeData = queryOne(
        `SELECT COUNT(*) as active_count FROM charges 
         WHERE user_id = ? AND status IN ('pending', 'reminder_sent', 'overdue')`,
        [user.id]
      );
      const activeCount = activeData?.active_count || 0;

      if (userPlan === 'starter' && activeCount >= 20) {
        return Response.json(
          { error: 'Você atingiu o limite máximo de 20 cobranças simultâneas ativas do plano Starter. Faça upgrade para cadastrar mais!' },
          { status: 403 }
        );
      }

      if (userPlan === 'crescimento' && activeCount >= 50) {
        return Response.json(
          { error: 'Você atingiu o limite máximo de 50 cobranças simultâneas ativas do plano Crescimento. Faça upgrade para o plano Cobra Pro para ter cobranças ilimitadas!' },
          { status: 403 }
        );
      }
    }

    // Starter plan forces reminder_channel to 'email' (no WhatsApp)
    const finalReminderChannel = userPlan === 'starter' ? 'email' : (reminder_channel || 'both');

    // Verify client belongs to user
    const client = queryOne('SELECT id FROM clients WHERE id = ? AND user_id = ?', [client_id, user.id]);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const id = generateId();
    run(
      `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, recurrence, reminder_channel, payment_method, daily_interest_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, client_id, amount, description || '', due_date, recurrence || 'once', finalReminderChannel, payment_method || 'pix', daily_interest_rate || 0]
    );


    // Update client total_charged
    run("UPDATE clients SET total_charged = total_charged + ?, updated_at = datetime('now') WHERE id = ?", [amount, client_id]);

    // Log activity
    const clientData = queryOne('SELECT name FROM clients WHERE id = ?', [client_id]);
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'charge_created', 'charge', id, `Cobrança criada para ${clientData?.name} - R$ ${amount.toFixed(2)}`]
    );
    // Notification
    run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'info', '📝 Nova cobrança criada', `Cobrança de R$ ${amount.toFixed(2)} para ${clientData?.name} com vencimento em ${due_date}`, 'charge', id]
    );

    const charge = queryOne('SELECT c.*, cl.name as client_name FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id WHERE c.id = ?', [id]);
    return Response.json({ charge }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
