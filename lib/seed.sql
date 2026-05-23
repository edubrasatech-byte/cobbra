-- =============================================
-- COBBRA - Seed Data
-- Admin Senior + Demo Data
-- =============================================

-- Admin Senior Account
-- Email: admin@cobbra.com.br
-- Password: Cobbra@Admin2026
-- Password hash generated with bcryptjs (12 rounds)
INSERT OR IGNORE INTO users (id, name, email, password_hash, phone, role, pix_key, pix_key_type, business_name, business_description, plan, plan_expires_at, status, onboarding_completed)
VALUES (
  'admin-senior-001',
  'Administrador Cobbra',
  'admin@cobbra.com.br',
  '$2b$12$8xTmO8ejjwvR6eUJXdUQhuDyzKQfOmK/iEXSoR44wUvK8bdetiIkW',
  '(11) 99999-0000',
  'admin_senior',
  'admin@cobbra.com.br',
  'email',
  'Cobbra Tecnologia',
  'Plataforma de cobrança gentil para autônomos brasileiros',
  'enterprise',
  '2030-12-31T23:59:59.000Z',
  'active',
  1
);

-- Demo User 1
INSERT OR IGNORE INTO users (id, name, email, password_hash, phone, role, pix_key, pix_key_type, business_name, plan, plan_expires_at, status, onboarding_completed)
VALUES (
  'user-demo-001',
  'Marina Oliveira',
  'marina@demo.com',
  '$2b$12$8xTmO8ejjwvR6eUJXdUQhuDyzKQfOmK/iEXSoR44wUvK8bdetiIkW',
  '(11) 98765-4321',
  'user',
  '11987654321',
  'phone',
  'Studio Marina Personal',
  'pro',
  '2026-12-31T23:59:59.000Z',
  'active',
  1
);

-- Demo User 2
INSERT OR IGNORE INTO users (id, name, email, password_hash, phone, role, pix_key, pix_key_type, business_name, plan, plan_expires_at, status, onboarding_completed)
VALUES (
  'user-demo-002',
  'Rafael Costa',
  'rafael@demo.com',
  '$2a$12$LJ3m4ys8Kn9kXhQRJv5Pxe0P8W5fN2KwzQn8y3x5j6r4t7u8v9w0',
  '(21) 91234-5678',
  'user',
  'rafael.design@gmail.com',
  'email',
  'RC Design Studio',
  'starter',
  '2026-06-30T23:59:59.000Z',
  'active',
  1
);

-- =============================================
-- CLIENTS for Demo User 1 (Marina)
-- =============================================
INSERT OR IGNORE INTO clients (id, user_id, name, email, phone, category, tags, health_score, notes, total_charged, total_paid, total_overdue) VALUES
('cli-001', 'user-demo-001', 'Mariana Alves', 'mariana@email.com', '(11) 91111-1111', 'Aluna', 'mensal,pilates', 'good', 'Aluna assídua, sempre paga em dia', 2400.00, 2400.00, 0),
('cli-002', 'user-demo-001', 'Rodrigo Pacheco', 'rodrigo@email.com', '(11) 92222-2222', 'Aluno', 'mensal,musculação', 'warning', 'Atrasou 2x nos últimos 3 meses', 1800.00, 1350.00, 450.00),
('cli-003', 'user-demo-001', 'Juliana Mendes', 'juliana@email.com', '(11) 93333-3333', 'Aluna', 'mensal,funcional', 'good', 'Indicou 3 novos alunos', 3000.00, 3000.00, 0),
('cli-004', 'user-demo-001', 'Carlos Eduardo', 'carlos@email.com', '(11) 94444-4444', 'Aluno', 'mensal,personal', 'critical', 'Devendo há 2 meses', 1200.00, 600.00, 600.00),
('cli-005', 'user-demo-001', 'Ana Paula Santos', 'ana.paula@email.com', '(11) 95555-5555', 'Aluna', 'semanal,yoga', 'good', 'Paga sempre antecipado', 1600.00, 1600.00, 0),
('cli-006', 'user-demo-001', 'Fernando Lima', 'fernando@email.com', '(11) 96666-6666', 'Aluno', 'mensal,crossfit', 'good', '', 2000.00, 2000.00, 0),
('cli-007', 'user-demo-001', 'Beatriz Souza', 'beatriz@email.com', '(11) 97777-7777', 'Aluna', 'mensal,pilates', 'warning', 'Pediu desconto no último mês', 900.00, 750.00, 150.00),
('cli-008', 'user-demo-001', 'Lucas Ferreira', 'lucas.f@email.com', '(11) 98888-8888', 'Aluno', 'quinzenal,personal', 'good', '', 1400.00, 1400.00, 0),
('cli-009', 'user-demo-001', 'Camila Rodrigues', 'camila@email.com', '(11) 90000-1111', 'Aluna', 'mensal,funcional', 'good', 'Contrato trimestral', 2700.00, 2700.00, 0),
('cli-010', 'user-demo-001', 'Pedro Henrique', 'pedro.h@email.com', '(11) 90000-2222', 'Aluno', 'mensal,musculação', 'critical', 'Cancelou e voltou, devendo mensalidade', 800.00, 400.00, 400.00);

-- =============================================
-- CLIENTS for Demo User 2 (Rafael)
-- =============================================
INSERT OR IGNORE INTO clients (id, user_id, name, email, phone, category, tags, health_score, notes, total_charged, total_paid, total_overdue) VALUES
('cli-011', 'user-demo-002', 'Studio Bem Estar', 'contato@bemestar.com', '(21) 91111-3333', 'Empresa', 'branding,mensal', 'good', 'Cliente recorrente desde 2024', 8000.00, 8000.00, 0),
('cli-012', 'user-demo-002', 'Café Artesanal', 'cafe@artesanal.com', '(21) 92222-4444', 'Empresa', 'social-media,mensal', 'good', 'Contrato de 12 meses', 6000.00, 6000.00, 0),
('cli-013', 'user-demo-002', 'Dr. Marcos Oliveira', 'marcos@clinica.com', '(21) 93333-5555', 'Pessoa', 'website,projeto', 'warning', 'Projeto atrasou por falta de conteúdo', 4500.00, 3000.00, 1500.00),
('cli-014', 'user-demo-002', 'Boutique Elegance', 'elegance@email.com', '(21) 94444-6666', 'Empresa', 'ecommerce,projeto', 'good', '', 12000.00, 12000.00, 0),
('cli-015', 'user-demo-002', 'Tech Solutions LTDA', 'financeiro@techsol.com', '(21) 95555-7777', 'Empresa', 'ui-ux,projeto', 'critical', 'Não responde desde março', 7500.00, 2500.00, 5000.00);

-- =============================================
-- CHARGES for Demo User 1 (Marina) - Recent
-- =============================================
INSERT OR IGNORE INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, paid_at, reminders_sent) VALUES
('chg-001', 'user-demo-001', 'cli-001', 450.00, 'Mensalidade Pilates - Maio/2026', '2026-05-10', 'paid', 'monthly', 'whatsapp', 'pix', '2026-05-09T14:30:00.000Z', 1),
('chg-002', 'user-demo-001', 'cli-002', 450.00, 'Mensalidade Musculação - Maio/2026', '2026-05-10', 'reminder_sent', 'monthly', 'both', 'pix', NULL, 2),
('chg-003', 'user-demo-001', 'cli-003', 500.00, 'Mensalidade Funcional - Maio/2026', '2026-05-15', 'paid', 'monthly', 'email', 'pix', '2026-05-14T10:00:00.000Z', 1),
('chg-004', 'user-demo-001', 'cli-004', 600.00, 'Mensalidade Personal - Maio/2026', '2026-05-05', 'overdue', 'monthly', 'both', 'pix', NULL, 3),
('chg-005', 'user-demo-001', 'cli-005', 200.00, 'Aula Yoga Avulsa', '2026-05-20', 'pending', 'once', 'whatsapp', 'pix', NULL, 0),
('chg-006', 'user-demo-001', 'cli-006', 350.00, 'Mensalidade Crossfit - Maio/2026', '2026-05-12', 'paid', 'monthly', 'whatsapp', 'pix', '2026-05-12T09:15:00.000Z', 1),
('chg-007', 'user-demo-001', 'cli-007', 300.00, 'Mensalidade Pilates - Maio/2026', '2026-05-15', 'reminder_sent', 'monthly', 'both', 'pix', NULL, 1),
('chg-008', 'user-demo-001', 'cli-008', 700.00, 'Quinzena Personal - 1ª Mai/2026', '2026-05-01', 'paid', 'monthly', 'whatsapp', 'pix', '2026-05-01T08:00:00.000Z', 0),
('chg-009', 'user-demo-001', 'cli-009', 900.00, 'Trimestral Funcional - Mai-Jul/2026', '2026-05-01', 'paid', 'quarterly', 'email', 'pix', '2026-04-30T16:45:00.000Z', 1),
('chg-010', 'user-demo-001', 'cli-010', 400.00, 'Mensalidade Musculação - Abr/2026', '2026-04-10', 'overdue', 'monthly', 'both', 'pix', NULL, 4),
('chg-011', 'user-demo-001', 'cli-001', 450.00, 'Mensalidade Pilates - Abril/2026', '2026-04-10', 'paid', 'monthly', 'whatsapp', 'pix', '2026-04-10T11:20:00.000Z', 1),
('chg-012', 'user-demo-001', 'cli-002', 450.00, 'Mensalidade Musculação - Abril/2026', '2026-04-10', 'paid', 'monthly', 'both', 'pix', '2026-04-13T09:00:00.000Z', 2),
('chg-013', 'user-demo-001', 'cli-003', 500.00, 'Mensalidade Funcional - Abril/2026', '2026-04-15', 'paid', 'monthly', 'email', 'pix', '2026-04-15T14:30:00.000Z', 1),
('chg-014', 'user-demo-001', 'cli-004', 600.00, 'Mensalidade Personal - Abril/2026', '2026-04-05', 'overdue', 'monthly', 'both', 'pix', NULL, 4),
('chg-015', 'user-demo-001', 'cli-006', 350.00, 'Mensalidade Crossfit - Abril/2026', '2026-04-12', 'paid', 'monthly', 'whatsapp', 'pix', '2026-04-11T17:00:00.000Z', 1);

-- =============================================
-- CHARGES for Demo User 2 (Rafael)
-- =============================================
INSERT OR IGNORE INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, reminder_channel, payment_method, paid_at, reminders_sent) VALUES
('chg-016', 'user-demo-002', 'cli-011', 2000.00, 'Branding Mensal - Maio/2026', '2026-05-10', 'paid', 'monthly', 'email', 'pix', '2026-05-10T10:00:00.000Z', 1),
('chg-017', 'user-demo-002', 'cli-012', 1500.00, 'Social Media - Maio/2026', '2026-05-15', 'pending', 'monthly', 'whatsapp', 'pix', NULL, 0),
('chg-018', 'user-demo-002', 'cli-013', 1500.00, 'Website - Parcela 2/3', '2026-05-01', 'overdue', 'once', 'both', 'pix', NULL, 3),
('chg-019', 'user-demo-002', 'cli-014', 4000.00, 'E-commerce - Parcela Final', '2026-05-20', 'pending', 'once', 'email', 'boleto', NULL, 0),
('chg-020', 'user-demo-002', 'cli-015', 2500.00, 'UI/UX - Parcela 2/3', '2026-04-15', 'overdue', 'once', 'both', 'pix', NULL, 5);

-- =============================================
-- REMINDERS
-- =============================================
INSERT OR IGNORE INTO reminders (id, charge_id, user_id, client_id, channel, message, status, sent_at, delivered_at, read_at) VALUES
('rem-001', 'chg-001', 'user-demo-001', 'cli-001', 'whatsapp', 'Oi Mariana! 💚 Lembrete gentil: sua mensalidade de Pilates (R$ 450,00) vence amanhã. Pode pagar pelo Pix no link abaixo. Obrigada! 🙏', 'read', '2026-05-09T08:00:00.000Z', '2026-05-09T08:01:00.000Z', '2026-05-09T08:05:00.000Z'),
('rem-002', 'chg-002', 'user-demo-001', 'cli-002', 'whatsapp', 'Oi Rodrigo! 💚 Sua mensalidade de Musculação (R$ 450,00) venceu ontem. Que tal regularizar? O Pix está no link. Qualquer coisa, me avisa! 😊', 'delivered', '2026-05-11T08:00:00.000Z', '2026-05-11T08:02:00.000Z', NULL),
('rem-003', 'chg-002', 'user-demo-001', 'cli-002', 'email', 'Olá, Rodrigo! Passando para lembrar que sua mensalidade de R$ 450,00 está pendente desde 10/05. Segue o link para pagamento via Pix. Obrigada pela atenção!', 'sent', '2026-05-13T08:00:00.000Z', NULL, NULL),
('rem-004', 'chg-003', 'user-demo-001', 'cli-003', 'email', 'Olá, Juliana! Sua mensalidade de Funcional (R$ 500,00) vence amanhã, dia 15/05. Segue o link para pagamento. Obrigada! 💚', 'read', '2026-05-14T08:00:00.000Z', '2026-05-14T08:03:00.000Z', '2026-05-14T08:10:00.000Z'),
('rem-005', 'chg-004', 'user-demo-001', 'cli-004', 'whatsapp', 'Carlos, bom dia! Sua mensalidade de Personal (R$ 600,00) venceu dia 05/05. Precisa de ajuda com o pagamento? Estou à disposição! 💚', 'delivered', '2026-05-06T08:00:00.000Z', '2026-05-06T08:01:00.000Z', NULL),
('rem-006', 'chg-004', 'user-demo-001', 'cli-004', 'email', 'Olá Carlos. Sua mensalidade de R$ 600,00 está pendente desde 05/05. Por favor, regularize o pagamento pelo link abaixo.', 'sent', '2026-05-12T08:00:00.000Z', NULL, NULL),
('rem-007', 'chg-004', 'user-demo-001', 'cli-004', 'whatsapp', 'Carlos, sua mensalidade está pendente há mais de 2 semanas. Preciso que regularize para manter seu acesso aos treinos. Link para pagamento abaixo.', 'delivered', '2026-05-19T08:00:00.000Z', '2026-05-19T08:02:00.000Z', NULL),
('rem-008', 'chg-016', 'user-demo-002', 'cli-011', 'email', 'Olá Studio Bem Estar! A fatura de Branding referente a Maio/2026 no valor de R$ 2.000,00 vence dia 10/05. Segue link para pagamento. Obrigado pela parceria! 💚', 'read', '2026-05-08T09:00:00.000Z', '2026-05-08T09:05:00.000Z', '2026-05-08T10:30:00.000Z');

-- =============================================
-- REMINDER TEMPLATES (Defaults)
-- =============================================
INSERT OR IGNORE INTO reminder_templates (id, user_id, name, message, tone, timing_days, is_default, channel) VALUES
('tmpl-001', NULL, 'Lembrete Gentil - 3 dias antes', 'Oi {cliente_nome}! 💚 Lembrete gentil: sua {descricao} no valor de {valor} vence em 3 dias ({vencimento}). Pode pagar pelo Pix no link: {link_pagamento}. Obrigado! 🙏', 'gentle', -3, 1, 'both'),
('tmpl-002', NULL, 'Lembrete Gentil - No dia', 'Oi {cliente_nome}! 💚 Hoje é o dia de vencimento da sua {descricao} ({valor}). Segue o link para pagamento: {link_pagamento}. Qualquer dúvida, estou aqui! 😊', 'gentle', 0, 1, 'both'),
('tmpl-003', NULL, 'Lembrete Gentil - 1 dia após', 'Oi {cliente_nome}! 💚 Passando para lembrar que sua {descricao} de {valor} venceu ontem. Tudo bem? Segue o link: {link_pagamento}. Me avisa se precisar de algo!', 'gentle', 1, 1, 'both'),
('tmpl-004', NULL, 'Lembrete Neutro - 7 dias após', 'Olá {cliente_nome}. Sua {descricao} no valor de {valor} está pendente desde {vencimento}. Por favor, efetue o pagamento pelo link: {link_pagamento}. Obrigado.', 'neutral', 7, 1, 'both'),
('tmpl-005', NULL, 'Lembrete Firme - 15 dias após', '{cliente_nome}, sua {descricao} de {valor} está pendente há mais de 15 dias (vencimento: {vencimento}). Preciso que regularize o pagamento para manter seu acesso. Link: {link_pagamento}', 'firm', 15, 1, 'both'),
('tmpl-006', NULL, 'Lembrete Firme - 30 dias após', '{cliente_nome}, sua {descricao} de {valor} está pendente há 30 dias. Caso não seja regularizada, precisarei tomar medidas adicionais. Pagamento: {link_pagamento}', 'firm', 30, 1, 'both');

-- =============================================
-- TRANSACTIONS
-- =============================================
INSERT OR IGNORE INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method, reference, created_at) VALUES
('txn-001', 'user-demo-001', 'chg-001', 'cli-001', 450.00, 'income', 'pix', 'PIX-001', '2026-05-09T14:30:00.000Z'),
('txn-002', 'user-demo-001', 'chg-003', 'cli-003', 500.00, 'income', 'pix', 'PIX-002', '2026-05-14T10:00:00.000Z'),
('txn-003', 'user-demo-001', 'chg-006', 'cli-006', 350.00, 'income', 'pix', 'PIX-003', '2026-05-12T09:15:00.000Z'),
('txn-004', 'user-demo-001', 'chg-008', 'cli-008', 700.00, 'income', 'pix', 'PIX-004', '2026-05-01T08:00:00.000Z'),
('txn-005', 'user-demo-001', 'chg-009', 'cli-009', 900.00, 'income', 'pix', 'PIX-005', '2026-04-30T16:45:00.000Z'),
('txn-006', 'user-demo-001', 'chg-011', 'cli-001', 450.00, 'income', 'pix', 'PIX-006', '2026-04-10T11:20:00.000Z'),
('txn-007', 'user-demo-001', 'chg-012', 'cli-002', 450.00, 'income', 'pix', 'PIX-007', '2026-04-13T09:00:00.000Z'),
('txn-008', 'user-demo-001', 'chg-013', 'cli-003', 500.00, 'income', 'pix', 'PIX-008', '2026-04-15T14:30:00.000Z'),
('txn-009', 'user-demo-001', 'chg-015', 'cli-006', 350.00, 'income', 'pix', 'PIX-009', '2026-04-11T17:00:00.000Z'),
('txn-010', 'user-demo-002', 'chg-016', 'cli-011', 2000.00, 'income', 'pix', 'PIX-010', '2026-05-10T10:00:00.000Z');

-- =============================================
-- ACTIVITY LOG
-- =============================================
INSERT OR IGNORE INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at) VALUES
('log-001', 'user-demo-001', 'charge_created', 'charge', 'chg-001', 'Cobrança criada para Mariana Alves - R$ 450,00', '2026-05-01T08:00:00.000Z'),
('log-002', 'user-demo-001', 'reminder_sent', 'reminder', 'rem-001', 'Lembrete WhatsApp enviado para Mariana Alves', '2026-05-09T08:00:00.000Z'),
('log-003', 'user-demo-001', 'payment_received', 'charge', 'chg-001', 'Pagamento de R$ 450,00 recebido de Mariana Alves via Pix', '2026-05-09T14:30:00.000Z'),
('log-004', 'user-demo-001', 'charge_created', 'charge', 'chg-004', 'Cobrança criada para Carlos Eduardo - R$ 600,00', '2026-04-28T08:00:00.000Z'),
('log-005', 'user-demo-001', 'reminder_sent', 'reminder', 'rem-005', 'Lembrete WhatsApp enviado para Carlos Eduardo', '2026-05-06T08:00:00.000Z'),
('log-006', 'user-demo-001', 'charge_overdue', 'charge', 'chg-004', 'Cobrança de Carlos Eduardo marcada como vencida', '2026-05-06T00:00:00.000Z'),
('log-007', 'user-demo-001', 'client_created', 'client', 'cli-010', 'Cliente Pedro Henrique cadastrado', '2026-03-15T10:00:00.000Z'),
('log-008', 'user-demo-002', 'payment_received', 'charge', 'chg-016', 'Pagamento de R$ 2.000,00 recebido de Studio Bem Estar via Pix', '2026-05-10T10:00:00.000Z');
