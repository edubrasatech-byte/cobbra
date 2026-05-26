const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('⚡ Aplicando regras avançadas de liberação de portas em iptables na VPS...');

conn.on('ready', () => {
  const cmd = `
    # Libera a porta 8080 no topo da tabela INPUT do iptables (antes de qualquer REJECT)
    iptables -I INPUT 1 -p tcp --dport 8080 -j ACCEPT
    iptables -I INPUT 1 -p tcp --dport 5432 -j ACCEPT
    
    # Salva as regras se o netfilter-persistent ou iptables-persistent estiver ativo
    if command -v netfilter-persistent >/dev/null; then
      netfilter-persistent save
    fi
    
    echo "=== REGRAS DE INPUT ATUAIS EM IPTABLES ==="
    iptables -L INPUT -n --line-numbers
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
