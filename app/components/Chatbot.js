'use client';
import { useState, useEffect, useRef } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Sou a Catarina AI 3.0, a inteligência neural da Cobbra. 🐍\n\nEstou conectada ao seu banco de dados e pronta para gerenciar cobranças gentis, analisar inadimplências ou criar faturamentos. \n\nComo posso acelerar seu caixa hoje?',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Smooth and extremely reliable scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const faqData = [
    { q: '⚡ Conectar WhatsApp', a: 'Para conectar seu WhatsApp Business, acesse as Configurações > Integrações no seu painel. Clique em "Configurar" ao lado do WhatsApp e siga o tutorial escaneando o QR Code da Z-API ou Evolution API com o seu celular. Leva menos de 2 minutos!' },
    { q: '💎 Planos & Limites', a: 'Starter (R$ 9,90/mês, até 3 cobranças ativas), Crescimento (R$ 19,90/mês, até 20 cobranças simultâneas) e Cobra Pro (R$ 49,90/mês, cobranças ilimitadas e suporte prioritário). Sem taxas Pix, você recebe 100% direto na sua conta!' },
    { q: '📈 Juros por Score', a: 'Você pode definir a taxa de juros diários ao criar qualquer cobrança. Se o cliente atrasar, o Cobbra calcula e exibe os juros acumulados corrigidos automaticamente dia após dia, incentivando o pagamento rápido. Altere as taxas por score no painel!' },
    { q: '🛡️ Sem Taxas Pix', a: 'Nenhuma! Diferente de outros intermediadores de pagamento, o Cobbra não retém nenhuma porcentagem do seu Pix. Você paga apenas a assinatura do plano mensal e recebe o dinheiro integral direto no seu banco!' }
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
        text: data.text || 'Conexão interrompida. Por favor, tente enviar novamente! 🐍',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ticketOpened: data.ticketOpened
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Identifiquei uma pequena instabilidade de conexão. Vamos tentar de novo? 🐍',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 10000, fontFamily: "'Inter', sans-serif" }}>
      
      {/* Global CSS Inject including dark backdrop, bubbles, and custom Windows scrollbar */}
      <style jsx global>{`
        @keyframes c3-float {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes c3-glow {
          0% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(13, 148, 136, 0.2); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.7), 0 0 45px rgba(13, 148, 136, 0.4); }
          100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(13, 148, 136, 0.2); }
        }
        @keyframes c3-slide-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes c3-pulse-wave {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes c3-sparkle {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes c3-typing-dot {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        
        /* Darker, opaque solid glass look for maximum readability and zero underlying text bleed */
        .c3-glass-panel {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(11, 15, 25, 0.98) !important; /* Extremely high opacity to block background text */
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04);
        }
        
        .c3-bubble-user {
          background: linear-gradient(135deg, #10b981, #0d9488) !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-width: 45px;
          text-align: left;
        }
        
        .c3-bubble-bot {
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-left: 3px solid #10b981 !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        
        .c3-ticket-alert {
          background: rgba(245, 158, 11, 0.08) !important;
          border: 1px solid rgba(245, 158, 11, 0.2) !important;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.1) inset;
        }
        
        .c3-input-glow:focus {
          border-color: rgba(16, 185, 129, 0.4) !important;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.2) !important;
          background: rgba(15, 23, 42, 0.9) !important;
        }

        /* Sleek custom scrollbar to match the high-end dashboard aesthetics */
        .c3-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .c3-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .c3-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .c3-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>

      {/* Floating Action Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 64, height: 64, borderRadius: '50%', 
          background: 'linear-gradient(135deg, #10b981, #0d9488)', 
          border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: 32,
          boxShadow: '0 8px 30px rgba(16,185,129,0.4)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none', position: 'relative',
          animation: isOpen ? 'none' : 'c3-float 4s ease-in-out infinite, c3-glow 3s ease-in-out infinite'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08) rotate(3deg)';
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(16,185,129,0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = isOpen ? 'none' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(16,185,129,0.4)';
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: 22, color: '#fff', fontWeight: 300, display: 'block' }}>✕</span>
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>🐍</span>
            {/* Live pulsating dot */}
            <span style={{
              position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%',
              background: '#34d399', border: '2px solid #0f172a',
              boxShadow: '0 0 8px #34d399'
            }} />
          </div>
        )}
      </button>

      {/* Futuristic Chat Window */}
      {isOpen && (
        <div 
          className="c3-glass-panel"
          style={{
            position: 'absolute', bottom: 82, right: 0, width: 375, height: 530,
            borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            animation: 'c3-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
            zIndex: 99999
          }}
        >
          {/* Glowing Top bar decoration */}
          <div style={{ height: 3, width: '100%', background: 'linear-gradient(90deg, #10b981, #0d9488, #3b82f6, #10b981)', backgroundSize: '300% 100%', animation: 'c3-sparkle 8s linear infinite' }} />

          {/* Header */}
          <div style={{ 
            padding: '20px 24px', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(13, 148, 136, 0.02))', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981, #0d9488)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                boxShadow: '0 0 15px rgba(16,185,129,0.25)'
              }}>🐍</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: 14, letterSpacing: '-0.3px' }}>Catarina AI</p>
                  <span style={{ 
                    fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 6,
                    background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>V3.0</span>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ 
                    width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block',
                    boxShadow: '0 0 6px #34d399', animation: 'c3-pulse-wave 2s infinite' 
                  }} /> 
                  Rede neural ativa e online
                </span>
              </div>
            </div>
            
            {/* Active CPU Latency indicator */}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, display: 'block' }}>LATÊNCIA</span>
              <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700, letterSpacing: '0.2px' }}>0ms (FREE)</span>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="c3-scrollbar"
            style={{ 
              flex: 1, padding: '20px 24px', overflowY: 'auto', 
              display: 'flex', flexDirection: 'column', gap: 16,
              background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.01) 0%, transparent 60%)'
            }}
          >
            {messages.map((m, i) => (
              <div 
                key={i}
                className={m.sender === 'user' ? 'c3-bubble-user' : 'c3-bubble-bot'}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '12px 18px', // Increased horizontal padding for balanced UX layout
                  position: 'relative',
                  animation: 'c3-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
                  overflow: 'visible' // Ensure no text boundary constraints
                }}
              >
                {/* Text */}
                <p style={{ 
                  margin: 0, 
                  fontSize: 13.5, 
                  color: '#fff', 
                  lineHeight: 1.55, 
                  whiteSpace: 'pre-wrap',
                  fontWeight: 500,
                  letterSpacing: '0.1px',
                  wordBreak: 'break-word'
                }}>{m.text}</p>
                
                {/* Glowing alert card for Opened support tickets */}
                {m.ticketOpened && (
                  <div 
                    className="c3-ticket-alert"
                    style={{ 
                      marginTop: 12, padding: '10px 14px', 
                      borderRadius: 12, fontSize: 11.5, color: '#fbbf24', 
                      fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 6,
                      animation: 'c3-slide-in 0.4s ease both'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🎫</span>
                      <span>CHAMADO REGISTRADO COM SUCESSO</span>
                    </div>
                    <span style={{ fontWeight: 400, color: '#d97706', fontSize: 10.5 }}>
                      Enviado prioritariamente para: <strong style={{ color: '#fbbf24' }}>suporte@cobbra.com.br</strong>
                    </span>
                  </div>
                )}
                
                {/* Time stamp */}
                <span style={{ 
                  fontSize: 9, 
                  color: m.sender === 'user' ? 'rgba(255,255,255,0.6)' : '#64748b', 
                  display: 'block', 
                  textAlign: 'right', 
                  marginTop: 6,
                  fontWeight: 600
                }}>{m.time}</span>
              </div>
            ))}

            {/* Neural Typing indicator */}
            {isTyping && (
              <div 
                className="c3-bubble-bot"
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '12px 18px',
                  color: '#94a3b8', fontSize: 12.5,
                  display: 'flex', alignItems: 'center', gap: 8,
                  animation: 'c3-slide-in 0.2s ease both'
                }}
              >
                <span style={{ fontSize: 14 }}>🐍</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Catarina AI está pensando</span>
                <div style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
                  {[0, 1, 2].map(dot => (
                    <span key={dot} style={{
                      width: 5, height: 5, borderRadius: '50%', background: '#34d399',
                      animation: `c3-typing-dot 1.2s infinite ease-in-out both`,
                      animationDelay: `${dot * 0.15}s`
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Auto-Scroll Anchor Anchor */}
            <div ref={messagesEndRef} style={{ height: 1, marginTop: -1 }} />
          </div>

          {/* Dynamic Quick FAQ Options capsules */}
          {messages.length === 1 && (
            <div style={{ 
              padding: '0 24px 16px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 8,
              borderTop: '1px solid rgba(255,255,255,0.02)'
            }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Ideias para perguntar:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {faqData.map((f, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendMessage(f.q.substring(2).trim())}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)', 
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 12, padding: '7px 12px', color: '#e2e8f0', fontSize: 11.5,
                      fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      fontFamily: 'Inter', outline: 'none'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {f.q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Futuristic Message Input Footer */}
          <div style={{ 
            padding: '16px 24px 20px', 
            borderTop: '1px solid rgba(255,255,255,0.06)', 
            display: 'flex', 
            gap: 12,
            background: 'rgba(11, 15, 25, 0.95)' /* Dark solid base for absolute overlap prevention */
          }}>
            <input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputText)}
              className="c3-input-glow"
              placeholder="Pergunte sobre faturamento, planos..."
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Inter',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            <button 
              onClick={() => handleSendMessage(inputText)}
              style={{
                width: 44, height: 44, borderRadius: 14, 
                background: 'linear-gradient(135deg, #10b981, #0d9488)',
                color: '#fff', border: 'none', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter', display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 4px 15px rgba(16,185,129,0.25)', flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.25)';
              }}
            >
              {/* Glowing Send Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg) translate(-1px, 1px)' }}>
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
