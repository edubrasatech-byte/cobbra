'use client';
import { useState, useEffect, useRef } from 'react';

export default function Chatbot({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [feedbacks, setFeedbacks] = useState({}); // { [msgIndex]: 'up' | 'down' }
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Sou a Catarina AI, a assistente inteligente do Cobbra. 🐍\n\nEstou conectada ao seu banco de dados e pronta para gerenciar cobranças gentis, analisar inadimplências ou criar faturamentos. \n\nComo posso acelerar seu fluxo de caixa hoje?',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const suggestions = [
    { label: 'Como conectar o meu WhatsApp?', text: 'Como posso conectar o meu WhatsApp?' },
    { label: 'Quais são os planos e limites?', text: 'Quais são os planos e limites do Cobbra?' },
    { label: 'Como funcionam os juros automáticos?', text: 'Como funcionam os juros automáticos no score?' },
    { label: 'O Pix tem taxa de intermediação?', text: 'O Pix do Cobbra tem alguma taxa de intermediação?' }
  ];

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setShowPlusMenu(false);
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
        text: data.text || 'Não consegui processar a resposta. Vamos tentar novamente? 🐍',
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

  // Simulated voice recognition
  const handleMicrophoneClick = () => {
    if (isListening || isTyping) return;
    setIsListening(true);
    
    // Simulate hearing voice commands
    setTimeout(() => {
      setInputText('Quem é meu maior devedor?');
    }, 1500);

    setTimeout(() => {
      setIsListening(false);
      handleSendMessage('Quem é o meu maior devedor atual?');
    }, 3200);
  };

  // Feedback handler
  const handleFeedback = (index, type) => {
    setFeedbacks(prev => ({
      ...prev,
      [index]: prev[index] === type ? null : type
    }));
  };

  const clearChat = () => {
    if (!confirm('Deseja limpar o histórico da conversa atual?')) return;
    setMessages([
      {
        sender: 'bot',
        text: 'Histórico redefinido. Como a Catarina AI pode ajudar você agora? 🐍',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setFeedbacks({});
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* CSS Animations & Micro-interactions */}
      <style jsx global>{`
        @keyframes chat-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes chat-glow {
          0% { box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1); }
          50% { box-shadow: 0 12px 35px rgba(16, 185, 129, 0.6), 0 0 15px rgba(16, 185, 129, 0.3); }
          100% { box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1); }
        }
        @keyframes chat-slide-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chat-pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes chat-typing-bubble {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes chat-wave-bar {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .chat-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>



      {/* Slide-out Sidebar Drawer (Hostinger style) */}
      <div 
        style={{
          position: 'fixed', top: 0, bottom: 0, right: 0,
          width: '100%', maxWidth: 420, height: '100vh',
          background: '#ffffff', borderLeft: '1px solid #e2e8f0',
          boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.06)', zIndex: 9998,
          display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          pointerEvents: isOpen ? 'all' : 'none'
        }}
      >
        
        {/* Drawer Header */}
        <div style={{ padding: '24px 24px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Persona info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.08)', color: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 11a9 9 0 0 1 18 0" />
                  <rect x="2" y="11" width="3" height="5" rx="1.5" fill="currentColor" />
                  <rect x="19" y="11" width="3" height="5" rx="1.5" fill="currentColor" />
                  <path d="M12 5c-3.866 0-7 2.686-7 6 0 1.942 1.077 3.655 2.766 4.708l-.766 2.292 2.766-.922A7.848 7.848 0 0 0 12 17c3.866 0 7-2.686 7-6s-3.134-6-7-6z" />
                  <path d="M19 16c0 1-1 2-2 2h-2" />
                  <circle cx="10" cy="11" r="1.5" fill="currentColor" />
                  <circle cx="14" cy="11" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Catarina AI</h3>
                  <span style={{ 
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)',
                    letterSpacing: '0.3px'
                  }}>PRO</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <span style={{ 
                    width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block',
                    boxShadow: '0 0 6px #10b981', animation: 'chat-pulse-dot 2s infinite' 
                  }} /> 
                  Rede neural online • Custo zero
                </span>
              </div>
            </div>

            {/* Header controls */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={clearChat}
                title="Limpar histórico"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
              <button 
                onClick={onClose}
                title="Minimizar chat"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

          </div>

          {/* Navigation Tabs (Hostinger Style) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 4px', gap: 20 }}>
            <button 
              onClick={() => setActiveTab('chat')}
              style={{
                background: 'none', border: 'none', padding: '0 0 8px 0', fontSize: 13, fontWeight: activeTab === 'chat' ? 700 : 500,
                color: activeTab === 'chat' ? '#10b981' : '#64748b', cursor: 'pointer', position: 'relative',
                transition: 'color 0.2s'
              }}
            >
              Conversa
              {activeTab === 'chat' && (
                <span style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#10b981', borderRadius: 4 }} />
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('history')}
              style={{
                background: 'none', border: 'none', padding: '0 0 8px 0', fontSize: 13, fontWeight: activeTab === 'history' ? 700 : 500,
                color: activeTab === 'history' ? '#10b981' : '#64748b', cursor: 'pointer', position: 'relative',
                transition: 'color 0.2s'
              }}
            >
              Histórico
              {activeTab === 'history' && (
                <span style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#10b981', borderRadius: 4 }} />
              )}
            </button>
          </div>

        </div>

        {/* Tab content 1: Historical list */}
        {activeTab === 'history' ? (
          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc', overflowY: 'auto' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Histórico de Insights Recentes</span>
            {[
              { title: '📊 Diagnóstico de Inadimplência', desc: 'Análise detalhada do score e juros de devedores atípicos.', date: 'Hoje' },
              { title: '📱 Integração Evolution API', desc: 'Passo a passo concluído de ativação do celular comercial.', date: 'Ontem' },
              { title: '💸 Abatimentos de Faturamento', desc: 'Verificação de baixas parciais de clientes no Pix.', date: 'Há 2 dias' },
            ].map((hist, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setActiveTab('chat');
                  handleSendMessage(hist.title.substring(2));
                }}
                style={{ 
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', 
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{hist.title}</h4>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{hist.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{hist.desc}</p>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Conversas mais antigas são limpas automaticamente a cada 7 dias para maior privacidade.</p>
            </div>
          </div>
        ) : (
          
          /* Tab content 2: Live Chat Messages (Hostinger Style) */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
            
            {/* Scrollable messages container */}
            <div 
              ref={scrollContainerRef}
              className="chat-scrollbar"
              style={{ flex: 1, padding: '24px 24px 16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {messages.map((m, idx) => (
                <div 
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    animation: 'chat-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  
                  {/* Bot Persona name block */}
                  {m.sender === 'bot' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Catarina AI</span>
                      <span style={{ fontSize: 10, color: '#10b981' }}>✨</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div style={{
                    background: m.sender === 'user' ? '#f1f5f9' : '#ffffff',
                    border: m.sender === 'user' ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                    color: '#0f172a',
                    padding: '12px 16px',
                    borderRadius: m.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    boxShadow: m.sender === 'user' ? 'none' : '0 2px 8px rgba(15,23,42,0.02)',
                    lineHeight: 1.6,
                    fontSize: 13.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {m.text}

                    {/* Glowing support ticket card */}
                    {m.ticketOpened && (
                      <div style={{ 
                        marginTop: 12, padding: '12px 14px', borderRadius: 12,
                        background: '#fffbeb', border: '1px solid #fef3c7',
                        display: 'flex', flexDirection: 'column', gap: 4,
                        animation: 'chat-slide-in 0.4s ease both'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#d97706' }}>
                          <span>🎫</span>
                          <span>SUPORTE PRIORITÁRIO ACIONADO</span>
                        </div>
                        <span style={{ fontSize: 10.5, color: '#b45309' }}>
                          Chamado criado e encaminhado de forma segura para <strong style={{ color: '#d97706' }}>suporte@cobbra.com.br</strong>. Retornaremos em breve!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer tools: Feedback (bot) / Time stamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px 6px 0 6px', marginTop: 2 }}>
                    
                    {/* Thumbs Feedback icons (Hostinger style) */}
                    {m.sender === 'bot' ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button 
                          onClick={() => handleFeedback(idx, 'up')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: feedbacks[idx] === 'up' ? '#10b981' : '#cbd5e1', transition: 'color 0.2s' }}
                          title="Resposta útil"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={feedbacks[idx] === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleFeedback(idx, 'down')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: feedbacks[idx] === 'down' ? '#ef4444' : '#cbd5e1', transition: 'color 0.2s' }}
                          title="Não foi útil"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={feedbacks[idx] === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                        </button>
                      </div>
                    ) : <div />}

                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{m.time}</span>
                  </div>

                </div>
              ))}

              {/* Bot thinking placeholder */}
              {isTyping && (
                <div style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  animation: 'chat-slide-in 0.2s ease both',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Catarina AI</span>
                    <span style={{ fontSize: 10, color: '#10b981' }}>🐍</span>
                  </div>
                  
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '12px 18px',
                    borderRadius: '20px 20px 20px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(15,23,42,0.02)'
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Pensando</span>
                    <div style={{ display: 'inline-flex', gap: 3 }}>
                      {[0, 1, 2].map(dot => (
                        <span key={dot} style={{
                          width: 4, height: 4, borderRadius: '50%', background: '#10b981',
                          animation: 'chat-typing-bubble 1.2s infinite ease-in-out both',
                          animationDelay: `${dot * 0.15}s`
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Auto Scroll ref */}
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>

            {/* Suggestions list (Hostinger format suggestions) */}
            {messages.length === 1 && !isTyping && (
              <div style={{ padding: '0 24px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✨</span> SUGESTÕES
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {suggestions.map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSendMessage(s.text)}
                      style={{
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12,
                        padding: '10px 16px', color: '#334155', fontSize: 12.5, fontWeight: 600,
                        cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', transition: 'all 0.2s', fontFamily: 'Inter', outline: 'none'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.color = '#10b981';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#334155';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <span>{s.label}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated Live Microphone overlay */}
            {isListening && (
              <div style={{
                margin: '0 24px 16px 24px', padding: '14px 18px', borderRadius: 16,
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                animation: 'chat-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'chat-pulse-dot 1s infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>Ouvindo comando por voz...</span>
                </div>
                
                {/* Voice waves */}
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(b => (
                    <span key={b} style={{
                      width: 3, background: '#10b981', borderRadius: 2,
                      animation: 'chat-wave-bar 0.8s infinite ease-in-out',
                      animationDelay: `${b * 0.1}s`
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Container Card (Hostinger Inspired) */}
            <div style={{ padding: '0 24px 20px 24px', background: 'transparent', position: 'relative' }}>
              
              <div style={{
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 20,
                padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: '0 4px 20px rgba(15,23,42,0.03)', position: 'relative'
              }}>
                
                {/* Textarea */}
                <textarea 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputText);
                    }
                  }}
                  placeholder="Escreva sua pergunta para a Catarina..."
                  rows={2}
                  style={{
                    width: '100%', border: 'none', background: 'none', outline: 'none',
                    resize: 'none', fontFamily: 'Inter', fontSize: 13, color: '#0f172a',
                    lineHeight: 1.5
                  }}
                />

                {/* Input bottom action toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                  
                  {/* Plus utility action button */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowPlusMenu(!showPlusMenu)}
                      title="Atalhos rápidos"
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#64748b', transition: 'all 0.2s', fontSize: 16
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                    >
                      +
                    </button>

                    {/* Quick shortcuts popup tooltip menu */}
                    {showPlusMenu && (
                      <div style={{
                        position: 'absolute', bottom: 36, left: 0, width: 220,
                        background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 14,
                        padding: 8, boxShadow: '0 10px 30px rgba(15,23,42,0.1)', zIndex: 10000,
                        animation: 'chat-slide-in 0.2s ease both'
                      }}>
                        <span style={{ display: 'block', padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>LANÇAMENTO RÁPIDO</span>
                        {[
                          { label: '📊 Ver resumo do meu caixa', text: 'Qual o meu faturamento total?' },
                          { label: '👥 Quem são meus devedores?', text: 'Quem está me devendo atualmente?' },
                          { label: '📱 Como conectar o WhatsApp', text: 'Como posso conectar o meu WhatsApp?' }
                        ].map((item, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              setInputText(item.text);
                              setShowPlusMenu(false);
                            }}
                            style={{
                              display: 'block', width: '100%', background: 'none', border: 'none',
                              padding: '8px 10px', textAlign: 'left', fontSize: 11.5, color: '#334155',
                              cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', fontFamily: 'Inter'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#10b981'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#334155'; }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Microphone & Send tools */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    
                    {/* Voice Microphone trigger */}
                    <button 
                      onClick={handleMicrophoneClick}
                      disabled={isListening || isTyping}
                      title="Falar por voz"
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'none',
                        border: 'none', cursor: isListening || isTyping ? 'default' : 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#64748b', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { if (!isListening && !isTyping) e.currentTarget.style.color = '#10b981'; }}
                      onMouseLeave={e => { if (!isListening && !isTyping) e.currentTarget.style.color = '#64748b'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </button>

                    {/* Circle Send button */}
                    <button 
                      onClick={() => handleSendMessage(inputText)}
                      disabled={!inputText.trim() || isTyping}
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: !inputText.trim() || isTyping ? '#cbd5e1' : 'linear-gradient(135deg,#10b981,#059669)',
                        border: 'none', cursor: !inputText.trim() || isTyping ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        transition: 'all 0.2s', boxShadow: !inputText.trim() || isTyping ? 'none' : '0 2px 8px rgba(16,185,129,0.2)'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg) translate(-0.5px, 0.5px)' }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>

                  </div>

                </div>

              </div>

            </div>

            {/* Bottom disclaimer */}
            <div style={{ padding: '0 24px 16px 24px', textAlign: 'center' }}>
              <span style={{ fontSize: 9.5, color: '#94a3b8', lineHeight: 1.4, display: 'block' }}>
                A Catarina AI pode cometer equívocos. Revise os dados de faturamento críticos.
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
