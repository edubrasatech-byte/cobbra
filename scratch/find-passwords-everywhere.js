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

function searchPasswords() {
  const dir = 'C:\\Users\\marci\\.gemini\\antigravity\\scratch\\cobroo';
  const files = walk(dir);
  console.log(`🔍 Scanning ${files.length} files for password mentions...`);

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (file.includes('find-passwords') || file.includes('reset-admin')) return;

      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        if (
          (lower.includes('senha') || lower.includes('password') || lower.includes('pass_') || lower.includes('pwd')) &&
          !lower.includes('bcrypt') &&
          !lower.includes('password_hash') &&
          !lower.includes('jwt_secret') &&
          !lower.includes('postgres') &&
          !lower.includes('smtp') &&
          !lower.includes('set_cookie')
        ) {
          console.log(`✨ Mentions in ${path.basename(file)}:${idx + 1}: ${line.trim()}`);
        }
      });
    } catch(e) {}
  });
}

searchPasswords();
