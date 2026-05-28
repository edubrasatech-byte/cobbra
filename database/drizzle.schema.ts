import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  phone: text('phone'),
  role: text('role').default('user'),
  pix_key: text('pix_key'),
  pix_key_type: text('pix_key_type'),
  business_name: text('business_name'),
  business_description: text('business_description'),
  avatar_url: text('avatar_url'),
  plan: text('plan').default('trial'),
  plan_expires_at: text('plan_expires_at'),
  status: text('status').default('active'),
  onboarding_completed: integer('onboarding_completed').default(0),
  business_niche: text('business_niche'),
  collection_rigor: text('collection_rigor').default('neutral'),
  interest_rate_excellent: real('interest_rate_excellent').default(0.1),
  interest_rate_regular: real('interest_rate_regular').default(0.3),
  interest_rate_risk: real('interest_rate_risk').default(0.5),
  created_at: text('created_at'),
  updated_at: text('updated_at')
});

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  document: text('document'),
  category: text('category'),
  tags: text('tags'),
  health_score: text('health_score').default('good'),
  notes: text('notes'),
  company_name: text('company_name'),
  birthday: text('birthday'),
  address: text('address'),
  total_charged: real('total_charged').default(0),
  total_paid: real('total_paid').default(0),
  total_overdue: real('total_overdue').default(0),
  last_payment_at: text('last_payment_at'),
  created_at: text('created_at'),
  updated_at: text('updated_at')
});

export const charges = sqliteTable('charges', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  client_id: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  description: text('description'),
  due_date: text('due_date').notNull(),
  status: text('status').default('pending'),
  recurrence: text('recurrence').default('once'),
  reminder_channel: text('reminder_channel').default('both'),
  payment_method: text('payment_method').default('pix'),
  daily_interest_rate: real('daily_interest_rate').default(0),
  paid_at: text('paid_at'),
  paid_amount: real('paid_amount'),
  cancelled_at: text('cancelled_at'),
  cancel_reason: text('cancel_reason'),
  next_reminder_at: text('next_reminder_at'),
  reminders_sent: integer('reminders_sent').default(0),
  vehicle_info: text('vehicle_info'),
  loan_info: text('loan_info'),
  contract_text: text('contract_text'),
  deposit_amount: real('deposit_amount').default(0),
  created_at: text('created_at'),
  updated_at: text('updated_at')
});

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  charge_id: text('charge_id').notNull().references(() => charges.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  client_id: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(),
  message: text('message').notNull(),
  status: text('status').default('sent'),
  sent_at: text('sent_at'),
  delivered_at: text('delivered_at'),
  read_at: text('read_at')
});
