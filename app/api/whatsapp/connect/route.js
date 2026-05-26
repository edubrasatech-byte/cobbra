import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, generateId } from '@/lib/db';

// GET /api/whatsapp/connect - Get status or generate QR Code
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const userData = queryOne(
      'SELECT whatsapp_status, whatsapp_phone, whatsapp_instance FROM users WHERE id = ?',
      [user.id]
    );

    let status = userData?.whatsapp_status || 'disconnected';
    const phone = userData?.whatsapp_phone || null;
    const instance = userData?.whatsapp_instance || `cobbra_inst_${user.id.substring(0, 8)}`;

    if (status === 'disconnected') {
      return Response.json({ status: 'disconnected', phone: null, instance: null });
    }

    let qrCode = null;
    let qrError = null;
    const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
    const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN || process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_GLOBAL_API_KEY || process.env.EVOLUTION_API_KEY;

    if (!evoUrl || !evoToken) {
      qrError = 'Evolution API não configurada nas variáveis de ambiente do servidor (EVOLUTION_API_URL / EVOLUTION_API_TOKEN).';
    } else {
      try {
        // Clean trailing slash from evoUrl if present
        const baseUrl = evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl;

        // Check if the instance already has an open/active connection
        const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
          headers: { 'apikey': evoToken }
        });

        if (stateRes.ok) {
          const stateData = await stateRes.json();
          const isConnected = stateData?.instance?.state === 'open';

          if (isConnected) {
            status = 'connected';
            run(
              "UPDATE users SET whatsapp_status = 'connected', whatsapp_instance = ?, updated_at = datetime('now') WHERE id = ?",
              [instance, user.id]
            );
            return Response.json({ status: 'connected', phone, instance });
          }
        }

        // If not connected, make sure the instance exists or create it
        await fetch(`${baseUrl}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evoToken },
          body: JSON.stringify({ instanceName: instance, qrcode: true })
        });

        // Request a connection QR Code from Evolution API
        const connectRes = await fetch(`${baseUrl}/instance/connect/${instance}`, {
          headers: { 'apikey': evoToken }
        });

        if (connectRes.ok) {
          const connectData = await connectRes.json();
          qrCode = connectData?.base64 || connectData?.code || null;
        }

        if (!qrCode) {
          qrError = 'Servidor Evolution não retornou QR Code. Tente reiniciar a conexão.';
        }
      } catch (e) {
        console.error("[EVOLUTION API ERROR]:", e);
        qrError = `Erro de comunicação com a VPS em "${baseUrl}". Detalhes: ${e.message}`;
      }
    }

    if (status === 'connected') {
      return Response.json({ status, phone, instance });
    }

    return Response.json({
      status,
      phone,
      instance,
      qrCode,
      error: qrError
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/whatsapp/connect - Trigger connect start or simulated scan connection
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { phone, action } = body;
    const instance = `cobbra_inst_${user.id.substring(0, 8)}`;

    if (action === 'start' || !phone) {
      // START NEW CONNECTION
      run(
        "UPDATE users SET whatsapp_status = 'scanning', whatsapp_instance = ?, updated_at = datetime('now') WHERE id = ?",
        [instance, user.id]
      );

      let qrCode = null;
      let qrError = null;
      const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
      const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN || process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_GLOBAL_API_KEY || process.env.EVOLUTION_API_KEY;

      if (!evoUrl || !evoToken) {
        qrError = 'Evolution API não configurada nas variáveis de ambiente do servidor (EVOLUTION_API_URL / EVOLUTION_API_TOKEN).';
      } else {
        try {
          const baseUrl = evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl;

          // Check connection state
          const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
            headers: { 'apikey': evoToken }
          });

          let isConnected = false;
          if (stateRes.ok) {
            const stateData = await stateRes.json();
            isConnected = stateData?.instance?.state === 'open';
          }

          if (isConnected) {
            run(
              "UPDATE users SET whatsapp_status = 'connected', whatsapp_instance = ?, updated_at = datetime('now') WHERE id = ?",
              [instance, user.id]
            );
            return Response.json({ success: true, status: 'connected', instance });
          }

          await fetch(`${baseUrl}/instance/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evoToken },
            body: JSON.stringify({ instanceName: instance, qrcode: true })
          });

          const connectRes = await fetch(`${baseUrl}/instance/connect/${instance}`, {
            headers: { 'apikey': evoToken }
          });

          if (connectRes.ok) {
            const connectData = await connectRes.json();
            qrCode = connectData?.base64 || connectData?.code || null;
          }

          if (!qrCode) {
            qrError = 'Servidor Evolution não retornou QR Code. Tente reiniciar a conexão.';
          }
        } catch (e) {
          console.error("[EVOLUTION API START ERROR]:", e);
          qrError = `Erro de comunicação com a VPS em "${baseUrl}". Detalhes: ${e.message}`;
        }
      }

      return Response.json({ success: true, status: 'scanning', qrCode, error: qrError, instance });
    }

    // SIMULATED PAIRING
    const cleanPhone = phone || user.phone || '5511999999999';

    // Simulate Evolution API webhook callback that switches status to connected
    run(
      `UPDATE users SET 
        whatsapp_status = 'connected', 
        whatsapp_phone = ?, 
        whatsapp_instance = ?,
        updated_at = datetime('now') 
       WHERE id = ?`,
      [cleanPhone, instance, user.id]
    );

    // Log activity
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'whatsapp_connected', 'user', user.id, `WhatsApp pareado com sucesso no número ${cleanPhone}`]
    );

    // In-app Notification
    run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'success', '📱 WhatsApp Conectado!', `Seu número ${cleanPhone} foi conectado com sucesso pelo nosso disparador central.`, 'user', user.id]
    );

    return Response.json({ success: true, status: 'connected', phone: cleanPhone, instance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/whatsapp/connect - Disconnect WhatsApp instance
export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    // Retrieve active connection info
    const userData = queryOne('SELECT whatsapp_instance, whatsapp_phone FROM users WHERE id = ?', [user.id]);
    const phone = userData?.whatsapp_phone || '';
    const instance = userData?.whatsapp_instance || `cobbra_inst_${user.id.substring(0, 8)}`;

    const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
    const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN;

    if (evoUrl && evoToken) {
      try {
        const baseUrl = evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl;
        // Terminate session on the central VPS Evolution API server
        await fetch(`${baseUrl}/instance/delete/${instance}`, {
          method: 'DELETE',
          headers: { 'apikey': evoToken }
        });
      } catch (e) {
        console.error("[EVOLUTION API DELETE ERROR]:", e);
      }
    }

    // Disconnect in database
    run(
      `UPDATE users SET 
        whatsapp_status = 'disconnected', 
        whatsapp_phone = NULL, 
        whatsapp_instance = NULL,
        updated_at = datetime('now') 
       WHERE id = ?`,
      [user.id]
    );

    // Log activity
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'whatsapp_disconnected', 'user', user.id, `WhatsApp despareado do número ${phone}`]
    );

    // Notification
    run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'info', '📱 WhatsApp Desconectado', `Sessão do número ${phone} foi despareada com sucesso nas configurações.`, 'user', user.id]
    );

    return Response.json({ success: true, status: 'disconnected' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
