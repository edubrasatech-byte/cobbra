const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'app');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('<button') || line.includes('className=')) {
      if (line.includes('slate-900') || line.includes('slate-950') || line.includes('black') || line.includes('transparent') || line.includes('text-[#070913]') || line.includes('text-slate-') || line.includes('bg-slate-')) {
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        console.log(`[FILE] ${relativePath}:${index + 1}`);
        console.log(`  Code: ${line.trim()}`);
      }
    }
  });
}

scanDir(targetDir);
