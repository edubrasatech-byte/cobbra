const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const root = 'C:\\Users\\marci\\.gemini\\antigravity\\scratch\\cobroo';
const files = walk(root);

console.log(`Found ${files.length} code files. Searching...`);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('Chatbot') || content.includes('formatMessage') || content.includes('**') || content.includes('Catarina')) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('Chatbot') || line.includes('formatMessage') || line.includes('**') || line.includes('Catarina')) {
        console.log(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
