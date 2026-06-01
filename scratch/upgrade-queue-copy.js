/**
 * 🐍 Cobbra Queue Perfect Recalibrator — Upgrade Completo das Abordagens na Fila (V2)
 * 
 * Este script atualiza todas as abordagens pendentes da fila no SQLite ativo.
 * 
 * Execução:
 * node scratch/upgrade-queue-copy.js
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');
const OLD_DB_PATH = path.join(process.cwd(), 'database', 'cobroo.db');

if (fs.existsSync(OLD_DB_PATH)) {
  if (!fs.existsSync(DB_PATH)) {
    DB_PATH = OLD_DB_PATH;
  } else {
    const oldSize = fs.statSync(OLD_DB_PATH).size;
    const newSize = fs.statSync(DB_PATH).size;
    if (oldSize > newSize) {
      DB_PATH = OLD_DB_PATH;
    }
  }
}

console.log('🔄 Conectando ao banco de dados em:', DB_PATH);
const db = new Database(DB_PATH);

try {
  const prospects = db.prepare("SELECT id, name, phone, custom_message FROM leads_prospects WHERE status = 'ready_to_send'").all();

  console.log(`🤖 Total de registros na fila: ${prospects.length}`);

  let updatedCount = 0;
  const updateStmt = db.prepare("UPDATE leads_prospects SET custom_message = ? WHERE id = ?");

  db.transaction(() => {
    for (const p of prospects) {
      if (!p.custom_message) continue;

      let msg = p.custom_message;
      const original = msg;

      // 1. Substituir referências do domínio antigo de forma insensível a maiúsculas/minúsculas
      msg = msg.replace(/cobbra\.ai/gi, 'cobbra.com.br');
      msg = msg.replace(/Cobbra\.ai/gi, 'Cobbra.com.br');

      // 2. Banimento absoluto da palavra "régua"
      msg = msg.replace(/régua de cobrança/gi, 'sequência inteligente de lembretes');
      msg = msg.replace(/régua/gi, 'sequência de lembretes');
      msg = msg.replace(/réguas/gi, 'sequências de lembretes');

      // 3. Injetar preço de R$ 49,90/mês e teste de 3 dias grátis
      if (!msg.includes('R$ 49,90') && !msg.includes('49,90')) {
        // Se tiver link com /login, substitui injetando a precificação comercial excelente
        if (msg.includes('https://cobbra.com.br/login')) {
          msg = msg.replace(
            'https://cobbra.com.br/login',
            `https://cobbra.com.br/login\n\n*(Você testa grátis por 3 dias sem cadastrar cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix é de apenas R$ 49,90/mês!)*`
          );
        } else if (msg.includes('👉 Registrar Grátis:')) {
          msg = msg.replace(
            '👉 Registrar Grátis:',
            `👉 Registrar Grátis: https://cobbra.com.br/login\n\n*(Você testa grátis por 3 dias sem cadastrar cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix é de apenas R$ 49,90/mês!)*`
          );
        } else {
          // Fallback final: anexa no final do texto de cadastro
          msg = msg + `\n\n*(Teste grátis por 3 dias. Plano completo sem taxas por apenas R$ 49,90/mês!)*`;
        }
      }

      if (msg !== original) {
        updateStmt.run(msg, p.id);
        updatedCount++;
      }
    }
  })();

  console.log(`✅ Sucesso! Atualizados ${updatedCount} leads prontos!`);

  // Mostrar amostra atualizada do primeiro
  const testSample = db.prepare("SELECT name, phone, custom_message FROM leads_prospects WHERE status = 'ready_to_send' LIMIT 1").get();
  if (testSample) {
    console.log("\n💬 [AMOSTRA DE ABORDAGEM APÓS A ATUALIZAÇÃO]");
    console.log("--------------------------------------------------------------------------------");
    console.log(`Para: ${testSample.name} (${testSample.phone})`);
    console.log("--------------------------------------------------------------------------------");
    console.log(testSample.custom_message);
    console.log("--------------------------------------------------------------------------------");
  }

} catch (err) {
  console.error("❌ Erro:", err.message);
} finally {
  db.close();
}
