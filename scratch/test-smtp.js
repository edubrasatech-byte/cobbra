const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Parser manual super simples para .env
function loadEnv(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove aspas simples ou duplas
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
          value = value.substring(1, value.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (e) {
    console.error('Erro ao ler .env:', e);
  }
}

loadEnv('./.env.local');
loadEnv('./.env');

console.log('--- TESTANDO CONFIGURAÇÃO SMTP DE EMAIL ---');
console.log('Host:', process.env.SMTP_HOST || 'smtp.hostinger.com (padrão)');
console.log('Port:', process.env.SMTP_PORT || '465 (padrão)');
console.log('User:', process.env.SMTP_USER || 'NÃO DEFINIDO');
console.log('Pass:', process.env.SMTP_PASS ? '******** (DEFINIDA)' : 'NÃO DEFINIDO');
console.log('Resend API Key:', process.env.RESEND_API_KEY ? '******** (DEFINIDA)' : 'NÃO DEFINIDO');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_USER || !SMTP_PASS) {
  console.log('\n[SIMULAÇÃO] Sem credenciais configuradas no .env. O mailer usará o modo Simulação local.');
  process.exit(0);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
  tls: {
    rejectUnauthorized: false
  }
});

console.log('\nConectando ao SMTP...');
transporter.verify(function(error, success) {
  if (error) {
    console.error('\n❌ ERRO SMTP IDENTIFICADO:');
    console.error(error);
  } else {
    console.log('\n✅ CONEXÃO SMTP REALIZADA COM SUCESSO! O servidor está respondendo perfeitamente.');
  }
  process.exit(0);
});
