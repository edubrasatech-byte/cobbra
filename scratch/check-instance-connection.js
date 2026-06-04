const url = 'http://129.121.85.166/instance/connectionState/cobbra-outreach';
const apikey = 'cobroo-global-token-2026-safe-key';

console.log('🔍 Checando estado de conexão da instância cobbra-outreach...');

fetch(url, {
  headers: { 'apikey': apikey }
})
.then(async r => {
  const status = r.status;
  const data = await r.json().catch(() => ({}));
  console.log('📊 HTTP Status:', status);
  console.log('📝 Dados:', JSON.stringify(data, null, 2));
})
.catch(e => {
  console.error('❌ Erro na consulta:', e.message);
});
