const url = 'http://129.121.85.166:8080/instance/connectionState/cobbra_inst_default';
const apikey = 'cobroo-global-token-2026-safe-key';

console.log(`📡 Consultando endpoint connectionState: ${url}...`);

fetch(url, {
  headers: { 'apikey': apikey }
})
  .then(res => {
    console.log(`🟢 Status HTTP: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log('📄 Resposta JSON:', JSON.stringify(data));
  })
  .catch(err => {
    console.error('❌ Falha na conexão:', err.message);
  });
