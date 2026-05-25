const { query } = require('../lib/db');

const clients = query("SELECT c.id, c.name, c.user_id, u.name as user_name, u.email as user_email, u.pix_key, u.pix_key_type FROM clients c JOIN users u ON c.user_id = u.id WHERE c.name LIKE '%Eduardo%'");
console.log('=== CLIENTS MATCHING "Eduardo" ===');
clients.forEach(c => {
  console.log(`Client Name: ${c.name}`);
  console.log(`User/Sender ID: ${c.user_id}`);
  console.log(`User/Sender Name: ${c.user_name}`);
  console.log(`User/Sender Email: ${c.user_email}`);
  console.log(`User/Sender Pix Key: "${c.pix_key}"`);
  console.log(`User/Sender Pix Key Type: "${c.pix_key_type}"`);
  console.log('---------------------------------');
});
