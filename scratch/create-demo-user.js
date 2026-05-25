/**
 * COBROO - Demo Account Seeder
 * Creates a fully functional and populated demo account (demo@cobbra.com.br / demo)
 */

const bcrypt = require('bcryptjs');
const { run, queryOne, generateId } = require('../lib/db');

async function seedDemoAccount() {
  console.log('🌱 Starting demo account seeder...');

  const email = 'demo@cobbra.com.br';
  const password = 'demo';
  
  // 1. Generate password hash
  const passwordHash = bcrypt.hashSync(password, 12);
  const userId = 'demo-user-id-999';

  // Delete existing demo user to avoid key conflicts
  run('DELETE FROM users WHERE id = ? OR email = ?', [userId, email]);
  run('DELETE FROM clients WHERE user_id = ?', [userId]);
  run('DELETE FROM charges WHERE user_id = ?', [userId]);
  run('DELETE FROM reminders WHERE user_id = ?', [userId]);
  run('DELETE FROM transactions WHERE user_id = ?', [userId]);
  run('DELETE FROM daily_billing WHERE user_id = ?', [userId]);
  run('DELETE FROM notifications WHERE user_id = ?', [userId]);
  run('DELETE FROM activity_log WHERE user_id = ?', [userId]);

  // 2. Insert User
  run(`
    INSERT INTO users (
      id, name, email, password_hash, phone, role, pix_key, pix_key_type, 
      business_name, business_description, plan, plan_expires_at, status, 
      onboarding_completed, interest_rate_excellent, interest_rate_regular, interest_rate_risk
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userId,
    'Felipe Rezende (Demo)',
    email,
    passwordHash,
    '(11) 98888-7777',
    'user',
    'demo@cobbra.com.br',
    'email',
    'Rezende Fit Studio',
    'Treinamento personalizado e consultoria esportiva de alta performance.',
    'pro',
    '2030-12-31T23:59:59.000Z',
    'active',

    1,
    0.1,
    0.3,
    0.5
  ]);
  console.log('✅ User demo@cobbra.com.br created successfully!');

  // 3. Insert Clients
  const clients = [
    { id: 'demo-cli-001', name: 'Arthur Nogueira', email: 'arthur.nogueira@email.com', phone: '(11) 97777-1111', category: 'Pilates', tags: 'mensal,individual', health_score: 'good', notes: 'Aluno muito dedicado, sempre paga em dia.', total_charged: 900.0, total_paid: 450.0, total_overdue: 0.0 },
    { id: 'demo-cli-002', name: 'Beatriz Camargo', email: 'beatriz.camargo@email.com', phone: '(11) 97777-2222', category: 'Crossfit', tags: 'mensal,grupo', health_score: 'warning', notes: 'Costuma atrasar de 3 a 5 dias.', total_charged: 700.0, total_paid: 350.0, total_overdue: 350.0 },
    { id: 'demo-cli-003', name: 'Gustavo Silveira', email: 'gustavo.silveira@email.com', phone: '(11) 97777-3333', category: 'Consultoria', tags: 'trimestral,premium', health_score: 'critical', notes: 'Atraso longo, precisa de cobrança ativa com juros.', total_charged: 2400.0, total_paid: 1200.0, total_overdue: 1200.0 },
    { id: 'demo-cli-004', name: 'Patricia Lemos', email: 'patricia.lemos@email.com', phone: '(11) 97777-4444', category: 'Funcional', tags: 'mensal,dupla', health_score: 'good', notes: 'Paga antecipado para garantir o horário.', total_charged: 1000.0, total_paid: 500.0, total_overdue: 0.0 },
    { id: 'demo-cli-005', name: 'Thiago Martins', email: 'thiago.martins@email.com', phone: '(11) 97777-5555', category: 'Personal', tags: 'diario,musculação', health_score: 'good', notes: 'Faturamento diário configurado.', total_charged: 300.0, total_paid: 250.0, total_overdue: 0.0 },
    { id: 'demo-cli-006', name: 'Camila Vianna', email: 'camila.vianna@email.com', phone: '(11) 97777-6666', category: 'Yoga', tags: 'diario,alongamento', health_score: 'warning', notes: 'Faturamento diário com pequenos atrasos.', total_charged: 480.0, total_paid: 400.0, total_overdue: 80.0 }
  ];

  for (const cli of clients) {
    run(`
      INSERT INTO clients (id, user_id, name, email, phone, category, tags, health_score, notes, total_charged, total_paid, total_overdue)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [cli.id, userId, cli.name, cli.email, cli.phone, cli.category, cli.tags, cli.health_score, cli.notes, cli.total_charged, cli.total_paid, cli.total_overdue]);
  }
  console.log('✅ Clients populated!');

  // 4. Insert Charges
  // Calculate relative dates for realism
  const getRelativeDateStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const charges = [
    // Arthur Nogueira
    { id: 'demo-chg-001', client_id: 'demo-cli-001', amount: 450.0, description: 'Mensalidade Pilates - Abril/2026', due_date: getRelativeDateStr(-25), status: 'paid', recurrence: 'monthly', reminder_channel: 'whatsapp', payment_method: 'pix', paid_at: getRelativeDateStr(-26) + 'T14:30:00.000Z', daily_interest_rate: 0.0, reminders_sent: 1 },
    { id: 'demo-chg-002', client_id: 'demo-cli-001', amount: 450.0, description: 'Mensalidade Pilates - Maio/2026', due_date: getRelativeDateStr(5), status: 'pending', recurrence: 'monthly', reminder_channel: 'whatsapp', payment_method: 'pix', paid_at: null, daily_interest_rate: 0.2, reminders_sent: 0 },
    
    // Beatriz Camargo (Overdue by 4 days, daily interest 0.5%)
    { id: 'demo-chg-003', client_id: 'demo-cli-002', amount: 350.0, description: 'Mensalidade Crossfit - Maio/2026', due_date: getRelativeDateStr(-4), status: 'reminder_sent', recurrence: 'monthly', reminder_channel: 'both', payment_method: 'pix', paid_at: null, daily_interest_rate: 0.5, reminders_sent: 2 },
    
    // Gustavo Silveira (Overdue by 12 days, daily interest 0.3%)
    { id: 'demo-chg-004', client_id: 'demo-cli-003', amount: 1200.0, description: 'Consultoria Premium - Maio/2026', due_date: getRelativeDateStr(-12), status: 'overdue', recurrence: 'once', reminder_channel: 'both', payment_method: 'pix', paid_at: null, daily_interest_rate: 0.3, reminders_sent: 4 },
    
    // Patricia Lemos
    { id: 'demo-chg-005', client_id: 'demo-cli-004', amount: 500.0, description: 'Funcional Trimestral - Parcela 1/3', due_date: getRelativeDateStr(-30), status: 'paid', recurrence: 'once', reminder_channel: 'email', payment_method: 'pix', paid_at: getRelativeDateStr(-31) + 'T10:00:00.000Z', daily_interest_rate: 0.0, reminders_sent: 1 },
    { id: 'demo-chg-006', client_id: 'demo-cli-004', amount: 500.0, description: 'Funcional Trimestral - Parcela 2/3', due_date: getRelativeDateStr(0), status: 'pending', recurrence: 'once', reminder_channel: 'email', payment_method: 'pix', paid_at: null, daily_interest_rate: 0.1, reminders_sent: 0 }
  ];

  for (const chg of charges) {
    run(`
      INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, paid_at, daily_interest_rate, reminders_sent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [chg.id, userId, chg.client_id, chg.amount, chg.description, chg.due_date, chg.status, chg.recurrence, chg.reminder_channel, chg.payment_method, chg.paid_at, chg.daily_interest_rate, chg.reminders_sent]);
  }
  console.log('✅ Charges populated!');

  // 5. Insert Daily Billing (Cobrança Diária)
  const dailyBillings = [
    { id: 'demo-dbill-001', client_id: 'demo-cli-005', amount: 50.0, description: 'Personal Diário - Musculação', interest_rate: 0.2, status: 'active', end_date: getRelativeDateStr(60), exclude_saturdays: 0, exclude_sundays_holidays: 1 },
    { id: 'demo-dbill-002', client_id: 'demo-cli-006', amount: 80.0, description: 'Yoga Diária - Alongamento', interest_rate: 0.3, status: 'paused', end_date: getRelativeDateStr(30), exclude_saturdays: 1, exclude_sundays_holidays: 1 }
  ];

  for (const dbill of dailyBillings) {
    run(`
      INSERT INTO daily_billing (id, user_id, client_id, amount, description, interest_rate, status, end_date, exclude_saturdays, exclude_sundays_holidays)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [dbill.id, userId, dbill.client_id, dbill.amount, dbill.description, dbill.interest_rate, dbill.status, dbill.end_date, dbill.exclude_saturdays, dbill.exclude_sundays_holidays]);
  }
  console.log('✅ Daily billing records populated!');

  // 6. Insert Transactions
  const transactions = [
    { id: 'demo-txn-001', charge_id: 'demo-chg-001', client_id: 'demo-cli-001', amount: 450.0, type: 'income', payment_method: 'pix', reference: 'PIX-DEMO-001', created_at: getRelativeDateStr(-26) + 'T14:30:00.000Z' },
    { id: 'demo-txn-002', charge_id: 'demo-chg-005', client_id: 'demo-cli-004', amount: 500.0, type: 'income', payment_method: 'pix', reference: 'PIX-DEMO-002', created_at: getRelativeDateStr(-31) + 'T10:00:00.000Z' },
    { id: 'demo-txn-003', charge_id: null, client_id: 'demo-cli-005', amount: 50.0, type: 'income', payment_method: 'pix', reference: 'PIX-DBILL-001', created_at: getRelativeDateStr(-1) + 'T09:15:00.000Z' },
    { id: 'demo-txn-004', charge_id: null, client_id: 'demo-cli-005', amount: 50.0, type: 'income', payment_method: 'pix', reference: 'PIX-DBILL-002', created_at: getRelativeDateStr(-2) + 'T08:00:00.000Z' }
  ];

  for (const txn of transactions) {
    run(`
      INSERT INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method, reference, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [txn.id, userId, txn.charge_id, txn.client_id, txn.amount, txn.type, txn.payment_method, txn.reference, txn.created_at]);
  }
  console.log('✅ Transactions populated!');

  // 7. Insert Activity Log
  const activities = [
    { id: 'demo-act-001', action: 'user_login', entity_type: 'user', entity_id: userId, details: 'Login efetuado com sucesso', created_at: getRelativeDateStr(0) + 'T07:15:00.000Z' },
    { id: 'demo-act-002', action: 'charge_created', entity_type: 'charge', entity_id: 'demo-chg-002', details: 'Cobrança Mensalidade Pilates criada para Arthur Nogueira - R$ 450,00', created_at: getRelativeDateStr(-1) + 'T10:00:00.000Z' },
    { id: 'demo-act-003', action: 'reminder_sent', entity_type: 'reminder', entity_id: 'demo-rem-001', details: 'Lembrete automático enviado para Beatriz Camargo', created_at: getRelativeDateStr(-4) + 'T08:30:00.000Z' },
    { id: 'demo-act-004', action: 'payment_received', entity_type: 'charge', entity_id: 'demo-chg-001', details: 'Pagamento de R$ 450,00 recebido de Arthur Nogueira via Pix', created_at: getRelativeDateStr(-26) + 'T14:30:00.000Z' }
  ];

  for (const act of activities) {
    run(`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [act.id, userId, act.action, act.entity_type, act.entity_id, act.details, act.created_at]);
  }
  console.log('✅ Activity log populated!');

  // 8. Insert Notifications
  const notifications = [
    { id: 'demo-not-001', type: 'success', title: 'Pagamento Recebido', message: 'Arthur Nogueira pagou a cobrança R$ 450,00 via Pix.', read: 0, entity_type: 'charge', entity_id: 'demo-chg-001', created_at: getRelativeDateStr(-26) + 'T14:30:00.000Z' },
    { id: 'demo-not-002', type: 'warning', title: 'Cobrança Vencida', message: 'A consultoria de Gustavo Silveira (R$ 1.200,00) está atrasada há 12 dias.', read: 0, entity_type: 'charge', entity_id: 'demo-chg-004', created_at: getRelativeDateStr(-12) + 'T00:05:00.000Z' },
    { id: 'demo-not-003', type: 'info', title: 'Bem-vindo ao Cobbra!', message: 'Seu plano Cobra Pro está ativo. Que tal parear seu WhatsApp para enviar notificações por IA?', read: 0, entity_type: 'system', entity_id: null, created_at: getRelativeDateStr(-31) + 'T09:00:00.000Z' }
  ];

  for (const not of notifications) {
    run(`
      INSERT INTO notifications (id, user_id, type, title, message, read, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [not.id, userId, not.type, not.title, not.message, not.read, not.entity_type, not.entity_id, not.created_at]);
  }
  console.log('✅ Notifications populated!');

  console.log('🎉 Seeding completed successfully!');
}

seedDemoAccount().catch(err => {
  console.error('❌ Seeding failed:', err);
});
