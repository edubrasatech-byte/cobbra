const { query } = require('../lib/db');

const charges = query("SELECT c.id, c.amount, c.description, c.due_date, c.status, c.user_id, u.name as user_name, u.email as user_email, u.pix_key, u.pix_key_type FROM charges c JOIN users u ON c.user_id = u.id WHERE c.amount = 150.00 OR c.description LIKE '%Eduardo%'");
console.log('=== MATCHING CHARGES ===');
charges.forEach(ch => {
  console.log(`Charge ID: ${ch.id}`);
  console.log(`Amount: R$ ${ch.amount}`);
  console.log(`Description: "${ch.description}"`);
  console.log(`Due Date: ${ch.due_date}`);
  console.log(`Status: ${ch.status}`);
  console.log(`User/Sender Name: ${ch.user_name}`);
  console.log(`User/Sender Email: ${ch.user_email}`);
  console.log(`User/Sender Pix Key: "${ch.pix_key}"`);
  console.log(`User/Sender Pix Key Type: "${ch.pix_key_type}"`);
  console.log('------------------------');
});
