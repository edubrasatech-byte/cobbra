import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, generateId } from '@/lib/db';
import { requestAsaasTransfer } from '@/lib/asaas';

/**
 * POST /api/pay/withdraw
 * Processa a solicitação de saque (resgate Pix) da carteira Cobbra Pay
 * do assinante logado para sua conta bancária externa.
 */
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, pix_key, pix_key_type } = body;

    if (!amount || !pix_key || !pix_key_type) {
      return Response.json(
        { error: 'Parâmetros inválidos. amount, pix_key e pix_key_type são obrigatórios.' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return Response.json({ error: 'Valor de saque inválido.' }, { status: 400 });
    }

    // Carregar dados atualizados do assinante
    const userData = queryOne(
      'SELECT name, wallet_balance, withdrawal_count FROM users WHERE id = ?',
      [user.id]
    );

    if (!userData) {
      return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Verificar se possui saldo suficiente
    const currentBalance = userData.wallet_balance || 0;
    if (currentBalance < numAmount) {
      return Response.json(
        { error: `Saldo insuficiente. Saldo disponível: R$ ${currentBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Regra de Tarifas de Saque: 1º Saque Grátis, demais R$ 3,90
    const withdrawalCount = userData.withdrawal_count || 0;
    const fee = withdrawalCount === 0 ? 0.0 : 3.90;
    const netAmount = numAmount - fee;

    if (netAmount <= 0) {
      return Response.json(
        { error: `O valor do saque deve ser maior que a tarifa de R$ ${fee.toFixed(2)}.` },
        { status: 400 }
      );
    }

    // Chamar API de Transferência do Asaas (TED/Pix de saída)
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

    // Deduzir o saldo do assinante no SQLite e incrementar contagem de saques
    run(
      'UPDATE users SET wallet_balance = wallet_balance - ?, withdrawal_count = withdrawal_count + 1, updated_at = datetime("now") WHERE id = ?',
      [numAmount, user.id]
    );

    // Salvar registro de saque externo (client_id é NULL pois o saque é geral do assinante)
    run(
      `INSERT INTO bank_transfers (id, user_id, client_id, amount, fee, net_amount, status, pix_key, pix_key_type, description)
       VALUES (?, ?, NULL, ?, ?, ?, 'done', ?, ?, ?)`,
      [
        transferId,
        user.id,
        numAmount,
        fee,
        netAmount,
        pix_key,
        pix_key_type,
        `Saque Pix ${withdrawalCount === 0 ? 'Gratuito' : 'Tarifado (R$ 3,90)'}`
      ]
    );

    // Gravar transação de débito no livro financeiro geral
    run(
      `INSERT INTO transactions (id, user_id, client_id, amount, type, payment_method, reference, notes)
       VALUES (?, ?, NULL, ?, 'expense', 'pix', ?, ?)`,
      [
        generateId(),
        user.id,
        numAmount,
        transferId,
        `Saque Pix efetuado para a chave: ${pix_key}. Tarifa: R$ ${fee.toFixed(2)}`
      ]
    );

    // Gravar log de atividade
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [
        generateId(),
        user.id,
        'withdraw_payout',
        'user',
        user.id,
        `Saque de R$ ${numAmount.toFixed(2)} (líquido R$ ${netAmount.toFixed(2)}) efetuado para a conta do assinante.`
      ]
    );

    // Criar notificação para o assinante
    run(
      'INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        generateId(),
        user.id,
        'warning',
        '💸 Saque realizado com sucesso',
        `Saque de R$ ${numAmount.toFixed(2)} processado e enviado para sua chave Pix.`,
        'user',
        user.id
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
