const fs = require('fs');
const path = require('path');

function searchInFile(filePath, query) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes(query)) {
    console.log(`Match found in: ${filePath}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(query)) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
}

const routePath = path.join(process.cwd(), 'app', 'api', 'lembretes', 'route.js');
searchInFile(routePath, 'Valor Total');
searchInFile(routePath, 'Valor Total Atualizado');
