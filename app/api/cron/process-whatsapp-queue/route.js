import { query, queryOne, run, generateId } from '@/lib/db';
import { getInstanceToken } from '@/lib/evolution';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || searchParams.get('token');
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || 'cobbra-cron-security-token-2026';

    const isAuthorized = (secret === expectedSecret) || (authHeader === `Bearer ${expectedSecret}`);
    if (!isAuthorized) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Buscar mensagens prontas para envio
    // Status 'pending' OU status 'failed' que ainda tenham tentativas disponíveis e já passou o tempo do next_attempt_at
    const pendingMessages = query(
      `SELECT * FROM whatsapp_queue 
       WHERE status = 'pending' 
          OR (status = 'failed' AND attempts < max_attempts AND (next_attempt_at IS NULL OR next_attempt_at <= datetime('now')))
       ORDER BY created_at ASC 
       LIMIT 15`
    );

    if (pendingMessages.length === 0) {
      return Response.json({ success: true, message: 'Nenhuma mensagem pendente na fila.' });
    }

    const evolutionUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
    const evolutionToken = process.env.EVOLUTION_API_GLOBAL_TOKEN || process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_GLOBAL_API_KEY || process.env.EVOLUTION_API_KEY;

    let sentCount = 0;
    let failedCount = 0;
    const logDetails = [];

    for (const msg of pendingMessages) {
      // 2. Travar mensagem como 'processing' para evitar processamento concorrente
      run("UPDATE whatsapp_queue SET status = 'processing', updated_at = datetime('now') WHERE id = ?", [msg.id]);

      // 3. Determinar instância do usuário ou fallback
      const userData = queryOne("SELECT whatsapp_instance, whatsapp_phone FROM users WHERE id = ?", [msg.user_id]);
      const instance = userData?.whatsapp_instance || 'cobroo-session';

      if (!evolutionUrl || !evolutionToken) {
        // Fallback de Simulação se não configurado
        run("UPDATE whatsapp_queue SET status = 'sent', attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?", [msg.id]);
        sentCount++;
        logDetails.push({ id: msg.id, status: 'simulated_sent', details: 'Evolution API não configurada no ambiente.' });
        continue;
      }

      try {
        let activeEvoUrl = evolutionUrl;
        let response;
        
        try {
          const instanceToken = await getInstanceToken(activeEvoUrl, evolutionToken, instance) || evolutionToken;
          response = await fetch(`${activeEvoUrl}/message/sendText/${instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': instanceToken
            },
            body: JSON.stringify({
              number: msg.phone,
              text: msg.message,
              delay: 1000
            })
          });
        } catch (fetchErr) {
          // Self-healing: Se falhar na porta 8080, tentar na porta padrão 80
          if (activeEvoUrl.includes(':8080')) {
            activeEvoUrl = activeEvoUrl.replace(':8080', '');
            console.log(`[QUEUE SELF-HEALING]: Retrying on port 80: ${activeEvoUrl}`);
            
            const retryInstanceToken = await getInstanceToken(activeEvoUrl, evolutionToken, instance) || evolutionToken;
            response = await fetch(`${activeEvoUrl}/message/sendText/${instance}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': retryInstanceToken
              },
              body: JSON.stringify({
                number: msg.phone,
                text: msg.message,
                delay: 1000
              })
            });
          } else {
            throw fetchErr;
          }
        }

        if (response && response.ok) {
          // 4. Sucesso: Marcar como enviada
          run(
            `UPDATE whatsapp_queue 
             SET status = 'sent', attempts = attempts + 1, error_message = NULL, updated_at = datetime('now') 
             WHERE id = ?`,
            [msg.id]
          );
          sentCount++;
          logDetails.push({ id: msg.id, status: 'sent', phone: msg.phone });
        } else {
          // 5. Servidor respondeu com erro
          const errorText = response ? await response.text() : 'Sem resposta do servidor';
          throw new Error(`Evolution API HTTP ${response?.status}: ${errorText}`);
        }

      } catch (err) {
        // 6. Falha: Incrementar tentativa e aplicar backoff exponencial
        const nextAttempts = msg.attempts + 1;
        failedCount++;

        if (nextAttempts >= msg.max_attempts) {
          // Excedeu tentativas máximas
          run(
            `UPDATE whatsapp_queue 
             SET status = 'failed', attempts = ?, error_message = ?, next_attempt_at = NULL, updated_at = datetime('now') 
             WHERE id = ?`,
            [nextAttempts, `[EXCEDEU MÁXIMO DE TENTATIVAS] ${err.message}`, msg.id]
          );
          logDetails.push({ id: msg.id, status: 'failed_permanently', error: err.message });
        } else {
          // Atraso exponencial baseado no número da tentativa: 5 min para a 1ª, 15 min para a 2ª
          const backoffMinutes = nextAttempts === 1 ? 5 : 15;
          run(
            `UPDATE whatsapp_queue 
             SET status = 'failed', attempts = ?, error_message = ?, 
                 next_attempt_at = datetime('now', '+${backoffMinutes} minutes'), updated_at = datetime('now') 
             WHERE id = ?`,
            [nextAttempts, err.message.substring(0, 500), msg.id]
          );
          logDetails.push({ id: msg.id, status: 'retry_scheduled', error: err.message, next_attempt_in: `${backoffMinutes} min` });
        }
      }
    }

    return Response.json({
      success: true,
      processed: pendingMessages.length,
      sent: sentCount,
      failed: failedCount,
      details: logDetails
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
