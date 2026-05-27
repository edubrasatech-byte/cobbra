const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\marci\\.gemini\\antigravity\\scratch\\cobroo\\app\\page.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('Chatbot') || line.includes('formatMessage') || line.includes('Catarina')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
