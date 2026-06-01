/**
 * 🚀 Cobbra Active Dispatcher — Disparador Ativo da Fila Outbound
 * 
 * Este script envia as abordagens personalizadas dos leads que estão na fila 'ready_to_send'.
 * Ele carrega as credenciais da Evolution API do ambiente e realiza o envio com delay inteligente
 * para evitar bloqueios de chip (comportamento humano).
 * 
 * Execução:
 * node scratch/trigger-dispatch.js [limite_de_leads]
 * Exemplo (envia 10 leads): node scratch/trigger-dispatch.js 10
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 1. Carregar variáveis de ambiente
let evoUrl = '';
let evoToken = '';
let outreachInstance = 'cobbra-outreach';

try {
  const checkPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local')
  ];
  for (const p of checkPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const urlMatch = content.match(/^NEXT_PUBLIC_EVOLUTION_API_URL\s*=\s*(.+)$/m) || content.match(/^EVOLUTION_API_URL\s*=\s*(.+)$/m);
      const tokenMatch = content.match(/^EVOLUTION_API_GLOBAL_TOKEN\s*=\s*(.+)$/m) || content.match(/^EVOLUTION_API_TOKEN\s*=\s*(.+)$/m) || content.match(/^EVOLUTION_API_GLOBAL_API_KEY\s*=\s*(.+)$/m) || content.match(/^EVOLUTION_API_KEY\s*=\s*(.+)$/m);
      const instMatch = content.match(/^EVOLUTION_OUTREACH_INSTANCE\s*=\s*(.+)$/m);
      
      if (urlMatch && !evoUrl) evoUrl = urlMatch[1].trim();
      if (tokenMatch && !evoToken) evoToken = tokenMatch[1].trim();
      if (instMatch) outreachInstance = instMatch[1].trim();
    }
  }
} catch(e) {}

// 2. Conectar ao Banco de Dados
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

// 3. Obter Limite por Argumento
const limit = parseInt(process.argv[2] || '5');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWhatsAppMessage({ baseUrl, token, instanceName, phone, text }) {
  const url = `${baseUrl}/message/sendText/${instanceName}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': token
      },
      body: JSON.stringify({
        number: phone,
        text: text,
        delay: 1200
      })
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function run() {
  try {
    // Pegar prospects prontos para envio
    const prospects = db.prepare(`
      SELECT id, name, phone, niche, city, custom_message 
      FROM leads_prospects 
      WHERE status = 'ready_to_send' 
      ORDER BY created_at ASC 
      LIMIT ?
    `).all(limit);

    console.log(`🤖 ========================================================`);
    console.log(`🚀 COBBRA OUTBOUND AUTOMATION — ENVIADOR ATIVO`);
    console.log(`🚀 Limite selecionado para este lote: ${limit} disparos`);
    console.log(`🚀 Total de leads prontos aguardando envio: ${db.prepare("SELECT COUNT(*) as count FROM leads_prospects WHERE status = 'ready_to_send'").get().count}`);
    console.log(`🤖 ========================================================\n`);

    if (prospects.length === 0) {
      console.log("⚠️ Nenhum lead com status 'ready_to_send' na fila de envios.");
      process.exit(0);
    }

    if (!evoUrl || !evoToken) {
      console.log("⚠️ Evolution API não configurada no arquivo .env local.");
      console.log("⚠️ Executando em MODO SIMULAÇÃO (Os status dos leads serão atualizados para 'sent' no banco local!).\n");
    } else {
      console.log(`✅ Evolution API configurada em: ${evoUrl}`);
      console.log(`✅ Instância comercial de prospecção: ${outreachInstance}\n`);
    }

    for (const [index, p] of prospects.entries()) {
      console.log(`👉 [${index + 1}/${prospects.length}] Enviando para: ${p.name} (${p.phone}) [Nicho: ${p.niche}]...`);

      if (!evoUrl || !evoToken) {
        // Simulação
        await sleep(1500); // delay de simulação
        db.prepare("UPDATE leads_prospects SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(p.id);
        console.log(`   ✅ [SIMULADO] Mensagem disparada com sucesso!`);
      } else {
        // Envio Real
        const result = await sendWhatsAppMessage({
          baseUrl: evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl,
          token: evoToken,
          instanceName: outreachInstance,
          phone: p.phone,
          text: p.custom_message
        });

        if (result.success) {
          db.prepare("UPDATE leads_prospects SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(p.id);
          console.log(`   ✅ [ENVIADO REAL] Mensagem disparada com sucesso!`);
          // Safe human-like delay between dispatches (12 seconds)
          await sleep(12000);
        } else {
          db.prepare("UPDATE leads_prospects SET status = 'failed', attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?").run(p.id);
          console.log(`   ❌ [FALHOU] Erro na API:`, result.error);
          await sleep(3000);
        }
      }
    }

    console.log(`\n🎉 Lote de disparos concluído!`);

  } catch (err) {
    console.error("❌ Erro operacional no enviador ativo:", err.message);
  } finally {
    db.close();
  }
}

run();
