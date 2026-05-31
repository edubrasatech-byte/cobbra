/**
 * 🐍 Cobbra Lead Scraper SerpAPI — Robô de Prospecção Fria de Alta Estabilidade
 * 
 * Este script utiliza a API da SerpAPI para consultar o Google Maps de forma direta,
 * contornando 100% dos bloqueios de Captcha e restrições de IP.
 * Perfeito para rodar na sua VPS Linux de forma ultraleve, rápida e sem necessidade de Puppeteer!
 * 
 * Pré-requisitos:
 * 1. Ter o Node.js instalado (v18+)
 * 2. Ter uma conta gratuita em https://serpapi.com para obter sua API Key (100 buscas gratuitas/mês)
 * 
 * Como executar:
 * node scratch/lead-scraper-serpapi.js "locadora de carros" "Curitiba" "SUA_SERPAPI_KEY"
 */

const fs = require('fs');
const path = require('path');

// Captura argumentos da linha de comando
const queryNiche = process.argv[2] || 'locadora de carros';
const queryCity = process.argv[3] || 'Curitiba';
const cliApiKey = process.argv[4];

// Busca API Key nas variáveis de ambiente ou no argumento CLI
const apiKey = cliApiKey || process.env.SERPAPI_API_KEY;

console.log(`🤖 ========================================================`);
console.log(`🤖 COBBRA LEAD SCRAPER SERPAPI — INICIANDO BUSCA SEGURA`);
console.log(`🤖 Nicho: "${queryNiche}" | Cidade: "${queryCity}"`);
console.log(`🤖 ========================================================\n`);

// Helper para formatar telefones em formato WhatsApp (E.164 pronto para Evolution API)
function formatWhatsAppNumber(rawPhone) {
  if (!rawPhone) return 'Não encontrado';
  
  let clean = rawPhone.replace(/\D/g, '');
  
  // Remove 0 inicial de DDD se houver
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  
  // Adiciona o DDI 55 (Brasil) se tiver apenas DDD + Número (10 ou 11 dígitos)
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  
  if (clean.length >= 8 && clean.length <= 13) {
    return clean;
  }
  
  return rawPhone;
}

async function runScraper() {
  if (!apiKey) {
    console.error("❌ ERRO: Nenhuma API Key da SerpAPI foi fornecida!");
    console.error("💡 Como obter sua chave:");
    console.error("   1. Cadastre-se gratuitamente em: https://serpapi.com/");
    console.error("   2. Copie sua API Key do painel.");
    console.error("   3. Execute passando a chave no final do comando, ex:");
    console.error(`      node scratch/lead-scraper-serpapi.js "${queryNiche}" "${queryCity}" "SUA_API_KEY_AQUI"\n`);
    process.exit(1);
  }

  const searchKeyword = `${queryNiche} em ${queryCity}`;
  const serpUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchKeyword)}&hl=pt-br&gl=br&api_key=${apiKey}`;

  console.log("🔍 Consultando Google Maps via SerpAPI (Zero Captchas & IP Evasion)...");

  try {
    const startTime = Date.now();
    const response = await fetch(serpUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resposta do servidor inválida (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const rawResults = data.local_results || [];

    console.log(`📊 SerpAPI respondeu em ${((Date.now() - startTime) / 1000).toFixed(2)}s.`);
    console.log(`📊 Encontrados ${rawResults.length} estabelecimentos comerciais.`);

    const leads = [];
    const seenPhones = new Set();
    const seenNames = new Set();

    for (const place of rawResults) {
      const name = place.title || 'Sem Nome';
      const rawPhone = place.phone || '';
      const cleanPhone = formatWhatsAppNumber(rawPhone);
      const website = place.website || 'Não encontrado';
      const address = place.address || 'Não encontrado';
      const rating = place.rating || 'N/A';
      const reviews = place.reviews || 0;

      // Deduplicação por telefone
      if (cleanPhone !== 'Não encontrado') {
        if (seenPhones.has(cleanPhone)) continue;
        seenPhones.add(cleanPhone);
      }

      // Deduplicação por nome comercial
      const nameLower = name.toLowerCase();
      if (seenNames.has(nameLower)) continue;
      seenNames.add(nameLower);

      leads.push({
        name,
        phone: cleanPhone,
        rawPhone: rawPhone || 'Não encontrado',
        email: 'Não encontrado', // A ser enriquecido ou buscado no site se necessário
        website,
        address,
        rating,
        reviews,
        source: 'Google Maps (SerpAPI)',
        capturedAt: new Date().toISOString()
      });
    }

    console.log(`📊 Processamento concluído! Extraímos ${leads.length} leads higienizados.`);

    // Salva os leads em um arquivo JSON
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `leads_serp_${queryNiche.replace(/\s+/g, '_')}_${queryCity.replace(/\s+/g, '_')}.json`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, JSON.stringify(leads, null, 2), 'utf8');
    console.log(`💾 Leads salvos com sucesso em: ${outputPath}`);

    // Mostra amostra formatada no terminal
    if (leads.length > 0) {
      console.log('\n--- Amostra dos Leads Capturados (Prontos para WhatsApp) ---');
      console.table(leads.slice(0, 10).map(l => ({
        Nome: l.name.substring(0, 26),
        WhatsApp: l.phone,
        Avaliação: `${l.rating} ★ (${l.reviews})`,
        Website: l.website.substring(0, 35)
      })));
      console.log('-----------------------------------------------------------');
      console.log('💡 Dica: Estes leads são 100% reais, limpos e sem risco de captchas!');
    }

  } catch (error) {
    console.error('❌ Ocorreu um erro durante a consulta na SerpAPI:', error.message);
  }
}

runScraper();
