import { getUserFromRequest } from '@/lib/auth';
import { run, generateId, queryOne } from '@/lib/db';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return Response.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponse = '';
    let isTicketOpened = false;

    // Strict system prompt containing business info, plans, FAQ, and support triggers
    let systemPrompt = `Você é a Catarina, a assistente inteligente oficial da plataforma SaaS brasileira Cobbra. 
Cobbra é uma plataforma que envia cobranças gentis por WhatsApp e e-mail de forma 100% automática. Receba direto no seu Pix, sem taxas intermediárias.
Valores dos planos:
- Starter: R$ 9,90/mês, até 20 cobranças simultâneas, lembretes por E-mail.
- Crescimento: R$ 19,90/mês, até 50 cobranças simultâneas, lembretes por WhatsApp e E-mail.
- Cobra Pro: R$ 49,90/mês, cobranças ilimitadas, SMTP/Z-API próprios, suporte prioritário, API.

INSTRUÇÃO RÍGIDA DE AUTO-SUPORTE:
Se o usuário solicitar ações que apenas o administrador/suporte oficial do Cobbra possa realizar manualmente (como estornar pagamentos de assinatura, cancelamento manual de planos com reembolso, relatar falhas técnicas severas do sistema, ou requisições complexas de infraestrutura), você deve dizer de forma muito simpática que entende a gravidade e que está abrindo um chamado de suporte prioritário para ele.
Neste caso, e SOMENTE neste caso, você DEVE terminar a sua resposta incluindo exatamente a marcação secreta: [SUPPORT_TICKET_TRIGGER]. Isso avisará o sistema para notificar o suporte imediatamente no e-mail suporte@cobbra.com.br.
Responda sempre em português brasileiro, seja simpática, solícita e use emojis de cobrinha 🐍.`;

    if (user) {
      // Fetch dynamic dashboard analytics from SQLite to provide hyper-intelligent user support
      const clientsCount = queryOne('SELECT COUNT(*) as total FROM clients WHERE user_id = ?', [user.id])?.total || 0;
      const chargesCount = queryOne('SELECT COUNT(*) as total FROM charges WHERE user_id = ?', [user.id])?.total || 0;
      
      const stats = queryOne(`
        SELECT 
          SUM(amount) as total_charged,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_received,
          SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue
        FROM charges 
        WHERE user_id = ?`,
        [user.id]
      );
      
      const totalCharged = stats?.total_charged || 0;
      const totalReceived = stats?.total_received || 0;
      const totalOverdue = stats?.total_overdue || 0;
      const overduePercent = totalCharged > 0 ? ((totalOverdue / totalCharged) * 100).toFixed(1) : '0';

      const topDebtor = queryOne(`
        SELECT cl.name, SUM(c.amount) as overdue_sum 
        FROM charges c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.user_id = ? AND c.status = 'overdue'
        GROUP BY c.client_id
        ORDER BY overdue_sum DESC
        LIMIT 1
      `, [user.id]);

      const debtorInfo = topDebtor 
        ? `${topDebtor.name} (R$ ${Number(topDebtor.overdue_sum).toFixed(2)} em atraso)`
        : 'Nenhum cliente inadimplente crítico';

      systemPrompt += `\n\nCONTEXTO REAL DO USUÁRIO LOGADO:
Nome do usuário: ${user.name}
E-mail: ${user.email}
Plano ativo: ${user.plan || 'trial'}
Estatísticas reais do negócio dele no SQLite do Cobbra:
- Total de clientes cadastrados: ${clientsCount}
- Total de cobranças criadas: ${chargesCount}
- Faturamento Total Lançado: R$ ${Number(totalCharged).toFixed(2)}
- Total Recebido (Pago): R$ ${Number(totalReceived).toFixed(2)}
- Total em Atraso (Vencido): R$ ${Number(totalOverdue).toFixed(2)} (Taxa de Inadimplência: ${overduePercent}%)
- Maior Devedor Atual: ${debtorInfo}

Se o usuário perguntar sobre o seu faturamento, clientes, inadimplência, ou quem deve para ele, você DEVE responder consultando exatamente os números acima com precisão e oferecendo conselhos práticos de cobrança amigável para ajudá-lo a receber!`;
    }

    if (apiKey) {
      // NATIVE DEPENDENCY-FREE FETCH CALL TO GEMINI API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      // Convert chat history format for Gemini API
      const contents = [];
      
      // Inject system instructions as instructions
      history.slice(-10).forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });

      // Append current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const errorText = await response.text();
        console.error('[GEMINI API ERROR]', errorText);
        aiResponse = getFallbackReply(message);
      }
    } else {
      // Use fallback matching if API Key is not set
      aiResponse = getFallbackReply(message);
    }

    // Support ticket trigger parsing
    if (aiResponse.includes('[SUPPORT_TICKET_TRIGGER]')) {
      isTicketOpened = true;
      aiResponse = aiResponse.replace('[SUPPORT_TICKET_TRIGGER]', '').trim();
      
      // If we have an authenticated user, open a ticket
      if (user) {
        const ticketId = generateId();
        const details = `Chamado aberto automaticamente pela IA para ${user.name} (${user.email}). Mensagem do usuário: "${message}"`;
        
        // Log activity
        run(
          'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
          [generateId(), user.id, 'support_ticket_opened', 'user', user.id, details]
        );
        
        // In-app Notification
        run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [generateId(), user.id, 'warning', '🎫 Suporte Acionado', 'Catarina abriu um ticket prioritário para suporte@cobbra.com.br. Nossa equipe já está resolvendo!', 'user', user.id]
        );
        
        console.warn(`[SUPPORT TICKET] Real-time email alert simulated: Sent ticket to suporte@cobbra.com.br for user ${user.email}`);
      } else {
        console.warn(`[SUPPORT TICKET] Guest user requested help. Simulated alert to suporte@cobbra.com.br. Message: "${message}"`);
      }
    }

    return Response.json({ text: aiResponse, ticketOpened: isTicketOpened });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Highly customized Brazilian SaaS fallback rules
function getFallbackReply(text) {
  const t = text.toLowerCase();
  if (t.includes('whatsapp') || t.includes('conectar') || t.includes('celular') || t.includes('qr code')) {
    return 'Para conectar seu WhatsApp Business ao Cobbra, acesse "Configurações > Integrações", clique em "Configurar" no card do WhatsApp e escaneie o QR Code. O processo leva menos de 2 minutos e é super amigável! 🐍';
  }
  if (t.includes('plano') || t.includes('planos') || t.includes('preço') || t.includes('mensalidade') || t.includes('gratis') || t.includes('grátis') || t.includes('starter') || t.includes('crescimento') || t.includes('cobra pro')) {
    return 'Temos três planos no Cobbra: Starter (R$ 9,90/mês, até 20 cobranças), Crescimento (R$ 19,90/mês, até 50 cobranças com WhatsApp) e Cobra Pro (R$ 49,90/mês, cobranças ilimitadas e suporte prioritário). Escolha o melhor para a escala do seu negócio! 💎';
  }
  if (t.includes('juro') || t.includes('juros') || t.includes('multa') || t.includes('atraso')) {
    return 'Com o Cobbra você adiciona juros diários pós-vencimento com facilidade. O saldo é recalculado automaticamente a cada dia em atraso e o valor atualizado é exibido diretamente para o cliente pagar pelo Pix! 💰';
  }
  if (t.includes('diaria') || t.includes('diária') || t.includes('faturamento diário')) {
    return 'O Faturamento Diário é perfeito para locações, serviços recorrentes ou assinaturas de alta frequência. Você configura o valor diário e o sistema soma os dias ativos no histórico do cliente! 📅';
  }
  if (t.includes('taxa') || t.includes('pix') || t.includes('receber')) {
    return 'Aqui a taxa é zero! O Pix do cliente cai 100% direto na sua chave cadastrada sem passar pelo Cobbra e sem nenhuma comissão ou taxa intermediária. Você fica com todo o dinheiro! 💸';
  }
  if (t.includes('estorno') || t.includes('cancelamento manual') || t.includes('reembolso') || t.includes('bug') || t.includes('erro técnico') || t.includes('estornar')) {
    return 'Entendo perfeitamente que essa é uma questão sensível e importante. Como eu sou uma assistente virtual, não consigo processar estornos ou cancelamentos manuais de forma direta. Por isso, acabo de abrir um chamado de suporte prioritário para a nossa equipe pelo e-mail suporte@cobbra.com.br. Eles vão resolver isso para você o mais rápido possível! [SUPPORT_TICKET_TRIGGER] 🐍';
  }
  return 'Excelente pergunta! Como assistente inteligente do Cobbra, posso te garantir que nossa ferramenta ajuda você a reduzir a inadimplência em até 40% enviando lembretes gentis por WhatsApp e e-mail. Se precisar de ajuda para configurar, me avise! 🐍';
}
