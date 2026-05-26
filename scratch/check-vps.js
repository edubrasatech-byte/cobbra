const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('🔍 Executando verificação de integridade dos serviços na VPS...');

conn.on('ready', () => {
  // Roda comandos rápidos para checar o status do docker e cron
  conn.exec('docker ps && crontab -l && ls -la /var/www/cron/', (err, stream) => {
    if (err) {
      console.error('Erro na execução do comando:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('\n--- RETORNO DA VPS ---');
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error('STDERR:', data.toString());
    });
  });
}).connect(VPS_CONFIG);
