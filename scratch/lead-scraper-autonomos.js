/**
 * 🐍 Cobbra Lead Scraper Autônomos v3 — Automatizador de Prospecção Fria Multicanais
 * 
 * Este script automatiza 100% o funil de prospecção de profissionais liberais e autônomos
 * utilizando o motor de inteligência artificial de altíssima performance da Groq (Llama 3.3 70B).
 * 
 * ELE É HIPER-PERSONALIZADO POR NICHO, gerando cópias sob medida para as dores dos seguintes públicos:
 * 1. Locadores de Carros (Uber, frotistas, P2P)
 * 2. Empréstimos / Financiadores / Credores (Agiotagem legalizada)
 * 3. Prestadores de Serviços da Construção Civil (Pedreiros, pintores, engenheiros, empreiteiros)
 * 4. Saúde e Fitness (Personal trainers, estúdios de pilates, yoga, clínicas)
 * 5. Nichos Genéricos (Freelancers, designers, consultores)
 * 
 * Roda de forma massiva varrendo capitais e grandes cidades do Brasil de forma 100% orgânica
 * e integrando com o banco de dados do Cobbra.ai (leads_prospects).
 * 
 * Pré-requisitos:
 * 1. Node.js (v18+)
 * 2. SQLite local configurado no projeto
 * 
 * Execução normal:
 * node scratch/lead-scraper-autonomos.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Lista abrangente de nichos e buscas focadas para minerar grupos de Facebook (ex: Uber, Autônomos)
const MINING_TARGETS = [
  // 1. Locadores de Carros e Ubers (Nicho de Altíssima Conversão)
  { niche: 'aluguel de carro para uber', query: 'aluguel de carro para uber OR aluguel de frota cnh' },
  { niche: 'locador de veiculos', query: 'locação de carros uber OR alugo carro curitiba' },
  
  // 2. Empréstimos, Credores e Investidores P2P
  { niche: 'emprestimo pessoal', query: 'emprestimo pessoal rapido OR emprestimo dinheiro' },
  { niche: 'credito autonomo', query: 'dinheiro na hora juros diários OR emprestimo sem burocracia' },
  
  // 3. Construção Civil e Empreiteiros
  { niche: 'servicos de pedreiro', query: 'pedreiro reforma OR construtor empreiteira' },
  { niche: 'empreiteiro', query: 'pintor encanador eletricista orçamento reforma' },
  
  // 4. Fitness e Saúde
  { niche: 'personal trainer', query: 'personal trainer mensalidade OR consultoria fitness' },
  { niche: 'estudio de pilates', query: 'estúdio de pilates mensalidade' }
];

// Cidades estratégicas do Brasil com alto volume de autônomos e frotas de Uber
const BRAZILIAN_CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre',
  'Salvador', 'Fortaleza', 'Recife', 'Goiânia', 'Campinas', 'Florianópolis'
];

// 1. Carregar chaves de API dos arquivos .env e .env.local
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

const fallbackSerpApiKey = "5afc5fd737156c56803c5b8c29f0bc492cf57e77cb26c008adc55e1feddd58a4";
const serpApiKey = process.env.SERPAPI_API_KEY || envSerpKey || fallbackSerpApiKey;
const groqApiKey = process.env.GROQ_API_KEY || envGroqKey;

// Conectar ao Banco de Dados SQLite do Cobbra para salvar leads prospects direto na fila de outbound
let db;
try {
  const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
  if (fs.existsSync(DB_PATH)) {
    db = new Database(DB_PATH);
    console.log(`🗄️ Conectado com sucesso ao SQLite em: ${DB_PATH}`);
  }
} catch(e) {
  console.log("⚠️ Executando em modo isolado de banco de dados:", e.message);
}

// Higienização e padronização do número para formato internacional WhatsApp (E.164)
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

// Dicionário Estrito de Copy e Gatilhos de Benefício por Nicho para Abordagem Exclusiva
function generatePersonalizedMessage(lead) {
  const name = lead.name.split(' ')[0]; // Apenas primeiro nome para maior intimidade
  const siteUrl = "https://cobbra.ai"; // URL oficial de registro do Cobbra

  switch (lead.niche.toLowerCase()) {
    case 'aluguel de carro para uber':
    case 'locador de veiculos':
      return `Olá ${name}! Tudo bem? 🚗

Vi seu anúncio de locação de veículo em ${lead.location}. 

Sabemos que gerenciar aluguel para Ubers e frotistas é um desafio: cobrar o boleto toda semana, controlar CNH vencida, consultar multas no dia/hora do motorista e torcer para o carro não sumir.

Criamos o Cobbra.ai para resolver isso de forma 100% automática! 
• Régua de cobrança semanal via WhatsApp com QR Code Pix (sem taxas!).
• Sistema de controle de CNH e Vistoria Fotográfica na entrega e devolução.
• Módulo de consulta de multas integrado.
• Protocolo de Pânico: notificação extrajudicial em PDF gerada por IA na hora caso o cliente suma.

Comece a testar agora gratuitamente por 3 dias (sem precisar cadastrar cartão de crédito):
👉 Registrar Grátis: ${siteUrl}/login

Qualquer dúvida, nossa IA Catarina estará à sua disposição no canto da tela. Abraço! 🐍✨`;

    case 'emprestimo pessoal':
    case 'credito autonomo':
      return `Olá ${name}! Tudo bem? 💸

Localizamos seu contato de serviços financeiros e suporte a crédito em ${lead.location}. 

Para quem gerencia empréstimos e suporte financeiro P2P, a pontualidade é tudo. Controlar parcelas diárias, semanais ou mensais de forma manual por planilha é exaustivo e gera perda de caixa.

Conheça o Cobbra.ai, a tecnologia mais robusta para gerenciar suas parcelas:
• Recorrências inteligentes: gere cobranças diárias, semanais ou mensais de forma simples.
• Juros de mora configuráveis ao dia calculados automaticamente pós-vencimento.
• Cobrança automática via WhatsApp com QR Code Pix direto pro seu Pix (taxa zero!).
• Régua inteligente de avisos (1 dia antes, no dia do vencimento, e pós-atraso).

Faça seu cadastro em 1 minuto e garanta 3 dias grátis para testar o sistema:
👉 Registrar Grátis: ${siteUrl}/login

Catarina, nossa assistente virtual de cobrança por IA, guiará você no primeiro acesso. Boas cobranças! 🐍✨`;

    case 'servicos de pedreiro':
    case 'empreiteiro':
      return `Olá ${name}! Tudo bem? 🏗️

Encontrei seu contato prestando serviços na área de reformas e construção civil em ${lead.location}. 

Sabemos que um dos maiores problemas na empreitada é o cliente atrasar os pagamentos combinados por etapa da obra, prejudicando a compra de materiais e o pagamento da sua equipe.

O Cobbra.ai ajuda você a organizar seus contratos de forma profissional:
• Geração automática de contratos de prestação de serviços por IA.
• Cobranças automáticas integradas por medição de progresso da obra ou etapas concluídas.
• Notificação amigável via WhatsApp com Pix Copia e Cola enviado direto pro cliente.
• Segurança jurídica: controle total do seu caixa e dos recebíveis.

Garanta seus 3 dias de teste grátis sem qualquer compromisso:
👉 Registrar Grátis: ${siteUrl}/login

A Catarina IA ajudará você a configurar tudo pelo chat do painel em segundos! Bons negócios! 🐍✨`;

    case 'personal trainer':
    case 'estudio de pilates':
      return `Olá ${name}! Tudo bem? 🏋️

Vi seu perfil profissional em saúde e bem-estar na região de ${lead.location}. 

Ficar cobrando mensalidades de alunos no final do treino ou mandando mensagens manuais constrangedoras consome seu tempo e prejudica a relação de confiança com seu cliente.

O Cobbra.ai profissionaliza suas mensalidades:
• Cobrança recorrente no Pix (sem comprometer o limite do cartão do aluno).
• Régua amigável via WhatsApp enviando o Pix com educação e carinho no dia certo.
• Catarina IA: nossa inteligência cobra os atrasados de forma polida por você.
• Painel de controle simples para saber quem pagou em tempo real no seu celular.

Comece agora e tenha 3 dias de acesso premium 100% grátis:
👉 Registrar Grátis: ${siteUrl}/login

Conecte sua chave Pix e veja como é fácil receber no dia certo! 🐍✨`;

    default:
      return `Olá ${name}! Tudo bem? 💼

Localizamos sua prestação de serviços independentes na região de ${lead.location}. 

Quem trabalha por conta própria sabe a dor que é realizar o serviço e sofrer com atrasos e esquecimento na hora do pagamento Pix. Mandar mensagem cobrando é chato e toma tempo.

O Cobbra.ai automatiza toda a sua régua de cobrança no piloto automático:
• Envio automático de lembrete com QR Code Pix no dia e vencimento.
• Cobrança amigável estruturada via WhatsApp pela nossa IA.
• Dinheiro cai direto na sua chave Pix, sem taxas de intermediação de intermediários ou gateways.
• Configuração de juros e multas de atraso no servidor de forma simples.

Registre-se agora e ganhe 3 dias grátis para testar o sistema completo:
👉 Registrar Grátis: ${siteUrl}/login

Deixe a cobrança chata com a Catarina IA e foque apenas no seu negócio! 🐍✨`;
  }
}

// Envia os snippets do Facebook/Google para extração estruturada de leads pela Groq AI
async function extractLeadsWithGroq(rawText, targetNiche, targetCity) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const systemPrompt = `Você é o qualificador e minerador comercial supremo de leads autônomos do Cobbra.ai.
Sua missão é ler os resultados brutos da busca e identificar contatos autônomos legítimos (pessoas físicas, motoristas, locadores individuais, prestadores locais de serviços, credores locais).
Exclua empresas de grande porte corporativas. Foque em profissionais e pequenos negócios.

Retorne EXCLUSIVAMENTE um objeto JSON estruturado contendo a chave "leads" mapeada para um array de objetos:
{
  "leads": [
    {
      "name": "Nome completo ou nome comercial do profissional/locador",
      "phone": "Número do WhatsApp/Telefone encontrado no snippet (mantenha string original)",
      "niche": "O nicho da pessoa mapeado exatamente para um destes valores estritos: 'aluguel de carro para uber', 'locador de veiculos', 'emprestimo pessoal', 'credito autonomo', 'servicos de pedreiro', 'empreiteiro', 'personal trainer', 'estudio de pilates' ou 'geral'",
      "location": "${targetCity}",
      "offer_details": "Condição oferecida no post (ex: Alugo Prisma 2020 para Uber, Empréstimo sem consulta, etc.)"
    }
  ]
}

Não adicione comentários, introduções ou blocos markdown. Retorne APENAS o JSON válido.`;

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
          { role: 'user', content: `Analise as publicações e extraia os leads qualificados do nicho "${targetNiche}" em "${targetCity}":\n\n${rawText}` }
        ],
        temperature: 0.1,
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
    console.error("❌ Erro ao extrair leads via Groq:", e.message);
    return [];
  }
}

// Execução centralizada do pipeline de mineração em lote nas capitais
async function runMassiveOutboundPipeline() {
  if (!groqApiKey) {
    console.error("❌ ERRO: Nenhuma API Key da Groq foi encontrada!");
    process.exit(1);
  }

  console.log(`🤖 ========================================================`);
  console.log(`🤖 COBBRA COMERCIAL AUTOMATION PRO V3 — INICIADO`);
  console.log(`🤖 Mineração em Lote nos Grupos de Dor de Autônomos`);
  console.log(`🤖 ========================================================\n`);

  for (const target of MINING_TARGETS) {
    for (const city of BRAZILIAN_CITIES) {
      console.log(`🔍 [MINANDO] Buscando Leads de "${target.niche}" em "${city}"...`);
      
      const facebookDork = `site:facebook.com/groups OR site:facebook.com/posts OR site:facebook.com/marketplace "${target.query}" "${city}" ("whatsapp" OR "whats" OR "celular" OR "contato" OR "tel")`;
      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(facebookDork)}&hl=pt-br&gl=br&api_key=${serpApiKey}`;

      try {
        const response = await fetch(serpUrl);
        if (!response.ok) {
          console.log(`⚠️ SerpAPI pulou ou limitou busca para "${target.niche}" em "${city}": ${response.status}`);
          continue;
        }

        const data = await response.json();
        const organicResults = data.organic_results || [];

        if (organicResults.length === 0) {
          console.log(`⚠️ Nenhum snippet orgânico para o dork em "${city}".`);
          continue;
        }

        const rawTextData = organicResults.map((r, idx) => {
          return `[Pub #${idx + 1}] Título: ${r.title}\nSnippet: ${r.snippet}\nLink: ${r.link}`;
        }).join('\n\n');

        // Extrair e qualificar autônomos por IA
        const extractedLeads = await extractLeadsWithGroq(rawTextData, target.niche, city);

        const validProspects = [];
        for (const lead of extractedLeads) {
          const cleanPhone = formatWhatsAppNumber(lead.phone);
          if (cleanPhone === 'Não encontrado') continue;

          // Injetar o texto da cópia hiper-personalizada
          lead.phone = cleanPhone;
          lead.location = city;
          const customMsg = generatePersonalizedMessage(lead);

          validProspects.push({
            name: lead.name,
            phone: cleanPhone,
            niche: lead.niche,
            city: city,
            offer_details: lead.offer_details,
            custom_message: customMsg
          });
        }

        console.log(`✅ Groq AI qualificou ${validProspects.length} leads de autônomos reais em ${city}.`);

        // Salvar no SQLite do Cobbra para o monitor do Administrador Senior
        if (db && validProspects.length > 0) {
          const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO leads_prospects (
              id, name, phone, niche, city, offer_details, status, custom_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'ready_to_send', ?, datetime('now'), datetime('now'))
          `);

          let count = 0;
          for (const l of validProspects) {
            const uuid = 'lead-' + Math.random().toString(36).substring(2, 15);
            try {
              const res = insertStmt.run(uuid, l.name, l.phone, l.niche, l.city, l.offer_details, l.custom_message);
              if (res.changes > 0) count++;
            } catch(dbErr) {}
          }
          console.log(`💾 Salvos ${count} novos prospects prontos para disparo automático no banco.`);
        }

      } catch(err) {
        console.error(`❌ Erro no processamento de "${target.niche}" em "${city}":`, err.message);
      }

      // Intervalo de polidez para evitar rate limiting da SerpAPI e da Groq
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n🎉 PIPELINE CONCLUÍDO! Todos os leads minerados e qualificados estão salvos na fila 'ready_to_send' do SQLite.`);
}

runMassiveOutboundPipeline();
