import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    const type = searchParams.get('type'); // income, expense, refund
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let sql = `
      SELECT t.*, v.model as vehicle_model, v.plate as vehicle_plate, cl.name as client_name
      FROM transactions t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN clients cl ON t.client_id = cl.id
      WHERE t.user_id = ?
    `;
    const params = [user.id];

    if (vehicleId) {
      if (vehicleId === 'company') {
        sql += " AND t.vehicle_id IS NULL";
      } else {
        sql += " AND t.vehicle_id = ?";
        params.push(vehicleId);
      }
    }

    if (type) {
      sql += " AND t.type = ?";
      params.push(type);
    }

    if (startDate) {
      sql += " AND DATE(t.created_at) >= DATE(?)";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND DATE(t.created_at) <= DATE(?)";
      params.push(endDate);
    }

    sql += " ORDER BY t.created_at DESC";
    const transactions = query(sql, params);
    return Response.json({ transactions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { amount, type, notes, vehicle_id, client_id, payment_method } = body;

    if (!amount || !type || !notes) {
      return Response.json({ error: 'Valor, tipo e descrição são obrigatórios.' }, { status: 400 });
    }

    const transactionId = generateId();
    const parsedAmount = parseFloat(amount);

    run(`
      INSERT INTO transactions (id, user_id, charge_id, client_id, vehicle_id, amount, type, payment_method, reference, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionId,
      user.id,
      null, // Manual entry doesn't have a charge_id initially
      client_id || null,
      vehicle_id || null,
      parsedAmount,
      type, // income, expense, refund
      payment_method || 'pix',
      null, // reference
      notes.trim()
    ]);

    // Log activity
    run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'manual_transaction', 'transaction', transactionId, `Transação manual de ${type === 'income' ? 'receita' : 'despesa'} registrada: R$ ${parsedAmount.toFixed(2)} - ${notes.trim()}`]);

    return Response.json({ success: true, id: transactionId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) return Response.json({ error: 'ID da transação é obrigatório.' }, { status: 400 });

    const transaction = queryOne("SELECT id FROM transactions WHERE user_id = ? AND id = ?", [user.id, transactionId]);
    if (!transaction) return Response.json({ error: 'Transação não encontrada.' }, { status: 404 });

    run("DELETE FROM transactions WHERE id = ?", [transactionId]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
