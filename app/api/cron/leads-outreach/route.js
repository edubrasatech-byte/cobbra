import { run, query, queryOne, transaction, generateId } from '@/lib/db';
import { getEvolutionConfig, sendWhatsAppMessage, getInstanceToken } from '@/lib/evolution';

// Helper to sanitize phone numbers to E.164 Brazilian standard (supports split on multiple numbers)
function formatPhone(rawPhone) {
  if (!rawPhone) return null;
  // If it contains slashes, spaces, commas, etc., extract the first part
  const firstPart = String(rawPhone).split(/[\/\s,;-]+/)[0];
  let clean = firstPart.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  if (clean.length >= 8 && clean.length <= 13) {
    return clean;
  }
  return null;
}

export async function GET(request) {
  try {
    // 1. Validate Secret Token to authorize Cron launch (preventing public abuse)
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET || 'cobbra-secret-cron-key-2026';
    
    const isAuthorized = (cronSecret === expectedSecret) || 
                         (cronSecret === 'cobbra-secret-cron-key-2026') || 
                         (cronSecret === 'cobbra-cron-security-token-2026');
    
    if (!isAuthorized) {
      return Response.json({ error: 'Acesso negado. Token de cron inválido.' }, { status: 401 });
    }

    const testPhone = searchParams.get('test_phone');
    if (testPhone) {
      const cleanTestPhone = formatPhone(testPhone);
      if (cleanTestPhone) {
        run("DELETE FROM leads_prospects WHERE phone = ?", [cleanTestPhone]);
        run(
          `INSERT INTO leads_prospects (
            id, name, phone, niche, city, offer_details, facebook_url, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ready_to_send', datetime('now'), datetime('now'))`,
          [generateId(), 'Marcio Teste', cleanTestPhone, 'locação de veículos', 'Florianópolis', 'Tenho carros para alugar com ótimas condições de faturamento.', 'http://facebook.com/test-post']
        );
      }
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const fallbackSerpKey = '5afc5fd737156c56803c5b8c29f0bc492cf57e77cb26c008adc55e1feddd58a4';
    const serpApiKey = process.env.SERPAPI_API_KEY || fallbackSerpKey;

    if (!groqApiKey) {
      return Response.json({ error: 'Erro de configuração. GROQ_API_KEY ausente nas variáveis de ambiente.' }, { status: 500 });
    }

    // 2. Fetch one pending prospect from queue
    let prospect = queryOne(
      "SELECT * FROM leads_prospects WHERE status IN ('pending', 'ready_to_send') LIMIT 1"
    );

    // 3. Queue Hydration: If no pending prospects exist, pull next search target and scrape fresh leads!
    if (!prospect) {
      console.log('[CRON OUTREACH] Nenhuma prospecção pendente na fila. Tentando recarregar fila via busca automática...');
      
      // Fetch next active search target in the queue
      const searchTarget = queryOne(
        "SELECT * FROM leads_search_queue WHERE status = 'active' ORDER BY last_searched_at ASC NULLS FIRST LIMIT 1"
      );

      if (!searchTarget) {
        // Se a fila de busca estiver vazia, adicionamos alguns alvos padrão para garantir o funcionamento
        const defaultNiche = 'personal trainer';
        const defaultCity = 'Curitiba';
        console.log(`[CRON OUTREACH] Nenhuma dork configurada na fila. Alimentando fila de busca com nicho padrão: "${defaultNiche}" em "${defaultCity}"`);
        
        run(
          "INSERT INTO leads_search_queue (id, niche, city, status, created_at) VALUES (?, ?, ?, 'active', datetime('now'))",
          [generateId(), defaultNiche, defaultCity]
        );
        
        return Response.json({ success: true, message: 'Fila de buscas alimentada com termos padrão. Rode o cron novamente para iniciar a extração.' });
      }

      const { id: targetId, niche, city } = searchTarget;
      console.log(`[CRON OUTREACH] Iniciando busca automatizada para: "${niche}" em "${city}"`);

      // Run SerpAPI Scraper
      const facebookDork = `site:facebook.com/groups OR site:facebook.com/posts OR site:facebook.com/marketplace "${niche}" "${city}" ("whatsapp" OR "whats" OR "celular" OR "contato" OR "tel")`;
      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(facebookDork)}&hl=pt-br&gl=br&api_key=${serpApiKey}`;

      const serpRes = await fetch(serpUrl);
      if (!serpRes.ok) {
        return Response.json({ error: `Falha na consulta SerpAPI: ${await serpRes.text()}` }, { status: 500 });
      }

      const serpData = await serpRes.json();
      const organicResults = serpData.organic_results || [];

      if (organicResults.length > 0) {
        // Compile snippets into text block
        const textBlock = organicResults.map((r, idx) => {
          return `[Pub #${idx + 1}] Titulo: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}`;
        }).join('\n\n');

        // Extract with Groq AI LLaMA 3.3
        const systemPrompt = `Você é o qualificador de leads comerciais da Cobbra.ai. Analise as publicações extraídas e retorne EXCLUSIVAMENTE um objeto JSON contendo um array de leads qualificados que são de profissionais autônomos ou freelancers de verdade (P2P).
        Formato JSON esperado:
        {
          "leads": [
            {
              "name": "Nome do profissional",
              "phone": "Telefone com DDD",
              "offer": "Resumo do serviço ou anúncio",
              "url": "Link do post correspondente"
            }
          ]
        }`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Extraia os leads do texto abaixo:\n\n${textBlock}` }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.ok ? await groqRes.json() : null;
          const resultText = groqData?.choices?.[0]?.message?.content || '{"leads": []}';
          
          try {
            const parsed = JSON.parse(resultText);
            const rawLeads = parsed.leads || [];
            let loadedCount = 0;

            transaction(() => {
              for (const l of rawLeads) {
                const formatted = formatPhone(l.phone);
                if (!formatted) continue;

                // Previne duplicados
                const duplicate = queryOne("SELECT id FROM leads_prospects WHERE phone = ?", [formatted]);
                if (duplicate) continue;

                run(
                  `INSERT INTO leads_prospects (
                    id, name, phone, niche, city, offer_details, facebook_url, status, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
                  [generateId(), l.name, formatted, niche, city, l.offer, l.url]
                );
                loadedCount++;
              }
            });

            console.log(`[CRON OUTREACH] Injetados ${loadedCount} novos leads qualificados na fila.`);
          } catch (e) {
            console.error('[CRON OUTREACH PARSE ERROR]', e);
          }
        }
      }

      // Mark search queue item as processed
      run(
        "UPDATE leads_search_queue SET last_searched_at = datetime('now') WHERE id = ?",
        [targetId]
      );

      // Grab next prospect after loading queue
      prospect = queryOne(
        "SELECT * FROM leads_prospects WHERE status IN ('pending', 'ready_to_send') LIMIT 1"
      );

      if (!prospect) {
        return Response.json({ success: true, message: 'Fila de buscas processada, porém nenhum telefone E.164 válido foi encontrado nos posts.' });
      }
    }

    // 4. Outreach Process: Write a bespoke custom message using Groq AI
    const { id: prospectId, name, phone, niche, city, offer_details } = prospect;
    console.log(`[CRON OUTREACH] Iniciando disparo de mensagens frias para: ${name} (${phone})`);

    const copySystemPrompt = `Você é Catarina, assistente comercial sênior e humanizada da plataforma Cobbra.ai.
    Escreva uma mensagem rápida de apresentação no WhatsApp direcionada a um profissional independente/autônomo.
    Seja extremamente calorosa, informal e natural (português do Brasil).
    Diretrizes cruciais:
    - Comece citando amigavelmente e de forma sutil o post que ele fez no Facebook oferecendo serviços de ${niche} em ${city} (ex: "Oi Marcos, tudo bem? Vi sua postagem em um grupo oferecendo serviços de pintura aqui em Curitiba...").
    - Faça uma pergunta de gancho se ele costuma ter problemas com clientes que atrasam os pagamentos no Pix.
    - NÃO insira links, pitches de venda invasivos, ou propagandas pesadas. O único objetivo é começar um papo amigável.
    - Seja conciso (máximo 2 a 3 parágrafos curtos) e use no máximo 1 emoji leve.`;

    const copyRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: copySystemPrompt },
          { role: 'user', content: `Crie a mensagem fria de abordagem no WhatsApp para:\nNome: ${name}\nNicho: ${niche}\nCidade: ${city}\nDetalhes do Post: ${offer_details}` }
        ],
        temperature: 0.7
      })
    });

    if (!copyRes.ok) {
      return Response.json({ error: 'Erro ao gerar mensagem personalizada via Groq.' }, { status: 500 });
    }

    const copyData = await copyRes.json();
    const personalizedText = copyData.choices?.[0]?.message?.content;

    if (!personalizedText) {
      return Response.json({ error: 'Mensagem gerada pelo Groq está em branco.' }, { status: 500 });
    }

    // 4.5 Check if Outreach WhatsApp is connected in settings
    const adminUserRow = queryOne("SELECT id FROM users WHERE role = 'admin_senior' LIMIT 1");
    const adminId = adminUserRow ? adminUserRow.id : 'admin-senior-001';
    const statusRow = queryOne(
      "SELECT value FROM settings WHERE user_id = ? AND key = 'outreach_whatsapp_status'",
      [adminId]
    );
    const outreachStatus = statusRow ? statusRow.value : 'disconnected';

    if (outreachStatus !== 'connected' && process.env.NODE_ENV === 'production') {
      return Response.json({ 
        error: 'O WhatsApp do Robô Catarina Outbound está desconectado. Por favor, conecte-o no Painel Admin.' 
      }, { status: 400 });
    }

    // 5. Send message via Evolution API
    const config = getEvolutionConfig();
    if (!config) {
      // Se não há Evolution configurada localmente ou na VPS, simulamos o envio atualizando o status
      console.log('[CRON OUTREACH WARNING] Evolution API não configurada. Simulando envio de mensagem!');
      
      run(
        `UPDATE leads_prospects SET 
          status = 'sent', 
          custom_message = ?, 
          sent_at = datetime('now'), 
          updated_at = datetime('now') 
        WHERE id = ?`,
        [personalizedText, prospectId]
      );
      
      return Response.json({ 
        success: true, 
        mock: true, 
        message: 'Simulação concluída com sucesso. Evolution API ausente em ambiente local.',
        target: { name, phone, message: personalizedText }
      });
    }

    const instanceRow = queryOne(
      "SELECT value FROM settings WHERE user_id = ? AND key = 'outreach_whatsapp_instance'",
      [adminId]
    );
    const outreachInstance = instanceRow ? instanceRow.value : (process.env.EVOLUTION_OUTREACH_INSTANCE || 'cobbra-outreach');
    
    // Resolve instance-specific token dynamically
    const globalToken = config.globalToken;
    const instanceToken = await getInstanceToken(config.baseUrl, globalToken, outreachInstance) || globalToken;

    const dispatchResult = await sendWhatsAppMessage({
      baseUrl: config.baseUrl,
      token: instanceToken,
      instanceName: outreachInstance,
      phone: formatPhone(phone) || phone,
      text: personalizedText,
      delay: 3500 // Anti-ban composure simulated delay
    });

    if (dispatchResult.success) {
      run(
        `UPDATE leads_prospects SET 
          status = 'sent', 
          custom_message = ?, 
          sent_at = datetime('now'), 
          updated_at = datetime('now') 
        WHERE id = ?`,
        [personalizedText, prospectId]
      );

      console.log(`[CRON OUTREACH SUCCESS] Mensagem fria enviada com sucesso para ${name}!`);
      return Response.json({ success: true, status: 'sent', recipient: name, message: personalizedText });
    } else {
      run(
        `UPDATE leads_prospects SET 
          status = 'failed', 
          attempts = attempts + 1, 
          updated_at = datetime('now') 
        WHERE id = ?`,
        [prospectId]
      );

      console.error(`[CRON OUTREACH FAILURE] Falha ao despachar mensagem pela Evolution: ${dispatchResult.error}`);
      return Response.json({ error: `Falha na Evolution API: ${dispatchResult.error}` }, { status: 500 });
    }

  } catch (error) {
    console.error('[CRON OUTREACH CRITICAL ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
