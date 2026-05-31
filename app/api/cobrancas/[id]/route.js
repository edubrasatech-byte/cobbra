import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run, generateId } from '@/lib/db';
import { calcInterest } from '@/lib/finance';

// GET /api/cobrancas/[id] - Get single charge
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const charge = queryOne(
      `SELECT c.*, cl.name as client_name, cl.email as client_email, cl.phone as client_phone 
       FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [id, user.id]
    );

    if (!charge) return Response.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    
    // Enriquecer com amount_with_interest calculado no servidor (Frente 7)
    const enrichedCharge = {
      ...charge,
      amount_with_interest: charge.amount + calcInterest(charge)
    };
    
    return Response.json({ charge: enrichedCharge });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/cobrancas/[id] - Update charge
export async function PUT(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = queryOne('SELECT * FROM charges WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!existing) return Response.json({ error: 'Cobrança não encontrada' }, { status: 404 });

    const body = await request.json();
    const { amount, description, due_date, status, recurrence, reminder_channel, payment_method, daily_interest_rate, rebateAmount } = body;

    // Handle deposit refund
    if (body.refundDeposit === true && existing.deposit_amount > 0) {
      const depAmt = existing.deposit_amount;
      
      // 1. Create refund transaction
      run('INSERT INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method, reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, id, existing.client_id, depAmt, 'refund', existing.payment_method || 'pix', 'RESTITUICAO-CAUCAO']);
      
      // 2. Log activity
      const clientData = queryOne('SELECT name FROM clients WHERE id = ?', [existing.client_id]);
      run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'refund_issued', 'charge', id, `Caução de R$ ${depAmt.toFixed(2)} restituído com sucesso para ${clientData?.name}`]);

      // 3. Create notification
      run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'success', '💸 Caução restituído', `Caução de R$ ${depAmt.toFixed(2)} devolvido para ${clientData?.name}`, 'charge', id]);

      // 4. Set deposit_amount to 0 to indicate it has been returned
      run(`UPDATE charges SET deposit_amount = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`, [id, user.id]);

      const updated = queryOne('SELECT c.*, cl.name as client_name FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id WHERE c.id = ?', [id]);
      return Response.json({ charge: updated });
    }

    // Handle partial payment abatement
    if (rebateAmount && rebateAmount > 0) {
      const rebateVal = parseFloat(rebateAmount);
      const newAmount = Math.max(0, existing.amount - rebateVal);
      
      const isOverdue = existing.status === 'overdue';
      const overdueSubtract = isOverdue ? Math.min(rebateVal, existing.amount) : 0;
      
      // Update clients table
      run(`UPDATE clients SET 
            total_paid = total_paid + ?, 
            total_overdue = MAX(0, total_overdue - ?), 
            updated_at = datetime('now') 
           WHERE id = ?`, 
        [rebateVal, overdueSubtract, existing.client_id]
      );

      // Insert transaction for the rebate amount
      run('INSERT INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, id, existing.client_id, rebateVal, 'income', existing.payment_method]);

      // Log activity
      const clientData = queryOne('SELECT name FROM clients WHERE id = ?', [existing.client_id]);
      run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'payment_received', 'charge', id, `Abatimento parcial de R$ ${rebateVal.toFixed(2)} registrado para ${clientData?.name}`]);

      // Create notification
      run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'payment', '💸 Abatimento parcial', `R$ ${rebateVal.toFixed(2)} abatido para ${clientData?.name}`, 'charge', id]);

      // Update charges table
      const finalStatus = newAmount === 0 ? 'paid' : existing.status;
      const paid_at = newAmount === 0 ? new Date().toISOString() : existing.paid_at;

      run(
        `UPDATE charges SET 
          amount = ?, 
          status = ?,
          paid_at = ?,
          updated_at = datetime('now') 
         WHERE id = ? AND user_id = ?`,
        [newAmount, finalStatus, paid_at, id, user.id]
      );

      const updated = queryOne('SELECT c.*, cl.name as client_name FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id WHERE c.id = ?', [id]);
      return Response.json({ charge: updated });
    }

    // Handle status changes
    let paid_at = existing.paid_at;
    let cancelled_at = existing.cancelled_at;

    if (status === 'paid' && existing.status !== 'paid') {
      paid_at = new Date().toISOString();
      // Calculate amount with interest via central finance module (Frente 7)
      const payAmount = existing.amount + calcInterest(existing);
      // Update client totals
      run('UPDATE clients SET total_paid = total_paid + ?, total_overdue = MAX(0, total_overdue - ?), last_payment_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?', 
        [payAmount, existing.amount, existing.client_id]);
      // Create transaction
      run('INSERT INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, id, existing.client_id, payAmount, 'income', existing.payment_method]);
      // Log
      const clientData = queryOne('SELECT name FROM clients WHERE id = ?', [existing.client_id]);
      run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'payment_received', 'charge', id, `Pagamento de R$ ${payAmount.toFixed(2)} recebido de ${clientData?.name}`]);
      // Create notification
      run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'payment', '💰 Pagamento confirmado', `R$ ${payAmount.toFixed(2)} recebido de ${clientData?.name}`, 'charge', id]);
    }

    if (status === 'overdue' && existing.status !== 'overdue') {
      // Update client overdue total
      run('UPDATE clients SET total_overdue = total_overdue + ?, updated_at = datetime(\'now\') WHERE id = ?', [existing.amount, existing.client_id]);
      const clientData = queryOne('SELECT name FROM clients WHERE id = ?', [existing.client_id]);
      run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'warning', '⚠️ Cobrança vencida', `Cobrança de R$ ${existing.amount.toFixed(2)} de ${clientData?.name} venceu`, 'charge', id]);
    }

    if (status === 'cancelled' && existing.status !== 'cancelled') {
      cancelled_at = new Date().toISOString();
    }

    run(
      `UPDATE charges SET 
        amount = COALESCE(?, amount),
        description = COALESCE(?, description),
        due_date = COALESCE(?, due_date),
        status = COALESCE(?, status),
        recurrence = COALESCE(?, recurrence),
        reminder_channel = COALESCE(?, reminder_channel),
        payment_method = COALESCE(?, payment_method),
        daily_interest_rate = COALESCE(?, daily_interest_rate),
        paid_at = ?,
        cancelled_at = ?,
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?`,
      [amount, description, due_date, status, recurrence, reminder_channel, payment_method, daily_interest_rate, paid_at, cancelled_at, id, user.id]
    );

    const updated = queryOne('SELECT c.*, cl.name as client_name FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id WHERE c.id = ?', [id]);
    return Response.json({ charge: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/cobrancas/[id] - Delete charge
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = queryOne('SELECT * FROM charges WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!existing) return Response.json({ error: 'Cobrança não encontrada' }, { status: 404 });

    run('DELETE FROM charges WHERE id = ? AND user_id = ?', [id, user.id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
