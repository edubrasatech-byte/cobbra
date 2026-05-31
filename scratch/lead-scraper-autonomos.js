/**
 * 🐍 Cobbra Lead Scraper Autônomos v4 — Automatizador de Prospecção Fria Multicanais
 * 
 * ESPECIFICAÇÕES DE EVOLUÇÃO (V4):
 * 1. Prevenção Absoluta de Duplicados: Telefones que já receberam mensagem ('sent') ou falharam ('failed')
 *    são preservados no banco e NUNCA são sobrescritos ou reinseridos na fila 'ready_to_send'.
 * 2. Fluxo de Segundo-Contato (Second Touchpoint): Contatos marcados como 'sent' são mantidos intactos, 
 *    permitindo campanhas futuras de acompanhamento ("follow-up").
 * 3. Rotatividade e Variabilidade das Abordagens (Groq AI): A IA utiliza sementes variáveis para garantir
 *    que a cópia de abordagem nunca repita exatamente as mesmas palavras a cada execução.
 * 4. Mineração Massiva Aumentada (Deep Extraction): Busca expandida para até 50 resultados orgânicos por dork
 *    via SerpAPI (usando paginação `num=50`) para maximizar a captura de contatos a cada lote.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const MINING_TARGETS = [
  { niche: 'aluguel de carro para uber', query: 'aluguel de carro para uber OR aluguel de frota cnh' },
  { niche: 'locador de veiculos', query: 'locação de carros uber OR alugo carro curitiba' },
  { niche: 'emprestimo pessoal', query: 'emprestimo pessoal rapido OR emprestimo dinheiro' },
  { niche: 'credito autonomo', query: 'dinheiro na hora juros diários OR emprestimo sem burocracia' },
  { niche: 'servicos de pedreiro', query: 'pedreiro reforma OR construtor empreiteira' },
  { niche: 'empreiteiro', query: 'pintor encanador eletricista orçamento reforma' },
  { niche: 'personal trainer', query: 'personal trainer mensalidade OR consultoria fitness' },
  { niche: 'estudio de pilates', query: 'estúdio de pilates mensalidade' }
];

const BRAZILIAN_CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre',
  'Salvador', 'Fortaleza', 'Recife', 'Goiânia', 'Campinas', 'Florianópolis'
];

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

function generatePersonalizedMessage(lead) {
  const name = lead.name.split(' ')[0];
  const siteUrl = "https://cobbra.ai";
  
  // Sementes de variabilidade para a introdução e o fechamento
  const greetings = [
    `Olá ${name}! Tudo bem?`,
    `Oi ${name}, tudo joia por aí?`,
    `Tudo bem, ${name}? Espero que sim!`
  ];
  const closings = [
    `Qualquer dúvida, nossa IA Catarina estará à sua disposição no canto da tela. Abraço! 🐍✨`,
    `Se precisar de uma força, a Catarina IA ajuda você a configurar tudo pelo chat do painel. Sucesso! 🐍✨`,
    `Nossa assistente virtual Catarina IA está online pronta para tirar qualquer dúvida no dashboard. Vamos pra cima! 🐍✨`
  ];
  
  const randGreet = greetings[Math.floor(Math.random() * greetings.length)];
  const randClose = closings[Math.floor(Math.random() * closings.length)];

  switch (lead.niche.toLowerCase()) {
    case 'aluguel de carro para uber':
    case 'locador de veiculos':
      return `${randGreet} 🚗

Vi seu anúncio de locação de veículo em ${lead.location}. 

Sabemos que gerenciar aluguel para Ubers e frotistas é um desafio: cobrar o boleto toda semana, controlar CNH vencida, consultar multas no dia/hora do motorista e torcer para o carro não sumir.

Criamos o Cobbra.ai para resolver isso de forma 100% automática! 
• Régua de cobrança semanal via WhatsApp com QR Code Pix (sem taxas!).
• Sistema de controle de CNH e Vistoria Fotográfica na entrega e devolução.
• Módulo de consulta de multas integrado.
• Protocolo de Pânico: notificação extrajudicial em PDF gerada por IA na hora caso o cliente suma.

Comece a testar agora gratuitamente por 3 dias (sem precisar cadastrar cartão de crédito):
👉 Registrar Grátis: ${siteUrl}/login

${randClose}`;

    case 'emprestimo pessoal':
    case 'credito autonomo':
      return `${randGreet} 💸

Localizamos seu contato de serviços financeiros e suporte a crédito em ${lead.location}. 

Para quem gerencia empréstimos e suporte financeiro P2P, a pontualidade é tudo. Controlar parcelas diárias, semanais ou mensais de forma manual por planilha é exaustivo e gera perda de caixa.

Conheça o Cobbra.ai, a tecnologia mais robusta para gerenciar suas parcelas:
• Recorrências inteligentes: gere cobranças diárias, semanais ou mensais de forma simples.
• Juros de mora configuráveis ao dia calculados automaticamente pós-vencimento.
• Cobrança automática via WhatsApp com QR Code Pix direto pro seu Pix (taxa zero!).
• Régua inteligente de avisos (1 dia antes, no dia do vencimento, e pós-atraso).

Faça seu cadastro em 1 minuto e garanta 3 dias grátis para testar o sistema:
👉 Registrar Grátis: ${siteUrl}/login

${randClose}`;

    case 'servicos de pedreiro':
    case 'empreiteiro':
      return `${randGreet} 🏗️

Encontrei seu contato prestando serviços na área de reformas e construção civil em ${lead.location}. 

Sabemos que um dos maiores problemas na empreitada é o cliente atrasar os pagamentos combinados por etapa da obra, prejudicando a compra de materiais e o pagamento da sua equipe.

O Cobbra.ai ajuda você a organizar seus contratos de forma profissional:
• Geração automática de contratos de prestação de serviços por IA.
• Cobranças automáticas integradas por medição de progresso da obra ou etapas concluídas.
• Notificação amigável via WhatsApp com Pix Copia e Cola enviado direto pro cliente.
• Segurança jurídica: controle total do seu caixa e dos recebíveis.

Garanta seus 3 dias de teste grátis sem qualquer compromisso:
👉 Registrar Grátis: ${siteUrl}/login

${randClose}`;

    case 'personal trainer':
    case 'estudio de pilates':
      return `${randGreet} 🏋️

Vi seu perfil profissional em saúde e bem-estar na região de ${lead.location}. 

Ficar cobrando mensalidades de alunos no final do treino ou mandando mensagens manuais constrangedoras consome seu tempo e prejudica a relação de confiança com seu cliente.

O Cobbra.ai profissionaliza suas mensalidades:
• Cobrança recorrente no Pix (sem comprometer o limite do cartão do aluno).
• Régua amigável via WhatsApp enviando o Pix com educação e carinho no dia certo.
• Catarina IA: nossa inteligência cobra os atrasados de forma polida por você.
• Painel de controle simples para saber quem pagou em tempo real no seu celular.

Comece agora e tenha 3 dias de acesso premium 100% grátis:
👉 Registrar Grátis: ${siteUrl}/login

${randClose}`;

    default:
      return `${randGreet} 💼

Localizamos sua prestação de serviços independentes na região de ${lead.location}. 

Quem trabalha por conta própria sabe a dor que é realizar o serviço e sofrer com atrasos e esquecimento na hora do pagamento Pix. Mandar mensagem cobrando é chato e toma tempo.

O Cobbra.ai automatiza toda a sua régua de cobrança no piloto automático:
• Envio automático de lembrete com QR Code Pix no dia e vencimento.
• Cobrança amigável estruturada via WhatsApp pela nossa IA.
• Dinheiro cai direto na sua chave Pix, sem taxas de intermediação de intermediários ou gateways.
• Configuração de juros e multas de atraso no servidor de forma simples.

Registre-se agora e ganhe 3 dias grátis para testar o sistema completo:
👉 Registrar Grátis: ${siteUrl}/login

${randClose}`;
  }
}

async function extractLeadsWithGroq(rawText, targetNiche, targetCity) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Semente dinâmica para forçar a Groq a mudar sua estruturação de dados
  const dynamicSeed = Math.floor(Math.random() * 10000);

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

ID de Geração Única: seed-${dynamicSeed}. Varie levemente o estilo das estruturas e extrações para evitar repetição.
Não adicione comentários, introduções ou blocos markdown. Retorne APENAS o JSON válido.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise as publicações e extraia os leads qualificados do nicho "${targetNiche}" em "${targetCity}":\n\n${rawText}` }
        ],
        temperature: 0.3, // Aumentado ligeiramente para maior variabilidade criativa nas abordagens
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

async function runMassiveOutboundPipeline() {
  if (!groqApiKey) {
    console.error("❌ ERRO: Nenhuma API Key da Groq foi encontrada!");
    process.exit(1);
  }

  console.log(`🤖 ========================================================`);
  console.log(`🤖 COBBRA COMERCIAL AUTOMATION PRO V4 (DEEP EXTRACTION)`);
  console.log(`🤖 Mineração em Lote de Alta Performance e Proteção Antiduplicados`);
  console.log(`🤖 ========================================================\n`);

  for (const target of MINING_TARGETS) {
    for (const city of BRAZILIAN_CITIES) {
      console.log(`🔍 [MINANDO] Buscando Leads de "${target.niche}" em "${city}"...`);
      
      // DEEP EXTRACTION: num=50 para buscar o máximo de posts orgânicos possíveis
      const facebookDork = `site:facebook.com/groups OR site:facebook.com/posts OR site:facebook.com/marketplace "${target.query}" "${city}" ("whatsapp" OR "whats" OR "celular" OR "contato" OR "tel")`;
      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(facebookDork)}&hl=pt-br&gl=br&num=50&api_key=${serpApiKey}`;

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

        const extractedLeads = await extractLeadsWithGroq(rawTextData, target.niche, city);

        const validProspects = [];
        for (const lead of extractedLeads) {
          const cleanPhone = formatWhatsAppNumber(lead.phone);
          if (cleanPhone === 'Não encontrado') continue;

          // EVOLUÇÃO 1 & 2: Verificar se já enviamos mensagem ou tentamos contato anteriormente com este número
          if (db) {
            const existing = db.prepare("SELECT status FROM leads_prospects WHERE phone = ?").get(cleanPhone);
            if (existing) {
              // Se já foi enviado ('sent'), falhou ('failed') ou está na fila, NÃO re-adiciona e preserva para o follow-up
              console.log(`⏭️ Lead ${lead.name} (${cleanPhone}) já existe no histórico (Status: ${existing.status}). Pulado e preservado.`);
              continue;
            }
          }

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

        console.log(`✅ Groq AI qualificou ${validProspects.length} leads de autônomos novos e inéditos em ${city}.`);

        // Salvar no SQLite
        if (db && validProspects.length > 0) {
          const insertStmt = db.prepare(`
            INSERT INTO leads_prospects (
              id, name, phone, niche, city, offer_details, status, custom_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'ready_to_send', ?, datetime('now'), datetime('now'))
          `);

          let count = 0;
          for (const l of validProspects) {
            const uuid = 'lead-' + Math.random().toString(36).substring(2, 15);
            try {
              const res = insertStmt.run(uuid, l.name, l.phone, l.niche, l.city, l.offer_details, l.custom_message);
              if (res.changes > 0) count++;
            } catch(dbErr) {
              console.error("Erro ao inserir:", dbErr.message);
            }
          }
          console.log(`💾 Salvos ${count} novos prospects prontos para disparo automático no banco.`);
        }

      } catch(err) {
        console.error(`❌ Erro no processamento de "${target.niche}" em "${city}":`, err.message);
      }

      // Aumentado o intervalo de polidez para 6.5 segundos para evitar estouro de limite de requisições (Rate Limit Exceeded)
      await new Promise(r => setTimeout(r, 6500));
    }
  }

  console.log(`\n🎉 PIPELINE CONCLUÍDO! Todos os novos leads qualificados e inéditos foram minerados de forma massiva e salvos na fila.`);
}

runMassiveOutboundPipeline();
