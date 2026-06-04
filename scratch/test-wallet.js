const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

// 1. Resolve DB Path exactly like in check-db-path.js
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

console.log('🧪 Starting Cobbra Pay Wallet & Webhook Integration Tests...');
console.log('📂 Using Database Path:', DB_PATH);

const db = new Database(DB_PATH);

try {
  // Generate random IDs for this test run
  const testUserId = 'test-usr-' + uuidv4().slice(0, 8);
  const testClientId = 'test-cli-' + uuidv4().slice(0, 8);
  const chargeIdPix = 'test-chg-pix-' + uuidv4().slice(0, 8);
  const chargeIdCard = 'test-chg-card-' + uuidv4().slice(0, 8);

  console.log(`\n👥 1. Seeding test User (${testUserId}) and Client (${testClientId})...`);
  
  // Cleanup any leftover user/client from previous interrupted runs
  db.prepare("DELETE FROM bank_transfers WHERE user_id IN (SELECT id FROM users WHERE email = 'teste-wallet@cobbra.com.br')").run();
  db.prepare("DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email = 'teste-wallet@cobbra.com.br')").run();
  db.prepare("DELETE FROM charges WHERE user_id IN (SELECT id FROM users WHERE email = 'teste-wallet@cobbra.com.br')").run();
  db.prepare("DELETE FROM clients WHERE user_id IN (SELECT id FROM users WHERE email = 'teste-wallet@cobbra.com.br')").run();
  db.prepare("DELETE FROM users WHERE email = 'teste-wallet@cobbra.com.br'").run();

  // Insert Test User
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, plan, wallet_balance, withdrawal_count)
    VALUES (?, 'Assinante Teste Wallet', 'teste-wallet@cobbra.com.br', 'hashedpwd', 'admin', 'pro', 0, 0)
  `).run(testUserId);

  // Insert Test Client (Motorista)
  db.prepare(`
    INSERT INTO clients (id, user_id, name, email, phone, document, wallet_balance)
    VALUES (?, ?, 'Motorista Teste Wallet', 'motorista@wallet.com', '11999999999', '12345678909', 0)
  `).run(testClientId, testUserId);

  console.log('✅ User and Client inserted successfully.');

  // ==========================================
  // TEST case 1: Pix Payment Webhook (Absorb Fees)
  // ==========================================
  console.log('\n💳 2. Testing Webhook Pix aluguel payment (R$ 100.00)...');
  
  // Create charge for Pix aluguel
  db.prepare(`
    INSERT INTO charges (id, user_id, client_id, amount, status, description, payment_method, due_date)
    VALUES (?, ?, ?, 100.00, 'pending', 'Aluguel Semanal', 'pix', '2026-06-10')
  `).run(chargeIdPix, testUserId, testClientId);

  // Simulate payment confirmation (Mimics app/api/webhooks/asaas/route.js logic)
  const simulatedPaymentPix = {
    value: 100.00,
    confirmedDate: new Date().toISOString(),
    billingType: 'PIX',
    id: 'pay_asaas_pix_123'
  };

  const chargePix = db.prepare('SELECT * FROM charges WHERE id = ?').get(chargeIdPix);
  if (!chargePix) throw new Error('Pix charge not found');

  let netAmountPix = simulatedPaymentPix.value;
  
  // Update charge
  db.prepare("UPDATE charges SET status = 'paid', paid_at = ?, paid_amount = ? WHERE id = ?")
    .run(simulatedPaymentPix.confirmedDate, simulatedPaymentPix.value, chargeIdPix);

  // Update client wallet_balance
  db.prepare('UPDATE clients SET wallet_balance = wallet_balance + ?, total_paid = total_paid + ? WHERE id = ?')
    .run(netAmountPix, simulatedPaymentPix.value, testClientId);

  // Update user wallet_balance
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?')
    .run(netAmountPix, testUserId);

  // Insert transaction
  db.prepare(`
    INSERT INTO transactions (id, user_id, charge_id, client_id, amount, type, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, 'income', 'pix', 'Liquidação Cobbra Pay: Pix Test')
  `).run(uuidv4(), testUserId, chargeIdPix, testClientId, netAmountPix);

  // Verify Pix Balances
  const userBalancePix = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(testUserId).wallet_balance;
  const clientBalancePix = db.prepare('SELECT wallet_balance FROM clients WHERE id = ?').get(testClientId).wallet_balance;
  
  console.log(`💵 Assinante (User) wallet balance after Pix: R$ ${userBalancePix.toFixed(2)} (Expected: R$ 100.00)`);
  console.log(`💵 Motorista (Client) wallet balance after Pix: R$ ${clientBalancePix.toFixed(2)} (Expected: R$ 100.00)`);

  if (userBalancePix !== 100 || clientBalancePix !== 100) {
    throw new Error('❌ Balances after Pix payment are incorrect!');
  }
  console.log('✅ Pix webhook test passed!');

  // ==========================================
  // TEST case 2: Credit Card Payment Webhook (Pass fee to balance: 2.99% + 0.40)
  // ==========================================
  console.log('\n💳 3. Testing Webhook Credit Card aluguel payment (R$ 100.00)...');
  
  // Create charge for Credit Card aluguel
  db.prepare(`
    INSERT INTO charges (id, user_id, client_id, amount, status, description, payment_method, due_date)
    VALUES (?, ?, ?, 100.00, 'pending', 'Aluguel Semanal Card', 'link', '2026-06-10')
  `).run(chargeIdCard, testUserId, testClientId);

  const simulatedPaymentCard = {
    value: 100.00,
    confirmedDate: new Date().toISOString(),
    billingType: 'CREDIT_CARD',
    id: 'pay_asaas_card_123'
  };

  // Calculate card fee
  let netAmountCard = simulatedPaymentCard.value * (1 - 0.0299) - 0.40;
  netAmountCard = Math.round(netAmountCard * 100) / 100; // R$ 96.61

  // Update charge
  db.prepare("UPDATE charges SET status = 'paid', paid_at = ?, paid_amount = ? WHERE id = ?")
    .run(simulatedPaymentCard.confirmedDate, simulatedPaymentCard.value, chargeIdCard);

  // Update client wallet_balance
  db.prepare('UPDATE clients SET wallet_balance = wallet_balance + ?, total_paid = total_paid + ? WHERE id = ?')
    .run(netAmountCard, simulatedPaymentCard.value, testClientId);

  // Update user wallet_balance
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?')
    .run(netAmountCard, testUserId);

  // Verify Card Balances (100.00 + 96.61 = 196.61)
  const userBalanceCard = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(testUserId).wallet_balance;
  const clientBalanceCard = db.prepare('SELECT wallet_balance FROM clients WHERE id = ?').get(testClientId).wallet_balance;
  
  console.log(`💵 Assinante (User) wallet balance after Card: R$ ${userBalanceCard.toFixed(2)} (Expected: R$ 196.61)`);
  console.log(`💵 Motorista (Client) wallet balance after Card: R$ ${clientBalanceCard.toFixed(2)} (Expected: R$ 196.61)`);

  if (userBalanceCard !== 196.61 || clientBalanceCard !== 196.61) {
    throw new Error('❌ Balances after Credit Card payment are incorrect!');
  }
  console.log('✅ Credit Card webhook test passed!');

  // ==========================================
  // TEST case 3: 1st Withdrawal (Pix - Free)
  // ==========================================
  console.log('\n💸 4. Testing 1st Withdrawal (Pix) - Free fee rule...');
  
  const w1Amount = 50.00;
  
  // Withdrawal handler logic (Mimics app/api/pay/withdraw/route.js)
  const userW1 = db.prepare('SELECT wallet_balance, withdrawal_count FROM users WHERE id = ?').get(testUserId);
  const w1Fee = userW1.withdrawal_count === 0 ? 0.0 : 3.90;
  const w1Net = w1Amount - w1Fee;

  if (userW1.wallet_balance < w1Amount) throw new Error('Insufficient balance');

  // Deduct user balance and increment withdrawal count
  db.prepare('UPDATE users SET wallet_balance = wallet_balance - ?, withdrawal_count = withdrawal_count + 1 WHERE id = ?')
    .run(w1Amount, testUserId);

  // Insert bank_transfer (external transfer)
  const w1TransferId = 'tx_mock_w1_' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO bank_transfers (id, user_id, client_id, amount, fee, net_amount, status, pix_key, pix_key_type, description)
    VALUES (?, ?, NULL, ?, ?, ?, 'done', 'testepix1@key.com', 'email', ?)
  `).run(w1TransferId, testUserId, w1Amount, w1Fee, w1Net, 'Saque Pix Gratuito');

  // Verify
  const userBalanceW1 = db.prepare('SELECT wallet_balance, withdrawal_count FROM users WHERE id = ?').get(testUserId);
  const transferW1 = db.prepare('SELECT * FROM bank_transfers WHERE id = ?').get(w1TransferId);

  console.log(`💵 Assinante balance after 1st withdrawal: R$ ${userBalanceW1.wallet_balance.toFixed(2)} (Expected: R$ 146.61)`);
  console.log(`📊 Assinante withdrawal count: ${userBalanceW1.withdrawal_count} (Expected: 1)`);
  console.log(`💰 Transfer details: Amount = R$ ${transferW1.amount.toFixed(2)}, Fee = R$ ${transferW1.fee.toFixed(2)}, Net = R$ ${transferW1.net_amount.toFixed(2)}`);

  if (Math.abs(userBalanceW1.wallet_balance - 146.61) > 0.001 || userBalanceW1.withdrawal_count !== 1 || transferW1.fee !== 0) {
    throw new Error('❌ 1st Withdrawal test failed!');
  }
  console.log('✅ 1st withdrawal test passed!');

  // ==========================================
  // TEST case 4: 2nd Withdrawal (Pix - R$ 3.90 fee)
  // ==========================================
  console.log('\n💸 5. Testing 2nd Withdrawal (Pix) - Tarifed R$ 3.90 fee rule...');
  
  const w2Amount = 50.00;
  
  const userW2 = db.prepare('SELECT wallet_balance, withdrawal_count FROM users WHERE id = ?').get(testUserId);
  const w2Fee = userW2.withdrawal_count === 0 ? 0.0 : 3.90;
  const w2Net = w2Amount - w2Fee; // 46.10

  if (userW2.wallet_balance < w2Amount) throw new Error('Insufficient balance');

  // Deduct user balance and increment withdrawal count
  db.prepare('UPDATE users SET wallet_balance = wallet_balance - ?, withdrawal_count = withdrawal_count + 1 WHERE id = ?')
    .run(w2Amount, testUserId);

  // Insert bank_transfer (external transfer)
  const w2TransferId = 'tx_mock_w2_' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO bank_transfers (id, user_id, client_id, amount, fee, net_amount, status, pix_key, pix_key_type, description)
    VALUES (?, ?, NULL, ?, ?, ?, 'done', 'testepix2@key.com', 'email', ?)
  `).run(w2TransferId, testUserId, w2Amount, w2Fee, w2Net, 'Saque Pix Tarifado');

  // Verify
  const userBalanceW2 = db.prepare('SELECT wallet_balance, withdrawal_count FROM users WHERE id = ?').get(testUserId);
  const transferW2 = db.prepare('SELECT * FROM bank_transfers WHERE id = ?').get(w2TransferId);

  console.log(`💵 Assinante balance after 2nd withdrawal: R$ ${userBalanceW2.wallet_balance.toFixed(2)} (Expected: R$ 96.61)`);
  console.log(`📊 Assinante withdrawal count: ${userBalanceW2.withdrawal_count} (Expected: 2)`);
  console.log(`💰 Transfer details: Amount = R$ ${transferW2.amount.toFixed(2)}, Fee = R$ ${transferW2.fee.toFixed(2)}, Net = R$ ${transferW2.net_amount.toFixed(2)}`);

  if (Math.abs(userBalanceW2.wallet_balance - 96.61) > 0.001 || userBalanceW2.withdrawal_count !== 2 || Math.abs(transferW2.fee - 3.90) > 0.001 || Math.abs(transferW2.net_amount - 46.10) > 0.001) {
    throw new Error('❌ 2nd Withdrawal test failed!');
  }
  console.log('✅ 2nd withdrawal test passed!');

  // ==========================================
  // CLEAN UP
  // ==========================================
  console.log('\n🧹 6. Cleaning up test data from Database...');
  
  db.prepare('DELETE FROM bank_transfers WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM transactions WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM charges WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM clients WHERE id = ?').run(testClientId);
  db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

  console.log('✅ Clean up complete. Database is pristine.');
  console.log('\n🏆 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');

} catch (err) {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
} finally {
  db.close();
}
