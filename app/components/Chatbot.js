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

  const handleSendMessage = async (text) => {
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

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });
      const data = await res.json();
      setIsTyping(false);

      const botMsg = {
        sender: 'bot',
        text: data.text || 'Tive uma pequena lentidão na minha conexão. Pode repetir? 🐍',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ticketOpened: data.ticketOpened
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Tive uma pequena lentidão na minha conexão. Pode repetir? 🐍',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
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
          background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          animation: 'fadeInUp 0.3s ease'
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
                  maxWidth: '85%',
                  background: m.sender === 'user' ? '#059669' : 'rgba(255,255,255,0.05)',
                  borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  padding: '10px 14px',
                  border: m.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                {m.ticketOpened && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                    🎫 Chamado prioritário aberto para suporte@cobbra.com.br
                  </div>
                )}
                <span style={{ fontSize: 9, color: '#64748b', display: 'block', textAlign: 'right', marginTop: 4 }}>{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div style={{
                alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px 16px 16px 2px', padding: '10px 14px',
                border: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span>Catarina está pensando</span>
                <span className="animate-pulse" style={{ color: '#10b981' }}>🐍...</span>
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
