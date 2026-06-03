import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    // Fetch all vehicles with active investors
    const vehicles = query(`
      SELECT * FROM vehicles 
      WHERE user_id = ? AND investor_name IS NOT NULL AND investor_name != ''
    `, [user.id]);

    const payouts = vehicles.map(vehicle => {
      // 1. Gross revenue: Sum of paid charges related to this vehicle
      // Match by plate in vehicle_info
      const plateQuery = `%${vehicle.plate.toUpperCase()}%`;
      const revenueData = queryOne(`
        SELECT COALESCE(SUM(paid_amount), 0) as total
        FROM charges
        WHERE user_id = ? AND status = 'paid' AND (vehicle_info LIKE ? OR description LIKE ?)
      `, [user.id, plateQuery, plateQuery]);

      const grossRevenue = revenueData.total;

      // 2. Operational costs: natural wear paid by owner
      const expenseData = queryOne(`
        SELECT COALESCE(SUM(total_cost), 0) as total
        FROM maintenance_records
        WHERE vehicle_id = ? AND responsibility = 'owner'
      `, [vehicle.id]);

      const maintenanceCost = expenseData.total;

      // 3. Management splits
      const splitRate = vehicle.investor_split_rate !== null ? vehicle.investor_split_rate : 80.0; // Default 80% to investor
      const adminRate = 100.0 - splitRate;
      
      const adminCommission = grossRevenue * (adminRate / 100);
      const netRepasse = Math.max(0, (grossRevenue - maintenanceCost) * (splitRate / 100));

      // 4. Check if there was any recent payout logged in transactions
      const lastPayout = queryOne(`
        SELECT created_at FROM transactions
        WHERE user_id = ? AND vehicle_id = ? AND type = 'expense' AND notes LIKE 'Repasse%'
        ORDER BY created_at DESC LIMIT 1
      `, [user.id, vehicle.id]);

      return {
        vehicle_id: vehicle.id,
        model: vehicle.model,
        plate: vehicle.plate,
        investor_name: vehicle.investor_name,
        investor_split_rate: splitRate,
        gross_revenue: grossRevenue,
        maintenance_cost: maintenanceCost,
        admin_commission: adminCommission,
        net_repasse: netRepasse,
        last_payout_at: lastPayout?.created_at || null
      };
    });

    return Response.json({ payouts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { vehicle_id, amount, investor_name } = body;

    if (!vehicle_id || !amount) {
      return Response.json({ error: 'Veículo e valor do repasse são obrigatórios.' }, { status: 400 });
    }

    const vehicle = queryOne("SELECT * FROM vehicles WHERE user_id = ? AND id = ?", [user.id, vehicle_id]);
    if (!vehicle) return Response.json({ error: 'Veículo não encontrado.' }, { status: 404 });

    const transactionId = generateId();
    const repasseVal = parseFloat(amount);

    // Register repasse as an expense in transactions book
    run(`
      INSERT INTO transactions (id, user_id, vehicle_id, amount, type, notes)
      VALUES (?, ?, ?, ?, 'expense', ?)
    `, [
      transactionId, 
      user.id, 
      vehicle_id, 
      repasseVal, 
      `Repasse efetuado para o investidor ${investor_name || vehicle.investor_name || 'Terceiro'} (${vehicle.plate})`
    ]);

    // Log activity
    run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'investor_payout', 'vehicle', vehicle_id, `Repasse de R$ ${repasseVal.toFixed(2)} efetuado para o investidor do veículo ${vehicle.model} (${vehicle.plate})`]);

    return Response.json({ success: true, transaction_id: transactionId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
