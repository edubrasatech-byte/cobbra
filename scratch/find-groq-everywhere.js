const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        results = results.concat(walk(filePath));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.md') || file.endsWith('.json') || file.startsWith('.env')) {
        results.push(filePath);
      }
    }
  });
  return results;
};

function searchEverywhere() {
  const dir = 'C:\\Users\\marci\\.gemini\\antigravity\\scratch\\cobroo';
  const files = walk(dir);
  console.log(`🔍 Scanning ${files.length} files for GROQ_API_KEY or gsk_...`);

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('gsk_')) {
        console.log(`✨ Found gsk_ in: ${file}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('gsk_')) {
            console.log(`   Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
      if (content.includes('GROQ_API_KEY') && !file.includes('find-groq') && !file.includes('check-env')) {
        console.log(`✨ Found GROQ_API_KEY in: ${file}`);
      }
    } catch(e) {}
  });
}

searchEverywhere();
