/**
 * 🐍 Cobbra Queue Replacer — Atualizador da Fila de Prospecção
 * 
 * Este script varre toda a tabela 'leads_prospects' no SQLite local
 * e atualiza em lote as mensagens de convite com o novo domínio 'cobbra.com.br'
 * e o novo valor de precificação única e transparente de R$ 49,90.
 * 
 * Execução:
 * node scratch/replace-messages.js
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');

// Auto-detect and fallback to cobroo.db if it has the actual active live data
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
  // Pegamos todos os prospects da fila prontos para envio
  const prospects = db.prepare("SELECT id, name, phone, niche, city, custom_message FROM leads_prospects").all();

  console.log(`🤖 ========================================================`);
  console.log(`🤖 COBBRA COMERCIAL AUTOMATION — RECALIBRADOR DE ABORDAGEM`);
  console.log(`🤖 Total de registros para analisar no banco: ${prospects.length}`);
  console.log(`🤖 ========================================================\n`);

  let updatedCount = 0;
  const updateStmt = db.prepare("UPDATE leads_prospects SET custom_message = ? WHERE id = ?");

  db.transaction(() => {
    for (const p of prospects) {
      if (!p.custom_message) continue;

      let msg = p.custom_message;

      // 1. Forçar a substituição do domínio para o oficial cobbra.com.br
      msg = msg.replace(/cobbra\.ai/gi, 'cobbra.com.br');

      // 2. Injetar a precificação de R$ 49,90 em todas as abordagens de forma garantida
      if (!msg.includes('R$ 49,90') && !msg.includes('49,90')) {
        // Encontra o link de registro e adiciona a menção ao valor logo abaixo para transparência total
        msg = msg.replace(
          /(👉 Registrar Grátis:|👉 Registrar Grátis: https:\/\/cobbra\.com\.br\/login|👉 Registrar Grátis: http:\/\/localhost:3000\/login)/gi,
          `👉 Registrar Grátis: https://cobbra.com.br/login\n\n*(Você testa grátis por 3 dias sem cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix fica por apenas R$ 49,90/mês!)*`
        );
      }

      if (msg !== p.custom_message) {
        updateStmt.run(msg, p.id);
        updatedCount++;
      }
    }
  });

  console.log(`✅ Sucesso! Atualizadas ${updatedCount} abordagens de prospecção com o domínio 'cobbra.com.br' e a precificação de R$ 49,90!`);

} catch (err) {
  console.error("❌ Erro ao atualizar abordagens:", err.message);
} finally {
  db.close();
}
