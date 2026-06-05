import { query, queryOne, run, generateId } from '@/lib/db';

/**
 * Calcula a data da Páscoa para um ano específico usando o algoritmo de Meeus/Jones/Butcher.
 * Utilizado para derivar feriados móveis nacionais no Brasil (Carnaval, Sexta-feira Santa, Corpus Christi).
 * @param {number} year 
 * @returns {Date}
 */
function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export async function GET(request) {
  try {
    // 1. Chave de proteção simples para chamadas de cron externo
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || searchParams.get('token');
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || 'cobbra-cron-security-token-2026';

    const isAuthorized = (secret === expectedSecret) || (authHeader === `Bearer ${expectedSecret}`);
    if (!isAuthorized) {
      return Response.json({ error: 'Não autorizado. Token de cron inválido.' }, { status: 401 });
    }

    // 2. Determinar a data e fuso horário brasileiro (America/Sao_Paulo)
    const now = new Date();
    const dateBrlStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const [day, month, year] = dateBrlStr.split('/').map(Number);
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const todayDate = new Date(year, month - 1, day);
    todayDate.setHours(0, 0, 0, 0);

    const dayOfWeek = todayDate.getDay(); // 0 = Domingo, 6 = Sábado
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    // 3. Feriados Estáticos
    const staticHolidays = [
      '01-01', // Confraternização Universal
      '04-21', // Tiradentes
      '05-01', // Dia do Trabalho
      '09-07', // Independência do Brasil
      '10-12', // Nossa Senhora Aparecida
      '11-02', // Finados
      '11-15', // Proclamação da República
      '11-20', // Dia Nacional da Consciência Negra
      '12-25'  // Natal
    ];
    const currentMMDD = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isStaticHoliday = staticHolidays.includes(currentMMDD);

    // 4. Feriados Móveis baseados no cálculo da Páscoa
    const easter = getEasterDate(year);
    easter.setHours(0, 0, 0, 0);

    const isSameDate = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    // Terça-feira de Carnaval (47 dias antes da Páscoa)
    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 47);

    // Sexta-feira Santa (2 dias antes da Páscoa)
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);

    // Corpus Christi (60 dias após a Páscoa)
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);

    const isMobileHoliday = isSameDate(todayDate, carnival) || isSameDate(todayDate, goodFriday) || isSameDate(todayDate, corpusChristi);
    const isHoliday = isStaticHoliday || isMobileHoliday;

    // 5. Buscar regras de daily-billing ativas
    const rules = query("SELECT * FROM daily_billing WHERE status = 'active'");
    let processedCount = 0;
    let createdCount = 0;
    let pausedCount = 0;

    for (const rule of rules) {
      processedCount++;

      // 5.1 Validar se a regra já passou da data limite de vigência
      if (rule.end_date) {
        const ruleEndDate = new Date(rule.end_date);
        ruleEndDate.setHours(0, 0, 0, 0);
        
        if (ruleEndDate < todayDate) {
          run("UPDATE daily_billing SET status = 'paused', updated_at = datetime('now') WHERE id = ?", [rule.id]);
          pausedCount++;
          continue;
        }
      }

      // 5.2 Respeitar restrições de calendário da regra
      if (isSaturday && rule.exclude_saturdays === 1) continue;
      if ((isSunday || isHoliday) && rule.exclude_sundays_holidays === 1) continue;

      // 5.3 Evitar dupla cobrança no mesmo dia (Idempotência)
      const refToken = `[Ref: ${rule.id} na data ${todayStr}]`;
      const alreadyBilled = queryOne(
        "SELECT id FROM charges WHERE client_id = ? AND user_id = ? AND description LIKE ?",
        [rule.client_id, rule.user_id, `%${refToken}%`]
      );

      if (alreadyBilled) continue;

      // 5.4 Gerar a cobrança real (faturamento materializado em charge)
      const chargeId = generateId();
      const finalDescription = `${rule.description || 'Cobranca Recorrente'} ${refToken}`;
      
      const user = queryOne("SELECT * FROM users WHERE id = ?", [rule.user_id]);
      const client = queryOne("SELECT * FROM clients WHERE id = ?", [rule.client_id]);
      
      let asaasCustomerId = client?.asaas_customer_id || null;
      let asaasPaymentLink = null;
      let asaasPixCopyPaste = null;
      let asaasId = null;

      if (process.env.ASAAS_API_KEY && user && client) {
        try {
          const { createAsaasCustomer, createAsaasPayment } = require('@/lib/asaas');
          asaasCustomerId = await createAsaasCustomer(user, client);
          if (asaasCustomerId) {
            if (asaasCustomerId !== client.asaas_customer_id) {
              run('UPDATE clients SET asaas_customer_id = ? WHERE id = ?', [asaasCustomerId, client.id]);
            }
            
            const chargeObj = { 
              id: chargeId, 
              amount: rule.amount, 
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
          console.error(`Erro Asaas ao integrar faturamento diario rule ${rule.id} com Asaas:`, err);
        }
      }

      run(
        `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, daily_interest_rate, asaas_id, payment_link, pix_copy_paste)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 'once', 'both', 'pix', ?, ?, ?, ?)`,
        [chargeId, rule.user_id, rule.client_id, rule.amount, finalDescription, todayStr, rule.interest_rate, asaasId, asaasPaymentLink, asaasPixCopyPaste]
      );

      // Incrementar o faturamento bruto cobrado do cliente
      run("UPDATE clients SET total_charged = total_charged + ?, updated_at = datetime('now') WHERE id = ?", [rule.amount, rule.client_id]);

      // Logs de Atividade
      run(
        'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), rule.user_id, 'charge_created', 'charge', chargeId, `Cobranca recorrente diaria gerada automaticamente - R$ ${rule.amount.toFixed(2)}`]
      );

      // Notificação interna
      run(
        'INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), rule.user_id, 'info', 'Faturamento diario automatico', `Cobranca de R$ ${rule.amount.toFixed(2)} gerada para ${client?.name || 'Cliente'}`, 'charge', chargeId]
      );

      createdCount++;
    }

    // 6. Processar cobranças automáticas de Custódia de Capital (V15)
    let custodyProcessed = 0;
    let custodyChargesCreated = 0;
    try {
      const activeCustodies = query("SELECT * FROM capital_custody WHERE status = 'active'");
      for (const contract of activeCustodies) {
        custodyProcessed++;

        const user = queryOne("SELECT * FROM users WHERE id = ?", [contract.user_id]);
        const client = queryOne("SELECT * FROM clients WHERE id = ?", [contract.client_id]);
        if (!user || !client) continue;

        // 6.1 Procura cobrança anterior pendente/vencida de custódia para acumular
        const lastUnpaidFee = queryOne(
          `SELECT c.*, h.id as history_id FROM charges c
           JOIN capital_custody_history h ON c.id = h.charge_id
           WHERE h.custody_id = ? AND h.type = 'daily_fee' AND c.status IN ('pending', 'reminder_sent', 'overdue')
           ORDER BY c.created_at DESC LIMIT 1`,
          [contract.id]
        );

        // Se já geramos a taxa hoje e ela está acumulada, evita duplicidade
        if (lastUnpaidFee && lastUnpaidFee.description.includes(`na data ${todayStr}`)) {
          continue;
        }

        // Se não houver pendente, checa idempotência de nova fatura já gerada e paga hoje
        if (!lastUnpaidFee) {
          const refToken = `[Custódia Ref: ${contract.id} na data ${todayStr}]`;
          const alreadyBilled = queryOne(
            "SELECT id FROM charges WHERE client_id = ? AND user_id = ? AND description LIKE ?",
            [contract.client_id, contract.user_id, `%${refToken}%`]
          );
          if (alreadyBilled) continue;
        }

        // 6.2 Calcular taxa diária proporcional (amortização parcial diminui a taxa)
        let calculatedFee = contract.daily_fee;
        if (contract.current_principal < contract.principal_amount && contract.principal_amount > 0) {
          calculatedFee = contract.daily_fee * (contract.current_principal / contract.principal_amount);
          calculatedFee = Math.round(calculatedFee * 100) / 100;
        }

        if (calculatedFee <= 0) continue;

        let asaasPaymentLink = null;
        let asaasPixCopyPaste = null;
        let asaasId = null;
        let finalDescription = '';
        let finalAmount = calculatedFee;

        if (lastUnpaidFee) {
          // 6.3 Cenário A: Acumular na cobrança pendente (Rollover com Juros)
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

          if (process.env.ASAAS_API_KEY && asaasId) {
            try {
              const { updateAsaasPayment } = require('@/lib/asaas');
              const asaasResult = await updateAsaasPayment(user, asaasId, finalAmount, todayStr, finalDescription);
              if (asaasResult && !asaasResult.fallback) {
                asaasPaymentLink = asaasResult.paymentLink || asaasResult.invoiceUrl;
                asaasPixCopyPaste = asaasResult.pixCopyPaste;
              }
            } catch (err) {
              console.error(`Erro Asaas ao atualizar cobrança acumulada ${asaasId}:`, err);
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
            [generateId(), contract.id, 'daily_fee', calculatedFee, lastUnpaidFee.id, `Taxa diária acumulada: adicionado R$ ${calculatedFee.toFixed(2)} (juros aplicados: R$ ${interestAmount.toFixed(2)})`]
          );

          // Notificação de sistema
          run(
            'INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [generateId(), contract.user_id, 'info', 'Taxa de Custódia Acumulada', `Fatura de custódia atualizada para R$ ${finalAmount.toFixed(2)} para ${client.name}`, 'charge', lastUnpaidFee.id]
          );

        } else {
          // 6.4 Cenário B: Criar nova cobrança do zero
          const chargeId = generateId();
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
                  id: chargeId,
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
              console.error(`Erro Asaas ao criar nova cobrança de custódia:`, err);
            }
          }

          if (!asaasPixCopyPaste) {
            const { generateStaticPix } = require('@/lib/pix');
            asaasPixCopyPaste = generateStaticPix({
              key: user.pix_key || 'demo@cobbra.com.br',
              amount: calculatedFee,
              name: user.business_name || user.name || 'Cobbra Pay',
              txid: chargeId.substring(0, 25).toUpperCase().replace(/[^A-Z0-9]/g, 'C')
            });
          }

          run(
            `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, daily_interest_rate, asaas_id, payment_link, pix_copy_paste)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', 'once', 'both', 'pix', 0, ?, ?, ?)`,
            [chargeId, contract.user_id, contract.client_id, calculatedFee, finalDescription, todayStr, asaasId, asaasPaymentLink, asaasPixCopyPaste]
          );

          run("UPDATE clients SET total_charged = total_charged + ?, updated_at = datetime('now') WHERE id = ?", [calculatedFee, contract.client_id]);

          run(
            `INSERT INTO capital_custody_history (id, custody_id, type, amount, charge_id, notes)
             VALUES (?, ?, 'daily_fee', ?, ?, ?)`,
            [generateId(), contract.id, 'daily_fee', calculatedFee, chargeId, `Taxa de custódia diária gerada: R$ ${calculatedFee.toFixed(2)}`]
          );

          run(
            'INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [generateId(), contract.user_id, 'info', 'Taxa de Custódia Gerada', `Taxa de R$ ${calculatedFee.toFixed(2)} gerada para ${client.name}`, 'charge', chargeId]
          );
        }

        // 6.5 Enfileirar WhatsApp com template customizado
        let messageText = '';
        const currentChargeId = lastUnpaidFee ? lastUnpaidFee.id : chargeId;
        const currentLink = asaasPaymentLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://cobbra.com.br'}/api/cobranca-diaria/pagar?id=${currentChargeId}`;

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

        if (client?.phone) {
          const cleanPhone = client.phone.replace(/\D/g, '');
          const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
          run(
            `INSERT INTO whatsapp_queue (id, user_id, phone, message, status, max_attempts)
             VALUES (?, ?, ?, ?, 'pending', 3)`,
            [generateId(), contract.user_id, fullPhone, messageText]
          );
        }

        custodyChargesCreated++;
      }
    } catch (custodyCronErr) {
      console.error('❌ Falha ao processar cron de custódia de capital:', custodyCronErr);
    }

    return Response.json({
      success: true,
      today: todayStr,
      isHoliday,
      isWeekend: isSaturday || isSunday,
      metrics: {
        totalRulesActive: rules.length,
        processedRules: processedCount,
        chargesCreated: createdCount,
        rulesPausedExpired: pausedCount,
        custodyProcessed,
        custodyChargesCreated
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
