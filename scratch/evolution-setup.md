# 🐍 Guia de Instalação e Configuração: Evolution API na VPS (Custo Zero)

Este guia ensina o passo a passo para instalar e configurar a **Evolution API** na sua VPS Linux usando Docker. A Evolution API é o gateway de WhatsApp 100% gratuito e open-source mais robusto do mercado, ideal para disparar as mensagens automáticas de cobrança e prospecção ativa do **Cobbra**.

---

## 1. Preparação da VPS Linux (Ubuntu 20.04 ou 22.04 LTS)

Acesse sua VPS via SSH e execute os comandos abaixo para atualizar o sistema e instalar o **Docker** e o **Docker-Compose** de forma totalmente gratuita.

### Passo 1: Atualizar o sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Passo 2: Instalar o Docker
```bash
sudo apt install curl apt-transport-https ca-certificates software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.slice.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce -y
```

### Passo 3: Instalar o Docker-Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

Verifique se a instalação foi bem-sucedida:
```bash
docker --version
docker-compose --version
```

---

## 2. Configurando o Docker-Compose da Evolution API

Crie um diretório dedicado para a API na sua VPS, entre nele e crie o arquivo de configuração:

```bash
mkdir -p ~/evolution-api && cd ~/evolution-api
nano docker-compose.yml
```

Cole o conteúdo abaixo dentro do arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  evolution_api:
    image: atendare/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # Configurações Gerais
      - SERVER_URL=http://SUA_IP_DA_VPS:8080
      - ENV=prod
      
      # Chave de Autenticação Global (GUARDE ESSA CHAVE!)
      - AUTH_API_KEY=CobbraSuperSecretApiKey123_456
      
      # Habilitar instâncias do WhatsApp via banco interno
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=sqlite
      - DATABASE_CONNECTION_CLIENT=sqlite3
      - DATABASE_CONNECTION_DATABASE=/evolution/db/database.sqlite
      
      # Otimização de Memória e Processamento
      - DELAY_SEND_MESSAGES=3000 # Delay de 3 segundos entre envios para evitar ban
      - CHROME_BIN=/usr/bin/chromium-browser
      - CACHE_REDIS_ENABLED=false
    volumes:
      - evolution_data:/evolution/db
      - evolution_instances:/evolution/instances

volumes:
  evolution_data:
  evolution_instances:
```

> [!IMPORTANT]
> Substitua `SUA_IP_DA_VPS` pelo endereço IP público da sua VPS Linux. Caso tenha um domínio configurado (ex: `api.seudominio.com`), você pode usá-lo na variável `SERVER_URL`.

Pressione `Ctrl + O` e depois `Enter` para salvar no nano, e `Ctrl + X` para sair.

---

## 3. Iniciando a Evolution API

Para rodar a API em segundo plano (modo daemon) na VPS:

```bash
docker-compose up -d
```

Verifique se o container está rodando perfeitamente:
```bash
docker ps
```

A API estará rodando na porta `8080` da sua VPS e responderá em `http://IP_DA_VPS:8080`.

---

## 4. Criando sua Instância e Pareando o WhatsApp (Via Terminal ou Postman)

A Evolution API possui uma interface Swagger interativa completa disponível no navegador em:
👉 `http://IP_DA_VPS:8080/docs`

Você pode criar uma instância enviando uma requisição HTTP POST para `/instance/create` com o cabeçalho `apikey: CobbraSuperSecretApiKey123_456`.

### Exemplo de comando cURL para criar a instância "cobbra_outreach":
```bash
curl -X POST "http://IP_DA_VPS:8080/instance/create" \
     -H "Content-Type: application/json" \
     -H "apikey: CobbraSuperSecretApiKey123_456" \
     -d '{
       "instanceName": "cobbra_outreach",
       "token": "token_secreto_da_instancia_999",
       "qrcode": true
     }'
```

A API retornará um código QR em formato Base64 ou texto. Você pode acessar a URL do QR code que ela retorna ou ir no painel administrativo `/docs` para escanear a tela com o WhatsApp do seu celular (Menu > Aparelhos Conectados > Conectar um aparelho).

Pronto! Seu robô de disparos no WhatsApp 100% gratuito e hospedado na sua própria VPS está pareado e pronto para o trabalho!

---

## 5. Boas Práticas contra Bloqueios e Banimentos no WhatsApp (Cold Outreach)

Para prospectar leads de locação de veículos ou empréstimos pessoais extraídos pelo `lead-scraper.js` sem sofrer bloqueios no WhatsApp:

1. **Delay Inteligente:** Mantenha a configuração de delay de envio alta (pelo menos 3 a 5 segundos entre mensagens). O Docker-compose acima já vem pré-configurado com 3000ms.
2. **Aquecimento do Chip (Warm-up):** Nunca use um chip de WhatsApp recém-ativado para enviar 100 mensagens no primeiro dia. Use o chip por 7 dias conversando com amigos e familiares para dar "maturidade" ao número perante os servidores da Meta.
3. **Abordagem Educada e Humana:** Não envie mensagens com tom invasivo de venda ("COMPRE AGORA!"). Faça uma abordagem consultiva e amigável:
   > *"Olá [Nome da Locadora]! Tudo bem? Vi que vocês fazem locação de frotas em [Cidade]. Elaboramos um modelo de contrato digital gratuito e uma régua Pix para acelerar recebimentos de locadoras locais. Gostariam de ver uma prévia sem compromisso?"*
4. **Respostas Positivas:** Apenas envie o link do seu contrato público (`/contrato-gratis`) para os leads que responderem à sua mensagem inicial demonstrando interesse. Isso garante uma taxa de denúncia de spam próxima a ZERO!
