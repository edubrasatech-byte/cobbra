const { query } = require('../lib/db');

const reminders = query(`
  SELECT r.id, r.charge_id, r.client_id, r.channel, r.message, r.sent_at,
         c.description as charge_desc, c.amount as charge_amount,
         cl.name as client_name, cl.email as client_email,
         u.name as user_name, u.email as user_email
  FROM reminders r
  LEFT JOIN charges c ON r.charge_id = c.id
  LEFT JOIN clients cl ON r.client_id = cl.id
  LEFT JOIN users u ON r.user_id = u.id
  ORDER BY r.sent_at DESC
  LIMIT 5
`);

console.log('=== RECENT REMINDERS ===');
reminders.forEach((r, idx) => {
  console.log(`[#${idx + 1}] ID: ${r.id}`);
  console.log(`Sent At: ${r.sent_at}`);
  console.log(`Channel: ${r.channel}`);
  console.log(`Client Name: ${r.client_name} (${r.client_email})`);
  console.log(`User/Sender: ${r.user_name} (${r.user_email})`);
  console.log(`Charge Description: "${r.charge_desc}"`);
  console.log(`Charge Amount: R$ ${r.charge_amount}`);
  console.log(`Message Body:`);
  console.log('----------------------------------------');
  console.log(r.message);
  console.log('========================================\n');
});
