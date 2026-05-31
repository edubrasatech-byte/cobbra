import { getUserFromRequest } from '@/lib/auth';
import { run, generateId, queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';


export async function POST(request) {
  let user = null;
  let targetRental = null;
  try {
    user = getUserFromRequest(request);
  } catch (authError) {
    console.error('[GEMINI CHAT AUTH EXCEPTION] Failed to retrieve user session, treating as guest:', authError);
  }

  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return Response.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // IA Prompt Guard: Sanitização contra injeções de prompt comuns (Frente 3)
    const dangerousPatterns = [
      /ignore\s+(as\s+)?instru[cç]ões/i,
      /ignore\s+all\s+previous\s+instructions/i,
      /esque[çc]a\s+o\s+que\s+eu\s+disse/i,
      /forget\s+all\s+previous/i,
      /you\s+are\s+now\s+a/i,
      /aja\s+como\s+se/i,
      /switch\s+to\s+admin\s+mode/i,
      /developer\s+mode/i
    ];
    const isSuspicious = dangerousPatterns.some(pattern => pattern.test(message));
    if (isSuspicious) {
      return Response.json({
        text: "Ops! Senti uma tentativa de alterar minhas diretrizes de segurança. Como a parceira inteligente oficial da Cobbra, sigo estritamente focada em ajudar você a gerenciar suas cobranças e acabar com a inadimplência! 🐍💚 Como posso te apoiar hoje com as ferramentas do sistema?",
        ticketOpened: false
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    let aiResponse = '';
    let isTicketOpened = false;

    // Strict system prompt containing business info, plans, FAQ, and support triggers
    let systemPrompt = `Você é a Catarina, a assistente inteligente e parceira financeira oficial da plataforma SaaS brasileira Cobbra.
Cobbra é uma plataforma sensacional que envia cobranças gentis por WhatsApp e e-mail de forma 100% automática, ajudando empreendedores a acabar com a inadimplência sem estresse. O dinheiro cai direto no Pix do usuário, sem taxas intermediárias!

Valores dos planos:
- Starter: R$ 9,90/mês, até 20 cobranças simultâneas, lembretes por E-mail.
- Crescimento: R$ 19,90/mês, até 50 cobranças simultâneas, lembretes por WhatsApp e E-mail.
- Cobra Pro: R$ 49,90/mês, cobranças ilimitadas, SMTP/Z-API próprios, suporte prioritário, API.

PERSONALIDADE DA CATARINA:
- Você é calorosa, empática, alegre, proativa e extremamente prestativa. Você NÃO fala como uma funcionária corporativa seca, formal, robótica ou mecânica. Você fala como uma parceira de negócios de verdade, que quer ver o usuário vencer e receber cada centavo!
- Use emojis divertidos e carinhosos (como 🐍, ✨, 🚀, 💰, 💖, ✌️) de forma muito fluxo natural e amigável.
- Evite frases engessadas do tipo "Olá, sou a Catarina, assistente...". Fale de forma mais natural, humana e direta, conectando-se genuinamente com o que o usuário está dizendo.
- Mostre entusiasmo e empatia pelo sucesso financeiro dele. Seja assertiva, mas sempre leve e acolhedora!

INSTRUÇÃO RÍGIDA DE AUTO-SUPORTE:
Se o usuário solicitar ações que apenas o administrador/suporte oficial do Cobbra possa realizar manualmente (como estornar pagamentos de assinatura, cancelamento manual de planos com reembolso, relatar falhas técnicas severas do sistema, ou requisições complexas de infraestrutura), você deve demonstrar total empatia e dizer que já está abrindo um chamado de suporte prioritário para ele.
Neste caso, e SOMENTE neste caso, você DEVE terminar a sua resposta incluindo exatamente a marcação secreta: [SUPPORT_TICKET_TRIGGER]. Isso avisará o sistema para notificar o suporte imediatamente no e-mail suporte@cobbra.com.br.
Responda sempre em português brasileiro de forma natural, calorosa e motivadora!`;

    if (user) {
      try {
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
Nicho de Negócio: ${user.business_niche || 'Geral'}
Rigor de Cobrança: ${user.collection_rigor || 'neutral'}
Estatísticas reais do negócio dele no SQLite do Cobbra:
- Total de clientes cadastrados: ${clientsCount}
- Total de cobranças criadas: ${chargesCount}
- Faturamento Total Lançado: R$ ${Number(totalCharged).toFixed(2)}
- Total Recebido (Pago): R$ ${Number(totalReceived).toFixed(2)}
- Total em Atraso (Vencido): R$ ${Number(totalOverdue).toFixed(2)} (Taxa de Inadimplência: ${overduePercent}%)
- Maior Devedor Atual: ${debtorInfo}

INSTRUÇÕES DO NICHO DO ASSINANTE:
O usuário atua no nicho de "${user.business_niche || 'Geral'}" com rigor "${user.collection_rigor || 'neutral'}".
Adequar totalmente suas orientações, exemplos de cobrança e linguagem para essa realidade:
- Se for 'locacao_veiculos' (Locação de Veículos): Foque na gestão de frota de carros, devolução no prazo, cobrança amigável de diárias/semanas e preservação do patrimônio da locadora.
- Se for 'emprestimo' (Empréstimos/Finanças): Apoie-o em cobranças assertivas, informando as consequências legais de atraso, o cálculo de juros diários estritos e o rigor contratual.
- Se for 'clinica' (Saúde): Aconselhe abordagens altamente diplomáticas, priorizando o acolhimento do paciente e a discrição.

Se o usuário perguntar sobre o seu faturamento, clientes, inadimplência, ou quem deve para ele, você DEVE responder consultando exatamente os números acima com precisão e oferecendo conselhos práticos de cobrança amigável para ajudá-lo a receber!`;

        // Intercept contract alteration requests dynamically
        const isContractRequest = /contrato|cláusula|clausula|altera.*contrato|muda.*contrato|adiciona.*contrato/i.test(message);
        
        if (isContractRequest) {
          const activeRentals = query(
            `SELECT c.*, cl.name as client_name 
             FROM charges c 
             JOIN clients cl ON c.client_id = cl.id 
             WHERE c.user_id = ? AND c.vehicle_info IS NOT NULL`,
            [user.id]
          );
          
          for (const r of activeRentals) {
            const clientFirstName = r.client_name.split(' ')[0].toLowerCase();
            const vehicleModel = r.vehicle_info.toLowerCase();
            if (message.toLowerCase().includes(clientFirstName) || message.toLowerCase().includes(vehicleModel.split(' ')[0])) {
              targetRental = r;
              break;
            }
          }
          if (!targetRental && activeRentals.length === 1) {
            targetRental = activeRentals[0];
          }
        }

        if (isContractRequest && !targetRental) {
          const activeRentals = query(
            `SELECT c.*, cl.name as client_name 
             FROM charges c 
             JOIN clients cl ON c.client_id = cl.id 
             WHERE c.user_id = ? AND c.vehicle_info IS NOT NULL`,
            [user.id]
          );
          const listStr = activeRentals.map(r => `- ${r.client_name} (${r.vehicle_info})`).join('\n');
          systemPrompt += `\n\nATENÇÃO - SOLICITAÇÃO DE ALTERAÇÃO DE CONTRATO SEM ALVO:
O usuário deseja alterar um contrato de locação de veículo, mas o modelo de veículo, placa ou cliente citado por ele (se houver) não correspondeu perfeitamente a nenhuma das suas locações ativas atuais.
Lista de locações ativas atuais do usuário no Cobbra:
${listStr || 'Nenhuma locação ativa encontrada.'}

Você deve listar amigavelmente estas locações para ele (se houver) e solicitar de forma muito educada que ele confirme qual veículo ou cliente ele deseja alterar o contrato (ex: "Não encontrei um veículo 'SDA'. Deseja alterar o contrato de Mariana Alves (Chevrolet Onix)?"). Não invente contratos nem diga que sua especialidade é apenas faturamento se houver locações disponíveis que ele queira alterar!`;
        }

        if (targetRental) {
          systemPrompt += `\n\nATENÇÃO - SOLICITAÇÃO DE ALTERAÇÃO DE CONTRATO ATIVA:
O usuário deseja alterar o contrato de locação do veículo de *${targetRental.client_name}* (${targetRental.vehicle_info}).
Texto atual do contrato:
\"\"\"
${targetRental.contract_text || 'Sem contrato gerado.'}
\"\"\"

Você DEVE reescrever este contrato completo incorporando as alterações de cláusulas ou novos termos solicitados pelo usuário. O contrato deve permanecer extremamente rígido e amplamente favorável ao locador.
Ao responder, você DEVE envelopar o novo texto completo do contrato exatamente dentro deste bloco de código markdown:
\`\`\`contract
[CONTRATO COMPLETO ALTERADO]
\`\`\`
Explique de forma muito simpática e resumida no chat quais cláusulas foram ajustadas e afirme que o contrato eletrônico correspondente já foi atualizado com sucesso no painel do usuário!`;
        }
      } catch (dbError) {
        console.error('[GEMINI CHAT DB STATS EXCEPTION] Proceeding with base profile:', dbError);
        systemPrompt += `\n\nCONTEXTO REAL DO USUÁRIO LOGADO:
Nome do usuário: ${user.name}
E-mail: ${user.email}
Plano ativo: ${user.plan || 'trial'}`;
      }
    }

    if (apiKey) {
      try {
        // NATIVE DEPENDENCY-FREE FETCH CALL TO GROQ API (using stable llama-3.3-70b-versatile)
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        
        // Convert chat history format for OpenAI/Groq messages standard
        const messages = [
          { role: 'system', content: systemPrompt }
        ];
        
        const userAndModelHistory = history.filter((msg, idx) => {
          if (idx === 0 && msg.sender !== 'user') return false;
          return true;
        });

        // Compactação inteligente de mensagens longas do histórico para economia de tokens (Frente 3)
        const compressedHistory = userAndModelHistory.map(msg => {
          let text = msg.text || '';
          if (text.length > 800) {
            const start = text.substring(0, 350);
            const end = text.substring(text.length - 350);
            text = `${start}\n... [conteúdo longo compactado pela Catarina para otimização de tokens] ...\n${end}`;
          }
          return {
            ...msg,
            text
          };
        });

        compressedHistory.slice(-10).forEach(msg => {
          messages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });

        // Append current message
        messages.push({
          role: 'user',
          content: message
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
          if (!aiResponse) {
            console.warn('[GROQ CHAT WARNING] Groq returned empty response, falling back to rule-based reply.');
            aiResponse = getFallbackReply(message);
          } else {
            const contractRegex = /```contract\s*([\s\S]*?)\s*```/i;
            const match = aiResponse.match(contractRegex);
            if (match && targetRental) {
              const newContract = match[1].trim();
              try {
                run('UPDATE charges SET contract_text = ? WHERE id = ?', [newContract, targetRental.id]);
                console.log(`[AI CONTRACT MUTATION SUCCESS] Contract updated for charge ${targetRental.id}`);
              } catch (dbErr) {
                console.error('[AI CONTRACT MUTATION ERROR] Failed to update contract in database:', dbErr);
              }
              aiResponse = aiResponse.replace(contractRegex, '').trim();
            }
          }
        } else {
          const errorText = await response.text();
          console.error('[GROQ API ERROR]', errorText);
          aiResponse = getFallbackReply(message);
        }
      } catch (fetchError) {
        console.error('[GROQ FETCH EXCEPTION] Outgoing request failed, resorting to local offline brain:', fetchError);
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
        try {
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
          
          // Send real support ticket notification email to suporte@cobbra.com.br
          try {
            const ticketHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); }
    .header { background: #ea580c; padding: 24px; text-align: center; }
    .title { color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .content { padding: 32px; line-height: 1.6; font-size: 14.5px; }
    .ticket-card { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .ticket-label { color: #b45309; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; display: block; }
    .ticket-value { color: #78350f; font-size: 14px; margin: 0; }
    .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🎫 Novo Chamado de Suporte — Cobbra</h1>
    </div>
    <div class="content">
      <p style="margin-top: 0;">A Catarina AI abriu automaticamente um ticket de suporte prioritário para um assinante:</p>
      
      <div class="ticket-card">
        <span class="ticket-label">Assinante Emissor</span>
        <p class="ticket-value"><strong>${user.name}</strong> (${user.email})</p>
        <p class="ticket-value" style="margin-top: 6px;">Plano: <strong>${user.plan?.toUpperCase() || 'TRIAL'}</strong></p>
      </div>

      <div class="ticket-card" style="background: #f8fafc; border-color: #e2e8f0;">
        <span class="ticket-label" style="color: #64748b;">Mensagem Solicitante</span>
        <p class="ticket-value" style="color: #334155; font-style: italic;">"${message}"</p>
      </div>

      <p style="font-size: 13.5px; color: #475569;">
        Por favor, acesse o painel administrativo do Cobbra ou envie uma resposta diretamente para o e-mail do assinante (<a href="mailto:${user.email}" style="color: #ea580c; text-decoration: none;">${user.email}</a>) para resolver a solicitação.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Cobbra AI Platform — Catarina Auto-Ticket Generator 🐍</p>
    </div>
  </div>
</body>
</html>
            `;
            
            sendEmail({
              to: 'suporte@cobbra.com.br',
              subject: `🎫 Novo Chamado [Suporte] — ${user.name}`,
              html: ticketHtml
            }).catch(err => console.error('[SMTP SUPPORT EMAIL DISPATCH ERROR]', err));
          } catch (emailErr) {
            console.error('[SMTP SUPPORT EMAIL INITIATION ERROR]', emailErr);
          }
          
          console.warn(`[SUPPORT TICKET] Real-time email alert dispatched to suporte@cobbra.com.br for user ${user.email}`);
        } catch (dbTicketError) {
          console.error('[GEMINI CHAT TICKET DB EXCEPTION] Failed to record ticket in database:', dbTicketError);
        }
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
  const t = text.trim().toLowerCase();
  
  // Natural greeting handling
  if (
    t === 'oi' || 
    t === 'olá' || 
    t === 'ola' || 
    t.startsWith('oi ') || 
    t.startsWith('olá ') || 
    t.includes('bom dia') || 
    t.includes('boa tarde') || 
    t.includes('boa noite') || 
    t.includes('tudo bem') || 
    t.includes('como vai')
  ) {
    return 'Olá! Sou a Catarina AI, a assistente inteligente do Cobbra. 🐍\n\nEstou pronta para tirar suas dúvidas de suporte ou ajudar você a gerenciar seu faturamento. Como posso ajudar você hoje?';
  }

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
  return 'Como a sua assistente inteligente do Cobbra, estou aqui para ajudar você a reduzir a inadimplência e automatizar cobranças gentis por WhatsApp e E-mail. 🐍\n\nSe tiver dúvidas sobre juros, Pix, planos ou sobre como conectar seu WhatsApp, basta me perguntar!';
}
