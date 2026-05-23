'use client';
import { useState, useEffect, useRef } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Sou a Catarina, sua assistente virtual da Cobbra. Estou aqui para te ajudar a gerenciar cobranças gentis! 🐍 Como posso te ajudar hoje?',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const faqData = [
    { q: '📱 Como conectar o WhatsApp?', a: 'Para conectar seu WhatsApp Business, acesse as Configurações > Integrações no seu painel. Clique em "Configurar" ao lado do WhatsApp e siga o tutorial escaneando o QR Code da Z-API ou Evolution API com o seu celular. Leva menos de 2 minutos!' },
    { q: '💎 Quais são os planos?', a: 'Oferecemos três planos incríveis: Starter (R$ 9,90/mês, até 3 cobranças ativas), Crescimento (R$ 19,90/mês, até 20 cobranças simultâneas) e Cobra Pro (R$ 49,90/mês, cobranças ilimitadas e suporte prioritário). Sem taxas Pix, você recebe 100% direto na sua conta!' },
    { q: '📈 Como funciona o juro diário?', a: 'Você pode definir a taxa de juros diários ao criar qualquer cobrança. Se o cliente atrasar, o Cobbra calcula e exibe os juros acumulados corrigidos automaticamente dia após dia, incentivando o pagamento rápido. Altere as taxas por score no painel!' },
    { q: '💰 Tem taxa sobre o valor recebido?', a: 'Nenhuma! Diferente de outros intermediadores de pagamento, o Cobbra não retém nenhuma porcentagem do seu Pix. Você paga apenas a assinatura do plano mensal e recebe o dinheiro integral direto no seu banco!' }
  ];

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '';
      const t = text.toLowerCase();

      if (t.includes('whatsapp') || t.includes('conectar') || t.includes('celular') || t.includes('qr code')) {
        replyText = 'Para conectar o WhatsApp ao Cobbra, acesse "Configurações > Integrações", clique em "Configurar" no card do WhatsApp e insira as credenciais do seu provedor (Z-API/Evolution). O processo é super amigável e não requer código!';
      } else if (t.includes('plano') || t.includes('planos') || t.includes('preço') || t.includes('preços') || t.includes('mensalidade') || t.includes('gratis') || t.includes('grátis')) {
        replyText = 'Temos três planos: Starter (R$ 9,90/mês, limite de 3 cobranças), Crescimento (R$ 19,90/mês, limite de 20 cobranças) e Cobra Pro (R$ 49,90/mês, cobranças ilimitadas). Escolha o melhor para a escala do seu negócio!';
      } else if (t.includes('juro') || t.includes('juros') || t.includes('multa') || t.includes('atraso')) {
        replyText = 'Com o Cobbra você pode adicionar juros diários pós-vencimento de forma flexível. O saldo da dívida é recalculado a cada dia que passa e exibido com destaque na tela de cobranças e no link do cliente!';
      } else if (t.includes('diaria') || t.includes('diária') || t.includes('faturamento diário')) {
        replyText = 'A Cobrança Diária é o recurso perfeito para locadoras de carros, estúdios ou serviços recorrentes de alta frequência. Você configura o valor diário no painel de cobrança diária e a cobrança acumula no histórico do cliente!';
      } else if (t.includes('taxa') || t.includes('pix') || t.includes('taxas') || t.includes('receber')) {
        replyText = 'Aqui a taxa é zero! O dinheiro do Pix cai direto na sua chave cadastrada sem passar pelo Cobbra. Você fica com 100% do valor pago pelo cliente!';
      } else if (t.includes('abatimento') || t.includes('abater') || t.includes('desconto')) {
        replyText = 'Você pode realizar abatimentos parciais em qualquer cobrança pendente. Basta ir na aba de Cobranças ou clicar no perfil do cliente, selecionar "Abater Parte", digitar o valor e o saldo será atualizado automaticamente!';
      } else {
        replyText = 'Excelente pergunta! Como assistente inteligente do Cobbra, posso te garantir que nossa ferramenta ajuda você a reduzir a inadimplência em até 40% enviando lembretes gentis por WhatsApp e e-mail. Se precisar de ajuda para configurar, me avise!';
      }

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', bottom: 70, right: 30, zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
      
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 60, height: 60, borderRadius: '50%', 
          background: 'linear-gradient(135deg, #059669, #0d9488)', 
          border: 'none', cursor: 'pointer', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: 30,
          boxShadow: '0 8px 25px rgba(5,150,105,0.4)', transition: 'all 0.3s ease',
          outline: 'none'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? '❌' : '🐍'}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: 75, right: 0, width: 360, height: 500,
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐍</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 14 }}>Catarina — IA Cobrinha</p>
              <span style={{ fontSize: 11, color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Online e pronta
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {messages.map((m, i) => (
              <div 
                key={i}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'user' ? '#059669' : 'rgba(255,255,255,0.05)',
                  borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  padding: '10px 14px',
                  border: m.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                <span style={{ fontSize: 9, color: '#64748b', display: 'block', textAlign: 'right', marginTop: 4 }}>{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div style={{
                alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px 16px 16px 2px', padding: '10px 14px',
                border: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12
              }}>
                Cobrinha está escrevendo... 🐍
              </div>
            )}
          </div>

          {/* Quick FAQ Options */}
          {messages.length === 1 && (
            <div style={{ padding: '0 20px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Sugestões rápidas:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {faqData.map((f, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendMessage(f.q.slice(2))}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8, padding: '6px 10px', color: '#cbd5e1', fontSize: 11,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  >
                    {f.q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input Footer */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10 }}>
            <input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder="Digite sua dúvida aqui..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Inter'
              }}
            />
            <button 
              onClick={() => handleSendMessage(inputText)}
              style={{
                padding: '10px 16px', borderRadius: 10, background: '#059669',
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter'
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
