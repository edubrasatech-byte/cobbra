const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('⚡ Iniciando provisionamento focado e rápido da VPS Ubuntu...');
console.log(`Conectando em ${VPS_CONFIG.username}@${VPS_CONFIG.host}...`);

conn.on('ready', () => {
  console.log('✅ Conexão SSH estabelecida com sucesso!');
  console.log('Iniciando instalação rápida e silenciosa (Docker, Evolution API e Cron)...');
  
  const setupScript = `
    # Garantir modo não-interativo total contra qualquer prompt do Ubuntu
    export DEBIAN_FRONTEND=noninteractive
    
    echo "=== 1. INSTALANDO DOCKER E DEPENDÊNCIAS ==="
    apt-get update -y
    apt-get install -y docker.io docker-compose jq curl ufw
    
    echo "=== 2. INICIANDO DOCKER ==="
    systemctl start docker
    systemctl enable docker
    echo "Docker está rodando: $(systemctl is-active docker)"

    echo "=== 3. CONFIGURANDO A EVOLUTION API (WHATSAPP) ==="
    mkdir -p /var/www/evolution
    
    cat << 'EOF' > /var/www/evolution/docker-compose.yml
version: '3.8'
services:
  evolution-api:
    image: evolutionapi/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_PORT=8080
      - API_KEY=cobroo-global-token-2026-safe-key
      - DATABASE_ENABLED=false
      - CACHE_ENABLED=false
      - STORE_SETTINGS_ENABLED=true
      - STORE_SETTINGS_CONNECTION_URI=sqlite:///var/www/evolution/store.db
      - USER_AGENT=Cobroo
    volumes:
      - evolution_data:/var/www/evolution
volumes:
  evolution_data:
EOF

    cd /var/www/evolution
    docker-compose down || true
    docker-compose up -d
    echo "Evolution API iniciada com sucesso na porta 8080!"

    echo "=== 4. CONFIGURANDO CRON JOB DIÁRIO PARA DISPAROS ==="
    # Cria o arquivo de script do cron
    mkdir -p /var/www/cron
    cat << 'EOF' > /var/www/cron/trigger-disparos.sh
#!/bin/bash
echo "[$(date)] Iniciando gatilho de cobranças automáticas do Cobbra..."
curl -X POST "http://cobbra.com.br/api/cron/send-reminders?secret=cobbra-cron-secret-key-2026"
echo "[$(date)] Concluído!"
EOF
    chmod +x /var/www/cron/trigger-disparos.sh

    # Adiciona o script ao crontab do root para rodar todos os dias às 08:00 (se não existir)
    (crontab -l 2>/dev/null | grep -F "/var/www/cron/trigger-disparos.sh" || (crontab -l 2>/dev/null; echo "0 8 * * * /var/www/cron/trigger-disparos.sh >> /var/log/cobbra-cron.log 2>&1")) | crontab -
    echo "Cron Job programado com sucesso no Linux para as 08:00 todos os dias!"

    echo "=== 5. AJUSTANDO FIREWALL (UFW) ==="
    ufw allow 22/tcp
    ufw allow 8080/tcp
    echo "y" | ufw enable
    
    echo "=== 🚀 TUDO PRONTO E ONLINE NA VPS UBUNTU! ==="
  `;

  executeCommand(setupScript);
}).connect(VPS_CONFIG);

function executeCommand(cmd) {
  conn.shell((err, stream) => {
    if (err) {
      console.error('❌ Erro ao abrir shell SSH:', err);
      conn.end();
      return;
    }
    
    stream.on('close', () => {
      console.log('\n✅ VPS Configurada e pronta para disparos automáticos!');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    stream.end(cmd + '\nexit\n');
  });
}
