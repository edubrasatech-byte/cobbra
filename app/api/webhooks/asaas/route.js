import { run, queryOne, generateId } from '@/lib/db';
import { calcInterest } from '@/lib/finance';

/**
 * POST /api/webhooks/asaas
 * Processador de webhook para liquidações do Asaas
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { event, payment } = body;

    if (!event || !payment) {
      return new Response('Invalid payload', { status: 400 });
    }

    console.log(`🔌 Webhook Asaas Recebido - Evento: ${event}, Ref: ${payment.externalReference}`);

    // Processar apenas eventos de pagamento recebido/confirmado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const chargeId = payment.externalReference;
      if (!chargeId) {
        return new Response('Missing externalReference', { status: 200 });
      }

      // Localizar a cobrança
      const existing = queryOne('SELECT * FROM charges WHERE id = ?', [chargeId]);
      if (!existing) {
        console.warn(`⚠️ Cobrança ${chargeId} não localizada no banco para este webhook.`);
        return new Response('Charge not found', { status: 200 }); // Retorna 200 para o Asaas parar de tentar enviar
      }

      // Se já está paga, ignora para evitar duplo processamento
      if (existing.status === 'paid') {
        return new Response('Already processed', { status: 200 });
      }

      const user = queryOne('SELECT * FROM users WHERE id = ?', [existing.user_id]);
      const client = queryOne('SELECT * FROM clients WHERE id = ?', [existing.client_id]);

      const paidAmount = payment.value || existing.amount;
      const paidAt = payment.confirmedDate ? new Date(payment.confirmedDate).toISOString() : new Date().toISOString();

      // Transação no SQLite para atualizar o status da cobrança, saldo do cliente e logar transação
      run('UPDATE charges SET status = "paid", paid_at = ?, paid_amount = ?, updated_at = datetime("now") WHERE id = ?', 
        [paidAt, paidAmount, chargeId]);

      // Atualizar estatísticas do cliente
      run('UPDATE clients SET total_paid = total_paid + ?, total_overdue = MAX(0, total_overdue - ?), last_payment_at = datetime("now"), updated_at = datetime("now") WHERE id = ?', 
        [paidAmount, existing.amount, existing.client_id]);

      // Registrar transação no livro financeiro
      run('INSERT INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method, reference, notes) VALUES (?, ?, ?, ?, ?, "income", "pix", ?, ?)',
        [
          generateId(),
          existing.user_id,
          chargeId,
          existing.client_id,
          paidAmount,
          payment.id || 'ASAAS-WH',
          `Liquidação Asaas do Pix/Boleto: ${existing.description || ''}`
        ]);

      // Registrar atividade do usuário
      run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), existing.user_id, 'payment_received', 'charge', chargeId, `Pagamento de R$ ${paidAmount.toFixed(2)} recebido via Asaas para o cliente ${client?.name}`]);

      // Criar notificação para o dashboard do usuário
      run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), existing.user_id, 'payment', '💰 Pagamento confirmado via Asaas', `R$ ${paidAmount.toFixed(2)} recebido de ${client?.name}`, 'charge', chargeId]);

      console.log(`✅ Cobrança ${chargeId} liquidada com sucesso via Webhook Asaas.`);
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Erro no webhook do Asaas:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
