const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(process.cwd(), 'database', 'cobbra.db');

console.log('🔄 Conectando ao banco de dados em:', DB_PATH);
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Erro: Arquivo cobbra.db não encontrado!');
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// 1. Gerar Hash do Password 'demo'
const passwordHash = bcrypt.hashSync('demo', 12);
const userId = 'user-demo-cobbra';

console.log('🔑 Senha "demo" hasheada com sucesso!');

try {
  db.transaction(() => {
    // 2. Remover registros anteriores do demo@cobbra.com.br (para possibilitar re-seed limpo)
    db.prepare('DELETE FROM users WHERE id = ? OR email = ?').run(userId, 'demo@cobbra.com.br');

    console.log('🧹 Limpeza concluída para o ID de demonstração.');

    // 3. Inserir Usuário Demo
    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, phone, role, 
        pix_key, pix_key_type, business_name, business_description, 
        plan, plan_expires_at, status, onboarding_completed,
        interest_rate_excellent, interest_rate_regular, interest_rate_risk,
        score_limit_good, score_limit_regular
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      'Demonstração Cobbra',
      'demo@cobbra.com.br',
      passwordHash,
      '(11) 97777-8888',
      'user',
      'demo@cobbra.com.br',
      'email',
      'Cobbra Demo Pay',
      'Plataforma de Cobrança e Gestão de Pagamentos Inteligentes',
      'cobra_pro',
      '2028-12-31T23:59:59.000Z',
      'active',
      1, // onboarding concluído
      0.1, // taxas de juros por faixa
      0.3,
      0.5,
      0.2, // limites de score
      0.4
    );

    console.log('👤 Usuário demo@cobbra.com.br cadastrado!');

    // 4. Inserir Clientes Demo (com scores e dados de teste)
    const clients = [
      { id: 'demo-cli-001', name: 'Mariana Alves', email: 'mariana@email.com', phone: '(11) 91111-1111', category: 'Aluna', tags: 'mensal,pilates', score: 'good', notes: 'Aluna assídua de Pilates, sempre paga antes do vencimento.', charged: 1350, paid: 900, overdue: 0 },
      { id: 'demo-cli-002', name: 'Rodrigo Pacheco', email: 'rodrigo@email.com', phone: '(11) 92222-2222', category: 'Aluno', tags: 'mensal,musculação', score: 'warning', notes: 'Atrasou a mensalidade de musculação este mês.', charged: 450, paid: 0, overdue: 450 },
      { id: 'demo-cli-003', name: 'Juliana Mendes', email: 'juliana@email.com', phone: '(11) 93333-3333', category: 'Aluna', tags: 'mensal,funcional', score: 'good', notes: 'Paga sempre pontualmente no dia 15.', charged: 1000, paid: 1000, overdue: 0 },
      { id: 'demo-cli-004', name: 'Carlos Eduardo', email: 'carlos@email.com', phone: '(11) 94444-4444', category: 'Aluno', tags: 'mensal,personal', score: 'critical', notes: 'Em atraso crítico há dois meses, não responde às mensagens.', charged: 1200, paid: 0, overdue: 1200 },
      { id: 'demo-cli-005', name: 'Ana Paula Santos', email: 'ana.paula@email.com', phone: '(11) 95555-5555', category: 'Aluna', tags: 'semanal,yoga', score: 'good', notes: 'Pratica yoga e paga de forma antecipada.', charged: 400, paid: 200, overdue: 0 },
      { id: 'demo-cli-006', name: 'Fernando Lima', email: 'fernando@email.com', phone: '(11) 96666-6666', category: 'Aluno', tags: 'mensal,crossfit', score: 'good', notes: 'Pratica crossfit, muito disciplinado.', charged: 350, paid: 350, overdue: 0 },
      { id: 'demo-cli-007', name: 'Beatriz Souza', email: 'beatriz@email.com', phone: '(11) 97777-7777', category: 'Aluna', tags: 'mensal,pilates', score: 'warning', notes: 'Pediu para postergar o vencimento deste mês.', charged: 300, paid: 0, overdue: 0 },
      { id: 'demo-cli-008', name: 'Lucas Ferreira', email: 'lucas.f@email.com', phone: '(11) 98888-8888', category: 'Aluno', tags: 'quinzenal,personal', score: 'good', notes: 'Paga a cada 15 dias sem problemas.', charged: 700, paid: 700, overdue: 0 }
    ];

    const insertClient = db.prepare(`
      INSERT INTO clients (
        id, user_id, name, email, phone, category, tags, health_score, notes, 
        total_charged, total_paid, total_overdue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of clients) {
      insertClient.run(c.id, userId, c.name, c.email, c.phone, c.category, c.tags, c.score, c.notes, c.charged, c.paid, c.overdue);
    }
    console.log(`👥 ${clients.length} clientes inseridos e vinculados!`);

    // 5. Inserir Cobranças Demo (Pagas, Vencidas, Pendentes)
    const charges = [
      // Pagas (Histórico)
      { id: 'demo-chg-001', client_id: 'demo-cli-001', amount: 450, desc: 'Mensalidade Pilates - Maio/2026', due: '2026-05-10', status: 'paid', paid_at: '2026-05-09T14:30:00.000Z', paid_amount: 450, reminders: 1 },
      { id: 'demo-chg-002', client_id: 'demo-cli-003', amount: 500, desc: 'Mensalidade Funcional - Maio/2026', due: '2026-05-15', status: 'paid', paid_at: '2026-05-14T10:00:00.000Z', paid_amount: 500, reminders: 1 },
      { id: 'demo-chg-003', client_id: 'demo-cli-006', amount: 350, desc: 'Mensalidade Crossfit - Maio/2026', due: '2026-05-12', status: 'paid', paid_at: '2026-05-12T09:15:00.000Z', paid_amount: 350, reminders: 1 },
      { id: 'demo-chg-004', client_id: 'demo-cli-008', amount: 700, desc: 'Quinzena Personal - 1ª Mai/2026', due: '2026-05-01', status: 'paid', paid_at: '2026-05-01T08:00:00.000Z', paid_amount: 700, reminders: 0 },
      { id: 'demo-chg-005', client_id: 'demo-cli-001', amount: 450, desc: 'Mensalidade Pilates - Abril/2026', due: '2026-04-10', status: 'paid', paid_at: '2026-04-10T11:20:00.000Z', paid_amount: 450, reminders: 1 },
      { id: 'demo-chg-006', client_id: 'demo-cli-003', amount: 500, desc: 'Mensalidade Funcional - Abril/2026', due: '2026-04-15', status: 'paid', paid_at: '2026-04-15T14:30:00.000Z', paid_amount: 500, reminders: 1 },
      { id: 'demo-chg-007', client_id: 'demo-cli-005', amount: 200, desc: 'Aula Yoga Avulsa', due: '2026-05-20', status: 'paid', paid_at: '2026-05-19T17:00:00.000Z', paid_amount: 200, reminders: 1 },

      // Vencidas / Atrasadas
      { id: 'demo-chg-008', client_id: 'demo-cli-004', amount: 600, desc: 'Mensalidade Personal - Maio/2026', due: '2026-05-05', status: 'overdue', paid_at: null, paid_amount: null, reminders: 3 },
      { id: 'demo-chg-009', client_id: 'demo-cli-002', amount: 450, desc: 'Mensalidade Musculação - Maio/2026', due: '2026-05-10', status: 'overdue', paid_at: null, paid_amount: null, reminders: 2 },
      { id: 'demo-chg-010', client_id: 'demo-cli-004', amount: 600, desc: 'Mensalidade Personal - Abril/2026', due: '2026-04-05', status: 'overdue', paid_at: null, paid_amount: null, reminders: 5 },

      // Pendentes / Futuras
      { id: 'demo-chg-011', client_id: 'demo-cli-007', amount: 300, desc: 'Mensalidade Pilates - Junho/2026', due: '2026-05-28', status: 'pending', paid_at: null, paid_amount: null, reminders: 0 },
      { id: 'demo-chg-012', client_id: 'demo-cli-005', amount: 200, desc: 'Aula Yoga Avulsa', due: '2026-05-30', status: 'pending', paid_at: null, paid_amount: null, reminders: 0 },
      { id: 'demo-chg-013', client_id: 'demo-cli-001', amount: 450, desc: 'Mensalidade Pilates - Junho/2026', due: '2026-06-10', status: 'pending', paid_at: null, paid_amount: null, reminders: 0 }
    ];

    const insertCharge = db.prepare(`
      INSERT INTO charges (
        id, user_id, client_id, amount, description, due_date, status, 
        recurrence, reminder_channel, payment_method, daily_interest_rate, 
        paid_at, paid_amount, reminders_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'monthly', 'both', 'pix', 0.005, ?, ?, ?)
    `);

    for (const c of charges) {
      insertCharge.run(c.id, userId, c.client_id, c.amount, c.desc, c.due, c.status, c.paid_at, c.paid_amount, c.reminders);
    }
    console.log(`💰 ${charges.length} cobranças inseridas!`);

    // 6. Inserir Transações Financeiras (Balanço de Caixa)
    const transactions = [
      { id: 'demo-txn-001', chg: 'demo-chg-001', cli: 'demo-cli-001', amount: 450, date: '2026-05-09T14:30:00.000Z', ref: 'PIX-DEMO-001' },
      { id: 'demo-txn-002', chg: 'demo-chg-002', cli: 'demo-cli-003', amount: 500, date: '2026-05-14T10:00:00.000Z', ref: 'PIX-DEMO-002' },
      { id: 'demo-txn-003', chg: 'demo-chg-003', cli: 'demo-cli-006', amount: 350, date: '2026-05-12T09:15:00.000Z', ref: 'PIX-DEMO-003' },
      { id: 'demo-txn-004', chg: 'demo-chg-004', cli: 'demo-cli-008', amount: 700, date: '2026-05-01T08:00:00.000Z', ref: 'PIX-DEMO-004' },
      { id: 'demo-txn-005', chg: 'demo-chg-005', cli: 'demo-cli-001', amount: 450, date: '2026-04-10T11:20:00.000Z', ref: 'PIX-DEMO-005' },
      { id: 'demo-txn-006', chg: 'demo-chg-006', cli: 'demo-cli-003', amount: 500, date: '2026-04-15T14:30:00.000Z', ref: 'PIX-DEMO-006' },
      { id: 'demo-txn-007', chg: 'demo-chg-007', cli: 'demo-cli-005', amount: 200, date: '2026-05-19T17:00:00.000Z', ref: 'PIX-DEMO-007' }
    ];

    const insertTxn = db.prepare(`
      INSERT INTO transactions (
        id, user_id, charge_id, client_id, amount, type, payment_method, reference, created_at
      ) VALUES (?, ?, ?, ?, ?, 'income', 'pix', ?, ?)
    `);

    for (const t of transactions) {
      insertTxn.run(t.id, userId, t.chg, t.cli, t.amount, t.ref, t.date);
    }
    console.log(`📈 ${transactions.length} transações registradas no caixa!`);

    // 7. Inserir Histórico de Lembretes Enviados
    const reminders = [
      { id: 'demo-rem-001', chg: 'demo-chg-001', cli: 'demo-cli-001', channel: 'whatsapp', msg: 'Oi Mariana! 💚 Lembrete gentil: sua mensalidade de Pilates (R$ 450,00) vence amanhã. Pode pagar pelo Pix no link abaixo. Obrigado! 🙏', status: 'read', sent: '2026-05-09T08:00:00.000Z' },
      { id: 'demo-rem-002', chg: 'demo-chg-008', cli: 'demo-cli-004', channel: 'whatsapp', msg: 'Oi Carlos! 💚 Lembrete gentil: sua mensalidade de Personal Trainer (R$ 600,00) vence amanhã. O Pix está no link. Bons treinos! 💪', status: 'delivered', sent: '2026-05-04T08:00:00.000Z' },
      { id: 'demo-rem-003', chg: 'demo-chg-008', cli: 'demo-cli-004', channel: 'email', msg: 'Prezado Carlos Eduardo, lembramos que sua fatura de R$ 600,00 venceu em 05/05/2026. Por favor, acesse o link de pagamento Pix para regularizar.', status: 'sent', sent: '2026-05-12T08:00:00.000Z' }
    ];

    const insertReminder = db.prepare(`
      INSERT INTO reminders (
        id, charge_id, user_id, client_id, channel, message, status, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of reminders) {
      insertReminder.run(r.id, r.chg, userId, r.cli, r.channel, r.msg, r.status, r.sent);
    }
    console.log(`✉️ ${reminders.length} lembretes históricos preenchidos!`);

    // 8. Inserir Notificações Ativas na UI
    const notifications = [
      { id: 'demo-notif-001', type: 'payment', title: 'Pagamento de R$ 500,00 Recebido', msg: 'Juliana Mendes efetuou a quitação da fatura de Funcional via Pix.', read: 0 },
      { id: 'demo-notif-002', type: 'warning', title: 'Cobrança em Atraso Crítico', msg: 'Carlos Eduardo está inadimplente há mais de 15 dias. Lembrete de cobrança firme enviado.', read: 0 },
      { id: 'demo-notif-003', type: 'system', title: 'Ambiente de Demonstração Ativo 🐍', msg: 'Seja bem-vindo ao painel completo da Cobbra. A IA Catarina está online e pronta para responder.', read: 0 }
    ];

    const insertNotif = db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    for (const n of notifications) {
      insertNotif.run(n.id, userId, n.type, n.title, n.msg, n.read);
    }
    console.log(`🔔 ${notifications.length} notificações inseridas no painel!`);

    // 9. Inserir Log de Atividades Recentes
    const activities = [
      { id: 'demo-act-001', action: 'user_login', details: 'Login efetuado no ambiente de testes demo@cobbra.com.br' },
      { id: 'demo-act-002', action: 'charge_created', details: 'Fatura de R$ 450,00 gerada com sucesso para Mariana Alves' },
      { id: 'demo-act-003', action: 'reminder_sent', details: 'Disparo automático de lembrete WhatsApp enviado para Mariana Alves' },
      { id: 'demo-act-004', action: 'payment_received', details: 'PIX Recebido: R$ 450,00 creditado de Mariana Alves' },
      { id: 'demo-act-005', action: 'settings_updated', details: 'Preferências de taxa de juros de atraso reajustadas para 0.5% ao dia' }
    ];

    const insertAct = db.prepare(`
      INSERT INTO activity_log (
        id, user_id, action, details, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `);

    for (const a of activities) {
      insertAct.run(a.id, userId, a.action, a.details);
    }
    console.log(`📝 ${activities.length} logs de atividades recentes criados!`);

    // 10. Inserir Configurações Específicas
    const settings = [
      { id: 'demo-set-001', key: 'ai_active', val: 'true' },
      { id: 'demo-set-002', key: 'whatsapp_integration', val: 'connected' },
      { id: 'demo-set-003', key: 'interest_rate_mode', val: 'daily' }
    ];

    const insertSetting = db.prepare(`
      INSERT INTO settings (
        id, user_id, key, value
      ) VALUES (?, ?, ?, ?)
    `);

    for (const s of settings) {
      insertSetting.run(s.id, userId, s.key, s.val);
    }
    console.log(`⚙️ Configurações de demonstração salvas!`);

    // 11. Inserir Faturamento Diário Recorrente (Versão 2.3)
    db.prepare(`
      INSERT INTO daily_billing (
        id, user_id, client_id, amount, description, interest_rate, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      'demo-daily-001',
      userId,
      'demo-cli-005', // Ana Paula
      200.00,
      'Mensalidade Yoga Recorrente',
      0.005,
      'active'
    );
    console.log(`📅 Faturamento diário recorrente cadastrado para simulação!`);

  });

  console.log('🎉 SUCESSO! A conta demo@cobbra.com.br foi completamente populada com dados de demonstração de alta fidelidade!');
} catch (err) {
  console.error('❌ Erro crítico ao rodar o seed do banco de dados:', err);
  process.exit(1);
} finally {
  db.close();
}
