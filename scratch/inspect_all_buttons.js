const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/marci/.gemini/antigravity/scratch/cobroo/app';

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
  const regex = /<button[\s\S]*?<\/button>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const buttonHtml = match[0];
    const relativePath = path.relative(targetDir, filePath);
    
    // Check for potential contrast issues
    const hasDarkBg = buttonHtml.includes('bg-slate-') || buttonHtml.includes('bg-black') || buttonHtml.includes('bg-surface') || buttonHtml.includes('bg-base') || buttonHtml.includes('bg-input') || buttonHtml.includes('bg-transparent') || buttonHtml.includes('btnGhost') || buttonHtml.includes('bg-modal');
    const hasDarkText = buttonHtml.includes('text-slate-') || buttonHtml.includes('text-black') || buttonHtml.includes('text-[#070913]') || buttonHtml.includes('text-slate-950') || buttonHtml.includes('text-slate-900') || buttonHtml.includes('text-primary-theme') || buttonHtml.includes('text-secondary-theme');
    
    if (hasDarkBg || hasDarkText || buttonHtml.includes('className=') || buttonHtml.includes('style=')) {
      console.log(`[BUTTON in ${relativePath}]`);
      console.log(buttonHtml.trim().substring(0, 300) + (buttonHtml.length > 300 ? '...' : ''));
      console.log('-'.repeat(40));
    }
  }
}

scanDir(targetDir);
