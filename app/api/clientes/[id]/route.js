import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run, query } from '@/lib/db';

// GET /api/clientes/[id]
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    // Get charge history
    const charges = query(
      'SELECT * FROM charges WHERE client_id = ? AND user_id = ? ORDER BY due_date DESC LIMIT 20',
      [id, user.id]
    );

    return Response.json({ client, charges });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clientes/[id]
export async function PUT(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!existing) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const { name, email, phone, document, category, tags, notes, health_score, company_name, birthday, address } = await request.json();

    run(
      `UPDATE clients SET 
        name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone),
        document = COALESCE(?, document), category = COALESCE(?, category), tags = COALESCE(?, tags),
        notes = COALESCE(?, notes), health_score = COALESCE(?, health_score),
        company_name = COALESCE(?, company_name), birthday = COALESCE(?, birthday), address = COALESCE(?, address),
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?`,
      [name, email, phone, document, category, tags, notes, health_score, company_name, birthday, address, id, user.id]
    );

    const updated = queryOne('SELECT * FROM clients WHERE id = ?', [id]);
    return Response.json({ client: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clientes/[id]
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!existing) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    run('DELETE FROM clients WHERE id = ? AND user_id = ?', [id, user.id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
