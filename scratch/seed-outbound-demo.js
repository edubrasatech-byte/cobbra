const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');

console.log('🔄 Conectando ao banco de dados em:', DB_PATH);
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Erro: Arquivo cobbra.db não encontrado!');
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const mockLeads = [
  {
    id: 'lead-mock-001',
    name: 'Felipe Locador Uber',
    phone: '5511999991111',
    niche: 'aluguel de carro para uber',
    city: 'São Paulo',
    offer_details: 'Aluguel de Prisma 2021 completo para motoristas de aplicativo',
    status: 'ready_to_send',
    custom_message: `Olá Felipe! Tudo bem? 🚗

Vi seu anúncio de locação de veículo em São Paulo. 

Sabemos que gerenciar aluguel para Ubers e frotistas é um desafio: cobrar o boleto toda semana, controlar CNH vencida, consultar multas no dia/hora do motorista e torcer para o carro não sumir.

Criamos o Cobbra.ai para resolver isso de forma 100% automática! 
• Sequência inteligente de lembretes semanal via WhatsApp com QR Code Pix (sem taxas!).
• Sistema de controle de CNH e Vistoria Fotográfica na entrega e dev devolução.
• Módulo de consulta de multas integrado.
• Protocolo de Pânico: notificação extrajudicial em PDF gerada por IA na hora caso o cliente suma.

Comece a testar agora gratuitamente por 3 dias (sem precisar cadastrar cartão de crédito):
👉 Registrar Grátis: https://cobbra.com.br/login

*(Você testa grátis por 3 dias sem cadastrar cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix é de apenas R$ 49,90/mês!)*

Nossa assistente virtual Catarina IA está online pronta para tirar qualquer dúvida no dashboard. Vamos pra cima! 🐍✨`
  },
  {
    id: 'lead-mock-002',
    name: 'Carlos Empréstimos',
    phone: '5521988882222',
    niche: 'emprestimo pessoal',
    city: 'Rio de Janeiro',
    offer_details: 'Crédito pessoal rápido sem burocracia para autônomos',
    status: 'ready_to_send',
    custom_message: `Oi Carlos, tudo joia por aí? 💸

Localizamos seu contato de serviços financeiros e suporte a crédito em Rio de Janeiro. 

Para quem gerencia empréstimos e suporte financeiro P2P, a pontualidade é tudo. Controlar parcelas diárias, semanais ou mensais de forma manual por planilha é exaustivo e gera perda de caixa.

Conheça o Cobbra.ai, a tecnologia mais robusta para gerenciar suas parcelas:
• Recorrências inteligentes: gere cobranças diárias, semanais ou mensais de forma simples.
• Juros de mora configuráveis ao dia calculados automaticamente pós-vencimento.
• Cobrança automática via WhatsApp com QR Code Pix direto pro seu Pix (taxa zero!).
• Sequência inteligente de avisos (1 dia antes, no dia do vencimento, e pós-atraso).

Faça seu cadastro em 1 minuto e garanta 3 dias grátis para testar o sistema:
👉 Registrar Grátis: https://cobbra.com.br/login

*(Você testa grátis por 3 dias sem cadastrar cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix é de apenas R$ 49,90/mês!)*

Qualquer dúvida, nossa IA Catarina estará à sua disposição no canto da tela. Abraço! 🐍✨`
  },
  {
    id: 'lead-mock-003',
    name: 'Roberto Construtor',
    phone: '5531977773333',
    niche: 'servicos de pedreiro',
    city: 'Belo Horizonte',
    offer_details: 'Reformas em geral, pedreiro e acabamento fino',
    status: 'sent',
    custom_message: `Tudo bem, Roberto? Espero que sim! 🏗️

Encontrei seu contato prestando serviços na área de reformas e construção civil em Belo Horizonte. 

Sabemos que um dos maiores problemas na empreitada é o cliente atrasar os pagamentos combinados por etapa da obra, prejudicando a compra de materiais e o pagamento da sua equipe.

O Cobbra.ai ajuda você a organizar seus contratos de forma profissional:
• Geração automática de contratos de prestação de serviços por IA.
• Cobranças automáticas integradas por medição de progresso da obra ou etapas concluídas.
• Notificação amigável via WhatsApp com Pix Copia e Cola enviado direto pro cliente.
• Segurança jurídica: controle total do seu caixa e dos recebíveis.

Garanta seus 3 dias de teste grátis sem qualquer compromisso:
👉 Registrar Grátis: https://cobbra.com.br/login

Se precisar de uma força, a Catarina IA ajuda você a configurar tudo pelo chat do painel. Sucesso! 🐍✨`
  },
  {
    id: 'lead-mock-004',
    name: 'Amanda Personal',
    phone: '5541966664444',
    niche: 'personal trainer',
    city: 'Curitiba',
    offer_details: 'Personal trainer consultoria online e presencial',
    status: 'failed',
    custom_message: `Olá Amanda! Tudo bem? 🏋️

Vi seu perfil profissional em saúde e bem-estar na região de Curitiba. 

Ficar cobrando mensalidades de alunos no final do treino ou mandando mensagens manuais constrangedoras consome seu tempo e prejudica a relação de confiança com seu cliente.

O Cobbra.ai profissionaliza suas mensalidades:
• Cobrança recorrente no Pix (sem comprometer o limite do cartão do aluno).
• Lembrete amigável via WhatsApp enviando o Pix com educação e carinho no dia certo.
• Catarina IA: nossa inteligência cobra os atrasados de forma polida por você.
• Painel de controle simples para saber quem pagou em tempo real no seu celular.

Comece agora e tenha 3 dias de acesso premium 100% grátis:
👉 Registrar Grátis: https://cobbra.com.br/login

Nossa assistente virtual Catarina IA está online pronta para tirar qualquer dúvida no dashboard. Vamos pra cima! 🐍✨`
  },
  {
    id: 'lead-mock-005',
    name: 'Pilates Vida',
    phone: '5551955555555',
    niche: 'estudio de pilates',
    city: 'Porto Alegre',
    offer_details: 'Estúdio de pilates completo mensalidades promocionais',
    status: 'ready_to_send',
    custom_message: `Oi Pilates Vida, tudo joia por aí? 🏋️

Vi seu perfil profissional em saúde e bem-estar na região de Porto Alegre. 

Ficar cobrando mensalidades de alunos no final do treino ou mandando mensagens manuais constrangedoras consome seu tempo e prejudica a relação de confiança com seu cliente.

O Cobbra.ai profissionaliza suas mensalidades:
• Cobrança recorrente no Pix (sem comprometer o limite do cartão do aluno).
• Lembrete amigável via WhatsApp enviando o Pix com educação e carinho no dia certo.
• Catarina IA: nossa inteligência cobra os atrasados de forma polida por você.
• Painel de controle simples para saber quem pagou em tempo real no seu celular.

Comece agora e tenha 3 dias de acesso premium 100% grátis:
👉 Registrar Grátis: https://cobbra.com.br/login

*(Você testa grátis por 3 dias sem cadastrar cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix é de apenas R$ 49,90/mês!)*

Se precisar de uma força, a Catarina IA ajuda você a configurar tudo pelo chat do painel. Sucesso! 🐍✨`
  }
];

try {
  db.transaction(() => {
    // Limpar leads de demonstração anteriores na tabela leads_prospects
    db.prepare("DELETE FROM leads_prospects WHERE id LIKE 'lead-mock-%'").run();
    
    const insertStmt = db.prepare(`
      INSERT INTO leads_prospects (
        id, name, phone, niche, city, offer_details, status, custom_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    for (const lead of mockLeads) {
      insertStmt.run(
        lead.id,
        lead.name,
        lead.phone,
        lead.niche,
        lead.city,
        lead.offer_details,
        lead.status,
        lead.custom_message
      );
    }
  })();
  console.log('✅ SUCESSO! 5 leads de demonstração foram populados na fila leads_prospects.');
} catch (e) {
  console.error('❌ Erro ao popular leads_prospects:', e.message);
} finally {
  db.close();
}
