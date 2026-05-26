const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('📡 Testando conectividade interna entre Evolution API e Redis...');

conn.on('ready', () => {
  const cmd = `
    echo "=== 1. TENTANDO DE PING DENTRO DO CONTAINER ==="
    docker exec evolution_api ping -c 3 redis || echo "Ping falhou!"
    
    echo "=== 2. TENTANDO CONEXÃO NA PORTA 6379 VIA NC ==="
    docker exec evolution_api nc -zv redis 6379 || echo "Netcat falhou!"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Erro:', err);
      conn.end();
      return;
    }
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error('STDERR:', data.toString());
    });
  });
}).connect(VPS_CONFIG);
