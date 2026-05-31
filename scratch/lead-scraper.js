/**
 * 🐍 Cobbra Lead Scraper Pro v2 — Robô de Prospecção Fria Multicanais (100% Gratuito)
 * 
 * Este script utiliza Puppeteer para pesquisar em múltiplos canais de forma paralela/concorrente:
 * 1. Google Maps (Local Search - Local Pack)
 * 2. Google Pesquisa Orgânica (Websites e Portais de Negócios)
 * 3. Facebook Pages (via Google Search Dorks - 100% Seguro, sem bloqueios de login!)
 * 4. Bing Search & Bing Maps (Fallback inteligente contra captchas e enriquecimento de dados)
 * 
 * Pré-requisitos:
 * 1. Ter o Node.js instalado (v16+)
 * 2. Instalar o Puppeteer: npm install puppeteer
 * 
 * Como executar:
 * node scratch/lead-scraper.js "locadora de carros" "Curitiba"
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Ativa o plugin de evasão stealth globalmente
puppeteer.use(StealthPlugin());

// Captura argumentos da linha de comando
const queryNiche = process.argv[2] || 'locadora de carros';
const queryCity = process.argv[3] || 'Curitiba';
const searchKeyword = `${queryNiche} em ${queryCity}`;

console.log(`🤖 ========================================================`);
console.log(`🤖 COBBRA LEAD SCRAPER PRO V2 — INICIANDO MULTICANAIS`);
console.log(`🤖 Nicho: "${queryNiche}" | Cidade: "${queryCity}"`);
console.log(`🤖 ========================================================\n`);

// Helper para extrair e-mails de uma string
function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

// Helper para extrair números de telefone brasileiro de um texto
function extractPhones(text) {
  // Regex abrangente para formatos brasileiros (fixos e celulares) com ou sem DDD
  const phoneRegex = /(?:\+?55\s?)?(?:\(?([1-9]{2})\)?\s?)?(?:(9\d{4})[-.\s]?(\d{4})|([2-8]\d{3})[-.\s]?(\d{4}))/g;
  const matches = text.match(phoneRegex) || [];
  return matches.map(p => p.trim()).filter(p => p.replace(/\D/g, '').length >= 8);
}

// Helper para formatar telefones em formato WhatsApp (E.164 pronto para Evolution API)
function formatWhatsAppNumber(rawPhone) {
  if (!rawPhone || rawPhone === 'Não encontrado') return 'Não encontrado';
  
  let clean = rawPhone.replace(/\D/g, '');
  
  // Remove 0 inicial de DDD se houver
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  
  // Adiciona o DDI 55 (Brasil) se tiver apenas DDD + Número (10 ou 11 dígitos)
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  
  // Se tiver 8 ou 9 dígitos (sem DDD), deixa o número limpo (Evolution API precisará de DDD)
  if (clean.length >= 8 && clean.length <= 13) {
    return clean;
  }
  
  return rawPhone; // Fallback para manter o original caso seja internacional/desconhecido
}

async function scrapeGoogleMaps(page) {
  const googleMapsUrl = `https://www.google.com/search?q=${encodeURIComponent(searchKeyword)}&tbm=lcl`;
  console.log(`🔍 [GOOGLE MAPS] Acessando Local Pack: ${googleMapsUrl}`);
  
  await page.goto(googleMapsUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await new Promise(r => setTimeout(r, 3500));
  
  // Verifica se fomos bloqueados por Captcha
  const hasCaptcha = await page.evaluate(() => {
    return document.body.innerText.includes('captcha') || !!document.querySelector('#captcha-form, iframe[src*="recaptcha"]');
  });

  if (hasCaptcha) {
    console.log('⚠️ [GOOGLE MAPS] Captcha do Google detectado. Abortando canal.');
    throw new Error('Google Captcha');
  }

  return await page.evaluate(() => {
    const results = [];
    const localCards = document.querySelectorAll('.rllt__details, .Vkuzco, [class*="rllt__details"]');
    
    localCards.forEach(card => {
      const titleEl = card.querySelector('.OSrXXb, span, h2, div');
      if (!titleEl) return;
      const name = titleEl.innerText.trim();
      if (!name || name.length < 3) return;

      const textContent = card.innerText || '';
      
      // Website
      let website = 'Não encontrado';
      const websiteLink = card.closest('div')?.querySelector('a[href*="http"]');
      if (websiteLink && !websiteLink.href.includes('google.com')) {
        website = websiteLink.href;
      }

      results.push({
        name,
        rawPhone: '', // Extraído via regex no escopo principal
        email: 'Não encontrado',
        website,
        snippet: textContent.replace(/\n+/g, ' ').substring(0, 200),
        source: 'Google Maps'
      });
    });
    return results;
  });
}

async function scrapeGoogleOrganic(page) {
  const googleOrgUrl = `https://www.google.com/search?q=${encodeURIComponent(searchKeyword)}`;
  console.log(`🔍 [GOOGLE ORGÂNICO] Buscando websites comerciais: ${googleOrgUrl}`);
  
  await page.goto(googleOrgUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await new Promise(r => setTimeout(r, 3000));

  const hasCaptcha = await page.evaluate(() => {
    return document.body.innerText.includes('captcha') || !!document.querySelector('#captcha-form, iframe[src*="recaptcha"]');
  });

  if (hasCaptcha) {
    console.log('⚠️ [GOOGLE ORGÂNICO] Captcha detectado. Abortando.');
    throw new Error('Google Captcha');
  }

  return await page.evaluate(() => {
    const results = [];
    const searchBlocks = document.querySelectorAll('div.g, div.kvH3rc, div.tF23ub');
    
    searchBlocks.forEach(block => {
      const titleEl = block.querySelector('h3');
      const linkEl = block.querySelector('a');
      const snippetEl = block.querySelector('div[style*="webkit-line-clamp"], .VwiC3b, .yXK7lf');
      
      if (!titleEl || !linkEl) return;
      
      const name = titleEl.innerText.trim();
      const website = linkEl.href;
      const snippet = snippetEl ? snippetEl.innerText.trim() : block.innerText;

      if (website.includes('facebook.com') || website.includes('instagram.com') || website.includes('google.com')) return;

      results.push({
        name: name.split(' - ')[0].split(' | ')[0],
        rawPhone: '',
        email: 'Não encontrado',
        website,
        snippet,
        source: 'Google Organic'
      });
    });
    return results;
  });
}

async function scrapeFacebookDork(page) {
  // Dork focada em encontrar páginas do Facebook do nicho e cidade que já exibem telefone/e-mail no snippet
  const facebookDorkQuery = `site:facebook.com "${queryNiche}" "${queryCity}"`;
  const googleFbUrl = `https://www.google.com/search?q=${encodeURIComponent(facebookDorkQuery)}`;
  console.log(`🔍 [FACEBOOK PROSPECTOR] Buscando páginas no Facebook via Google: ${googleFbUrl}`);
  
  await page.goto(googleFbUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await new Promise(r => setTimeout(r, 3000));

  const hasCaptcha = await page.evaluate(() => {
    return document.body.innerText.includes('captcha') || !!document.querySelector('#captcha-form, iframe[src*="recaptcha"]');
  });

  if (hasCaptcha) {
    console.log('⚠️ [FACEBOOK PROSPECTOR] Captcha detectado. Abortando.');
    throw new Error('Google Captcha');
  }

  return await page.evaluate(() => {
    const results = [];
    const searchBlocks = document.querySelectorAll('div.g, div.kvH3rc, div.tF23ub');
    
    searchBlocks.forEach(block => {
      const titleEl = block.querySelector('h3');
      const linkEl = block.querySelector('a');
      const snippetEl = block.querySelector('div[style*="webkit-line-clamp"], .VwiC3b, .yXK7lf');
      
      if (!titleEl || !linkEl) return;
      
      const rawName = titleEl.innerText.trim();
      const website = linkEl.href;
      const snippet = snippetEl ? snippetEl.innerText.trim() : block.innerText;

      // Limpa nome do Facebook (Ex: "Locadora Silva - Home | Facebook" -> "Locadora Silva")
      let cleanName = rawName.replace(/\s?-\s?(?:Home|Página inicial|Facebook|Perfil|Entrar).*$/gi, '').trim();

      results.push({
        name: cleanName,
        rawPhone: '',
        email: 'Não encontrado',
        website,
        snippet,
        source: 'Facebook Page'
      });
    });
    return results;
  });
}

async function scrapeBingSearch(page) {
  const bingQuery = `${queryNiche} em ${queryCity}`;
  const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(bingQuery)}`;
  console.log(`🔄 [BING FALLBACK] Buscando no Bing: ${bingUrl}`);
  
  await page.goto(bingUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await new Promise(r => setTimeout(r, 4000));

  return await page.evaluate(() => {
    const results = [];
    const localCards = document.querySelectorAll('.l_ecrd, .b_algo, .b_ad');
    
    localCards.forEach(card => {
      const titleEl = card.querySelector('h2, .b_focusTextLarge, .title');
      if (!titleEl) return;
      const name = titleEl.innerText.trim();
      
      const snippetEl = card.querySelector('.b_caption p, .b_captionText, .caption, .description');
      const snippet = snippetEl ? snippetEl.innerText.trim() : card.innerText;
      
      // Target the main link inside the heading or title element
      const linkEl = titleEl.tagName === 'A' ? titleEl : titleEl.querySelector('a');
      let website = 'Não encontrado';
      
      if (linkEl && linkEl.href) {
        const href = linkEl.href;
        if (!href.includes('bing.com/search') && !href.includes('bing.com/images') && !href.includes('bing.com/maps')) {
          website = href;
        }
      } else {
        const fallbackLink = card.querySelector('a');
        if (fallbackLink && fallbackLink.href && !fallbackLink.href.includes('bing.com/search')) {
          website = fallbackLink.href;
        }
      }

      results.push({
        name: name.split(' - ')[0].split(' | ')[0],
        rawPhone: '',
        email: 'Não encontrado',
        website,
        snippet,
        source: 'Bing Search'
      });
    });
    return results;
  });
}

async function runScraper() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=pt-BR,pt'
      ]
    });

    // Cria abas concorrentes para rodar os múltiplos canais simultaneamente!
    const [page1, page2, page3] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage()
    ]);

    // Define User-Agents realísticos em todas as abas
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await Promise.all([
      page1.setUserAgent(userAgent),
      page2.setUserAgent(userAgent),
      page3.setUserAgent(userAgent),
      page1.setViewport({ width: 1280, height: 900 }),
      page2.setViewport({ width: 1280, height: 900 }),
      page3.setViewport({ width: 1280, height: 900 })
    ]);

    let rawLeads = [];
    let googleBlocked = false;

    console.log(`⚡ Iniciando buscas concorrentes nos canais do Google...`);

    // Roda os três scrapers do Google de forma concorrente usando as três abas!
    try {
      const googleResults = await Promise.allSettled([
        scrapeGoogleMaps(page1),
        scrapeGoogleOrganic(page2),
        scrapeFacebookDork(page3)
      ]);

      googleResults.forEach(res => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          rawLeads.push(...res.value);
        } else if (res.status === 'rejected' && res.reason.message.includes('Captcha')) {
          googleBlocked = true;
        }
      });

    } catch (e) {
      console.error('❌ Erro na execução das abas do Google:', e);
      googleBlocked = true;
    }

    // Se fomos bloqueados ou o resultado foi muito fraco, roda o canal de enriquecimento do Bing
    if (googleBlocked || rawLeads.length < 5) {
      console.log(`\n🔄 [FALLBACK BING ACTIVED] Google bloqueou ou retornou poucos resultados. Ativando Bing...`);
      try {
        const bingLeads = await scrapeBingSearch(page1);
        rawLeads.push(...bingLeads);
      } catch (bingErr) {
        console.error('❌ Erro no canal do Bing:', bingErr);
      }
    }

    // Processamento e limpeza de dados (Extração de telefones e e-mails via Regex)
    console.log(`\n⚡ Higienizando e enriquecendo dados de ${rawLeads.length} leads brutos...`);
    const processedLeads = [];
    const seenPhones = new Set();
    const seenNames = new Set();

    for (const lead of rawLeads) {
      // Extrai telefones e e-mails do texto estruturado (snippet e corpo)
      const phonesFound = extractPhones(lead.snippet);
      const emailsFound = extractEmails(lead.snippet);
      
      const phone = phonesFound.length > 0 ? phonesFound[0] : 'Não encontrado';
      const email = emailsFound.length > 0 ? emailsFound[0] : lead.email;
      
      const cleanPhone = formatWhatsAppNumber(phone);

      // Regras de Deduplicação e Validação
      // Se não tiver telefone limpo, mas tiver um website ou página de Facebook válida, mantemos!
      if (cleanPhone === 'Não encontrado' && (!lead.website || lead.website === 'Não encontrado')) {
        continue;
      }
      
      if (cleanPhone !== 'Não encontrado') {
        if (seenPhones.has(cleanPhone)) continue;
        seenPhones.add(cleanPhone);
      }

      const nameLower = lead.name.toLowerCase();
      if (seenNames.has(nameLower)) continue;
      seenNames.add(nameLower);

      processedLeads.push({
        name: lead.name,
        phone: cleanPhone,
        rawPhone: phone,
        email: email,
        website: lead.website,
        source: lead.source,
        capturedAt: new Date().toISOString()
      });
    }

    console.log(`📊 Raspagem concluída! Extraímos ${processedLeads.length} leads validados e deduplicados.`);

    // Salva os leads em um arquivo JSON
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `leads_${queryNiche.replace(/\s+/g, '_')}_${queryCity.replace(/\s+/g, '_')}.json`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, JSON.stringify(processedLeads, null, 2), 'utf8');
    console.log(`💾 Leads salvos com sucesso em: ${outputPath}`);

    // Mostra amostra formatada no terminal
    if (processedLeads.length > 0) {
      console.log('\n--- Amostra dos Leads Capturados (Prontos para WhatsApp) ---');
      console.table(processedLeads.slice(0, 10).map(l => ({
        Nome: l.name.substring(0, 26),
        WhatsApp: l.phone,
        Email: l.email,
        Origem: l.source,
        URL: l.website.substring(0, 35)
      })));
      console.log('-----------------------------------------------------------');
      console.log('💡 Dica: Esses números de WhatsApp formatados com 55 (DDI) já podem ser exportados direto para a Evolution API na VPS!');
    }

  } catch (error) {
    console.error('❌ Ocorreu um erro geral durante a raspagem:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runScraper();
