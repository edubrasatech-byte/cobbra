import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');

    if (!vehicleId) return Response.json({ error: 'Falta o ID do veículo.' }, { status: 400 });

    const vehicle = queryOne("SELECT * FROM vehicles WHERE user_id = ? AND id = ?", [user.id, vehicleId]);
    if (!vehicle) return Response.json({ error: 'Veículo não encontrado' }, { status: 404 });

    // 1. Fetch rental history (charges with this vehicle plate in vehicle_info)
    const plateQuery = `%(${vehicle.plate.toUpperCase()})%`;
    const rentals = query(`
      SELECT c.id, c.due_date, c.amount, c.status, cl.name as client_name, c.created_at
      FROM charges c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.user_id = ? AND c.vehicle_info LIKE ?
      ORDER BY c.due_date DESC
    `, [user.id, plateQuery]);

    // 2. Fetch maintenance history
    const maintenances = query(`
      SELECT * FROM maintenance_records
      WHERE vehicle_id = ?
      ORDER BY created_at DESC
    `, [vehicleId]);

    // 3. Fetch traffic fines history
    const fines = query(`
      SELECT * FROM traffic_fines
      WHERE vehicle_id = ?
      ORDER BY infraction_date DESC
    `, [vehicleId]);

    // 4. Combine into a sorted timeline
    const timeline = [];

    rentals.forEach(r => {
      timeline.push({
        id: r.id,
        type: 'rental',
        title: `Alugado para ${r.client_name}`,
        date: r.created_at || r.due_date,
        description: `Cobrança semanal de R$ ${Number(r.amount).toFixed(2)} (${r.status === 'paid' ? 'Paga/Encerrada' : 'Pendente'})`,
        raw: r
      });
    });

    maintenances.forEach(m => {
      timeline.push({
        id: m.id,
        type: 'maintenance',
        title: `Oficina: ${m.description}`,
        date: m.created_at,
        description: `Custo total: R$ ${Number(m.total_cost).toFixed(2)} (Responsável: ${m.responsibility === 'owner' ? 'Proprietário' : m.responsibility === 'driver' ? 'Motorista' : 'Compartilhado'})`,
        raw: m
      });
    });

    fines.forEach(f => {
      timeline.push({
        id: f.id,
        type: 'fine',
        title: `Multa: ${f.description}`,
        date: f.infraction_date,
        description: `Valor: R$ ${Number(f.amount).toFixed(2)} (Pontos: ${f.points || 0} CNH · ${f.driver_indicated ? 'Condutor Indicado' : 'Aguardando Indicação'})`,
        raw: f
      });
    });

    // Sort timeline by date DESC (newest events first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return Response.json({ vehicle, timeline });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
