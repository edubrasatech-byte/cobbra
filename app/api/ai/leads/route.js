import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, transaction, generateId } from '@/lib/db';

// Helper to sanitize and format phone numbers to Brazilian E.164 standard (55...)
function formatWhatsAppNumber(rawPhone) {
  if (!rawPhone || rawPhone.toLowerCase().includes('não') || rawPhone.toLowerCase().includes('encontrado')) {
    return 'Não encontrado';
  }
  
  let clean = rawPhone.replace(/\D/g, '');
  
  // Remove leading 0 if present (e.g. 041... -> 41...)
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  
  // If it's a Brazilian mobile/landline without country code (e.g. 41999999999 or 4133333333)
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  
  if (clean.length >= 8 && clean.length <= 13) {
    return clean;
  }
  return rawPhone;
}

export async function POST(request) {
  try {
    // 1. Strict Administrator Authorization Check
    let user = null;
    try {
      user = getUserFromRequest(request);
    } catch (e) {
      return Response.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
    }

    if (!user || (user.role !== 'admin' && user.role !== 'admin_senior')) {
      return Response.json({ error: 'Acesso negado. Apenas administradores podem gerenciar e extrair leads.' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // --- ACTION: BATCH IMPORT LEADS TO SQLITE ---
    if (action === 'import') {
      const { leads } = body;
      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return Response.json({ error: 'Nenhum lead fornecido para importação.' }, { status: 400 });
      }

      let importedCount = 0;

      transaction(() => {
        for (const lead of leads) {
          const clientId = generateId();
          const cleanPhone = formatWhatsAppNumber(lead.phone);
          
          // Double check if client with this phone already exists for this admin
          const existing = queryOne(
            'SELECT id FROM clients WHERE user_id = ? AND (phone = ? OR name = ?)',
            [user.id, cleanPhone, lead.name]
          );
          if (existing) continue;

          // Insert into clients table
          run(
            `INSERT INTO clients (
              id, user_id, name, email, phone, category, tags, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              clientId,
              user.id,
              lead.name,
              lead.email || null,
              cleanPhone !== 'Não encontrado' ? cleanPhone : null,
              lead.niche || 'Autônomo',
              'prospeccao,radar_ai,groq',
              `Lead autônomo extraído via Groq AI.\n• Oferta/Preço: ${lead.offer_details}\n• Origem: ${lead.facebook_url}`
            ]
          );

          // Log in activity feed
          run(
            'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))',
            [
              generateId(),
              user.id,
              'client_created',
              'client',
              clientId,
              `Cliente "${lead.name}" importado com sucesso via Radar de Prospecção.`
            ]
          );
          importedCount++;
        }
      });

      return Response.json({ success: true, count: importedCount });
    }

    // --- ACTION: ACTIVE SEARCH & EXTRACTION ---
    const { niche, city, customGroqKey, customSerpKey } = body;
    if (!niche || !city) {
      return Response.json({ error: 'Nicho e Cidade são obrigatórios para prospecção.' }, { status: 400 });
    }

    // Chaves de API (com fallbacks)
    const fallbackSerpKey = '5afc5fd737156c56803c5b8c29f0bc492cf57e77cb26c008adc55e1feddd58a4';
    const serpApiKey = customSerpKey || process.env.SERPAPI_API_KEY || fallbackSerpKey;
    const groqApiKey = customGroqKey || process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return Response.json({ 
        error: 'API Key do Groq não encontrada. Configure process.env.GROQ_API_KEY ou envie uma chave de contingência na tela.' 
      }, { status: 400 });
    }

    // Dork de busca focada em capturar grupos de Facebook, posts ou Marketplace do nicho
    const facebookDork = `site:facebook.com/groups OR site:facebook.com/posts OR site:facebook.com/marketplace "${niche}" "${city}" ("whatsapp" OR "whats" OR "celular" OR "contato" OR "tel")`;
    const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(facebookDork)}&hl=pt-br&gl=br&api_key=${serpApiKey}`;

    console.log(`[RADAR LEADS] Consultando SerpAPI para: "${niche}" em "${city}"`);
    const serpRes = await fetch(serpUrl);
    
    if (!serpRes.ok) {
      const errText = await serpRes.text();
      return Response.json({ error: `Erro na SerpAPI: ${errText}` }, { status: serpRes.status });
    }

    const serpData = await serpRes.json();
    const organicResults = serpData.organic_results || [];

    if (organicResults.length === 0) {
      return Response.json({ leads: [], message: 'Nenhuma publicação pública indexada foi encontrada para estes termos.' });
    }

    // Formata os snippets e títulos orgânicos em um bloco de texto estruturado para a IA
    const textBlock = organicResults.map((r, idx) => {
      return `
[Publicação #${idx + 1}]
Título: ${r.title}
Link: ${r.link}
Snippet: ${r.snippet}
      `.trim();
    }).join('\n\n');

    // Prompt de extração estruturada em JSON
    const systemPrompt = `Você é o robô especialista em extração de leads e prospecção ativa da plataforma Cobbra.ai.
Sua missão é analisar textos de publicações, anúncios e grupos de redes sociais e extrair leads estruturados EXCLUSIVAMENTE de autônomos, freelancers e pequenos profissionais liberais independentes (P2P), descartando grandes empresas corporativas.

Retorne EXCLUSIVAMENTE um objeto JSON válido contendo uma chave "leads" mapeando para um array de objetos no formato:
{
  "leads": [
    {
      "name": "Nome da pessoa ou perfil comercial do autônomo",
      "phone": "Telefone ou celular informado (mantenha string original)",
      "niche": "Nicho do profissional (ex: Personal Trainer, Aluguel de Andaime, Pintor)",
      "location": "Cidade e estado de atuação",
      "offer_details": "Condições do serviço, preços ou detalhes de contato citados",
      "facebook_url": "Link exato do post correspondente fornecido no texto",
      "is_autonomous": true
    }
  ]
}

Seja extremamente criterioso na identificação de autônomos e garanta que o JSON retornado seja limpo, sem notas explicativas, sem marcações de markdown ou formatações extras. Apenas o JSON puro!`;

    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    console.log(`[RADAR LEADS] Invocando Groq Llama 3.3 para extração estruturada...`);

    const groqRes = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise e extraia os autônomos do seguinte bloco de dados:\n\n${textBlock}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return Response.json({ error: `Erro na Groq API: ${errText}` }, { status: groqRes.status });
    }

    const groqData = await groqRes.json();
    const resultText = groqData.choices?.[0]?.message?.content || '{"leads": []}';
    
    let parsedLeads = [];
    try {
      const parsedObj = JSON.parse(resultText);
      parsedLeads = parsedObj.leads || [];
    } catch (parseError) {
      console.error('[RADAR LEADS PARSE ERROR]', resultText, parseError);
      return Response.json({ error: 'Erro ao analisar resposta da inteligência artificial.' }, { status: 500 });
    }

    // Higieniza, formata e enriquece os leads extraídos pela IA
    const sanitizedLeads = parsedLeads
      .map(lead => {
        const cleanPhone = formatWhatsAppNumber(lead.phone);
        
        // Match link fallback if Groq missed it
        let fbUrl = lead.facebook_url;
        if (fbUrl === 'Não encontrado' || !fbUrl) {
          const matched = organicResults.find(r => r.title.includes(lead.name) || r.snippet.includes(lead.name));
          fbUrl = matched ? matched.link : 'Não encontrado';
        }

        return {
          ...lead,
          phone: cleanPhone,
          rawPhone: lead.phone,
          facebook_url: fbUrl
        };
      })
      // Filter out leads that don't have a valid WhatsApp or aren't autonomous
      .filter(lead => lead.phone !== 'Não encontrado' && lead.is_autonomous === true);

    console.log(`[RADAR LEADS] Extraídos com sucesso ${sanitizedLeads.length} leads de autônomos.`);
    return Response.json({ leads: sanitizedLeads });

  } catch (error) {
    console.error('[RADAR LEADS CRITICAL ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
