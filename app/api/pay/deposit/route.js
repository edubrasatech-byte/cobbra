import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, generateId } from '@/lib/db';
import { createAsaasCustomer, createAsaasPayment } from '@/lib/asaas';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { client_id, amount } = body;

    if (!client_id || !amount) {
      return Response.json(
        { error: 'Parâmetros inválidos. client_id e amount são obrigatórios.' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return Response.json({ error: 'Valor de depósito inválido.' }, { status: 400 });
    }

    // Load client and verify ownership
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ?', [client_id, user.id]);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const id = generateId();
    const description = `Recarga de Carteira Cobbra Pay - ${client.name}`;
    const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    let asaasCustomerId = client.asaas_customer_id || null;
    let asaasPaymentLink = null;
    let asaasPixCopyPaste = null;
    let asaasId = null;

    // Call Asaas API if integrated
    try {
      asaasCustomerId = await createAsaasCustomer(user, client);
      if (asaasCustomerId) {
        // Save Asaas customer id to client if newly created
        if (asaasCustomerId !== client.asaas_customer_id) {
          run('UPDATE clients SET asaas_customer_id = ? WHERE id = ?', [asaasCustomerId, client.id]);
        }

        const chargeObj = { 
          id, 
          amount: numAmount, 
          due_date: todayStr, 
          description, 
          payment_method: 'pix' 
        };

        const asaasResult = await createAsaasPayment(user, chargeObj, asaasCustomerId);
        if (asaasResult) {
          asaasId = asaasResult.asaasId;
          asaasPaymentLink = asaasResult.paymentLink || asaasResult.invoiceUrl;
          asaasPixCopyPaste = asaasResult.pixCopyPaste;
        }
      }
    } catch (err) {
      console.error('❌ Falha ao integrar recarga com Asaas, gerando fallback local:', err);
    }

    // Save charge to local DB
    run(
      `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, recurrence, reminder_channel, payment_method, daily_interest_rate, asaas_id, payment_link, pix_copy_paste)
       VALUES (?, ?, ?, ?, ?, ?, 'once', 'email', 'pix', 0, ?, ?, ?)`,
      [
        id,
        user.id,
        client_id,
        numAmount,
        description,
        todayStr,
        asaasId,
        asaasPaymentLink,
        asaasPixCopyPaste
      ]
    );

    // Save log activity
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [
        generateId(),
        user.id,
        'charge_created',
        'charge',
        id,
        `Solicitação de recarga de R$ ${numAmount.toFixed(2)} criada para ${client.name}.`
      ]
    );

    return Response.json({
      success: true,
      charge_id: id,
      amount: numAmount,
      pix_copy_paste: asaasPixCopyPaste,
      payment_link: asaasPaymentLink
    });

  } catch (error) {
    console.error('Error creating deposit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
