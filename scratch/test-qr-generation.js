const instance = 'cobbra_inst_test_qr_v6';
const baseUrl = 'http://129.121.85.166';
const apikey = 'cobroo-global-token-2026-safe-key';

console.log('🔄 1. Criando instância com "WHATSAPP-BAILEYS"...');
fetch(`${baseUrl}/instance/create`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'apikey': apikey 
  },
  body: JSON.stringify({ 
    instanceName: instance, 
    integration: "WHATSAPP-BAILEYS",
    qrcode: true 
  })
})
  .then(res => {
    console.log(`🟢 Create Instance Status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log('📄 Create Response:', JSON.stringify(data));
    
    console.log('\n🔄 2. Solicitando QR Code...');
    return fetch(`${baseUrl}/instance/connect/${instance}`, {
      headers: { 'apikey': apikey }
    });
  })
  .then(res => {
    console.log(`🟢 Connect Instance Status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log('📄 Connect Response (QR Code):', JSON.stringify(data).substring(0, 200) + '...');
  })
  .catch(err => {
    console.error('❌ Falha:', err.message);
  });
