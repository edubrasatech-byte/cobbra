/**
 * 🐍 Cobbra Lead Scraper Autônomos v2 — Automação de Captação P2P via Groq AI
 * 
 * Este script automatiza 100% o funil de prospecção de profissionais liberais e autônomos
 * utilizando o motor de inferência da Groq (Llama 3.3 70B), garantindo velocidade ultra-alta,
 * zero captchas e compatibilidade absoluta com sua VPS Linux!
 * 
 * Pré-requisitos:
 * 1. Ter o Node.js instalado (v18+)
 * 2. Ter a API Key da SerpAPI e da Groq
 * 
 * Como executar:
 * node scratch/lead-scraper-autonomos.js "nicho" "cidade" "SUA_GROQ_KEY"
 * 
 * Exemplo:
 * node scratch/lead-scraper-autonomos.js "personal trainer" "Curitiba" "gsk_..."
 */

const fs = require('fs');
const path = require('path');

// Captura argumentos da linha de comando
const queryNiche = process.argv[2] || 'personal trainer';
const queryCity = process.argv[3] || 'Curitiba';
const cliGroqKey = process.argv[4];

// Chave default de contingência da SerpAPI
const fallbackSerpApiKey = "5afc5fd737156c56803c5b8c29f0bc492cf57e77cb26c008adc55e1feddd58a4";

// 1. Carrega chaves de API dos arquivos .env e .env.local
let envGroqKey = '';
let envSerpKey = '';

try {
  const checkPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), 'app', '.env'),
    path.join(process.cwd(), 'app', '.env.local')
  ];

  for (const p of checkPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const groqMatch = content.match(/^GROQ_API_KEY\s*=\s*(.+)$/m);
      const serpMatch = content.match(/^SERPAPI_API_KEY\s*=\s*(.+)$/m);
      if (groqMatch && !envGroqKey) envGroqKey = groqMatch[1].trim();
      if (serpMatch && !envSerpKey) envSerpKey = serpMatch[1].trim();
    }
  }
} catch(e) {}

const serpApiKey = process.env.SERPAPI_API_KEY || envSerpKey || fallbackSerpApiKey;
const groqApiKey = cliGroqKey || process.env.GROQ_API_KEY || envGroqKey;

console.log(`🤖 ========================================================`);
console.log(`🤖 COBBRA LEAD AUTOMATION AI — MOTOR GROQ COMPATÍVEL`);
console.log(`🤖 Nicho: "${queryNiche}" | Cidade: "${queryCity}"`);
console.log(`🤖 ========================================================\n`);

// Helper para formatar telefones em formato WhatsApp (E.164 pronto para Evolution API)
function formatWhatsAppNumber(rawPhone) {
  if (!rawPhone || rawPhone.toLowerCase().includes('não') || rawPhone.toLowerCase().includes('encontrado')) {
    return 'Não encontrado';
  }
  
  let clean = rawPhone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  if (clean.length >= 8 && clean.length <= 13) {
    return clean;
  }
  return rawPhone;
}

// Envia os snippets orgânicos para o Groq extrair leads em JSON nativo
async function extractLeadsWithGroq(rawText) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const systemPrompt = `Você é o motor de inteligência artificial de extração de leads do Cobbra.ai.
Análise o texto de resultados orgânicos de redes sociais e extraia informações estruturadas de autônomos, profissionais independentes e pequenos prestadores de serviços locais.

Retorne EXCLUSIVAMENTE um objeto JSON contendo uma chave "leads" que mapeia para uma lista de objetos, no formato:
{
  "leads": [
    {
      "name": "Nome do profissional ou do perfil comercial",
      "phone": "Telefone ou celular do profissional (mantenha string original)",
      "niche": "Nicho do profissional (ex: Personal Trainer, Aluguel de Andaime, Empréstimo)",
      "location": "Cidade e estado",
      "offer_details": "Resumo curto do serviço, preço ou condições que a pessoa oferece",
      "facebook_url": "Link do post ou perfil se houver no texto, senão 'Não encontrado'",
      "is_autonomous": true ou false (estime se o lead é de fato uma pessoa física/autônomo ou microempresa)
    }
  ]
}

Seja extremamente rigoroso para garantir que o JSON retornado seja válido e siga exatamente essa estrutura. Não inclua observações, notas ou blocos markdown adicionais.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extraia os leads autônomos do seguinte texto:\n\n${rawText}` }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Falha na API da Groq: ${err}`);
    }

    const resJson = await response.json();
    const resultText = resJson.choices?.[0]?.message?.content || '{"leads": []}';
    const parsed = JSON.parse(resultText);
    return parsed.leads || [];
  } catch (e) {
    console.error("❌ Erro ao invocar a Groq para extração de dados:", e.message);
    return [];
  }
}

async function runPipeline() {
  if (!groqApiKey) {
    console.error("❌ ERRO: Nenhuma API Key da Groq foi encontrada!");
    console.error("💡 Como executar passando a chave:");
    console.error(`      node scratch/lead-scraper-autonomos.js "${queryNiche}" "${queryCity}" "SUA_GROQ_API_KEY"\n`);
    process.exit(1);
  }

  // Dork de busca focada em capturar grupos de Facebook e listagens do nicho
  const facebookDork = `site:facebook.com/groups OR site:facebook.com/posts OR site:facebook.com/marketplace "${queryNiche}" "${queryCity}" ("whatsapp" OR "whats" OR "celular" OR "contato" OR "tel")`;
  const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(facebookDork)}&hl=pt-br&gl=br&api_key=${serpApiKey}`;

  console.log(`🔍 [AUTOMATED GROQ PIPELINE] Consultando SerpAPI para obter publicações...`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(serpUrl);
    
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Erro na SerpAPI (${response.status}): ${err}`);
    }

    const data = await response.json();
    const organicResults = data.organic_results || [];

    console.log(`📊 SerpAPI retornou ${organicResults.length} postagens/anúncios relevantes em ${((Date.now() - startTime)/1000).toFixed(2)}s.`);

    if (organicResults.length === 0) {
      console.log("⚠️ Nenhuma publicação pública indexada foi encontrada para esses termos.");
      process.exit(0);
    }

    // Mescla títulos, snippets e links em um bloco estruturado de texto
    const textData = organicResults.map((r, idx) => {
      return `
[Publicação #${idx + 1}]
Título: ${r.title}
Link: ${r.link}
Snippet: ${r.snippet}
      `.trim();
    }).join('\n\n');

    console.log(`⚡ Dados brutos organizados. Acionando Catarina Groq AI (Llama 3.3 70B)...`);
    
    const extractionStart = Date.now();
    const leads = await extractLeadsWithGroq(textData);
    
    // Sincroniza e limpa contatos para formato WhatsApp
    leads.forEach(l => {
      l.phone = formatWhatsAppNumber(l.phone);
      if (l.facebook_url === 'Não encontrado' || !l.facebook_url) {
        const matchingResult = organicResults.find(r => r.title.includes(l.name) || r.snippet.includes(l.name));
        l.facebook_url = matchingResult ? matchingResult.link : 'Não encontrado';
      }
    });

    const autonomousLeads = leads.filter(l => l.is_autonomous && l.phone !== 'Não encontrado');

    console.log(`📊 Catarina Groq AI concluiu a extração em ${((Date.now() - extractionStart)/1000).toFixed(2)}s.`);
    console.log(`📊 Extraídos ${autonomousLeads.length} leads de autônomos validados.`);

    // Salva os leads em JSON
    const outputDir = path.join(process.cwd(), 'scratch', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `leads_autonomos_${queryNiche.replace(/\s+/g, '_')}_${queryCity.replace(/\s+/g, '_')}.json`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, JSON.stringify(autonomousLeads, null, 2), 'utf8');
    console.log(`💾 Leads salvos com sucesso em: ${outputPath}`);

    // Imprime tabela de amostra
    if (autonomousLeads.length > 0) {
      console.log('\n--- Amostra dos Autônomos Extraídos Nativamente da Rede ---');
      console.table(autonomousLeads.slice(0, 10).map(l => ({
        Nome: l.name.substring(0, 24),
        WhatsApp: l.phone,
        Nicho: l.niche,
        Local: l.location,
        Post: l.facebook_url.substring(0, 45)
      })));
      console.log('-----------------------------------------------------------');
      console.log('💡 Dica: Esses números já possuem o DDI 55 e estão prontos para envio automático na VPS!');
    } else {
      console.log("⚠️ Todos os resultados indexados eram corporativos ou não possuíam contatos de WhatsApp visíveis.");
    }

  } catch (error) {
    console.error("❌ Falha crítica no pipeline automatizado:", error.message);
  }
}

runPipeline();
