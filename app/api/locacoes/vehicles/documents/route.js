import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');

    if (!vehicleId) return Response.json({ error: 'Falta o ID do veículo.' }, { status: 400 });

    const docs = query(
      "SELECT id, name, created_at FROM vehicle_documents WHERE vehicle_id = ? ORDER BY created_at DESC",
      [vehicleId]
    );

    return Response.json({ documents: docs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { vehicle_id, name, file_base64 } = body;

    if (!vehicle_id || !name || !file_base64) {
      return Response.json({ error: 'ID do veículo, Nome do documento e arquivo PDF em base64 são obrigatórios.' }, { status: 400 });
    }

    const id = generateId();
    run(
      "INSERT INTO vehicle_documents (id, vehicle_id, name, file_base64) VALUES (?, ?, ?, ?)",
      [id, vehicle_id, name.trim(), file_base64]
    );

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
