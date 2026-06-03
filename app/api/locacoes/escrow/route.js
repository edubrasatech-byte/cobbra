import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    // Fetch escrow accounts with associated contract, client, and vehicle info
    const escrows = query(`
      SELECT e.*, cr.start_date, cr.end_date, cr.rent_amount,
             cl.name as client_name, cl.phone as client_phone,
             v.model as vehicle_model, v.plate as vehicle_plate
      FROM escrow_deposits e
      JOIN contracts_rentals cr ON e.contract_id = cr.id
      JOIN clients cl ON cr.client_id = cl.id
      JOIN vehicles v ON cr.vehicle_id = v.id
      WHERE cr.user_id = ?
      ORDER BY e.created_at DESC
    `, [user.id]);

    return Response.json({ escrows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { contract_id, amount, type, notes } = body;

    if (!contract_id || amount === undefined || !type) {
      return Response.json({ error: 'Contrato, valor e tipo de movimentação são obrigatórios.' }, { status: 400 });
    }

    const escrow = queryOne(`
      SELECT e.*, cr.client_id, cr.vehicle_id
      FROM escrow_deposits e
      JOIN contracts_rentals cr ON e.contract_id = cr.id
      WHERE cr.user_id = ? AND e.contract_id = ?
    `, [user.id, contract_id]);

    if (!escrow) return Response.json({ error: 'Conta de caução não localizada.' }, { status: 404 });

    const changeVal = parseFloat(amount);
    let newBalance = escrow.balance_paid;

    if (type === 'deposit') {
      newBalance += changeVal;
      // Mark as fully paid if it meets or exceeds total target amount
      const status = newBalance >= escrow.total_target_amount ? 'fully_paid' : 'pending_accrual';
      run('UPDATE escrow_deposits SET balance_paid = ?, status = ?, updated_at = datetime("now") WHERE id = ?', 
        [newBalance, status, escrow.id]);

      // Log income transaction
      run('INSERT INTO transactions (id, user_id, client_id, vehicle_id, amount, type, notes) VALUES (?, ?, ?, ?, ?, "income", ?)',
        [generateId(), user.id, escrow.client_id, escrow.vehicle_id, changeVal, notes || 'Aporte de Caução']);
    } else if (type === 'withdraw') {
      newBalance = Math.max(0, newBalance - changeVal);
      run('UPDATE escrow_deposits SET balance_paid = ?, status = "discounted", updated_at = datetime("now") WHERE id = ?', 
        [newBalance, escrow.id]);

      // Log expense transaction (damage deduction)
      run('INSERT INTO transactions (id, user_id, client_id, vehicle_id, amount, type, notes) VALUES (?, ?, ?, ?, ?, "refund", ?)',
        [generateId(), user.id, escrow.client_id, escrow.vehicle_id, changeVal, notes || 'Abatimento de Caução por Avaria']);
    } else if (type === 'refund') {
      newBalance = 0;
      run('UPDATE escrow_deposits SET balance_paid = 0, status = "refunded", updated_at = datetime("now") WHERE id = ?', 
        [escrow.id]);

      // Log refund transaction
      run('INSERT INTO transactions (id, user_id, client_id, vehicle_id, amount, type, notes) VALUES (?, ?, ?, ?, ?, "refund", ?)',
        [generateId(), user.id, escrow.client_id, escrow.vehicle_id, changeVal, notes || 'Restituição Total de Caução']);
    }

    return Response.json({ success: true, balance: newBalance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
