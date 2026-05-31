const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\marci\\.gemini\\antigravity\\brain\\e2f865eb-76b0-40b9-9a5b-3fc861ea9522\\.system_generated\\logs\\transcript.jsonl';

async function findGroqKey() {
  console.log('🔍 Scanning conversation history for Groq API keys...');
  
  if (!fs.existsSync(logPath)) {
    console.error('Log file not found at:', logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const keysFound = new Set();

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      // Look for gsk_ followed by alphanumeric characters
      const matches = line.match(/gsk_[a-zA-Z0-9_-]+/g);
      if (matches) {
        for (const key of matches) {
          keysFound.add(key);
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  if (keysFound.size > 0) {
    console.log('\n🎉 FOUND GROQ KEYS IN HISTORY:');
    for (const key of keysFound) {
      console.log(`- ${key}`);
    }
  } else {
    console.log('\n❌ No Groq API keys (gsk_...) found in conversation history.');
  }
}

findGroqKey();
