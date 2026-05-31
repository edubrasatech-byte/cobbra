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

function searchUrls() {
  const dir = 'C:\\Users\\marci\\.gemini\\antigravity\\scratch\\cobroo';
  const files = walk(dir);
  console.log(`🔍 Scanning ${files.length} files for URL domains...`);

  const domains = new Set();

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/https?:\/\/[^\s"'`]+(?:railway\.app|cobbra|cobroo)[^\s"'`]*/gi);
      if (matches) {
        matches.forEach(m => domains.add(m));
      }
    } catch(e) {}
  });

  console.log('\n🔗 FOUND DOMAINS/URLS:');
  for (const dom of domains) {
    console.log(`- ${dom}`);
  }
}

searchUrls();
