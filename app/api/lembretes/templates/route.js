import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/lembretes/templates
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const templates = query(
      'SELECT * FROM reminder_templates WHERE user_id IS NULL OR user_id = ? ORDER BY timing_days ASC',
      [user.id]
    );

    return Response.json({ templates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/lembretes/templates
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { name, message, tone, timing_days, channel } = await request.json();
    if (!name || !message) return Response.json({ error: 'Nome e mensagem são obrigatórios' }, { status: 400 });

    const id = generateId();
    run(
      `INSERT INTO reminder_templates (id, user_id, name, message, tone, timing_days, channel)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, name, message, tone || 'gentle', timing_days || 0, channel || 'both']
    );

    const template = queryOne('SELECT * FROM reminder_templates WHERE id = ?', [id]);
    return Response.json({ template }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
