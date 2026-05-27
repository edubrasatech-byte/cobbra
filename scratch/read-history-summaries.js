const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\marci\\.gemini\\antigravity\\brain\\e2f865eb-76b0-40b9-9a5b-3fc861ea9522\\.system_generated\\logs\\transcript.jsonl';

async function parseLogs() {
  console.log('📖 Reconstruindo consciência histórica do chat de 12MB...');
  
  if (!fs.existsSync(logPath)) {
    console.error('Arquivo de log não encontrado em:', logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 1;
  const userInputs = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      // Filter steps that represent User Inputs
      if (step.type === 'USER_INPUT' || step.source === 'USER_EXPLICIT') {
        const dateStr = step.timestamp ? new Date(step.timestamp).toLocaleString('pt-BR') : 'Sem data';
        userInputs.push({
          step: step.step_index || index,
          date: dateStr,
          text: step.content || (step.tool_calls ? 'Chamada de Ferramenta' : '')
        });
      }
    } catch (e) {
      // Ignore parsing errors for truncated lines
    }
    index++;
  }

  console.log('\n--- HISTÓRICO CRONOLÓGICO DE REQUISIÇÕES DO USUÁRIO ---');
  userInputs.forEach((input, idx) => {
    console.log(`[#${idx + 1}] Passo ${input.step} (${input.date}):`);
    console.log(`   "${input.text.replace(/\r?\n/g, ' ')}"`);
    console.log('----------------------------------------------------');
  });
}

parseLogs();
