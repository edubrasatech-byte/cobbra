import { getUserFromRequest } from '@/lib/auth';
import { query, run, generateId, queryOne } from '@/lib/db';

// GET /api/clientes/[id]/documents - List client documents metadata
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id: client_id } = await params;

    // Check if client exists and belongs to user
    const client = queryOne('SELECT id FROM clients WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [client_id, user.id]);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const docs = query(
      'SELECT id, name, file_name, file_type, file_size, created_at FROM client_documents WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC',
      [client_id, user.id]
    );

    return Response.json({ documents: docs }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clientes/[id]/documents - Upload/Index a new document for a client
export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id: client_id } = await params;

    // Check if client exists
    const client = queryOne('SELECT id FROM clients WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [client_id, user.id]);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const body = await request.json();
    const { name, file_name, file_type, file_size, file_base64 } = body;

    if (!name || !file_name || !file_type || !file_base64) {
      return Response.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const docId = generateId();

    run(
      `INSERT INTO client_documents (id, user_id, client_id, name, file_name, file_type, file_size, file_base64)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [docId, user.id, client_id, name, file_name, file_type, parseInt(file_size || 0), file_base64]
    );

    const newDoc = {
      id: docId,
      name,
      file_name,
      file_type,
      file_size: parseInt(file_size || 0),
      created_at: new Date().toISOString()
    };

    return Response.json({ success: true, document: newDoc }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
