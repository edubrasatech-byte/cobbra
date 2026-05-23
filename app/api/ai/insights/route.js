import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    // Aggregate statistics from database
    const clientsCountRes = queryOne('SELECT COUNT(*) as total FROM clients WHERE user_id = ?', [user.id]);
    const clientsCount = clientsCountRes ? clientsCountRes.total : 0;

    const chargesStats = query(
      `SELECT status, COUNT(*) as count, SUM(amount) as sum 
       FROM charges 
       WHERE user_id = ? 
       GROUP BY status`,
      [user.id]
    );

    // Calculate specific stats
    let totalCharged = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let totalPending = 0;

    let countPaid = 0;
    let countOverdue = 0;
    let countPending = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // We can also double check details by querying the due_date status directly
    const overdueRes = queryOne(
      `SELECT COUNT(*) as count, SUM(amount) as sum 
       FROM charges 
       WHERE user_id = ? AND status = 'pending' AND due_date < ?`,
      [user.id, todayStr]
    );

    const pendingInTimeRes = queryOne(
      `SELECT COUNT(*) as count, SUM(amount) as sum 
       FROM charges 
       WHERE user_id = ? AND status = 'pending' AND due_date >= ?`,
      [user.id, todayStr]
    );

    const paidRes = queryOne(
      `SELECT COUNT(*) as count, SUM(amount) as sum 
       FROM charges 
       WHERE user_id = ? AND (status = 'paid' OR status = 'paid_early')`,
      [user.id]
    );

    countOverdue = overdueRes ? overdueRes.count : 0;
    totalOverdue = overdueRes && overdueRes.sum ? overdueRes.sum : 0;

    countPending = pendingInTimeRes ? pendingInTimeRes.count : 0;
    totalPending = pendingInTimeRes && pendingInTimeRes.sum ? pendingInTimeRes.sum : 0;

    countPaid = paidRes ? paidRes.count : 0;
    totalPaid = paidRes && paidRes.sum ? paidRes.sum : 0;

    totalCharged = totalPaid + totalOverdue + totalPending;

    // Get average delay days for overdue charges
    const avgOverdueRes = queryOne(
      `SELECT AVG(julianday(?) - julianday(due_date)) as avg_days 
       FROM charges 
       WHERE user_id = ? AND status = 'pending' AND due_date < ?`,
      [todayStr, user.id, todayStr]
    );
    const avgDaysOverdue = avgOverdueRes && avgOverdueRes.avg_days ? Math.round(avgOverdueRes.avg_days) : 0;

    // Build statistics summary
    const statsSummary = `
      - Total de clientes ativos: ${clientsCount}
      - Total faturado histórico (soma de cobranças ativas): R$ ${totalCharged.toFixed(2)}
      - Cobranças já quitadas: ${countPaid} recebimentos (Total: R$ ${totalPaid.toFixed(2)})
      - Cobranças em dia (aguardando vencimento): ${countPending} pendentes (Total: R$ ${totalPending.toFixed(2)})
      - Cobranças inadimplentes (vencidas): ${countOverdue} em atraso (Total: R$ ${totalOverdue.toFixed(2)})
      - Média de atraso atual dos devedores: ${avgDaysOverdue} dias
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    let insights = null;

    if (apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemPrompt = `Você é a Catarina, a analista financeira oficial de IA da plataforma Cobbra.
Sua especialidade é gerar conselhos acionáveis, inteligentes e persuasivos de negócios para ajudar autônomos e freelancers a reduzir a inadimplência e melhorar o fluxo de caixa.

Analise as estatísticas de cobranças anônimas fornecidas e gere exatamente 3 insights acionáveis de negócios.
Você deve retornar estritamente uma matriz JSON contendo exatamente 3 objetos. Não envie blocos de código markdown adicionais ou formatações redundantes. Apenas o JSON puro!

Cada objeto do array JSON DEVE ter o seguinte formato:
{
  "title": "Um título atraente e curto de até 5 palavras (use emojis relevantes)",
  "text": "O insight detalhado explicando o que os números mostram e dando uma dica prática e acionável de até 2 frases.",
  "type": "success" | "warning" | "info" (use "success" para comemorações e receitas, "warning" para alertas de atraso alto ou perigo, "info" para dicas operacionais ou de configuração)
}

Por favor, seja estimulante, fale no tom amigável da cobrinha Catarina e use emojis de cobrinha 🐍!`;

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
              parts: [{ text: `Estatísticas financeiras atuais:\n${statsSummary}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.6,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          insights = JSON.parse(jsonText.trim());
        } catch (e) {
          console.error('[INSIGHTS JSON PARSE ERROR]', jsonText, e);
        }
      } else {
        const errorText = await response.text();
        console.error('[INSIGHTS GEMINI ERROR]', errorText);
      }
    }

    // Smart Fallback if Gemini is not set or failed
    if (!insights || !Array.isArray(insights) || insights.length < 3) {
      insights = getFallbackInsights(totalPaid, totalOverdue, countOverdue, avgDaysOverdue, clientsCount);
    }

    return Response.json({ insights });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getFallbackInsights(totalPaid, totalOverdue, countOverdue, avgDaysOverdue, clientsCount) {
  const insights = [];

  // Insight 1: Inadimplência
  if (countOverdue > 0) {
    const ratio = (totalOverdue / (totalPaid + totalOverdue + 1)) * 100;
    if (ratio > 20) {
      insights.push({
        title: '⚠️ Risco de Caixa Alto',
        text: `Você possui R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto (${ratio.toFixed(0)}% do faturado). Sugerimos ativar o canal WhatsApp e programar lembretes 2 dias antes e 3 dias após o vencimento! 🐍`,
        type: 'warning'
      });
    } else {
      insights.push({
        title: '📈 Controle de Inadimplência',
        text: `Seu índice de inadimplência está saudável, abaixo de 10%. Continue enviando cobranças gentis automáticas para garantir a estabilidade do seu fluxo! 🐍`,
        type: 'info'
      });
    }
  } else {
    insights.push({
      title: '🏆 Fluxo Perfeito!',
      text: 'Parabéns! Você tem 0% de inadimplência ativa no momento. Seus clientes estão pagando em dia, mantendo sua empresa extremamente saudável! 🐍',
      type: 'success'
    });
  }

  // Insight 2: WhatsApp
  insights.push({
    title: '📱 Automação Z-API',
    text: 'Sabia que cobranças com lembretes pelo WhatsApp reduzem em até 40% o tempo médio de pagamento? Conecte sua conta em Configurações > Integrações agora mesmo! 🐍',
    type: 'info'
  });

  // Insight 3: Dica de Vencimento / Faturamento Diário
  if (clientsCount > 5) {
    insights.push({
      title: '📅 Dica de Calendário',
      text: 'Cobranças programadas com vencimento entre os dias 5 e 10 têm uma taxa de quitação 25% mais rápida no Brasil devido ao ciclo padrão de salários. Planeje seus prazos! 🐍',
      type: 'success'
    });
  } else {
    insights.push({
      title: '🐍 Cresça com Faturamento Diário',
      text: 'Para serviços recorrentes ou aluguéis de equipamentos, experimente nossa ferramenta de Faturamento Diário. Ela elimina a necessidade de emitir faturas manuais toda semana! 🐍',
      type: 'info'
    });
  }

  return insights;
}
