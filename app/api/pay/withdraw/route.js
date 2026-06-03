import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, generateId } from '@/lib/db';
import { requestAsaasTransfer } from '@/lib/asaas';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { client_id, amount, pix_key, pix_key_type } = body;

    if (!client_id || !amount || !pix_key || !pix_key_type) {
      return Response.json(
        { error: 'Parâmetros inválidos. client_id, amount, pix_key e pix_key_type são obrigatórios.' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return Response.json({ error: 'Valor de saque inválido.' }, { status: 400 });
    }

    // Load client and verify ownership
    const client = queryOne(
      'SELECT id, name, wallet_balance, withdrawal_count FROM clients WHERE id = ? AND user_id = ?',
      [client_id, user.id]
    );

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    // Verify sufficient balance
    if ((client.wallet_balance || 0) < numAmount) {
      return Response.json(
        { error: `Saldo insuficiente. Saldo disponível: R$ ${(client.wallet_balance || 0).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Calculate fees
    const withdrawalCount = client.withdrawal_count || 0;
    const fee = withdrawalCount === 0 ? 0.0 : 3.90;
    const netAmount = numAmount - fee;

    if (netAmount <= 0) {
      return Response.json(
        { error: `O valor do saque deve ser maior que a tarifa de R$ ${fee.toFixed(2)}.` },
        { status: 400 }
      );
    }

    // Request transfer on Asaas
    let asaasResult;
    try {
      asaasResult = await requestAsaasTransfer(netAmount, pix_key, pix_key_type);
    } catch (err) {
      console.error('Failed to request Asaas transfer:', err);
      return Response.json(
        { error: `Falha ao processar saque via Asaas: ${err.message}` },
        { status: 500 }
      );
    }

    const transferId = asaasResult.transferId || generateId();

    // Deduct wallet balance and increment withdrawal count in local database
    run(
      'UPDATE clients SET wallet_balance = wallet_balance - ?, withdrawal_count = withdrawal_count + 1, updated_at = datetime("now") WHERE id = ?',
      [numAmount, client_id]
    );

    // Save bank transfer record
    run(
      `INSERT INTO bank_transfers (id, user_id, client_id, amount, fee, net_amount, status, pix_key, pix_key_type, description)
       VALUES (?, ?, ?, ?, ?, ?, 'done', ?, ?, ?)`,
      [
        transferId,
        user.id,
        client_id,
        numAmount,
        fee,
        netAmount,
        pix_key,
        pix_key_type,
        `Saque Pix ${withdrawalCount === 0 ? 'Gratuito' : 'Tarifado (R$ 3,90)'}`
      ]
    );

    // Record client transaction (so it shows up in their ledger as debit)
    run(
      `INSERT INTO transactions (id, user_id, client_id, amount, type, payment_method, reference, notes)
       VALUES (?, ?, ?, ?, 'expense', 'pix', ?, ?)`,
      [
        generateId(),
        user.id,
        client_id,
        numAmount,
        transferId,
        `Saque Pix efetuado para a chave: ${pix_key}. Tarifa: R$ ${fee.toFixed(2)}`
      ]
    );

    // Create log activity
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [
        generateId(),
        user.id,
        'withdraw_payout',
        'client',
        client_id,
        `Saque de R$ ${numAmount.toFixed(2)} (líquido R$ ${netAmount.toFixed(2)}) efetuado para ${client.name}.`
      ]
    );

    // Create user notification
    run(
      'INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        generateId(),
        user.id,
        'warning',
        '💸 Saque realizado',
        `Saque de R$ ${numAmount.toFixed(2)} da carteira de ${client.name} processado com sucesso.`,
        'client',
        client_id
      ]
    );

    return Response.json({
      success: true,
      transferId,
      amount: numAmount,
      fee,
      netAmount,
      withdrawalCount: withdrawalCount + 1
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
