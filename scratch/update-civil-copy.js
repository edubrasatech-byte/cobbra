const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
const DUMP_PATH = path.join(process.cwd(), 'public', 'leads_dump.json');

console.log('🔄 Atualizando copies de construção civil no banco local...');

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Erro: database/cobbra.db não encontrado!');
  process.exit(1);
}

try {
  const db = new Database(DB_PATH);
  
  // Buscar prospects do nicho de construção civil
  const prospects = db.prepare("SELECT id, name, city, custom_message FROM leads_prospects WHERE niche IN ('servicos de pedreiro', 'empreiteiro')").all();
  console.log(`🏗️ Encontrados ${prospects.length} prospects de construção civil.`);

  let updated = 0;
  for (const p of prospects) {
    const name = p.name.split(' ')[0];
    const siteUrl = "https://cobbra.com.br";
    
    // Variáveis amigáveis de saudação e fechamento
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

    const newMsg = `${randGreet} 🏗️

Encontrei seu contato prestando serviços na área de reformas e construção civil em ${p.city}. 

Sabemos que um dos maiores problemas na empreitada é a dor de cabeça para fechar o serviço de forma profissional e a insegurança de atrasos por etapa da obra, prejudicando a compra de materiais e pagamento da equipe.

O Cobbra.ai ajuda você a organizar seus orçamentos e contratos de forma profissional:
• Geração automática de orçamentos profissionais e contratos de prestação de serviços por IA.
• Cobranças automáticas integradas por medição de progresso da obra ou etapas concluídas.
• Notificação amigável via WhatsApp com Pix Copia e Cola enviado direto pro cliente.
• Segurança jurídica: controle total do seu caixa e dos recebíveis.

Garanta seus 3 dias de teste grátis sem qualquer compromisso:
👉 Registrar Grátis: ${siteUrl}/login

${randClose}`;

    db.prepare("UPDATE leads_prospects SET custom_message = ? WHERE id = ?").run(newMsg, p.id);
    updated++;
  }
  
  console.log(`✅ Alterados ${updated} prospects de construção civil no banco local.`);

  // Exportar de volta para o leads_dump.json
  const leads = db.prepare("SELECT * FROM leads_prospects").all();
  fs.writeFileSync(DUMP_PATH, JSON.stringify(leads, null, 2), 'utf-8');
  console.log(`📊 Exportados ${leads.length} leads atualizados para ${DUMP_PATH}`);

  db.close();
} catch (e) {
  console.error('❌ Erro no script:', e.message);
}
