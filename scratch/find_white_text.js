const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/marci/.gemini/antigravity/scratch/cobroo/app/dashboard';

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
  const relativePath = path.relative(targetDir, filePath);
  
  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    
    // We want to find text-white, #ffffff, #fff, color: 'white' where it might not have a dark background.
    // If it has bg-emerald-500 or similar, it's fine. If it has no bg- or is on a generic background, it's a bug.
    if (lower.includes('text-white') || lower.includes('#ffffff') || lower.includes('#fff') || lower.includes('color: \'white\'') || lower.includes('color: "white"')) {
      // Exclude lines that set background colors to dark or green gradients, or SVGs, or obvious things.
      const hasDarkBgInLine = lower.includes('bg-emerald-') || lower.includes('bg-teal-') || lower.includes('bg-rose-') || lower.includes('bg-blue-') || lower.includes('bg-slate-900') || lower.includes('bg-slate-950') || lower.includes('bg-black') || lower.includes('linear-gradient') || lower.includes('bg-green-');
      
      if (!hasDarkBgInLine) {
        console.log(`[FILE ${relativePath}:${index + 1}]`);
        console.log(`  Code: ${line.trim()}`);
      }
    }
  });
}

scanDir(targetDir);
