import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run, query, generateId } from '@/lib/db';

// GET /api/clientes/[id]
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    // Excluir clientes soft-deleted (LGPD)
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [id, user.id]);
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
    const existing = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [id, user.id]);
    if (!existing) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    // Snapshot dos dados anteriores para auditoria (Frente 15)
    const previousData = JSON.stringify(existing);

    const { name, email, phone, document, category, tags, notes, health_score, company_name, birthday, address, cnh_number, cnh_category, cnh_expires_at, security_background_status, avatar_url } = await request.json();

    run(
      `UPDATE clients SET 
        name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone),
        document = COALESCE(?, document), category = COALESCE(?, category), tags = COALESCE(?, tags),
        notes = COALESCE(?, notes), health_score = COALESCE(?, health_score),
        company_name = COALESCE(?, company_name), birthday = COALESCE(?, birthday), address = COALESCE(?, address),
        cnh_number = COALESCE(?, cnh_number), cnh_category = COALESCE(?, cnh_category),
        cnh_expires_at = COALESCE(?, cnh_expires_at), security_background_status = COALESCE(?, security_background_status),
        avatar_url = COALESCE(?, avatar_url),
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?`,
      [name, email, phone, document, category, tags, notes, health_score, company_name, birthday, address, cnh_number, cnh_category, cnh_expires_at, security_background_status, avatar_url, id, user.id]
    );

    const updated = queryOne('SELECT * FROM clients WHERE id = ?', [id]);

    // Registrar log de auditoria cadastral (Frente 15)
    run(
      `INSERT INTO cadastral_audit_log (id, user_id, entity_type, entity_id, action, previous_data, new_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), user.id, 'client', id, 'update', previousData, JSON.stringify(updated)]
    );

    return Response.json({ client: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clientes/[id] — Soft-delete com anonimização LGPD (Frente 4)
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [id, user.id]);
    if (!existing) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    // Soft-delete: marca deleted_at e anonimiza dados sensíveis conforme LGPD
    // Mantém 'name' para relatórios históricos de cobrança
    run(
      `UPDATE clients SET
        deleted_at = datetime('now'),
        cnh_number = NULL,
        document = '[ANONIMIZADO-LGPD]',
        phone = '[REMOVIDO]',
        email = '[REMOVIDO]',
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?`,
      [id, user.id]
    );

    // Registrar exclusão no log de auditoria cadastral (Frente 15)
    run(
      `INSERT INTO cadastral_audit_log (id, user_id, entity_type, entity_id, action, previous_data, new_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), user.id, 'client', id, 'soft_delete', JSON.stringify(existing), null]
    );

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
