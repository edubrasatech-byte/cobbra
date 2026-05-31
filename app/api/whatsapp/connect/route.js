import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, generateId } from '@/lib/db';
import { getInstanceToken, getEvolutionConfig, resilientFetch } from '@/lib/evolution';

// getInstanceToken is now centralized in @/lib/evolution.js


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

    const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
    const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN || process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_GLOBAL_API_KEY || process.env.EVOLUTION_API_KEY;
    let baseUrl = evoUrl ? (evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl) : '';

    if (!evoUrl || !evoToken) {
      return Response.json({
        status,
        phone,
        instance,
        error: 'Evolution API não configurada nas variáveis de ambiente do servidor.'
      });
    }

    try {
      // 1. Check if the instance already has an open/active connection on VPS
      const instanceToken = await getInstanceToken(baseUrl, evoToken, instance) || evoToken;
      let stateRes;
      try {
        stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
          headers: { 'apikey': instanceToken }
        });
      } catch (fetchErr) {
        if (baseUrl.includes(':8080')) {
          baseUrl = baseUrl.replace(':8080', '');
          console.log(`[SELF-HEALING GET]: Port 8080 failed. Retrying on port 80: ${baseUrl}`);
          stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
            headers: { 'apikey': instanceToken }
          });
        } else {
          throw fetchErr;
        }
      }

      if (stateRes && stateRes.ok) {
        const stateData = await stateRes.json();
        const isConnected = stateData?.instance?.state === 'open';

        if (isConnected) {
          status = 'connected';
          // Heal the database status!
          run(
            "UPDATE users SET whatsapp_status = 'connected', whatsapp_instance = ?, whatsapp_phone = ?, updated_at = datetime('now') WHERE id = ?",
            [instance, phone || '5511999999999', user.id]
          );
          return Response.json({ status: 'connected', phone: phone || '5511999999999', instance });
        } else if (status === 'connected') {
          // Heal the database status: if db status is 'connected' but VPS is not open, then it is disconnected!
          status = 'disconnected';
          run(
            "UPDATE users SET whatsapp_status = 'disconnected', whatsapp_phone = NULL, whatsapp_instance = NULL, updated_at = datetime('now') WHERE id = ?",
            [user.id]
          );
          return Response.json({ status: 'disconnected', phone: null, instance: null });
        }
      }
    } catch (e) {
      console.error("[EVOLUTION API GET STATUS ERROR]:", e);
    }

    // If it's not connected on VPS and database status is disconnected, return disconnected directly
    if (status === 'disconnected') {
      return Response.json({ status: 'disconnected', phone: null, instance: null });
    }

    // Otherwise, if database status is scanning/connected (but VPS was not open), try to fetch the QR Code to continue
    let qrCode = null;
    let qrError = null;

    try {
      // Make sure the instance exists or create it
      await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evoToken },
        body: JSON.stringify({ instanceName: instance, integration: "WHATSAPP-BAILEYS", qrcode: true })
      });

      const instanceToken = await getInstanceToken(baseUrl, evoToken, instance) || evoToken;
      // Request a connection QR Code from Evolution API
      const connectRes = await fetch(`${baseUrl}/instance/connect/${instance}`, {
        headers: { 'apikey': instanceToken }
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

// POST /api/whatsapp/connect - Trigger connect start
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { action } = body;
    const instance = `cobbra_inst_${user.id.substring(0, 8)}`;

    // START NEW CONNECTION
    run(
      "UPDATE users SET whatsapp_status = 'scanning', whatsapp_instance = ?, updated_at = datetime('now') WHERE id = ?",
      [instance, user.id]
    );

    let qrCode = null;
    let qrError = null;
    const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
    const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN || process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_GLOBAL_API_KEY || process.env.EVOLUTION_API_KEY;
    let baseUrl = evoUrl ? (evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl) : '';

    if (!evoUrl || !evoToken) {
      qrError = 'Evolution API não configurada nas variáveis de ambiente do servidor (EVOLUTION_API_URL / EVOLUTION_API_TOKEN).';
    } else {
      try {
        // Check connection state
        const instanceToken = await getInstanceToken(baseUrl, evoToken, instance) || evoToken;
        let stateRes;
        try {
          stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
            headers: { 'apikey': instanceToken }
          });
        } catch (fetchErr) {
          if (baseUrl.includes(':8080')) {
            baseUrl = baseUrl.replace(':8080', '');
            console.log(`[SELF-HEALING POST]: Port 8080 failed. Retrying on port 80: ${baseUrl}`);
            stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
              headers: { 'apikey': instanceToken }
            });
          } else {
            throw fetchErr;
          }
        }

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
          body: JSON.stringify({ instanceName: instance, integration: "WHATSAPP-BAILEYS", qrcode: true })
        });

        const connectRes = await fetch(`${baseUrl}/instance/connect/${instance}`, {
          headers: { 'apikey': instanceToken }
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
        const instanceToken = await getInstanceToken(baseUrl, evoToken, instance) || evoToken;
        // Terminate session on the central VPS Evolution API server
        await fetch(`${baseUrl}/instance/delete/${instance}`, {
          method: 'DELETE',
          headers: { 'apikey': instanceToken }
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
