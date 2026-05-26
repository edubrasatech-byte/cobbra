const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('🔍 Coletando logs de erro do Docker na VPS...');

conn.on('ready', () => {
  conn.exec('docker logs evolution_api', (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      console.log('\n--- LOGS DO CONTAINER EVOLUTION_API ---');
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error('STDERR LOGS:', data.toString());
    });
  });
}).connect(VPS_CONFIG);
