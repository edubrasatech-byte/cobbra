import { query, run, generateId } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { getInstanceToken, getEvolutionConfig, sendWhatsAppMessage } from '@/lib/evolution';

// getInstanceToken is now centralized in @/lib/evolution.js

// Rota protegida: POST /api/cron/send-reminders?secret=SEU_SECRET
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || searchParams.get('token');
    const authHeader = request.headers.get('authorization');

    // Validação de segurança
    const cronSecret = process.env.CRON_SECRET || 'cobbra-cron-secret-key-2026';
    const isAuthorized = (secret === cronSecret) || (authHeader === `Bearer ${cronSecret}`);
    if (!isAuthorized) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Réguas de dias ativas no sistema
    const activeRules = [-3, 0, 1, 7, 15, 30];
    
    let totalProcessed = 0;
    let totalEmailsSent = 0;
    let totalWhatsappSent = 0;
    const detailsLog = [];

    // Loop por cada régua de dias para calcular a data alvo
    for (const daysOffset of activeRules) {
      const targetDate = new Date();
      // Se daysOffset é -3, targetDate será hoje + 3 dias (vence em 3 dias)
      // Se daysOffset é 7, targetDate será hoje - 7 dias (venceu há 7 dias)
      targetDate.setDate(targetDate.getDate() - daysOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Determina quais status de cobrança buscar dependendo se é antes ou depois do vencimento
      let statusFilter = "c.status IN ('pending', 'reminder_sent')";
      if (daysOffset > 0) {
        // Para faturas que já venceram, o status precisa ser 'overdue' ou 'reminder_sent' (mas não pagas)
        statusFilter = "c.status IN ('overdue', 'reminder_sent')";
      }

      // Buscar cobranças que se enquadram exatamente nesta régua e data-alvo
      const targetCharges = query(
        `SELECT c.*, cl.name as client_name, cl.email as client_email, cl.phone as client_phone, u.business_name, u.pix_key, u.pix_key_type
         FROM charges c
         JOIN clients cl ON c.client_id = cl.id
         JOIN users u ON c.user_id = u.id
         WHERE ${statusFilter} AND c.due_date = ?`,
        [targetDateStr]
      );

      if (targetCharges.length > 0) {
        console.log(`[CRON] Encontradas ${targetCharges.length} cobranças para a régua [${daysOffset} dias] (Data: ${targetDateStr})`);
      }

      for (const charge of targetCharges) {
        // Link dinâmico de pagamento do Cobbra
        const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://cobbra.com.br'}/api/cobranca-diaria/pagar?id=${charge.id}`;
        const valorFmt = `R$ ${Number(charge.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const vencimentoFmt = new Date(charge.due_date + 'T12:00:00').toLocaleDateString('pt-BR');

        // Buscar o template customizado do usuário ou carregar o padrão do sistema para este timing_days
        const template = query(
          `SELECT * FROM reminder_templates 
           WHERE (user_id = ? OR user_id IS NULL) AND timing_days = ? AND (channel = ? OR channel = 'both') 
           ORDER BY user_id DESC LIMIT 1`,
          [charge.user_id, daysOffset, charge.reminder_channel]
        );

        // Fallback robusto de textos caso o banco não tenha templates definidos
        let defaultMsg = '';
        if (daysOffset === -3) {
          defaultMsg = 'Oi {cliente_nome}! 💚 Lembrete gentil: sua {descricao} no valor de {valor} vence em 3 dias ({vencimento}). Pode pagar pelo Pix no link: {link_pagamento}. Obrigado! 🙏';
        } else if (daysOffset === 0) {
          defaultMsg = 'Oi {cliente_nome}! 💚 Hoje é o dia de vencimento da sua {descricao} ({valor}). Segue o link para pagamento: {link_pagamento}. Qualquer dúvida, estou aqui! 😊';
        } else if (daysOffset === 1) {
          defaultMsg = 'Oi {cliente_nome}! 💚 Passando para lembrar que sua {descricao} de {valor} venceu ontem. Tudo bem? Segue o link: {link_pagamento}. Me avisa se precisar de algo!';
        } else {
          defaultMsg = '{cliente_nome}, sua {descricao} de {valor} está pendente há {timing_days} dias (vencimento: {vencimento}). Por favor, regularize o pagamento pelo link: {link_pagamento}';
        }

        const templateObj = template && template[0] ? template[0] : { message: defaultMsg };
        const rawMessage = templateObj.message || defaultMsg;

        // Substituição inteligente de tags
        const formattedMessage = rawMessage
          .replace(/{cliente_nome}/g, charge.client_name)
          .replace(/{descricao}/g, charge.description || 'Cobrança')
          .replace(/{valor}/g, valorFmt)
          .replace(/{vencimento}/g, vencimentoFmt)
          .replace(/{timing_days}/g, String(Math.abs(daysOffset)))
          .replace(/{link_pagamento}/g, paymentLink);

        let emailSent = false;
        let whatsappSent = false;

        // --- DISPARO DE E-MAIL REAL ---
        if (charge.reminder_channel === 'email' || charge.reminder_channel === 'both') {
          try {
            const emailSubject = `Lembrete de Cobrança: ${charge.description || 'Cobrança Gentil'}`;
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #10b981; margin-bottom: 20px;">Lembrete de Pagamento 🐍</h2>
                <p style="font-size: 15px; color: #334155; line-height: 1.6;">${formattedMessage.replace(/\n/g, '<br>')}</p>
                <div style="margin-top: 30px; text-align: center;">
                  <a href="${paymentLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
                    Pagar via Pix / Boleto
                  </a>
                </div>
                <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e2e8f0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                  Enviado de forma segura por ${charge.business_name || 'Cobbra Financeiro'}.
                </p>
              </div>
            `;

            await sendEmail({
              to: charge.client_email,
              subject: emailSubject,
              html: emailHtml
            });

            emailSent = true;
            totalEmailsSent++;
          } catch (e) {
            console.error(`[CRON ERROR] Falha no e-mail para ${charge.client_email}:`, e.message);
          }
        }

        // --- ENFILEIRAR DISPARO DE WHATSAPP (Frente 6 — Fila WhatsApp) ---
        if (charge.reminder_channel === 'whatsapp' || charge.reminder_channel === 'both') {
          try {
            const queueId = generateId();
            // Limpar caracteres não numéricos do telefone
            const formattedPhone = charge.client_phone.replace(/\D/g, '');
            const fullPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

            run(
              `INSERT INTO whatsapp_queue (id, user_id, phone, message, status, max_attempts) 
               VALUES (?, ?, ?, ?, 'pending', 3)`,
              [queueId, charge.user_id, fullPhone, formattedMessage]
            );

            console.log(`[QUEUE] Mensagem de WhatsApp para ${fullPhone} enfileirada com sucesso (ID: ${queueId}).`);
            whatsappSent = true;
            totalWhatsappSent++;
          } catch (e) {
            console.error('[QUEUE ERROR] Falha ao enfileirar mensagem de WhatsApp:', e.message);
          }
        }

        // --- REGISTRAR NO BANCO DE DADOS ---
        if (emailSent || whatsappSent) {
          totalProcessed++;
          const reminderId = generateId();
          
          // Salva o lembrete enviado na tabela 'reminders'
          run(
            `INSERT INTO reminders (id, charge_id, user_id, client_id, channel, message, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
            [reminderId, charge.id, charge.user_id, charge.client_id, charge.reminder_channel, formattedMessage]
          );

          // Atualiza status para 'overdue' se for após o vencimento, ou mantém 'reminder_sent'
          const nextStatus = daysOffset > 0 ? 'overdue' : 'reminder_sent';

          run(
            `UPDATE charges SET 
              status = ?, 
              reminders_sent = reminders_sent + 1,
              updated_at = datetime('now') 
             WHERE id = ?`,
            [nextStatus, charge.id]
          );

          // Registrar no feed de atividades
          run(
            `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
             VALUES (?, ?, 'reminder_sent', 'reminder', ?, ?)`,
            [generateId(), charge.user_id, reminderId, `Régua automática [${daysOffset}d] enviada para ${charge.client_name}`]
          );

          detailsLog.push({
            client: charge.client_name,
            rule: `${daysOffset} dias`,
            email: emailSent,
            whatsapp: whatsappSent
          });
        }
      }
    }

    return Response.json({
      success: true,
      processed: totalProcessed,
      emailsSent: totalEmailsSent,
      whatsappSent: totalWhatsappSent,
      details: detailsLog
    });

  } catch (error) {
    console.error('[CRON GENERAL FAULT] Erro no processamento do cron:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
