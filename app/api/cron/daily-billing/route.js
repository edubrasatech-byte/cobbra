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
    const secret = searchParams.get('secret');
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

    return Response.json({
      success: true,
      today: todayStr,
      isHoliday,
      isWeekend: isSaturday || isSunday,
      metrics: {
        totalRulesActive: rules.length,
        processedRules: processedCount,
        chargesCreated: createdCount,
        rulesPausedExpired: pausedCount
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
