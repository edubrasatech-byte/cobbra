import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run, generateId } from '@/lib/db';

// PUT /api/custodia/[id] - Handle actions (amortize, repay, cancel, edit)
export async function PUT(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const contract = queryOne('SELECT * FROM capital_custody WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!contract) {
      return Response.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    const now = new Date();
    const dateBrlStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const [day, month, year] = dateBrlStr.split('/').map(Number);
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (action === 'amortize') {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return Response.json({ error: 'Valor de amortização inválido' }, { status: 400 });
      }
      if (amount > contract.current_principal) {
        return Response.json({ error: 'Valor maior que o saldo principal devedor' }, { status: 400 });
      }

      // Generate a new transparent charge for the amortization
      const chargeId = generateId();
      const finalDescription = `Amortização Parcial de Custódia - Capital Locado [Ref: Amortização ${contract.id}]`;

      const client = queryOne('SELECT * FROM clients WHERE id = ?', [contract.client_id]);

      let asaasCustomerId = client?.asaas_customer_id || null;
      let asaasPaymentLink = null;
      let asaasPixCopyPaste = null;
      let asaasId = null;

      if (process.env.ASAAS_API_KEY && client) {
        try {
          const { createAsaasCustomer, createAsaasPayment } = require('@/lib/asaas');
          asaasCustomerId = await createAsaasCustomer(user, client);
          if (asaasCustomerId) {
            if (asaasCustomerId !== client.asaas_customer_id) {
              run('UPDATE clients SET asaas_customer_id = ? WHERE id = ?', [asaasCustomerId, client.id]);
            }

            const chargeObj = {
              id: chargeId,
              amount,
              due_date: todayStr,
              description: finalDescription,
              payment_method: 'pix'
            };

            const asaasResult = await createAsaasPayment(user, chargeObj, asaasCustomerId);
            if (asaasResult && !asaasResult.fallback) {
              asaasId = asaasResult.asaasId;
              asaasPaymentLink = asaasResult.paymentLink || asaasResult.invoiceUrl;
              asaasPixCopyPaste = asaasResult.pixCopyPaste;
            }
          }
        } catch (err) {
          console.error(`Erro Asaas ao criar cobrança de amortização:`, err);
        }
      }

      if (!asaasPixCopyPaste) {
        const { generateStaticPix } = require('@/lib/pix');
        asaasPixCopyPaste = generateStaticPix({
          key: user.pix_key || 'demo@cobbra.com.br',
          amount,
          name: user.business_name || user.name || 'Cobbra Pay',
          txid: chargeId.substring(0, 25).toUpperCase().replace(/[^A-Z0-9]/g, 'C')
        });
      }

      // Insert charge
      run(
        `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, daily_interest_rate, asaas_id, payment_link, pix_copy_paste)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 'once', 'both', 'pix', 0, ?, ?, ?)`,
        [chargeId, user.id, contract.client_id, amount, finalDescription, todayStr, asaasId, asaasPaymentLink, asaasPixCopyPaste]
      );

      // Register history record
      run(
        `INSERT INTO capital_custody_history (id, custody_id, type, amount, charge_id, notes)
         VALUES (?, ?, 'amortization', ?, ?, ?)`,
        [generateId(), contract.id, 'amortization', amount, chargeId, `Solicitada amortização de R$ ${amount.toFixed(2)}. Aguardando pagamento.`]
      );

      // Log activity
      run(
        'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'custody_amortization_requested', 'custody', contract.id, `Amortização de R$ ${amount.toFixed(2)} gerada para ${client.name}`]
      );

      // Return generated charge
      return Response.json({
        success: true,
        message: 'Cobrança de amortização gerada com sucesso!',
        charge: { id: chargeId, payment_link: asaasPaymentLink, pix_copy_paste: asaasPixCopyPaste, amount }
      });

    } else if (action === 'repay') {
      const amount = contract.current_principal;
      if (amount <= 0) {
        return Response.json({ error: 'Nenhum saldo principal para quitar' }, { status: 400 });
      }

      // Generate a new transparent charge for full repayment
      const chargeId = generateId();
      const finalDescription = `Quitação Integral de Custódia - Devolução Capital [Ref: Quitação ${contract.id}]`;

      const client = queryOne('SELECT * FROM clients WHERE id = ?', [contract.client_id]);

      let asaasCustomerId = client?.asaas_customer_id || null;
      let asaasPaymentLink = null;
      let asaasPixCopyPaste = null;
      let asaasId = null;

      if (process.env.ASAAS_API_KEY && client) {
        try {
          const { createAsaasCustomer, createAsaasPayment } = require('@/lib/asaas');
          asaasCustomerId = await createAsaasCustomer(user, client);
          if (asaasCustomerId) {
            if (asaasCustomerId !== client.asaas_customer_id) {
              run('UPDATE clients SET asaas_customer_id = ? WHERE id = ?', [asaasCustomerId, client.id]);
            }

            const chargeObj = {
              id: chargeId,
              amount,
              due_date: todayStr,
              description: finalDescription,
              payment_method: 'pix'
            };

            const asaasResult = await createAsaasPayment(user, chargeObj, asaasCustomerId);
            if (asaasResult && !asaasResult.fallback) {
              asaasId = asaasResult.asaasId;
              asaasPaymentLink = asaasResult.paymentLink || asaasResult.invoiceUrl;
              asaasPixCopyPaste = asaasResult.pixCopyPaste;
            }
          }
        } catch (err) {
          console.error(`Erro Asaas ao criar cobrança de quitação:`, err);
        }
      }

      if (!asaasPixCopyPaste) {
        const { generateStaticPix } = require('@/lib/pix');
        asaasPixCopyPaste = generateStaticPix({
          key: user.pix_key || 'demo@cobbra.com.br',
          amount,
          name: user.business_name || user.name || 'Cobbra Pay',
          txid: chargeId.substring(0, 25).toUpperCase().replace(/[^A-Z0-9]/g, 'C')
        });
      }

      // Insert charge
      run(
        `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, daily_interest_rate, asaas_id, payment_link, pix_copy_paste)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 'once', 'both', 'pix', 0, ?, ?, ?)`,
        [chargeId, user.id, contract.client_id, amount, finalDescription, todayStr, asaasId, asaasPaymentLink, asaasPixCopyPaste]
      );

      // Register history record
      run(
        `INSERT INTO capital_custody_history (id, custody_id, type, amount, charge_id, notes)
         VALUES (?, ?, 'repayment', ?, ?, ?)`,
        [generateId(), contract.id, 'repayment', amount, chargeId, `Solicitada quitação de R$ ${amount.toFixed(2)}. Aguardando pagamento.`]
      );

      // Log activity
      run(
        'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'custody_repayment_requested', 'custody', contract.id, `Quitação integral de R$ ${amount.toFixed(2)} gerada para ${client.name}`]
      );

      return Response.json({
        success: true,
        message: 'Cobrança de quitação gerada com sucesso!',
        charge: { id: chargeId, payment_link: asaasPaymentLink, pix_copy_paste: asaasPixCopyPaste, amount }
      });

    } else if (action === 'cancel') {
      // Cancel the custody contract (does not require charge, manually closed/cancelled)
      run("UPDATE capital_custody SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [contract.id]);

      run(
        `INSERT INTO capital_custody_history (id, custody_id, type, amount, notes)
         VALUES (?, ?, 'repayment', 0, ?)`,
        [generateId(), contract.id, `Contrato cancelado/finalizado manualmente pelo assinante.`]
      );

      run(
        'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'custody_cancelled', 'custody', contract.id, `Contrato de custódia cancelado manualmente.`]
      );

      return Response.json({ success: true, message: 'Contrato cancelado com sucesso!' });

    } else {
      // Edit mode (collateral_info, custom_message_template, daily_fee, late_interest_rate)
      const { collateral_info, custom_message_template, daily_fee, billing_frequency, late_interest_rate } = body;
      
      const newDailyFee = parseFloat(daily_fee);
      if (isNaN(newDailyFee) || newDailyFee <= 0) {
        return Response.json({ error: 'Taxa diária inválida' }, { status: 400 });
      }

      const parsedLateRate = late_interest_rate !== undefined ? parseFloat(late_interest_rate) / 100 : 0.01;

      run(
        `UPDATE capital_custody
         SET collateral_info = ?, custom_message_template = ?, daily_fee = ?, billing_frequency = ?, late_interest_rate = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [collateral_info || null, custom_message_template || null, newDailyFee, billing_frequency || 'daily', parsedLateRate, contract.id]
      );

      run(
        'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'custody_updated', 'custody', contract.id, `Contrato de custódia atualizado: nova taxa diária R$ ${newDailyFee.toFixed(2)}, juros diários ${(parsedLateRate * 100).toFixed(2)}%`]
      );

      const updated = queryOne('SELECT * FROM capital_custody WHERE id = ?', [contract.id]);
      return Response.json({ success: true, contract: updated });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/custodia/[id] - Trigger manual daily fee charge generation for testing
export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const contract = queryOne('SELECT * FROM capital_custody WHERE id = ? AND user_id = ?', [id, user.id]);
    if (!contract) {
      return Response.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    if (contract.status !== 'active') {
      return Response.json({ error: 'Somente contratos ativos podem gerar taxas diárias' }, { status: 400 });
    }

    const client = queryOne('SELECT * FROM clients WHERE id = ?', [contract.client_id]);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const dateBrlStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const [day, month, year] = dateBrlStr.split('/').map(Number);
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 1. Procura cobrança anterior pendente/vencida de custódia para acumular
    const lastUnpaidFee = queryOne(
      `SELECT c.*, h.id as history_id FROM charges c
       JOIN capital_custody_history h ON c.id = h.charge_id
       WHERE h.custody_id = ? AND h.type = 'daily_fee' AND c.status IN ('pending', 'reminder_sent', 'overdue')
       ORDER BY c.created_at DESC LIMIT 1`,
      [contract.id]
    );

    // Se já geramos a taxa hoje e ela está acumulada, evita duplicidade
    if (lastUnpaidFee && lastUnpaidFee.description.includes(`na data ${todayStr}`)) {
      return Response.json({ error: 'Taxa diária já foi gerada hoje para este contrato' }, { status: 400 });
    }

    // Se não houver pendente, checa idempotência de nova fatura já gerada e paga hoje
    if (!lastUnpaidFee) {
      const refToken = `[Custódia Ref: ${contract.id} na data ${todayStr}]`;
      const alreadyBilled = queryOne(
        "SELECT id FROM charges WHERE client_id = ? AND user_id = ? AND description LIKE ?",
        [contract.client_id, contract.user_id, `%${refToken}%`]
      );
      if (alreadyBilled) {
        return Response.json({ error: 'Taxa diária já foi gerada hoje para este contrato' }, { status: 400 });
      }
    }

    // 2. Calcular taxa diária proporcional
    let calculatedFee = contract.daily_fee;
    if (contract.current_principal < contract.principal_amount && contract.principal_amount > 0) {
      calculatedFee = contract.daily_fee * (contract.current_principal / contract.principal_amount);
      calculatedFee = Math.round(calculatedFee * 100) / 100;
    }

    if (calculatedFee <= 0) {
      return Response.json({ error: 'Taxa proporcional calculada é menor ou igual a zero' }, { status: 400 });
    }

    let asaasPaymentLink = null;
    let asaasPixCopyPaste = null;
    let asaasId = null;
    let finalDescription = '';
    let finalAmount = calculatedFee;
    let finalChargeId = '';

    if (lastUnpaidFee) {
      // Cenário A: Acumular na cobrança pendente (Rollover com Juros)
      const lastDue = new Date(lastUnpaidFee.due_date);
      const todayDateObj = new Date(todayStr);
      const daysOverdue = Math.max(0, Math.floor((todayDateObj - lastDue) / (1000 * 60 * 60 * 24)));
      
      const lateRate = contract.late_interest_rate !== undefined ? contract.late_interest_rate : 0.01;
      const interestAmount = Math.round((lastUnpaidFee.amount * lateRate * daysOverdue) * 100) / 100;
      finalAmount = Math.round((lastUnpaidFee.amount + interestAmount + calculatedFee) * 100) / 100;

      finalDescription = `Taxa de Custódia Diária (Acumulada) - Capital Locado. Inclui R$ ${interestAmount.toFixed(2)} de juros de atraso (${daysOverdue} dias) e R$ ${calculatedFee.toFixed(2)} da taxa de hoje. [Custódia Ref: ${contract.id} na data ${todayStr}]`;
      
      asaasId = lastUnpaidFee.asaas_id;
      asaasPaymentLink = lastUnpaidFee.payment_link;
      asaasPixCopyPaste = lastUnpaidFee.pix_copy_paste;
      finalChargeId = lastUnpaidFee.id;

      if (process.env.ASAAS_API_KEY && asaasId) {
        try {
          const { updateAsaasPayment } = require('@/lib/asaas');
          const asaasResult = await updateAsaasPayment(user, asaasId, finalAmount, todayStr, finalDescription);
          if (asaasResult && !asaasResult.fallback) {
            asaasPaymentLink = asaasResult.paymentLink || asaasResult.invoiceUrl;
            asaasPixCopyPaste = asaasResult.pixCopyPaste;
          }
        } catch (err) {
          console.error(`Erro Asaas ao atualizar cobrança manual acumulada ${asaasId}:`, err);
        }
      }

      if (!asaasPixCopyPaste) {
        const { generateStaticPix } = require('@/lib/pix');
        asaasPixCopyPaste = generateStaticPix({
          key: user.pix_key || 'demo@cobbra.com.br',
          amount: finalAmount,
          name: user.business_name || user.name || 'Cobbra Pay',
          txid: lastUnpaidFee.id.substring(0, 25).toUpperCase().replace(/[^A-Z0-9]/g, 'C')
        });
      }

      // Atualizar a cobrança existente na base SQLite
      run(
        `UPDATE charges SET amount = ?, description = ?, due_date = ?, status = 'pending', payment_link = ?, pix_copy_paste = ?, updated_at = datetime('now') WHERE id = ?`,
        [finalAmount, finalDescription, todayStr, asaasPaymentLink, asaasPixCopyPaste, lastUnpaidFee.id]
      );

      // Incrementar faturamento no cliente
      run("UPDATE clients SET total_charged = total_charged + ?, updated_at = datetime('now') WHERE id = ?", [calculatedFee, contract.client_id]);

      // Registrar histórico
      run(
        `INSERT INTO capital_custody_history (id, custody_id, type, amount, charge_id, notes)
         VALUES (?, ?, 'daily_fee', ?, ?, ?)`,
        [generateId(), contract.id, 'daily_fee', calculatedFee, lastUnpaidFee.id, `Taxa diária acumulada manualmente: adicionado R$ ${calculatedFee.toFixed(2)} (juros aplicados: R$ ${interestAmount.toFixed(2)})`]
      );

      // Notificação de sistema
      run(
        'INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), contract.user_id, 'info', 'Taxa de Custódia Acumulada', `Fatura de custódia atualizada manualmente para R$ ${finalAmount.toFixed(2)}`, 'charge', lastUnpaidFee.id]
      );

    } else {
      // Cenário B: Criar nova cobrança do zero
      finalChargeId = generateId();
      finalDescription = `Taxa de Custódia Diária - Capital Locado [Custódia Ref: ${contract.id} na data ${todayStr}]`;
      let asaasCustomerId = client.asaas_customer_id || null;

      if (process.env.ASAAS_API_KEY) {
        try {
          const { createAsaasCustomer, createAsaasPayment } = require('@/lib/asaas');
          asaasCustomerId = await createAsaasCustomer(user, client);
          if (asaasCustomerId) {
            if (asaasCustomerId !== client.asaas_customer_id) {
              run('UPDATE clients SET asaas_customer_id = ? WHERE id = ?', [asaasCustomerId, client.id]);
            }

            const chargeObj = {
              id: finalChargeId,
              amount: calculatedFee,
              due_date: todayStr,
              description: finalDescription,
              payment_method: 'pix'
            };

            const asaasResult = await createAsaasPayment(user, chargeObj, asaasCustomerId);
            if (asaasResult && !asaasResult.fallback) {
              asaasId = asaasResult.asaasId;
              asaasPaymentLink = asaasResult.paymentLink || asaasResult.invoiceUrl;
              asaasPixCopyPaste = asaasResult.pixCopyPaste;
            }
          }
        } catch (err) {
          console.error(`Erro Asaas ao criar cobrança manual de custódia:`, err);
        }
      }

      if (!asaasPixCopyPaste) {
        const { generateStaticPix } = require('@/lib/pix');
        asaasPixCopyPaste = generateStaticPix({
          key: user.pix_key || 'demo@cobbra.com.br',
          amount: calculatedFee,
          name: user.business_name || user.name || 'Cobbra Pay',
          txid: finalChargeId.substring(0, 25).toUpperCase().replace(/[^A-Z0-9]/g, 'C')
        });
      }

      run(
        `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, daily_interest_rate, asaas_id, payment_link, pix_copy_paste)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 'once', 'both', 'pix', 0, ?, ?, ?)`,
        [finalChargeId, user.id, contract.client_id, calculatedFee, finalDescription, todayStr, asaasId, asaasPaymentLink, asaasPixCopyPaste]
      );

      run("UPDATE clients SET total_charged = total_charged + ?, updated_at = datetime('now') WHERE id = ?", [calculatedFee, contract.client_id]);

      run(
        `INSERT INTO capital_custody_history (id, custody_id, type, amount, charge_id, notes)
         VALUES (?, ?, 'daily_fee', ?, ?, ?)`,
        [generateId(), contract.id, 'daily_fee', calculatedFee, finalChargeId, `Taxa de custódia diária gerada manualmente: R$ ${calculatedFee.toFixed(2)}`]
      );
    }

    // Queue WhatsApp message
    let messageText = '';
    const currentLink = asaasPaymentLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://cobbra.com.br'}/api/cobranca-diaria/pagar?id=${finalChargeId}`;

    if (contract.custom_message_template) {
      const valorFmt = `R$ ${finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const principalFmt = `R$ ${contract.current_principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      messageText = contract.custom_message_template
        .replace(/{cliente_nome}/g, client.name)
        .replace(/{taxa_diaria}/g, valorFmt)
        .replace(/{capital_total}/g, principalFmt)
        .replace(/{link_pagamento}/g, currentLink);
    } else {
      messageText = `Olá ${client.name}! ⚡ Segue a taxa de custódia diária acumulada do capital locado sob sua responsabilidade, no valor total de R$ ${finalAmount.toFixed(2)}. Pague pelo Pix copia e cola ou no link: ${currentLink}`;
    }

    if (client.phone) {
      const cleanPhone = client.phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      run(
        `INSERT INTO whatsapp_queue (id, user_id, phone, message, status, max_attempts)
         VALUES (?, ?, ?, ?, 'pending', 3)`,
        [generateId(), contract.user_id, fullPhone, messageText]
      );
    }

    return Response.json({
      success: true,
      message: lastUnpaidFee ? 'Taxa diária acumulada e enfileirada com sucesso!' : 'Taxa diária gerada e enfileirada com sucesso!',
      charge: { id: finalChargeId, amount: finalAmount, payment_link: asaasPaymentLink, pix_copy_paste: asaasPixCopyPaste }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
