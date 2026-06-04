const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/lembretes/page.js',
  'app/dashboard/locacoes/page.js',
  'app/dashboard/obras/page.js',
  'app/dashboard/relatorios/page.js',
  'app/dashboard/emprestimos/page.js',
  'app/dashboard/cobranca-diaria/page.js'
];

const basePath = 'C:/Users/marci/.gemini/antigravity/scratch/cobroo/';

files.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Replace style={{ color: '#fff' }} and variations
  content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*'#ffffff'/g, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*"#fff"/g, 'color: "var(--text-primary)"');
  content = content.replace(/color:\s*"#ffffff"/g, 'color: "var(--text-primary)"');

  // Replace text-white class on headings
  content = content.replace(/text-white/g, "text-primary-theme");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated contrast issues in: ${file}`);
  } else {
    console.log(`No white text bugs found/updated in: ${file}`);
  }
});
