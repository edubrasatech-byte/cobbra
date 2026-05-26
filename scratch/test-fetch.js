const url = 'http://129.121.85.166:8080/';

console.log(`📡 Testando requisição para ${url}...`);

fetch(url)
  .then(res => {
    console.log(`🟢 Sucesso! Status HTTP: ${res.status}`);
    return res.text();
  })
  .then(text => {
    console.log('📄 Resposta:', text.substring(0, 100));
  })
  .catch(err => {
    console.error('❌ Falha na conexão:', err.message);
  });
