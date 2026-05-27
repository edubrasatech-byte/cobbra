'use client';
import { useState, useEffect, useRef } from 'react';

export function formatMessageText(text, isUser = false) {
  if (!text) return '';
  const parts = text.split('**');
  return parts.map((part, index) => {
    return index % 2 === 1 
      ? <strong key={index} style={{ fontWeight: 700, color: isUser ? 'inherit' : '#10b981' }}>{part}</strong> 
      : part;
  });
}

export default function Chatbot({ isOpen, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isCurrentlyOpen = isOpen !== undefined ? isOpen : internalOpen;

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [feedbacks, setFeedbacks] = useState({}); // { [msgIndex]: 'up' | 'down' }
  const [user, setUser] = useState(null);
  const [isCopilotEnabled, setIsCopilotEnabled] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Sou a Catarina AI. 🐍\n\nComo posso te ajudar com suporte ou automação de cobranças hoje?',
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
    if (isCurrentlyOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isCurrentlyOpen]);

  // Auth & Plan Validation on mount
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            // Copilot is active for any logged user with a non-inactive plan/status
            const hasActivePlan = data.user.plan && data.user.plan !== 'inactive' && data.user.status !== 'inactive';
            setIsCopilotEnabled(hasActivePlan);
          }
        }
      } catch (e) {
        console.error('[CHATBOT AUTH CHECK ERROR]', e);
      }
    };
    checkUserAuth();
  }, []);

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

    // If Copilot is enabled (logged user with active plan), try parsing intent first
    if (isCopilotEnabled) {
      try {
        const copilotRes = await fetch('/api/ai/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: text.trim() })
        });

        if (copilotRes.ok) {
          const copilotData = await copilotRes.json();
          
          if (copilotData && copilotData.intent && copilotData.intent !== 'unknown') {
            const { intent, client_id, client_name, amount, due_date, description, responseMessage } = copilotData;

            // 1. Redirection Intents
            if (intent === 'view_stats') {
              setIsTyping(false);
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: responseMessage || 'Sem problemas! Redirecionando você para a aba de Relatórios e Análises. 📈🐍',
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              }]);
              setTimeout(() => {
                window.location.href = '/dashboard/relatorios';
              }, 2000);
              return;
            }

            if (intent === 'view_calendar') {
              setIsTyping(false);
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: responseMessage || 'Certo! Abrindo o Calendário de Pagamentos. 🗓️🐍',
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              }]);
              setTimeout(() => {
                window.location.href = '/dashboard/calendario';
              }, 2000);
              return;
            }

            if (intent === 'view_clients') {
              setIsTyping(false);
              setMessages(prev => [...prev, {
                sender: 'bot',
                text: responseMessage || 'Entendido! Acessando a lista de Clientes cadastrados. 👥🐍',
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              }]);
              setTimeout(() => {
                window.location.href = '/dashboard/clientes';
              }, 2000);
              return;
            }

            // 2. Billing Creation Intents (Only if basic parameters resolved)
            if ((intent === 'create_charge' || intent === 'create_daily_billing') && client_id && amount && due_date) {
              const createRes = await fetch('/api/cobrancas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  client_id,
                  amount,
                  due_date,
                  description: description || 'Lançado via Copilot',
                  recurrence: intent === 'create_daily_billing' ? 'daily' : 'once'
                })
              });

              const createData = await createRes.json();
              setIsTyping(false);

              if (createRes.ok) {
                // Determine due relative label (e.g. "Vence Amanhã", "Vence Hoje")
                const todayStr = new Date().toISOString().split('T')[0];
                const dMatch = new Date(due_date + 'T00:00:00');
                const tMatch = new Date(todayStr + 'T00:00:00');
                const diffTime = Math.abs(dMatch - tMatch);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const relativeLabel = due_date === todayStr ? 'Vence Hoje' : (diffDays === 1 && dMatch > tMatch ? 'Vence Amanhã' : `Vence em ${due_date.split('-').reverse().join('/')}`);

                const botMsg = {
                  sender: 'bot',
                  text: `Com certeza! Cadastrei a cobrança de **R$ ${amount.toFixed(2)}** para **${client_name}** com vencimento para ${due_date === todayStr ? 'hoje' : 'amanhã'} (${due_date.split('-').reverse().join('/')}). Ele receberá o lembrete gentil com o Pix copia e cola no WhatsApp. 🐍`,
                  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  scheduledTicket: {
                    client_name,
                    amount,
                    relativeLabel
                  }
                };
                setMessages(prev => [...prev, botMsg]);
                return;
              } else {
                setMessages(prev => [...prev, {
                  sender: 'bot',
                  text: `Não consegui lançar a cobrança: **${createData.error || 'Erro desconhecido'}** 🐍`,
                  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                }]);
                return;
              }
            }
          }
        }
      } catch (copilotErr) {
        console.error('[COPILOT INTEGRATION ERROR] Falling back to standard chat:', copilotErr);
      }
    }

    // Fallback: Standard support chatbot /api/ai/chat
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
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
      setInputText('Cobre R$ 150 do Gustavo amanhã');
    }, 1500);

    setTimeout(() => {
      setIsListening(false);
      handleSendMessage('Cobre R$ 150 do Gustavo amanhã');
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

  const handleCloseClick = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Floating Mascot Launcher Button (Only shown in uncontrolled/landing page mode when closed) */}
      {isOpen === undefined && !isCurrentlyOpen && (
        <button
          onClick={() => setInternalOpen(true)}
          aria-label="Abrir suporte Catarina AI"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0c0e1a 0%, #10b981 100%)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4), 0 0 15px rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9999,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'chat-float 3s ease-in-out infinite'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1) translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.6), 0 0 25px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.4), 0 0 15px rgba(16, 185, 129, 0.2)';
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <g transform="translate(1.5, 1.5)">
                <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke="url(#launcherSnakeGrad)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <circle cx="24" cy="8" r="5" fill="url(#launcherSnakeGrad)" />
                <circle cx="23" cy="7" r="1.2" fill="white" />
                <circle cx="26" cy="7" r="1.2" fill="white" />
                <circle cx="23.2" cy="7.3" r="0.7" fill="#070913" />
                <circle cx="26.2" cy="7.3" r="0.7" fill="#070913" />
              </g>
              <defs>
                <linearGradient id="launcherSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #0c0e1a',
              boxShadow: '0 0 4px #10b981'
            }} />
          </div>
        </button>
      )}

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
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }

        /* Responsive Premium Floating Card Box Styles */
        .chatbot-drawer-container {
          position: fixed !important;
          z-index: 9998 !important;
          display: flex !important;
          flex-direction: column !important;
          background: #0c0e1a !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(16, 185, 129, 0.05) !important;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease !important;
          
          /* Desktop default floating card */
          bottom: 24px !important;
          right: 24px !important;
          width: 420px !important;
          height: 680px !important;
          max-height: calc(100vh - 48px) !important;
          border-radius: 24px !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          transform: translateY(120%) scale(0.95) !important;
          opacity: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
        }
        
        .chatbot-drawer-container.open {
          transform: translateY(0) scale(1) !important;
          opacity: 1 !important;
          pointer-events: all !important;
        }
        
        /* Mobile fullscreen adaptation */
        @media (max-width: 640px) {
          .chatbot-drawer-container {
            top: 0 !important;
            bottom: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 100dvh !important;
            height: 100vh !important;
            max-height: 100dvh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
            transform: translateX(100%) !important;
          }
          
          .chatbot-drawer-container.open {
            transform: translateX(0) !important;
          }
          
          .chatbot-header-container {
            padding-top: calc(20px + env(safe-area-inset-top, 16px)) !important;
          }
        }
      `}</style>

      {/* Floating Card Support Chat (Premium Dark Redesign) */}
      <div className={`chatbot-drawer-container ${isCurrentlyOpen ? 'open' : ''}`}>
        
        {/* Drawer Header (Premium Dark Style) */}
        <div className="chatbot-header-container" style={{ padding: '24px 24px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0c0e1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Persona info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              
              {/* Circular Avatar with Snake Logo matching User Screenshot */}
              <div style={{ 
                width: 44, height: 44, borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <g transform="translate(1.5, 1.5)">
                    <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke="url(#chatSnakeGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <circle cx="24" cy="8" r="5" fill="url(#chatSnakeGrad)" />
                    <circle cx="23" cy="7" r="1.2" fill="white" />
                    <circle cx="26" cy="7" r="1.2" fill="white" />
                    <circle cx="23.2" cy="7.3" r="0.7" fill="#070913" />
                    <circle cx="26.2" cy="7.3" r="0.7" fill="#070913" />
                  </g>
                  <defs>
                    <linearGradient id="chatSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontWeight: 700, color: '#ffffff', fontSize: 16 }}>Catarina — IA Cobrinha</h3>
                </div>
                <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, fontWeight: 600 }}>
                  <span style={{ 
                    width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block',
                    boxShadow: '0 0 6px #10b981', animation: 'chat-pulse-dot 2s infinite' 
                  }} /> 
                  Online e ativa
                </span>
              </div>
            </div>

            {/* Header controls */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={clearChat}
                title="Limpar histórico"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
              <button 
                onClick={handleCloseClick}
                title="Minimizar chat"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

          </div>

          {/* Navigation Tabs (Hostinger Style - Dark Mode) */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 4px', gap: 20 }}>
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
          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#0c0e1a', overflowY: 'auto' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Histórico de Insights Recentes</span>
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
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px', 
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{hist.title}</h4>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{hist.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.4 }}>{hist.desc}</p>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <p style={{ fontSize: 12, color: '#64748b' }}>Conversas mais antigas são limpas automaticamente a cada 7 dias para maior privacidade.</p>
            </div>
          </div>
        ) : (
          
          /* Tab content 2: Live Chat Messages (Premium Dark Style) */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0c0e1a', overflow: 'hidden' }}>
            
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
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>Catarina AI</span>
                      <span style={{ fontSize: 10, color: '#10b981' }}>✨</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div style={{
                    background: m.sender === 'user' ? '#10b981' : 'rgba(255, 255, 255, 0.02)',
                    border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: m.sender === 'user' ? '#070913' : '#ffffff',
                    fontWeight: m.sender === 'user' ? '600' : '400',
                    padding: '12px 16px',
                    borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    boxShadow: m.sender === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
                    lineHeight: 1.6,
                    fontSize: 13.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {formatMessageText(m.text, m.sender === 'user')}

                    {/* Green Snake Brand Logo SVG inside bot bubble (Matching user screenshot) */}
                    {m.sender === 'bot' && (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, opacity: 0.9 }}>
                        <svg width="16" height="16" viewBox="0 0 40 40" fill="none" style={{ filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.3))' }}>
                          <g transform="translate(1.5, 1.5)">
                            <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke="url(#bubbleSnakeGrad)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                            <circle cx="24" cy="8" r="5" fill="url(#bubbleSnakeGrad)" />
                            <circle cx="23" cy="7" r="1.2" fill="white" />
                            <circle cx="26" cy="7" r="1.2" fill="white" />
                          </g>
                          <defs>
                            <linearGradient id="bubbleSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#0d9488" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    )}

                    {/* Copilot In-bubble green Scheduled Ticket Card (Matching the user screenshot exactly) */}
                    {m.scheduledTicket && (
                      <div style={{ 
                        marginTop: 12, padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#10b981', fontWeight: 600,
                        animation: 'chat-slide-in 0.4s ease both'
                      }}>
                        <span>📅</span>
                        <span>Cobrança agendada: {m.scheduledTicket.client_name} · R$ {m.scheduledTicket.amount.toFixed(2)} · {m.scheduledTicket.relativeLabel}</span>
                      </div>
                    )}

                    {/* Glowing support ticket card */}
                    {m.ticketOpened && (
                      <div style={{ 
                        marginTop: 12, padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                        display: 'flex', flexDirection: 'column', gap: 4,
                        animation: 'chat-slide-in 0.4s ease both'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                          <span>🎫</span>
                          <span>SUPORTE PRIORITÁRIO ACIONADO</span>
                        </div>
                        <span style={{ fontSize: 10.5, color: '#cbd5e1' }}>
                          Chamado criado e encaminhado de forma segura para <strong style={{ color: '#f59e0b' }}>suporte@cobbra.com.br</strong>. Retornaremos em breve!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer tools: Feedback (bot) / Time stamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px 6px 0 6px', marginTop: 2 }}>
                    
                    {/* Thumbs Feedback icons (Hostinger style - Dark Theme) */}
                    {m.sender === 'bot' ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button 
                          onClick={() => handleFeedback(idx, 'up')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: feedbacks[idx] === 'up' ? '#10b981' : 'rgba(255,255,255,0.15)', transition: 'color 0.2s' }}
                          title="Resposta útil"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={feedbacks[idx] === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleFeedback(idx, 'down')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: feedbacks[idx] === 'down' ? '#ef4444' : 'rgba(255,255,255,0.15)', transition: 'color 0.2s' }}
                          title="Não foi útil"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={feedbacks[idx] === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                        </button>
                      </div>
                    ) : <div />}

                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{m.time}</span>
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
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>Catarina AI</span>
                    <span style={{ fontSize: 10, color: '#10b981' }}>🐍</span>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '12px 18px',
                    borderRadius: '16px 16px 16px 2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>Pensando</span>
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

            {/* Simulated Live Microphone overlay */}
            {isListening && (
              <div style={{
                margin: '0 24px 16px 24px', padding: '14px 18px', borderRadius: 16,
                background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                animation: 'chat-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'chat-pulse-dot 1s infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Ouvindo comando por voz...</span>
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

            {/* Chat Input Container Card (Side-by-Side Premium Redesign as Screenshot) */}
            <div style={{ padding: '0 24px 20px 24px', background: 'transparent', position: 'relative' }}>
              
              {/* Utility Row (Atalhos e Voz) */}
              {isCopilotEnabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
                  {/* Shortcuts popup / Plus Menu */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowPlusMenu(!showPlusMenu)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', 
                        fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                      onMouseLeave={e => e.currentTarget.style.opacity = 1}
                    >
                      ⚡ Atalhos Rápidos
                    </button>

                    {/* Quick shortcuts popup tooltip menu */}
                    {showPlusMenu && (
                      <div style={{
                        position: 'absolute', bottom: 28, left: 0, width: 240,
                        background: '#0c0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
                        padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10000,
                        animation: 'chat-slide-in 0.2s ease both'
                      }}>
                        <span style={{ display: 'block', padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>COMANDOS COPILOT</span>
                        {[
                          { label: '📊 Ver resumo financeiro', text: 'Ver resumo do meu caixa' },
                          { label: '👥 Quem está me devendo?', text: 'Quem são meus devedores?' },
                          { label: '📅 Abrir a agenda Pix', text: 'Abrir meu calendário' },
                          { label: '📱 Como integrar WhatsApp', text: 'Como posso conectar o WhatsApp?' }
                        ].map((item, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              setInputText(item.text);
                              setShowPlusMenu(false);
                            }}
                            style={{
                              display: 'block', width: '100%', background: 'none', border: 'none',
                              padding: '8px 10px', textAlign: 'left', fontSize: 11.5, color: '#cbd5e1',
                              cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', fontFamily: 'Inter'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#10b981'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#cbd5e1'; }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Voice Mic Command */}
                  <button 
                    onClick={handleMicrophoneClick}
                    disabled={isListening || isTyping}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#cbd5e1', 
                      background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                  >
                    🎙️ Comando por voz
                  </button>
                </div>
              )}

              {/* Side-by-side Input & Send Button Layout (Directly matching User uploaded Image) */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
                
                {/* Text input */}
                <input 
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSendMessage(inputText);
                    }
                  }}
                  placeholder="Escreva sua dúvida aqui..."
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '13px 18px',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'Inter',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.3)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />

                {/* rectangular green "Enviar" button from screenshot */}
                <button 
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isTyping}
                  style={{
                    background: !inputText.trim() || isTyping ? 'rgba(255,255,255,0.06)' : '#10b981',
                    color: !inputText.trim() || isTyping ? '#64748b' : '#070913',
                    padding: '13px 26px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: !inputText.trim() || isTyping ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    border: 'none',
                    boxShadow: !inputText.trim() || isTyping ? 'none' : '0 4px 14px rgba(16,185,129,0.25)'
                  }}
                  onMouseEnter={e => {
                    if (inputText.trim() && !isTyping) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(16,185,129,0.4)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (inputText.trim() && !isTyping) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.25)';
                    }
                  }}
                >
                  Enviar
                </button>

              </div>

            </div>

            {/* Bottom disclaimer */}
            <div style={{ padding: '0 24px 16px 24px', textAlign: 'center' }}>
              <span style={{ fontSize: 9.5, color: '#64748b', lineHeight: 1.4, display: 'block' }}>
                A Catarina AI pode cometer equívocos. Revise os dados de faturamento críticos.
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
