import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, generateId } from '@/lib/db';
import { requestAsaasTransfer } from '@/lib/asaas';
import { sendWhatsAppMessage, getEvolutionConfig } from '@/lib/evolution';

/**
 * POST /api/pay/withdraw
 * Processa a solicitação de saque (resgate Pix) com 2FA via WhatsApp
 */
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, pix_key, pix_key_type, code } = body;

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
      'SELECT name, phone, wallet_balance, withdrawal_count FROM users WHERE id = ?',
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

    const getSetting = (key) => {
      const row = queryOne('SELECT value FROM settings WHERE user_id = ? AND key = ?', [user.id, key]);
      return row ? row.value : null;
    };

    const setSetting = (key, value) => {
      try {
        run(
          `INSERT INTO settings (id, user_id, key, value) VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, key) DO UPDATE SET value = ?`,
          [generateId(), user.id, key, value, value]
        );
      } catch(e) {
        run('DELETE FROM settings WHERE user_id = ? AND key = ?', [user.id, key]);
        run('INSERT INTO settings (id, user_id, key, value) VALUES (?, ?, ?, ?)', [generateId(), user.id, key, value]);
      }
    };

    // 2FA VERIFICATION CODE FLOW
    if (!code) {
      if (!userData.phone || userData.phone.trim() === '') {
        return Response.json(
          { error: 'Você precisa cadastrar um número de telefone de contato nas Configurações para poder autorizar saques.' },
          { status: 400 }
        );
      }

      // Generate 6-digit code
      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      // Store in settings table
      setSetting('withdraw_2fa_code', generatedCode);
      setSetting('withdraw_2fa_expires', String(expiresAt));
      setSetting('withdraw_2fa_amount', String(numAmount));
      setSetting('withdraw_2fa_pix_key', pix_key);
      setSetting('withdraw_2fa_pix_key_type', pix_key_type);

      // Send via official Support Instance (48 991694737)
      const config = getEvolutionConfig();
      if (config) {
        const instanceName = process.env.SUPPORT_WHATSAPP_INSTANCE || 'cobbra-outreach';
        const cleanPhone = userData.phone.replace(/\D/g, '');
        const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        
        const text = `🛡️ *Segurança Cobbra Pay*\n\nSeu código de segurança para autorizar o resgate Pix de *R$ ${numAmount.toFixed(2)}* é:\n\n*${generatedCode}*\n\nEste código expira em 5 minutos. Não compartilhe com terceiros.`;

        await sendWhatsAppMessage({
          baseUrl: config.baseUrl,
          token: config.globalToken,
          instanceName: instanceName,
          phone: phoneWithDDI,
          text: text
        });
      } else {
        console.log(`[PIX 2FA CODE LOCAL SIMULATOR] Code: ${generatedCode} for Phone: ${userData.phone}`);
      }

      return Response.json({ requires_2fa: true });
    }

    // VERIFY SUBMITTED 2FA CODE
    const savedCode = getSetting('withdraw_2fa_code');
    const savedExpires = getSetting('withdraw_2fa_expires');
    const savedAmount = getSetting('withdraw_2fa_amount');
    const savedPixKey = getSetting('withdraw_2fa_pix_key');
    const savedPixKeyType = getSetting('withdraw_2fa_pix_key_type');

    if (!savedCode || !savedExpires) {
      return Response.json(
        { error: 'Nenhum código de segurança foi gerado para este saque. Inicie a solicitação novamente.' },
        { status: 400 }
      );
    }

    if (Date.now() > parseInt(savedExpires)) {
      return Response.json({ error: 'O código de segurança expirou. Solicite um novo código.' }, { status: 400 });
    }

    if (savedCode !== code.trim()) {
      return Response.json({ error: 'Código de segurança incorreto.' }, { status: 400 });
    }

    if (parseFloat(savedAmount) !== numAmount || savedPixKey !== pix_key || savedPixKeyType !== pix_key_type) {
      return Response.json(
        { error: 'Os dados do saque não conferem com o código gerado. Solicite outro código.' },
        { status: 400 }
      );
    }

    // Clean up 2FA settings
    run(
      'DELETE FROM settings WHERE user_id = ? AND key IN ("withdraw_2fa_code", "withdraw_2fa_expires", "withdraw_2fa_amount", "withdraw_2fa_pix_key", "withdraw_2fa_pix_key_type")',
      [user.id]
    );

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

    // Send confirmation WhatsApp message to the subscriber's phone
    const config = getEvolutionConfig();
    if (config && userData.phone) {
      const instanceName = process.env.SUPPORT_WHATSAPP_INSTANCE || 'cobbra-outreach';
      const cleanPhone = userData.phone.replace(/\D/g, '');
      const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      const text = `💸 *Saque Concluído - Cobbra Pay*\n\nSeu resgate Pix no valor de *R$ ${numAmount.toFixed(2)}* para a chave \`${pix_key}\` foi concluído com sucesso e enviado para processamento bancário.`;

      await sendWhatsAppMessage({
        baseUrl: config.baseUrl,
        token: config.globalToken,
        instanceName: instanceName,
        phone: phoneWithDDI,
        text: text
      });
    }

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
