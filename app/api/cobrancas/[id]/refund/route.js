import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run, generateId } from '@/lib/db';
import { refundAsaasPayment } from '@/lib/asaas';

// POST /api/cobrancas/[id]/refund - Refund a paid charge
export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    // Get the charge
    const charge = queryOne('SELECT * FROM charges WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!charge) return Response.json({ error: 'Cobrança não encontrada' }, { status: 404 });

    // Validate if paid
    if (charge.status !== 'paid') {
      return Response.json({ error: 'Apenas cobranças pagas podem ser estornadas.' }, { status: 400 });
    }

    const refundValue = charge.paid_amount || charge.amount;

    // Trigger Asaas payment refund if asaas_id exists
    if (charge.asaas_id) {
      try {
        const asaasRefund = await refundAsaasPayment(charge.asaas_id, refundValue);
        if (!asaasRefund.success) {
          return Response.json({ error: 'Falha no processamento de estorno do Asaas.' }, { status: 400 });
        }
      } catch (err) {
        console.error('Asaas Refund Error:', err);
        return Response.json({ error: `Erro na comunicação com Asaas: ${err.message}` }, { status: 500 });
      }
    }

    // Begin Database Updates (Estorno Local)
    // 1. Update charge status to 'cancelled' (refunded)
    run(
      `UPDATE charges 
       SET status = 'cancelled', 
           cancel_reason = 'Estorno de pagamento realizado pelo usuário',
           cancelled_at = datetime('now'),
           updated_at = datetime('now') 
       WHERE id = ?`,
      [id]
    );

    // 2. Subtract from user wallet balance
    run(
      `UPDATE users 
       SET wallet_balance = MAX(0, wallet_balance - ?), 
           updated_at = datetime('now') 
       WHERE id = ?`,
      [refundValue, user.id]
    );

    // 3. Subtract from client total paid and client wallet balance
    run(
      `UPDATE clients 
       SET wallet_balance = MAX(0, wallet_balance - ?), 
           total_paid = MAX(0, total_paid - ?),
           updated_at = datetime('now') 
       WHERE id = ?`,
      [refundValue, refundValue, charge.client_id]
    );

    // 4. Create refund transaction entry (logged as debit)
    run(
      `INSERT INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method, reference, notes) 
       VALUES (?, ?, ?, ?, ?, 'refund', ?, ?, ?)`,
      [
        generateId(),
        user.id,
        id,
        charge.client_id,
        refundValue,
        charge.payment_method || 'pix',
        charge.asaas_id || 'LOCAL-REFUND',
        `Estorno/Reembolso de cobrança: ${charge.description || ''}`
      ]
    );

    // 5. Log activity
    run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        user.id,
        'charge_refund',
        'charge',
        id,
        `Reembolso de R$ ${refundValue.toFixed(2)} processado para o cliente.`
      ]
    );

    // 6. Create notification
    run(
      `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        user.id,
        'alert',
        '💸 Reembolso processado',
        `R$ ${refundValue.toFixed(2)} foi estornado para o cliente.`,
        'charge',
        id
      ]
    );

    return Response.json({ success: true, message: 'Reembolso processado com sucesso.' }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
