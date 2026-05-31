const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\marci\\.gemini\\antigravity\\brain\\e2f865eb-76b0-40b9-9a5b-3fc861ea9522\\.system_generated\\logs\\transcript.jsonl';

async function getLine() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount === 9050) {
      console.log('--- LINE 9050 ---');
      console.log(line);
      console.log('-----------------');
      break;
    }
  }
}

getLine();
