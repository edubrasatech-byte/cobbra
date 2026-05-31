const fallbackSerpKey = '';
const serpApiKey = process.env.SERPAPI_API_KEY || '';
const groqApiKey = process.env.GROQ_API_KEY || '';


const fs = require('fs');
const path = require('path');

// Read keys from env
let envGroqKey = '';
let envSerpKey = '';
try {
  const checkPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local')
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

const finalGroqKey = process.env.GROQ_API_KEY || envGroqKey;
const finalSerpKey = process.env.SERPAPI_API_KEY || envSerpKey || fallbackSerpKey;

console.log("Using Groq Key:", finalGroqKey ? "FOUND (gsk_...)" : "MISSING");
console.log("Using SerpAPI Key:", finalSerpKey ? "FOUND" : "MISSING");

const niche = "personal trainer";
const city = "Curitiba";
const facebookDork = `site:facebook.com/groups OR site:facebook.com/posts OR site:facebook.com/marketplace "${niche}" "${city}" ("whatsapp" OR "whats" OR "celular" OR "contato" OR "tel")`;
const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(facebookDork)}&hl=pt-br&gl=br&api_key=${finalSerpKey}`;

async function runTest() {
  try {
    console.log(`Querying SerpAPI with dork: ${facebookDork}...`);
    const serpRes = await fetch(serpUrl);
    if (!serpRes.ok) {
      console.error(`SerpAPI error: ${serpRes.status} - ${await serpRes.text()}`);
      return;
    }
    const serpData = await serpRes.json();
    const organicResults = serpData.organic_results || [];
    console.log(`SerpAPI returned ${organicResults.length} organic results.`);
    
    if (organicResults.length === 0) {
      console.log("No organic results found.");
      return;
    }

    console.log("First organic result sample snippet:", organicResults[0].snippet);

    if (!finalGroqKey) {
      console.log("Groq Key is missing. Skipping Groq qualification test.");
      return;
    }

    const textBlock = organicResults.map((r, idx) => {
      return `[Pub #${idx + 1}] Titulo: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}`;
    }).join('\n\n');

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

    console.log("Querying Groq AI for qualification...");
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalGroqKey}`
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

    if (!groqRes.ok) {
      console.error(`Groq error: ${groqRes.status} - ${await groqRes.text()}`);
      return;
    }

    const groqData = await groqRes.json();
    console.log("Groq AI qualification result choices content:", groqData?.choices?.[0]?.message?.content);
  } catch (e) {
    console.error("Test failed:", e);
  }
}

runTest();
