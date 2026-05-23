import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run, generateId } from '@/lib/db';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { daily_billing_id, amount, finalize } = body;

    if (!daily_billing_id || !amount || parseFloat(amount) <= 0) {
      return Response.json({ error: 'ID do faturamento e valor são obrigatórios' }, { status: 400 });
    }

    // Load daily billing details
    const bill = queryOne('SELECT d.*, c.name as client_name FROM daily_billing d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ? AND d.user_id = ?', [daily_billing_id, user.id]);
    if (!bill) {
      return Response.json({ error: 'Faturamento diário não encontrado' }, { status: 404 });
    }

    const payVal = parseFloat(amount);

    // 1. Insert transaction
    const txId = generateId();
    run(
      `INSERT INTO transactions (id, user_id, client_id, amount, type, payment_method, notes)
       VALUES (?, ?, ?, ?, 'income', 'pix', ?)`,
      [txId, user.id, bill.client_id, payVal, `Abatimento / Pagamento antecipado do contrato diário: ${bill.description || 'Faturamento Diário'}`]
    );

    // 2. Update client total_paid
    run(
      `UPDATE clients SET total_paid = total_paid + ?, updated_at = datetime('now') WHERE id = ?`,
      [payVal, bill.client_id]
    );

    // 3. If finalize, update contract status to 'paid_early'
    if (finalize) {
      run(
        `UPDATE daily_billing SET status = 'paid_early', updated_at = datetime('now') WHERE id = ?`,
        [daily_billing_id]
      );
    }

    // 4. Log activity
    run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'daily_billing_paid_early', 'client', ?, ?)`,
      [generateId(), user.id, bill.client_id, `Pagamento antecipado de R$ ${payVal.toFixed(2)} recebido para faturamento diário de ${bill.client_name}. Status do contrato: ${finalize ? 'Quitado Antecipado' : 'Mantido Ativo'}.`]
    );

    // 5. Notification
    run(
      `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
       VALUES (?, ?, 'success', '💸 Faturamento Diário Pago', 'Recebido R$ ${payVal.toFixed(2)} de ${bill.client_name} referente a contrato diário.', 'client', ?)`,
      [generateId(), user.id, bill.client_id]
    );

    return Response.json({ success: true, message: finalize ? 'Contrato quitado com sucesso!' : 'Abatimento efetuado com sucesso!' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
