import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    if (!docId) return Response.json({ error: 'Falta o ID do documento.' }, { status: 400 });

    const doc = queryOne("SELECT * FROM vehicle_documents WHERE id = ?", [docId]);
    if (!doc) return Response.json({ error: 'Documento não encontrado.' }, { status: 404 });

    return Response.json({ doc });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
