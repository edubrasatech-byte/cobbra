const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('⚡ Iniciando implantação industrial (Evolution API + Postgres Local) na VPS...');

conn.on('ready', () => {
  console.log('✅ Conexão SSH estabelecida!');

  const deployCmd = `
    export DEBIAN_FRONTEND=noninteractive
    
    echo "=== 1. GARANTINDO DOCKER E CRON ==="
    apt-get update -y
    apt-get install -y cron docker.io docker-compose-v2 jq curl ufw
    
    systemctl start cron
    systemctl enable cron
    systemctl start docker
    systemctl enable docker
    
    echo "=== 2. CONFIGURANDO A PASTA DO PROJETO ==="
    mkdir -p /var/www/evolution
    
    # Criando docker-compose industrial com Postgres leve e Evolution API
    cat << 'EOF' > /var/www/evolution/docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    container_name: evolution_db
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=cobroo-postgres-senha-segura-2026
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  evolution-api:
    image: evoapicloud/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_PORT=8080
      - API_KEY=cobroo-global-token-2026-safe-key
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_CLIENT=pg
      - DATABASE_CONNECTION_URI=postgresql://postgres:cobroo-postgres-senha-segura-2026@db:5432/evolution
      - CACHE_ENABLED=false
      - STORE_SETTINGS_ENABLED=true
      - STORE_SETTINGS_CONNECTION_URI=postgresql://postgres:cobroo-postgres-senha-segura-2026@db:5432/evolution
      - USER_AGENT=Cobroo
    depends_on:
      - db

volumes:
  postgres_data:
EOF

    cd /var/www/evolution
    docker compose down || true
    docker compose up -d
    
    echo "=== 3. CONFIGURANDO O SCRIPT DE DISPARO DIÁRIO DO COBBRA ==="
    mkdir -p /var/www/cron
    cat << 'EOF' > /var/www/cron/trigger-disparos.sh
#!/bin/bash
echo "[$(date)] Iniciando gatilho de cobranças automáticas do Cobbra..."
curl -s -X POST "http://cobbra.com.br/api/cron/send-reminders?secret=cobbra-cron-secret-key-2026"
echo "[$(date)] Concluído!"
EOF
    chmod +x /var/www/cron/trigger-disparos.sh

    echo "=== 4. CONFIGURANDO O AGENDAMENTO NO CRONTAB ==="
    (crontab -l 2>/dev/null | grep -v "/var/www/cron/trigger-disparos.sh" ; echo "0 8 * * * /var/www/cron/trigger-disparos.sh >> /var/log/cobbra-cron.log 2>&1") | crontab -
    
    echo "=== 5. CONFIGURANDO FIREWALL SEGURO (UFW) ==="
    ufw allow 22/tcp
    ufw allow 8080/tcp
    echo "y" | ufw enable
    
    echo "=== 🚀 TUDO INSTALADO E DEPLOYED EM NÍVEL INDUSTRIAL NA VPS UBUNTU! ==="
    sleep 3
    docker ps
  `;

  conn.exec(deployCmd, (err, stream) => {
    if (err) {
      console.error('❌ Erro na execução:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log('\n🎉 PROCESSO CONCLUÍDO NA VPS! Código de saída:', code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect(VPS_CONFIG);
