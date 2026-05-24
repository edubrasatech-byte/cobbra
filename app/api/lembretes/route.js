import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';

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

    const { charge_id, channel, message } = await request.json();
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

    const id = generateId();
    run(
      `INSERT INTO reminders (id, charge_id, user_id, client_id, channel, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
      [id, charge_id, user.id, charge.client_id, finalChannel, message]
    );

    // 1. Dynamic Real Dispatches via central Evolution API for WhatsApp
    if (finalChannel === 'whatsapp' || finalChannel === 'both') {
      const userData = queryOne('SELECT whatsapp_status, whatsapp_instance, whatsapp_phone FROM users WHERE id = ?', [user.id]);
      const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
      const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN;
      
      const isUserConnected = userData?.whatsapp_status === 'connected';
      const instance = isUserConnected ? userData.whatsapp_instance : (process.env.EVOLUTION_DEFAULT_INSTANCE || 'cobbra_master');
      
      if (evoUrl && evoToken && (isUserConnected || process.env.EVOLUTION_DEFAULT_INSTANCE || 'cobbra_master')) {
        if (client.phone) {
          // Clean non-digits and format for WhatsApp (55 prefix for Brazil if missing)
          const cleanPhone = client.phone.replace(/\D/g, '');
          const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
            
            await fetch(`${evoUrl}/message/sendText/${instance}`, {
              method: 'POST',
              signal: controller.signal,
              headers: { 
                'Content-Type': 'application/json',
                'apikey': evoToken
              },
              body: JSON.stringify({
                number: waNumber,
                options: { delay: 1200, linkPreview: true },
                textMessage: { text: message }
              })
            });
            clearTimeout(timeoutId);
            console.log(`[EVOLUTION API] Successfully sent WhatsApp message to ${waNumber} via instance ${instance}`);
          } catch (e) {
            console.error("[EVOLUTION API] Connection failed or timed out to send message:", e);
            throw new Error(`Falha no WhatsApp: ${e.message || 'Sem conexão com a Evolution API.'}`);
          }
        }
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
          <tr>
            <td class="invoice-label" style="border-top: 1px dashed #e2e8f0; padding-top: 10px;">Valor Total:</td>
            <td class="invoice-value" style="border-top: 1px dashed #e2e8f0; padding-top: 10px; color: #10b981; font-size: 17px; font-weight: 800;">R$ ${charge.amount.toFixed(2).replace('.', ',')}</td>
          </tr>
        </table>
        
        ${user.pix_key ? `
        <div class="pix-box">
          <div class="pix-title">Chave Pix para Pagamento (${user.pix_key_type?.toUpperCase()})</div>
          <div class="pix-key">${user.pix_key}</div>
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
