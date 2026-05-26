const url = 'http://129.121.85.166/instance/connectionState/cobbra_inst_default';

console.log('📡 Testando autenticação com chave INCORRETA...');

fetch(url, {
  headers: { 'apikey': 'chave-completamente-falsa' }
})
  .then(res => {
    console.log(`🟢 Status HTTP com chave falsa: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log('📄 Resposta:', JSON.stringify(data));
  })
  .catch(err => {
    console.error('❌ Falha:', err.message);
  });
