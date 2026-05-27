const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('📋 Lendo logs do Redis...');

conn.on('ready', () => {
  conn.exec('docker logs evolution_redis --tail 50', (err, stream) => {
    if (err) {
      console.error('Erro:', err);
      conn.end();
      return;
    }
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      console.log('\n--- LOGS REDIS ---');
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error('STDERR:', data.toString());
    });
  });
}).connect(VPS_CONFIG);
