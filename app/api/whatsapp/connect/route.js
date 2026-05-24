import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne } from '@/lib/db';

// GET /api/whatsapp/connect - Get status or generate QR Code
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const userData = queryOne(
      'SELECT whatsapp_status, whatsapp_phone, whatsapp_instance FROM users WHERE id = ?',
      [user.id]
    );

    const status = userData?.whatsapp_status || 'disconnected';
    const phone = userData?.whatsapp_phone || null;
    const instance = userData?.whatsapp_instance || `cobbra_inst_${user.id.substring(0, 8)}`;

    if (status === 'connected') {
      return Response.json({ status, phone, instance });
    }

    // Generate dynamic mock Base64 QR Code representing standard connect code
    // This allows perfect local simulation without external API calls
    const mockQrCode = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250"><rect width="250" height="250" fill="white"/><g fill="%230f172a"><rect x="20" y="20" width="40" height="40"/><rect x="20" y="70" width="10" height="10"/><rect x="50" y="70" width="10" height="10"/><rect x="20" y="90" width="40" height="40"/><rect x="70" y="20" width="10" height="10"/><rect x="90" y="20" width="40" height="40"/><rect x="90" y="70" width="10" height="10"/><rect x="120" y="70" width="10" height="10"/><rect x="90" y="90" width="40" height="40"/><rect x="140" y="20" width="40" height="40"/><rect x="140" y="70" width="10" height="10"/><rect x="170" y="70" width="10" height="10"/><rect x="140" y="90" width="40" height="40"/><rect x="190" y="20" width="10" height="10"/><rect x="210" y="20" width="20" height="20"/><rect x="190" y="50" width="30" height="10"/><rect x="190" y="70" width="40" height="40"/><g fill="%2310b981"><rect x="30" y="30" width="20" height="20"/><rect x="100" y="30" width="20" height="20"/><rect x="150" y="30" width="20" height="20"/><rect x="30" y="100" width="20" height="20"/><rect x="100" y="100" width="20" height="20"/><rect x="150" y="100" width="20" height="20"/></g></g></svg>';

    // If there is a real centralized Evolution API server, we could make a fetch call here:
    /*
    const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
    const evoToken = process.env.EVOLUTION_API_GLOBAL_TOKEN;
    if (evoUrl && evoToken) {
      try {
        const createRes = await fetch(`${evoUrl}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evoToken },
          body: JSON.stringify({ instanceName: instance, token: user.id, qrcode: true })
        });
        const createData = await createRes.json();
        // and fetch QR Code from the Evolution instance endpoint
      } catch (e) {
        console.error("Evolution Server Error", e);
      }
    }
    */

    return Response.json({
      status,
      phone,
      instance,
      qrCode: mockQrCode
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/whatsapp/connect - Trigger simulated scan connection
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { phone } = body;
    const cleanPhone = phone || user.phone || '5511999999999';

    // Simulate Evolution API webhook callback that switches status to connected
    const instance = `cobbra_inst_${user.id.substring(0, 8)}`;
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
