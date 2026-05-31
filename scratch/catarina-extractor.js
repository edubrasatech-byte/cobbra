/**
 * 🐍 Cobbra Catarina Extratora AI v1 — Motor de Extração Inteligente de Autônomos
 * 
 * Este script é um extrator de leads baseado em Inteligência Artificial (Gemini 2.5 Flash).
 * Ele resolve o maior problema de raspar redes complexas (como Facebook Groups, Marketplace,
 * Instagram e chats de WhatsApp): a obfuscagem de código React e bloqueios de login.
 * 
 * Como funciona:
 * 1. MODO CLIPBOARD/TEXTO: Copie e cole todo o conteúdo bruto (Ctrl+A e Ctrl+C) de um grupo do
 *    Facebook, anúncio do Marketplace ou chat de WhatsApp em um arquivo local (ex: scratch/raw_group.txt).
 * 2. O extrator lê o texto totalmente desorganizado e utiliza a IA para pescar nomes, contatos,
 *    nichos, cidades, descrições dos serviços e estimar se o perfil é de um autônomo real.
 * 3. MODO DORK LOCALIZADO: Faz buscas públicas no Google/Bing focadas em perfis P2P (como "aluguel particular")
 *    e processa os textos dos snippets diretamente com IA.
 * 
 * Como executar:
 * node scratch/catarina-extractor.js MODO [CaminhoDoArquivo ou PalavraChave]
 * 
 * Exemplos:
 * node scratch/catarina-extractor.js text scratch/raw_input.txt
 * node scratch/catarina-extractor.js search "aluguel de carro particular Curitiba"
 */

const fs = require('fs');
const path = require('path');

// Carrega as variáveis do arquivo .env local para obter a chave Gemini
let geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  try {
    const envPath = path.join(__dirname, 'cobroo', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match) geminiKey = match[1].trim();
    }
    
    // Tentativa no diretório atual
    if (!geminiKey) {
      const localEnvPath = path.join(__dirname, '.env');
      if (fs.existsSync(localEnvPath)) {
        const envContent = fs.readFileSync(localEnvPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
        if (match) geminiKey = match[1].trim();
      }
    }
  } catch (e) {
    console.log("Aviso: Falha ao ler arquivo .env de forma síncrona.");
  }
}

// Chave hardcoded de fallback encontrada no .env do usuário
const fallbackKey = "AIzaSyA5G3wIPLSGQtHYjwBdLy-t7JG8G3yzgpg";
const apiKey = geminiKey || fallbackKey;

const mode = process.argv[2] || 'help';
const inputParam = process.argv[3];

console.log(`🐍 ========================================================`);
console.log(`🐍 COBBRA CATARINA EXTRACTION AI — MOTOR DE AUTÔNOMOS`);
console.log(`🐍 Modo ativo: "${mode.toUpperCase()}"`);
console.log(`🐍 ========================================================\n`);

if (mode === 'help' || !inputParam) {
  console.log("💡 Como usar o Extrator de Autônomos AI:");
  console.log("\n--- OPÇÃO A: EXTRAÇÃO DE TEXTO BRUTO (Facebook, WhatsApp, Marketplace) ---");
  console.log("1. Vá em um grupo de Facebook de autônomos ou anúncio do Marketplace.");
  console.log("2. Selecione toda a página (Ctrl+A), copie (Ctrl+C).");
  console.log("3. Salve o conteúdo em um arquivo de texto, ex: scratch/raw_leads.txt");
  console.log("4. Execute o comando:");
  console.log("   node scratch/catarina-extractor.js text scratch/raw_leads.txt");
  
  console.log("\n--- OPÇÃO B: EXTRAÇÃO VIA DORK P2P PÚBLICA (Sem Captchas) ---");
  console.log("Busca direto na web por listagens e perfis autônomos locais:");
  console.log("   node scratch/catarina-extractor.js search \"aluguel de betoneira particular Curitiba\"");
  console.log("   node scratch/catarina-extractor.js search \"empresto dinheiro juros whatsapp Porto Alegre\"\n");
  process.exit(0);
}

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

// Envia o texto bruto para o Gemini extrair leads estruturados
async function extractLeadsWithAI(rawText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const systemPrompt = `
Você é o motor de inteligência artificial de extração de leads do Cobbra.ai.
Seu objetivo é analisar textos altamente desorganizados, bagunçados e poluídos (como cópias de páginas de grupos de Facebook, anúncios do Marketplace, posts de Instagram ou chats de WhatsApp) e pescar informações de pessoas físicas, autônomos, profissionais independentes e pequenos prestadores de serviços locais.

Ignore grandes empresas (como Localiza, Porto Seguro, grandes imobiliárias). Foque em autônomos reais (ex: motoristas particulares, pessoas que emprestam dinheiro a juros de forma autônoma, pessoas que alugam ferramentas de quintal, maridos de aluguel, encanadores, personal trainers).

Extraia uma lista de leads no seguinte formato JSON (siga estritamente o esquema):
{
  "name": "Nome da pessoa ou nome comercial curto",
  "phone": "Telefone ou celular encontrado (mantenha como string no formato original)",
  "niche": "Nicho do profissional (ex: Aluguel de Carro Particular, Empréstimo Pessoal, Locação de Ferramentas, Estética)",
  "location": "Cidade e estado se houver (ex: Curitiba - PR, São Paulo)",
  "offer_details": "Resumo curto do serviço, preço ou condições que a pessoa oferece",
  "is_autonomous": true ou false (estime se o lead é de fato uma pessoa física/autônomo ou microempresa)
}

Se o texto contiver múltiplos posts ou anúncios, extraia todos os leads que identificar. Se não encontrar contatos telefônicos explícitos no anúncio mas encontrar links ou perfis fortes, tente extrair o nome e o que ele oferece.
  `.trim();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nTEXTO BRUTO PARA EXTRAÇÃO:\n${rawText}` }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                phone: { type: "STRING" },
                niche: { type: "STRING" },
                location: { type: "STRING" },
                offer_details: { type: "STRING" },
                is_autonomous: { type: "BOOLEAN" }
              },
              required: ["name", "phone", "niche", "offer_details", "is_autonomous"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Falha na API do Gemini: ${err}`);
    }

    const resJson = await response.json();
    const resultText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    return JSON.parse(resultText);
  } catch (e) {
    console.error("❌ Erro ao invocar o Gemini para extração de dados:", e.message);
    return [];
  }
}

async function runTextMode() {
  const filePath = path.isAbsolute(inputParam) ? inputParam : path.join(process.cwd(), inputParam);
  console.log(`📂 Lendo texto bruto de: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ERRO: O arquivo "${filePath}" não foi encontrado!`);
    console.error("💡 Certifique-se de salvar o texto bruto em um arquivo válido primeiro.");
    process.exit(1);
  }

  const rawText = fs.readFileSync(filePath, 'utf8');
  console.log(`⚡ Texto carregado (${rawText.length} caracteres). Processando com Catarina AI...`);
  
  const startTime = Date.now();
  const leads = await extractLeadsWithAI(rawText);
  
  // Higieniza os contatos
  leads.forEach(l => {
    l.phone = formatWhatsAppNumber(l.phone);
  });

  const finalLeads = leads.filter(l => l.is_autonomous);

  console.log(`\n📊 IA concluiu a extração em ${((Date.now() - startTime)/1000).toFixed(2)}s.`);
  console.log(`📊 Extraídos ${finalLeads.length} leads de autônomos válidos.`);

  // Salva resultado
  const outputDir = path.join(process.cwd(), 'scratch', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const fileName = `extracted_leads_${path.basename(filePath, path.extname(filePath))}.json`;
  const outputPath = path.join(outputDir, fileName);

  fs.writeFileSync(outputPath, JSON.stringify(finalLeads, null, 2), 'utf8');
  console.log(`💾 Resultados estruturados salvos em: ${outputPath}`);

  if (finalLeads.length > 0) {
    console.log('\n--- Amostra dos Leads Autônomos Extraídos ---');
    console.table(finalLeads.slice(0, 10).map(l => ({
      Nome: l.name.substring(0, 24),
      WhatsApp: l.phone,
      Nicho: l.niche,
      Local: l.location,
      Detalhes: l.offer_details.substring(0, 45)
    })));
    console.log('---------------------------------------------');
  } else {
    console.log("⚠️ Nenhuma listagem válida de autônomo com telefone foi detectada no arquivo.");
  }
}

async function runSearchMode() {
  // Executa uma pesquisa de Dork no Bing (que não tem captchas) e alimenta as descrições na IA
  const query = inputParam;
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  
  console.log(`🔍 [P2P SEARCH] Varrendo websites e postagens públicas do Bing para: "${query}"...`);
  
  try {
    // Usando fetch tradicional de rede na VPS
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error("Erro na busca de rede");
    
    const html = await response.text();
    
    // Extração rústica de snippets de texto da página de resultados
    const textBlocks = [];
    const matchRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = matchRegex.exec(html)) !== null) {
      const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
      if (cleanText.length > 40 && textBlocks.length < 50) {
        textBlocks.push(cleanText);
      }
    }

    const mergedText = textBlocks.join('\n\n');
    console.log(`⚡ Extraídos ${textBlocks.length} snippets de texto orgânicos. Processando com Catarina AI...`);
    
    const leads = await extractLeadsWithAI(mergedText);
    leads.forEach(l => {
      l.phone = formatWhatsAppNumber(l.phone);
    });

    const finalLeads = leads.filter(l => l.is_autonomous);
    console.log(`📊 Raspagem concluída! Extraímos ${finalLeads.length} leads qualificados.`);

    const outputDir = path.join(process.cwd(), 'scratch', 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `extracted_leads_search_${query.replace(/\s+/g, '_')}.json`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, JSON.stringify(finalLeads, null, 2), 'utf8');
    console.log(`💾 Resultados estruturados salvos em: ${outputPath}`);

    if (finalLeads.length > 0) {
      console.log('\n--- Amostra dos Leads P2P Extraídos ---');
      console.table(finalLeads.slice(0, 10).map(l => ({
        Nome: l.name.substring(0, 24),
        WhatsApp: l.phone,
        Nicho: l.niche,
        Detalhes: l.offer_details.substring(0, 45)
      })));
      console.log('---------------------------------------');
    }

  } catch (e) {
    console.error("❌ Falha na busca de dados públicos:", e.message);
  }
}

if (mode === 'text') {
  runTextMode();
} else if (mode === 'search') {
  runSearchMode();
} else {
  console.log("Comando não reconhecido. Use 'node scratch/catarina-extractor.js' sem argumentos para ver ajuda.");
}
