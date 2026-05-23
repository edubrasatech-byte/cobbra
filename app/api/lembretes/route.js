import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/lembretes - List reminders
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const reminders = query(
      `SELECT r.*, c.amount as charge_amount, c.description as charge_description,
              cl.name as client_name, cl.phone as client_phone, cl.email as client_email
       FROM reminders r
       LEFT JOIN charges c ON r.charge_id = c.id
       LEFT JOIN clients cl ON r.client_id = cl.id
       WHERE r.user_id = ?
       ORDER BY r.sent_at DESC
       LIMIT ? OFFSET ?`,
      [user.id, limit, offset]
    );

    const { total } = queryOne('SELECT COUNT(*) as total FROM reminders WHERE user_id = ?', [user.id]);

    return Response.json({ reminders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/lembretes - Send a reminder
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { charge_id, channel, message } = await request.json();
    if (!charge_id || !message) return Response.json({ error: 'Cobrança e mensagem são obrigatórios' }, { status: 400 });

    const charge = queryOne('SELECT * FROM charges WHERE id = ? AND user_id = ?', [charge_id, user.id]);
    if (!charge) return Response.json({ error: 'Cobrança não encontrada' }, { status: 404 });

    const id = generateId();
    run(
      `INSERT INTO reminders (id, charge_id, user_id, client_id, channel, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
      [id, charge_id, user.id, charge.client_id, channel || 'whatsapp', message]
    );

    // Update charge
    run('UPDATE charges SET status = "reminder_sent", reminders_sent = reminders_sent + 1, updated_at = datetime("now") WHERE id = ?', [charge_id]);

    // Log activity
    const client = queryOne('SELECT name FROM clients WHERE id = ?', [charge.client_id]);
    run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'reminder_sent', 'reminder', id, `Lembrete ${channel} enviado para ${client.name}`]);

    const reminder = queryOne('SELECT * FROM reminders WHERE id = ?', [id]);
    return Response.json({ reminder }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
