const { Client } = require('ssh2');
const conn = new Client();

const VPS_CONFIG = {
  host: '129.121.85.166',
  port: 22,
  username: 'root',
  password: '476113@Etc'
};

console.log('⚡ Mapeando a Evolution API para a porta padrão 80 na VPS...');

conn.on('ready', () => {
  const cmd = `
    # 1. Atualiza o docker-compose.yml para mapear a porta externa 80 para a interna 8080
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

  redis:
    image: redis:alpine
    container_name: evolution_redis
    restart: always
    ports:
      - "6379:6379"

  evolution-api:
    image: evoapicloud/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "80:8080"
    environment:
      - SERVER_PORT=8080
      - API_KEY=cobroo-global-token-2026-safe-key
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_CLIENT=pg
      - DATABASE_CONNECTION_URI=postgresql://postgres:cobroo-postgres-senha-segura-2026@db:5432/evolution
      - CACHE_ENABLED=true
      - CACHE_PROVIDER=redis
      - CACHE_REDIS_HOST=redis
      - CACHE_REDIS_PORT=6379
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - STORE_SETTINGS_ENABLED=true
      - STORE_SETTINGS_CONNECTION_URI=postgresql://postgres:cobroo-postgres-senha-segura-2026@db:5432/evolution
      - USER_AGENT=Cobroo
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
EOF

    # 2. Reinicia os containers para aplicar a porta 80
    cd /var/www/evolution
    docker compose down || true
    docker compose up -d
    
    # 3. Libera a porta 80 no Firewall da VPS
    ufw allow 80/tcp
    iptables -I INPUT 1 -p tcp --dport 8 -j ACCEPT
    iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
    if command -v netfilter-persistent >/dev/null; then
      netfilter-persistent save
    fi

    echo "=== VERIFICANDO PORTS DO DOCKER ==="
    sleep 5
    docker ps
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
