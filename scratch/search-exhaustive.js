const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(fullPath);
      }
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Whats') || content.includes('E-mails') || content.includes('Demissões') || content.includes('Remessas')) {
        console.log(`Found in: ${path.relative(rootDir, fullPath)}`);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('Whats') || line.includes('E-mails') || line.includes('Demissões') || line.includes('Remessas')) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log("Searching exhaustively...");
searchDir(rootDir);
console.log("Search finished.");
