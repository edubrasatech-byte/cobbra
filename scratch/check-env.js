const fs = require('fs');
const path = require('path');

console.log("🔍 Verificando variáveis de ambiente...");
console.log("process.env.GROQ_API_KEY:", process.env.GROQ_API_KEY ? "DEFINIDA (escondida)" : "NÃO DEFINIDA");

const files = ['.env', '.env.local', '.env.production', '.env.development'];
files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(/GROQ_API_KEY\s*=\s*(.+)/);
    if (match) {
      console.log(`✅ Achado em ${file}:`, match[1].trim());
    } else {
      console.log(`❌ Não achado em ${file}`);
    }
  }
});
