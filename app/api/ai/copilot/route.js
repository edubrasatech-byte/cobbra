import { getUserFromRequest } from '@/lib/auth';
import { query, run, generateId } from '@/lib/db';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { command } = body;

    if (!command) {
      return Response.json({ error: 'Comando é obrigatório' }, { status: 400 });
    }

    // Get all clients of the user to pass as options
    const clients = query('SELECT id, name FROM clients WHERE user_id = ?', [user.id]);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const apiKey = process.env.GEMINI_API_KEY;

    let aiResult = null;

    if (apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemPrompt = `Você é o Dashboard Copilot da plataforma Cobbra. Seu trabalho é traduzir comandos em linguagem natural em parâmetros estruturados de banco de dados.
Hoje é dia ${todayStr} (Ano-Mês-Dia).

Você deve analisar o comando enviado pelo usuário e retornar estritamente um objeto JSON com o seguinte formato estruturado. Não envie blocos de código adicionais, cabeçalhos ou comentários markdown. Retorne apenas o JSON puro!

Lista de Clientes cadastrados:
${JSON.stringify(clients.map(c => ({ id: c.id, name: c.name })))}

Formato de Saída (JSON Puro):
{
  "intent": "create_charge" | "create_daily_billing" | "view_stats" | "view_clients" | "view_calendar" | "unknown",
  "client_id": "ID_DO_CLIENTE_SELECIONADO" | null,
  "client_name": "NOME_DO_CLIENTE" | null,
  "amount": VALOR_FLOAT | null,
  "due_date": "YYYY-MM-DD" | null,
  "description": "DESCRIÇÃO_DA_COBRANÇA" | null,
  "responseMessage": "Uma mensagem curta em português brasileiro descrevendo o que você entendeu e o que vai fazer (use emojis de cobrinha 🐍)"
}

Instruções importantes:
1. Se a intenção for cobrar, determine se é cobrança única ("create_charge") ou diária/recorrente ("create_daily_billing").
2. Associe o nome do cliente mencionado com o cliente da lista de clientes cadastrados que possua o nome mais semelhante. Se não encontrar semelhança nenhuma, retorne "client_id": null.
3. Calcule as datas relativas com precisão:
   - "amanhã" -> dia posterior a ${todayStr}
   - "hoje" -> ${todayStr}
   - "fim do mês" ou "fim deste mês" -> último dia do mês atual
   - Se mencionar apenas o dia (ex: "dia 28" ou "para o dia 5"), assuma o dia do mês atual (ou do próximo se o dia já tiver passado).
4. Se o usuário quiser ver relatórios, gráficos, faturamento, receita ou estatísticas, defina "intent": "view_stats".
5. Se o usuário quiser ver clientes ou inadimplência por cliente, defina "intent": "view_clients".
6. Se o usuário quiser ver calendário de pagamentos, defina "intent": "view_calendar".
7. Se for algo não estruturável, defina "intent": "unknown".`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: command }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          aiResult = JSON.parse(jsonText.trim());
        } catch (e) {
          console.error('[COPILOT JSON PARSE ERROR]', jsonText, e);
        }
      } else {
        const errorText = await response.text();
        console.error('[COPILOT GEMINI ERROR]', errorText);
      }
    }

    // Smart Fallback if API Key not present or Gemini failed
    if (!aiResult) {
      aiResult = getFallbackCopilotResult(command, clients, todayStr);
    }

    return Response.json(aiResult);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getFallbackCopilotResult(command, clients, todayStr) {
  const c = command.toLowerCase();
  
  let intent = 'unknown';
  let client_id = null;
  let client_name = null;
  let amount = null;
  let due_date = todayStr;
  let description = 'Cobrança via Copilot';
  let responseMessage = 'Não consegui estruturar seu comando. Tente algo como "Cobrar R$ 150 do Gustavo amanhã" ou "Ver gráficos"! 🐍';

  // Check intents
  if (c.includes('gráfico') || c.includes('receita') || c.includes('relatório') || c.includes('faturamento') || c.includes('estatística')) {
    intent = 'view_stats';
    responseMessage = 'Entendido! Redirecionando você para a aba de Relatórios e Análises. 📈🐍';
  } else if (c.includes('calendário') || c.includes('agenda') || c.includes('vencimentos')) {
    intent = 'view_calendar';
    responseMessage = 'Sem problemas! Abrindo o Calendário Interativo de Pagamentos. 🗓️🐍';
  } else if (c.includes('cliente') || c.includes('inadimplentes') || c.includes('devedor')) {
    intent = 'view_clients';
    responseMessage = 'Certo! Vamos para a lista de Clientes cadastrados. 👥🐍';
  } else if (c.includes('cobrar') || c.includes('cobre') || c.includes('cria') || c.includes('gerar') || c.includes('lançar') || c.includes('mensalidade')) {
    intent = c.includes('diária') || c.includes('diaria') ? 'create_daily_billing' : 'create_charge';
    
    // Parse Amount (R$ or R$XX.XX or XX,XX)
    const amountMatch = c.match(/(?:r\$\s*|rs\s*)?(\d+(?:[.,]\d{2})?)/);
    if (amountMatch) {
      const valStr = amountMatch[1].replace(',', '.');
      amount = parseFloat(valStr);
    } else {
      const justNumbers = c.match(/\b\d+\b/);
      if (justNumbers) {
        amount = parseFloat(justNumbers[0]);
      }
    }

    // Find closest client
    let bestMatch = null;
    let highestScore = 0;
    
    for (const client of clients) {
      const clientNameLower = client.name.toLowerCase();
      // Split names to check individual terms
      const nameParts = clientNameLower.split(' ');
      let score = 0;
      for (const part of nameParts) {
        if (part.length > 2 && c.includes(part)) {
          score += 10;
        }
      }
      if (c.includes(clientNameLower)) {
        score += 50;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = client;
      }
    }

    if (bestMatch) {
      client_id = bestMatch.id;
      client_name = bestMatch.name;
    }

    // Resolve date relative
    let daysToAdd = 0;
    if (c.includes('amanhã') || c.includes('amanha')) {
      daysToAdd = 1;
    } else if (c.includes('hoje')) {
      daysToAdd = 0;
    } else if (c.includes('semana que vem') || c.includes('próxima semana')) {
      daysToAdd = 7;
    } else {
      // Look for a day pattern like "dia X"
      const dayMatch = c.match(/dia\s*(\d{1,2})/);
      if (dayMatch) {
        const targetDay = parseInt(dayMatch[1]);
        const d = new Date();
        const currentYear = d.getFullYear();
        const currentMonth = d.getMonth();
        let targetDate = new Date(currentYear, currentMonth, targetDay);
        if (targetDate < d) {
          // Next month
          targetDate = new Date(currentYear, currentMonth + 1, targetDay);
        }
        due_date = targetDate.toISOString().split('T')[0];
        daysToAdd = -1; // already calculated
      }
    }

    if (daysToAdd >= 0) {
      const d = new Date();
      d.setDate(d.getDate() + daysToAdd);
      due_date = d.toISOString().split('T')[0];
    }

    description = intent === 'create_daily_billing' ? 'Faturamento Diário via Copilot' : 'Cobrança via Copilot';

    if (intent === 'create_charge') {
      responseMessage = `Entendido! Você deseja criar uma cobrança única para ${client_name || 'um cliente'} no valor de R$ ${amount || '0,00'} com vencimento em ${due_date.split('-').reverse().join('/')}. Confirmar lançamento? 🪄🐍`;
    } else {
      responseMessage = `Entendido! Você deseja iniciar um Faturamento Diário de R$ ${amount || '0,00'} para o cliente ${client_name || 'um cliente'}. Confirmar início? 🪄📅🐍`;
    }
  }

  return {
    intent,
    client_id,
    client_name,
    amount,
    due_date,
    description,
    responseMessage
  };
}
