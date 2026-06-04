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
    // Search for button or input elements that might have contrast issues
    if (line.includes('<button') || line.includes('className=') || line.includes('style=')) {
      // Look for transparent background or black background, and black/dark text
      const lower = line.toLowerCase();
      const hasBlackText = lower.includes('text-[#070913]') || lower.includes('text-slate-950') || lower.includes('text-slate-900') || lower.includes('text-black');
      const hasBlackBg = lower.includes('bg-slate-950') || lower.includes('bg-slate-900') || lower.includes('bg-black') || lower.includes('bg-[#070913]') || lower.includes('bg-surface-theme') || lower.includes('bg-transparent');
      
      // Let's also check for inline styles
      const hasInlineStyle = lower.includes('style={{') && (lower.includes('background') || lower.includes('color'));
      
      if ((hasBlackText && hasBlackBg) || hasInlineStyle || lower.includes('bg-none') || lower.includes('bg-transparent') || lower.includes('background: none') || lower.includes('background:none')) {
        console.log(`[LINE ${index + 1} in ${relativePath}]`);
        console.log(`  Code: ${line.trim()}`);
      }
    }
  });
}

scanDir(targetDir);
