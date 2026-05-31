/**
 * 🐍 Cobbra Queue Viewer — Visualizador Rápido da Fila Outbound
 * 
 * Este script consulta a tabela 'leads_prospects' no SQLite local
 * e exibe de forma organizada os leads qualificados prontos para envio.
 * 
 * Execução:
 * node scratch/view-queue.js
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Erro: Banco de dados cobbra.db não encontrado.');
  process.exit(1);
}

const db = new Database(DB_PATH);

try {
  // Consultar todos os leads prontos para envio
  const prospects = db.prepare(`
    SELECT name, phone, niche, city, status, custom_message 
    FROM leads_prospects 
    WHERE status = 'ready_to_send'
    ORDER BY created_at DESC
  `).all();

  console.log(`🤖 ========================================================`);
  console.log(`🤖 COBBRA OUTBOUND QUEUE MONITOR — LEADS PRONTOS`);
  console.log(`🤖 Total na fila 'ready_to_send': ${prospects.length} leads`);
  console.log(`🤖 ========================================================\n`);

  if (prospects.length === 0) {
    console.log("⚠️ Nenhum lead na fila 'ready_to_send' no momento.");
    console.log("💡 Dica: Rode o script 'node scratch/lead-scraper-autonomos.js' para qualificar e preencher a fila.");
    process.exit(0);
  }

  // Tabela resumida
  console.table(prospects.map(p => ({
    Nome: p.name.substring(0, 25),
    WhatsApp: p.phone,
    Nicho: p.niche,
    Cidade: p.city,
    Status: p.status
  })));

  // Mostrar uma amostra da mensagem personalizada do primeiro lead
  console.log("\n💬 [AMOSTRA DE ABORDAGEM PERSONALIZADA (Primeiro da fila)]");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Para: ${prospects[0].name} (${prospects[0].phone})`);
  console.log("--------------------------------------------------------------------------------");
  console.log(prospects[0].custom_message);
  console.log("--------------------------------------------------------------------------------");

} catch (err) {
  console.error("❌ Erro ao consultar a fila:", err.message);
} finally {
  db.close();
}
