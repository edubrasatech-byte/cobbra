import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { generateStaticPix } from '@/lib/pix';

// Helper to dynamically get the instance-specific token using the global token
async function getInstanceToken(evoUrl, globalToken, instanceName) {
  try {
    const baseUrl = evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl;
    let res;
    try {
      res = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { 'apikey': globalToken }
      });
    } catch (e) {
      if (baseUrl.includes(':8080')) {
        const fallbackUrl = baseUrl.replace(':8080', '');
        console.log(`[TOKEN RESOLVER SELF-HEALING]: Port 8080 failed. Retrying on port 80: ${fallbackUrl}`);
        res = await fetch(`${fallbackUrl}/instance/fetchInstances`, {
          headers: { 'apikey': globalToken }
        });
      } else {
        throw e;
      }
    }

    if (res && res.ok) {
      const instances = await res.json();
      if (Array.isArray(instances)) {
        const inst = instances.find(i => i.name === instanceName || i.instanceName === instanceName);
        if (inst && inst.token) {
          console.log(`[TOKEN RESOLVER] Dynamically resolved token for instance ${instanceName}`);
          return inst.token;
        }
      }
    }
  } catch (e) {
    console.error('[TOKEN RESOLVER ERROR]', e);
  }
  return null;
}


// GET /api/lembretes - List reminders
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const reminders = query(
      `SELECT r.*, c.amount as charge_amount, c.description as charge_description,
              cl.name as client_name, cl.phone as client_phone, cl.email as client_email
       FROM reminders r
       LEFT JOIN charges c ON r.charge_id = c.id
       LEFT JOIN clients cl ON r.client_id = cl.id
       WHERE r.user_id = ?
       ORDER BY r.sent_at DESC
       LIMIT ? OFFSET ?`,
      [user.id, limit, offset]
    );

    const { total } = queryOne('SELECT COUNT(*) as total FROM reminders WHERE user_id = ?', [user.id]);

    return Response.json({ reminders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/lembretes - Send a reminder
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const charge_id = body.charge_id || body.chargeId;
    const channel = body.channel;
    const message = body.message;

    if (!charge_id || !message) return Response.json({ error: 'Cobrança e mensagem são obrigatórios' }, { status: 400 });

    const charge = queryOne('SELECT * FROM charges WHERE id = ? AND user_id = ?', [charge_id, user.id]);
    if (!charge) return Response.json({ error: 'Cobrança não encontrada' }, { status: 404 });

    const finalChannel = channel || 'whatsapp';
    const client = queryOne('SELECT name, email, phone FROM clients WHERE id = ?', [charge.client_id]);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    // Validate email channel requirements
    if ((finalChannel === 'email' || finalChannel === 'both') && !client.email) {
      return Response.json({ error: 'O cliente não possui e-mail cadastrado para envio.' }, { status: 400 });
    }

    // Calculate updated debt value with daily interest if overdue
    let updatedAmount = charge.amount;
    let delayDays = 0;
    let interestApplied = 0;

    if (charge.status !== 'paid' && charge.status !== 'cancelled') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const due = new Date(charge.due_date + 'T00:00:00');
      
      if (today > due) {
        const timeDiff = today.getTime() - due.getTime();
        delayDays = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        
        if (charge.daily_interest_rate > 0) {
          // daily_interest_rate is stored as percentage, e.g. 0.3% per day
          interestApplied = charge.amount * (charge.daily_interest_rate / 100) * delayDays;
          updatedAmount += interestApplied;
        }
      }
    }

    // Generate Pix code or use Asaas Pix copy-paste if available
    let pixCode = charge.pix_copy_paste || '';
    if (!pixCode && user.pix_key) {
      pixCode = generateStaticPix({
        key: user.pix_key,
        amount: updatedAmount,
        name: user.business_name || user.name
      });
    }

    // Format WhatsApp message with Pix and updated debt summary if applicable
    let finalMessage = message;
    if (charge.payment_link) {
      finalMessage += `\n\n🔗 *Link de Pagamento (Fatura):* ${charge.payment_link}`;
    }

    if (pixCode) {
      finalMessage += `\n\n💵 *Resumo do Pagamento:* \n`;
      if (delayDays > 0 && interestApplied > 0) {
        finalMessage += `• Valor original: R$ ${charge.amount.toFixed(2).replace('.', ',')}\n`;
        finalMessage += `• Juros por atraso (${delayDays} dias): R$ ${interestApplied.toFixed(2).replace('.', ',')}\n`;
        finalMessage += `• *Valor Total:* R$ ${updatedAmount.toFixed(2).replace('.', ',')}\n\n`;
      } else {
        finalMessage += `• *Valor Total:* R$ ${updatedAmount.toFixed(2).replace('.', ',')}\n\n`;
      }
      finalMessage += `📸 *O QRCode e o Pix Copia e Cola foram enviados logo abaixo para facilitar o seu pagamento!*`;
    }

    const id = generateId();
    run(
      `INSERT INTO reminders (id, charge_id, user_id, client_id, channel, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
      [id, charge_id, user.id, charge.client_id, finalChannel, finalMessage]
    );

    // 1. Dynamic Real Dispatches via central Evolution API for WhatsApp
    if (finalChannel === 'whatsapp' || finalChannel === 'both') {
      const userData = queryOne('SELECT whatsapp_status, whatsapp_instance, whatsapp_phone FROM users WHERE id = ?', [user.id]);
      const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
      const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN || process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_GLOBAL_API_KEY || process.env.EVOLUTION_API_KEY;
      
      const instance = userData?.whatsapp_instance || `cobbra_inst_${user.id.substring(0, 8)}`;
      
      if (evoUrl && evoToken) {
          const { normalizeBrazilianNumber } = require('@/lib/evolution');
          const waNumber = normalizeBrazilianNumber(client.phone);
          
          let activeEvoUrl = evoUrl;
          let response;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
          
          // Helper to send Pix extras (QR Code image & raw copyable code separately)
          const sendPixExtras = async (baseUrl, instName, token, phoneNum, code) => {
            if (!code) return;
            // 1. Send the QR Code Image
            try {
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code)}&.png`;
              await fetch(`${baseUrl}/message/sendMedia/${instName}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'apikey': token
                },
                body: JSON.stringify({
                  number: phoneNum,
                  mediatype: "image",
                  mimetype: "image/png",
                  fileName: "qrcode.png",
                  media: qrCodeUrl,
                  caption: "📸 Aponte a câmera do celular para pagar via Pix!"
                })
              });
              console.log(`[EVOLUTION API] Successfully sent Pix QR Code image to ${phoneNum}`);
            } catch (qrErr) {
              console.error("[EVOLUTION API] Failed to send Pix QR Code image:", qrErr);
            }

            // 2. Send the RAW Pix Copia e Cola as a separate message for easy tap-and-hold copy-paste
            try {
              await fetch(`${baseUrl}/message/sendText/${instName}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'apikey': token
                },
                body: JSON.stringify({
                  number: phoneNum,
                  text: code,
                  delay: 800
                })
              });
              console.log(`[EVOLUTION API] Successfully sent raw Pix Copia e Cola message to ${phoneNum}`);
            } catch (pixErr) {
              console.error("[EVOLUTION API] Failed to send raw Pix Copia e Cola:", pixErr);
            }
          };

          try {
            const instanceToken = await getInstanceToken(activeEvoUrl, evoToken, instance) || evoToken;
            response = await fetch(`${activeEvoUrl}/message/sendText/${instance}`, {
              method: 'POST',
              signal: controller.signal,
              headers: { 
                'Content-Type': 'application/json',
                'apikey': instanceToken
              },
              body: JSON.stringify({
                number: waNumber,
                text: finalMessage,
                delay: 1200
              })
            });
            clearTimeout(timeoutId);
            
            if (response && response.ok) {
              await sendPixExtras(activeEvoUrl, instance, instanceToken, waNumber, pixCode);
            }
          } catch (e) {
            clearTimeout(timeoutId);
            
            // Self-healing: if port 8080 failed due to firewall/outbound block, retry on default port 80
            if (activeEvoUrl.includes(':8080')) {
              activeEvoUrl = activeEvoUrl.replace(':8080', '');
              console.log(`[SELF-HEALING SEND]: Port 8080 connection failed/aborted. Retrying send on default port 80: ${activeEvoUrl}`);
              
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), 8000);
              
              try {
                const retryInstanceToken = await getInstanceToken(activeEvoUrl, evoToken, instance) || evoToken;
                response = await fetch(`${activeEvoUrl}/message/sendText/${instance}`, {
                  method: 'POST',
                  signal: retryController.signal,
                  headers: { 
                    'Content-Type': 'application/json',
                    'apikey': retryInstanceToken
                  },
                  body: JSON.stringify({
                    number: waNumber,
                    text: finalMessage,
                    delay: 1200
                  })
                });
                clearTimeout(retryTimeoutId);
                
                if (response && response.ok) {
                  await sendPixExtras(activeEvoUrl, instance, retryInstanceToken, waNumber, pixCode);
                }
              } catch (retryErr) {
                clearTimeout(retryTimeoutId);
                console.error("[EVOLUTION API SELF-HEALING] Retry also failed:", retryErr);
                throw new Error(`Falha no WhatsApp (Autocura): ${retryErr.message || 'Sem conexão com a Evolution API.'}`);
              }
            } else {
              console.error("[EVOLUTION API] Connection failed or timed out to send message:", e);
              throw new Error(`Falha no WhatsApp: ${e.message || 'Sem conexão com a Evolution API.'}`);
            }
          }

          if (response && !response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Falha no WhatsApp: Servidor retornou HTTP ${response.status} - ${errData.message || 'Erro desconhecido'}`);
          }
          
          // Self-healing database status: if message sent successfully, the instance is active!
          if (userData && userData.whatsapp_status !== 'connected') {
            run(
              "UPDATE users SET whatsapp_status = 'connected', whatsapp_instance = ?, whatsapp_phone = ?, updated_at = datetime('now') WHERE id = ?",
              [instance, userData.whatsapp_phone || '5511999999999', user.id]
            );
            console.log(`[SELF-HEALING DB] Automatically healed whatsapp_status to connected for user ${user.id}`);
          }
          console.log(`[EVOLUTION API] Successfully sent WhatsApp message to ${waNumber} via instance ${instance}`);
      }
    }

    // 2. Real SMTP Email Dispatches via Hostinger / Nodemailer
    if (finalChannel === 'email' || finalChannel === 'both') {
      try {
        const formattedDate = new Date(charge.due_date).toLocaleDateString('pt-BR');
        
        // Build email HTML template
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 28px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 800; text-decoration: none; letter-spacing: -0.5px; }
    .content { padding: 36px 32px; line-height: 1.6; font-size: 15px; }
    .invoice-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .invoice-title { font-weight: 700; font-size: 15px; margin-bottom: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .invoice-table { width: 100%; border-collapse: collapse; }
    .invoice-label { color: #64748b; padding: 6px 0; font-size: 13.5px; }
    .invoice-value { color: #0f172a; font-weight: 700; text-align: right; padding: 6px 0; font-size: 13.5px; }
    .pix-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px; margin-top: 16px; text-align: center; }
    .pix-title { font-size: 12px; font-weight: 700; color: #047857; margin-bottom: 4px; text-transform: uppercase; }
    .pix-key { font-family: monospace; font-size: 13.5px; color: #065f46; word-break: break-all; font-weight: bold; }
    .footer { padding: 24px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">🐍 Cobbra</span>
    </div>
    <div class="content">
      <p style="margin-top: 0;">Olá, <strong>${client.name}</strong>,</p>
      
      <p style="color: #334155; margin-bottom: 24px; white-space: pre-line;">${message}</p>
      
      <div class="invoice-card">
        <div class="invoice-title">Detalhamento do Lançamento</div>
        <table class="invoice-table">
          <tr>
            <td class="invoice-label">Descrição:</td>
            <td class="invoice-value">${charge.description || 'Cobrança Geral'}</td>
          </tr>
          <tr>
            <td class="invoice-label">Vencimento:</td>
            <td class="invoice-value">${formattedDate}</td>
          </tr>
          ${delayDays > 0 && interestApplied > 0 ? `
          <tr>
            <td class="invoice-label">Valor Original:</td>
            <td class="invoice-value">R$ ${charge.amount.toFixed(2).replace('.', ',')}</td>
          </tr>
          <tr>
            <td class="invoice-label">Juros por Atraso (${delayDays} dias):</td>
            <td class="invoice-value" style="color: #ef4444;">+ R$ ${interestApplied.toFixed(2).replace('.', ',')}</td>
          </tr>
          ` : ''}
          <tr>
            <td class="invoice-label" style="border-top: 1px dashed #e2e8f0; padding-top: 10px;">Valor Total Atualizado:</td>
            <td class="invoice-value" style="border-top: 1px dashed #e2e8f0; padding-top: 10px; color: #10b981; font-size: 17px; font-weight: 800;">R$ ${updatedAmount.toFixed(2).replace('.', ',')}</td>
          </tr>
        </table>
        
        ${pixCode ? `
        <div class="pix-box" style="margin-top: 24px; padding: 20px; background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; text-align: center;">
          <div class="pix-title" style="font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Pagar via Pix (Liberação Imediata)</div>
          
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCode)}" alt="QR Code Pix" style="margin: 12px auto; display: block; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(22, 101, 52, 0.08); width: 180px; height: 180px; border-radius: 8px;" />
          
          <p style="font-size: 12px; color: #15803d; margin: 12px 0 6px 0; font-weight: 600;">Código Pix Copia e Cola:</p>
          <div style="font-family: monospace; font-size: 11.5px; color: #166534; background: #ffffff; border: 1px dashed #86efac; border-radius: 8px; padding: 12px; word-break: break-all; text-align: center; line-height: 1.4; user-select: all;" title="Clique para selecionar e copiar">${pixCode}</div>
          <p style="font-size: 11px; color: #15803d; margin: 6px 0 0 0; font-style: italic; opacity: 0.8;">Dica: Toque/clique no código acima para selecionar e copiar no seu celular</p>
        </div>
        ` : user.pix_key ? `
        <div class="pix-box" style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
          <div class="pix-title" style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Chave Pix para Pagamento (${user.pix_key_type?.toUpperCase()})</div>
          <div class="pix-key" style="font-family: monospace; font-size: 14px; color: #0f172a; word-break: break-all; font-weight: bold;">${user.pix_key}</div>
        </div>
        ` : ''}
      </div>
      
      <p style="font-size: 12.5px; color: #64748b; text-align: center; margin-top: 24px;">
        O pagamento por Pix é liquidado de forma imediata e 100% automática.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Este lembrete profissional foi emitido por <strong>${user.business_name || user.name}</strong> via Cobbra.</p>
      <p style="margin: 6px 0 0 0;">Dúvidas? Entre em contato diretamente pelo WhatsApp: ${user.phone || ''}</p>
    </div>
  </div>
</body>
</html>
        `;

        await sendEmail({
          to: client.email,
          subject: `Lembrete de Cobrança — ${charge.description || 'Fatura'}`,
          html: htmlBody
        });
        console.log(`[SMTP MAILER] Successfully dispatched reminder email to client ${client.email}`);
      } catch (err) {
        console.error("[SMTP MAILER EXCEPTION] Failed to dispatch email reminder:", err);
        throw new Error(`Falha no E-mail (SMTP): ${err.message || 'Erro de conexão ou credenciais inválidas com a Hostinger.'}`);
      }
    }

    // Update charge
    run("UPDATE charges SET status = 'reminder_sent', reminders_sent = reminders_sent + 1, updated_at = datetime('now') WHERE id = ?", [charge_id]);

    // Log activity
    run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'reminder_sent', 'reminder', id, `Lembrete ${finalChannel} enviado para ${client.name}`]);

    const reminder = queryOne('SELECT * FROM reminders WHERE id = ?', [id]);
    return Response.json({ reminder }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
