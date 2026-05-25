const fs = require('fs');
const path = require('path');

let apiKey = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  const match = envContent.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.error('Failed to read .env.local', e);
}

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not defined in .env.local');
  process.exit(1);
}

async function testGemini(modelName) {
  console.log(`\n--- Testing model: ${modelName} ---`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello Catarina! Are you there?' }]
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Status: Success (200)');
      console.log('Response Text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      const errorText = await response.text();
      console.log(`Status: Failed (${response.status})`);
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('Fetch exception:', error);
  }
}

async function run() {
  await testGemini('gemini-1.5-flash');
  await testGemini('gemini-2.5-flash');
}

run();
