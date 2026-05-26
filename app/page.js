'use client';
import { useState, useEffect, useRef, useId } from 'react';
import Chatbot from './components/Chatbot';

// ========== SNAKE MASCOT SVG ==========
function SnakeMascot({ size = 120, style = {} }) {
  const id = useId();
  const uniqueId = id.replace(/:/g, '');
  const snakeGradId = `snakeGrad-${uniqueId}`;
  const headGradId = `headGrad-${uniqueId}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style}>
      {/* Body coil */}
      <ellipse cx="100" cy="120" rx="55" ry="40" fill={`url(#${snakeGradId})`} opacity="0.3" />
      <path d="M70 140 C40 140, 30 110, 50 90 C70 70, 100 65, 120 80 C140 95, 155 80, 155 60 C155 40, 140 30, 125 35" stroke={`url(#${snakeGradId})`} strokeWidth="18" strokeLinecap="round" fill="none" />
      {/* Body pattern */}
      <path d="M70 140 C40 140, 30 110, 50 90 C70 70, 100 65, 120 80 C140 95, 155 80, 155 60 C155 40, 140 30, 125 35" stroke="rgba(255,255,255,0.15)" strokeWidth="8" strokeLinecap="round" fill="none" strokeDasharray="4 12" />
      {/* Head */}
      <circle cx="120" cy="32" r="22" fill={`url(#${snakeGradId})`} />
      <circle cx="120" cy="32" r="20" fill={`url(#${headGradId})`} />
      {/* Eyes */}
      <ellipse cx="112" cy="28" rx="6" ry="7" fill="white" />
      <ellipse cx="130" cy="28" rx="6" ry="7" fill="white" />
      <ellipse cx="113" cy="29" rx="3.5" ry="4.5" fill="#0f172a" />
      <ellipse cx="131" cy="29" rx="3.5" ry="4.5" fill="#0f172a" />
      {/* Eye shine */}
      <circle cx="115" cy="27" r="1.5" fill="white" />
      <circle cx="133" cy="27" r="1.5" fill="white" />
      {/* Smile */}
      <path d="M113 38 Q121 46 129 38" stroke="#047857" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Tongue */}
      <path d="M121 44 L121 52 L117 56 M121 52 L125 56" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Tie */}
      <polygon points="120,50 115,58 120,55 125,58" fill="#0891b2" />
      <polygon points="120,55 113,68 120,63 127,68" fill="#0891b2" opacity="0.8" />
      {/* Belly stripes */}
      <path d="M55 95 Q65 88 75 95" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
      <path d="M75 100 Q85 93 95 100" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
      <path d="M100 92 Q110 85 120 92" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
      {/* Tail */}
      <path d="M70 140 C65 150, 75 155, 85 148" stroke={`url(#${snakeGradId})`} strokeWidth="10" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id={snakeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id={headGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ========== MINI SNAKE (for decorations) ==========
function MiniSnake({ size = 40, style = {} }) {
  const id = useId();
  const uniqueId = id.replace(/:/g, '');
  const miniGradId = `miniGrad-${uniqueId}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style} className="mini-snake-hover">
      <g transform="translate(1.5, 1.5)">
        <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke={`url(#${miniGradId})`} strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="8" r="5" fill={`url(#${miniGradId})`} />
        <circle cx="23" cy="7" r="1.2" fill="white" />
        <circle cx="26" cy="7" r="1.2" fill="white" />
        <circle cx="23.2" cy="7.3" r="0.7" fill="#070913" />
        <circle cx="26.2" cy="7.3" r="0.7" fill="#070913" />
      </g>
      <defs>
        <linearGradient id={miniGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ========== GLOW CARD (Vercel-style hover glow) ==========
function GlowCard({ children, style = {}, ...props }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        background: '#0c0e1a',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: isHovered ? '0 10px 30px rgba(16, 185, 129, 0.04)' : 'none',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        ...style
      }}
      {...props}
    >
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle 200px at ${coords.x}px ${coords.y}px, rgba(16, 185, 129, 0.08) 0%, transparent 80%)`,
          pointerEvents: 'none',
          zIndex: 1
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// ========== WHATSAPP SIMULATOR ==========
function WhatsAppSimulator() {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    let active = true;
    const runSequence = async () => {
      if (!active) return;
      setStep(0);
      setTyping(false);
      setMessages([]);

      await new Promise(r => setTimeout(r, 2500));
      if (!active) return;

      setStep(1);
      setMessages([{ sender: 'system', text: '🤖 Catarina AI: Agendando lembrete de Pix para Marina Oliveira (Vence Amanhã).' }]);

      await new Promise(r => setTimeout(r, 2500));
      if (!active) return;

      setStep(2);
      setTyping(true);
      await new Promise(r => setTimeout(r, 1800));
      if (!active) return;
      setTyping(false);
      setMessages(prev => [...prev, {
        sender: 'cobbra',
        text: 'Oi Mari! 💚 Lembrete gentil da Cobbra: sua mensalidade de R$ 450,00 vence amanhã. Segue o Pix copia e cola no link abaixo.',
        status: 'sent'
      }]);

      await new Promise(r => setTimeout(r, 800));
      if (!active) return;
      setMessages(prev => prev.map(m => m.sender === 'cobbra' ? { ...m, status: 'delivered' } : m));
      
      await new Promise(r => setTimeout(r, 1000));
      if (!active) return;
      setMessages(prev => prev.map(m => m.sender === 'cobbra' ? { ...m, status: 'read' } : m));

      await new Promise(r => setTimeout(r, 2500));
      if (!active) return;

      setStep(3);
      setTyping(true);
      await new Promise(r => setTimeout(r, 2000));
      if (!active) return;
      setTyping(false);
      setMessages(prev => [...prev, {
        sender: 'marina',
        text: 'Nossa, verdade! Estava na correria e tinha esquecido. Pago em 2 minutos! Obrigado pelo aviso! 🤝'
      }]);

      await new Promise(r => setTimeout(r, 3000));
      if (!active) return;

      setStep(4);
      setMessages(prev => [...prev, {
        sender: 'system-success',
        text: '✅ Pix de R$ 450,00 recebido! Repassado 100% à sua conta (Taxa: R$ 0,00).'
      }]);

      await new Promise(r => setTimeout(r, 6000));
      if (active) runSequence();
    };

    runSequence();
    return () => { active = false; };
  }, []);

  return (
    <div style={{
      background: '#0c0e1a', borderRadius: 24, padding: '24px 20px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.06)', position: 'relative', width: '100%', maxWidth: 440, margin: '0 auto',
      minHeight: 460, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden'
    }}>
      {/* Smartphone notch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Simulador Cobbra em Ação</span>
        </div>
        <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '3px 8px', borderRadius: 6, fontWeight: 800 }}>LIVE DEMO</span>
      </div>

      {/* Message Screen Area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12, minHeight: 340, justifyContent: 'flex-end', paddingBottom: 8 }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease', padding: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>Faturamento Recuperado</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#10b981' }}>R$ 8.420,00</p>
              </div>
              <div style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }}>
                Taxa Pago: 94%
              </div>
            </div>
            
            <div style={{ background: '#070913', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Mariana Oliveira</span>
                <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Aguardando...</span>
              </div>
              <div style={{ height: 4, background: '#1e293b', borderRadius: 2 }}>
                <div style={{ height: '100%', width: '40%', background: '#f59e0b', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        )}

        {step > 0 && messages.map((msg, idx) => {
          if (msg.sender === 'system') {
            return (
              <div key={idx} style={{
                alignSelf: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                color: '#94a3b8', fontSize: 11, padding: '8px 12px', borderRadius: 10, maxWidth: '95%',
                textAlign: 'center', animation: 'fadeInUp 0.3s ease', lineHeight: 1.4
              }}>
                {msg.text}
              </div>
            );
          }
          if (msg.sender === 'system-success') {
            return (
              <div key={idx} style={{
                alignSelf: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                color: '#34d399', fontSize: 12, padding: '10px 14px', borderRadius: 12, maxWidth: '95%',
                textAlign: 'center', fontWeight: 700, animation: 'fadeInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.15)'
              }}>
                {msg.text}
              </div>
            );
          }

          const isCobbra = msg.sender === 'cobbra';
          return (
            <div key={idx} style={{
              alignSelf: isCobbra ? 'flex-end' : 'flex-start',
              background: isCobbra ? '#059669' : 'rgba(255,255,255,0.05)',
              border: isCobbra ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: isCobbra ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              maxWidth: '85%',
              fontSize: 13,
              lineHeight: 1.45,
              animation: 'fadeInUp 0.3s ease',
              boxShadow: isCobbra ? '0 4px 12px rgba(5,150,105,0.15)' : 'none'
            }}>
              <div>{msg.text}</div>
              {isCobbra && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4, fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
                  <span>14:00</span>
                  {msg.status === 'sent' && <span>✓</span>}
                  {msg.status === 'delivered' && <span>✓✓</span>}
                  {msg.status === 'read' && <span style={{ color: '#60a5fa' }}>✓✓</span>}
                </div>
              )}
              {!isCobbra && (
                <div style={{ fontSize: 8, color: '#64748b', marginTop: 4, textAlign: 'right' }}>
                  14:02
                </div>
              )}
            </div>
          );
        })}

        {typing && (
          <div style={{
            alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            padding: '10px 16px', borderRadius: '16px 16px 16px 4px', width: 64, display: 'flex', gap: 4,
            justifyContent: 'center', alignItems: 'center'
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.2s infinite' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.2s infinite 0.2s' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.2s infinite 0.4s' }} />
          </div>
        )}
      </div>

      {/* Swipe bar indicator */}
      <div style={{ alignSelf: 'center', width: 100, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
    </div>
  );
}

// ========== ANIMATED COUNTER ==========
function AnimatedCounter({ end, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, started]);

  return <span ref={ref}>{prefix}{typeof end === 'number' && end >= 1000 ? count.toLocaleString('pt-BR') : count}{suffix}</span>;
}

// ========== FAQ ITEM ==========
function FaqItem({ question, answer, category }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 12, overflow: 'hidden',
      background: open ? 'rgba(16,185,129,0.05)' : '#0c0e1a', transition: 'all 0.3s ease',
      boxShadow: open ? '0 4px 20px rgba(16,185,129,0.05)' : 'none'
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 16, fontWeight: 600, color: '#ffffff', textAlign: 'left', cursor: 'pointer',
        background: 'none', border: 'none', fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {category && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{category}</span>}
          {question}
        </div>
        <span style={{ fontSize: 24, transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.3s', color: '#10b981', flexShrink: 0, marginLeft: 12 }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease',
        padding: open ? '0 24px 20px' : '0 24px', color: '#94a3b8', fontSize: 15, lineHeight: 1.7
      }}>
        {answer}
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function HomePage() {
  const [calcClients, setCalcClients] = useState(20);
  const [calcAmount, setCalcAmount] = useState(300);
  const [calcLatePercent, setCalcLatePercent] = useState(25);
  const [urgencyVisible, setUrgencyVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [faqCategory, setFaqCategory] = useState('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [testimonialFilter, setTestimonialFilter] = useState('todos');
  const [urgencyTime, setUrgencyTime] = useState('');
  const [urgencyCity, setUrgencyCity] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [beforeAfterTab, setBeforeAfterTab] = useState('after');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [billingCycle, setBillingCycle] = useState('mensal');

  useEffect(() => {
    const cities = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 'Porto Alegre, RS', 'Fortaleza, CE', 'Salvador, BA', 'Campinas, SP'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    setUrgencyCity(city);
    const updateTime = () => {
      const mins = Math.floor(Math.random() * 4) + 1;
      setUrgencyTime(`${mins} minuto${mins > 1 ? 's' : ''} atrás`);
    };
    updateTime();
    const interval = setInterval(updateTime, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lostPerMonth = (calcClients * calcAmount * calcLatePercent) / 100;
  const recoveredWithCobbra = lostPerMonth * 0.94;

  const headerBg = scrollY > 50 ? 'rgba(12, 14, 26, 0.9)' : 'transparent';
  const headerShadow = scrollY > 50 ? '0 4px 30px rgba(0,0,0,0.3)' : 'none';

  const faqs = [
    { cat: 'Conta', q: 'Preciso pagar para começar?', a: 'O plano Starter é 100% gratuito e permite até 3 cobranças simultâneas. Perfeito para testar a plataforma sem compromisso. Quando precisar de mais, é só fazer upgrade.' },
    { cat: 'Conta', q: 'Como faço para cancelar minha assinatura?', a: 'Sem fidelidade, sem multa. Cancele com um clique nas configurações a qualquer momento. Seus dados ficam salvos por 30 dias caso queira voltar.' },
    { cat: 'Produto', q: 'Funciona para qualquer tipo de negócio?', a: 'Sim! O Cobbra funciona para qualquer profissional que precise cobrar clientes: personal trainers, dentistas, advogados, designers, professores, estúdios de estética, nutricionistas, fotógrafos, e muitos outros.' },
    { cat: 'Produto', q: 'Qual a diferença entre os planos?', a: 'Starter: até 3 cobranças (grátis). Crescimento: até 20 cobranças + relatórios (R$ 19,90/mês). Cobra Pro: cobranças ilimitadas + API + suporte prioritário (R$ 49,90/mês). Todos incluem WhatsApp + e-mail.' },
    { cat: 'Produto', q: 'Posso personalizar as mensagens de cobrança?', a: 'Sim! Você pode editar os templates de mensagem, escolher o tom (gentil, neutro ou firme) e configurar quando cada lembrete será enviado (3 dias antes, no dia, 1 dia depois, etc).' },
    { cat: 'Cobranças', q: 'A mensagem vai parecer um spam?', a: 'De jeito nenhum! As mensagens são escritas com tom gentil e profissional. Nossos usuários relatam que os clientes até elogiam a comunicação. A cobra morde suave 🐍' },
    { cat: 'Cobranças', q: 'Posso cobrar via boleto ou só Pix?', a: 'Atualmente o foco é Pix (sem taxas!), mas estamos preparando integração com boleto bancário e link de pagamento por cartão. Disponível em breve!' },
    { cat: 'Integração', q: 'Como conecto meu WhatsApp?', a: 'É muito simples! No painel, vá em Configurações > Integrações > WhatsApp. Escaneie o QR Code com seu WhatsApp Business e pronto. São menos de 5 minutos e não precisa de nenhum conhecimento técnico.' },
    { cat: 'Integração', q: 'Preciso de conhecimento técnico?', a: 'Não! O Cobbra foi feito para ser simples como mandar uma mensagem. Você cadastra o cliente, cria a cobrança e a cobra faz o resto. Sem código, sem complicação.' },
    { cat: 'Pagamento', q: 'O dinheiro passa pelo Cobbra?', a: 'Não. O pagamento é feito diretamente via Pix para a sua conta. O Cobbra apenas envia os lembretes com o link de pagamento. Zero taxas sobre o valor recebido.' },
    { cat: 'Pagamento', q: 'Tem taxa sobre o valor recebido?', a: 'Nenhuma! Diferente de maquininhas e intermediadores, o Cobbra não cobra porcentagem. Você paga apenas a mensalidade fixa e recebe 100% dos pagamentos direto no Pix.' },
    { cat: 'Segurança', q: 'Meus dados estão seguros?', a: 'Sim! Usamos criptografia de ponta a ponta e as melhores práticas de segurança do mercado. Seus dados e os dos seus clientes estão 100% protegidos. Nenhuma informação é compartilhada com terceiros.' },
  ];

  const filteredFaqs = faqs.filter(f => {
    const matchesCategory = faqCategory === 'all' || f.cat === faqCategory;
    const matchesSearch = f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const faqCategories = ['all', ...new Set(faqs.map(f => f.cat))];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#fff', background: '#070913' }}>
      {/* ===== HEADER ===== */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: headerBg, boxShadow: headerShadow,
        transition: 'all 0.3s ease', borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo with Snake */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MiniSnake size={38} />
            <span style={{ fontSize: 30, fontWeight: 900, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -1 }}>
              Cobbra
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginTop: -8, marginLeft: -2 }}>.ai</span>
          </div>

          {/* Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', fontSize: 24, color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}
            className="mobile-hamburger"
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Nav */}
          <nav className="landing-nav" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Benefícios', 'Como funciona', 'Depoimentos', 'Preços', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}
                style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#10b981'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >{item}</a>
            ))}
            <a href="/login" style={{
              fontSize: 14, fontWeight: 600, color: '#10b981', padding: '8px 20px', borderRadius: 8,
              border: '2px solid #10b981', transition: 'all 0.2s', textDecoration: 'none'
            }}
              onMouseEnter={e => { e.target.style.background = '#10b981'; e.target.style.color = '#070913'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#10b981'; }}
            >Entrar</a>
            <a href="/cadastro" style={{
              fontSize: 13, fontWeight: 600, color: '#070913', padding: '8px 18px', borderRadius: 8,
              background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              transition: 'all 0.2s', transform: 'translateY(0)', textDecoration: 'none'
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)'; }}
            >Começar grátis</a>
          </nav>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="landing-nav-mobile" style={{
            position: 'fixed', top: 60, left: 0, right: 0, background: '#0C0E1A',
            borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', zIndex: 999,
            display: 'none', flexDirection: 'column', gap: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}>
            {['Benefícios#beneficios','Como funciona#como-funciona','Depoimentos#depoimentos','Preços#precos','FAQ#faq'].map(item => {
              const [label, hash] = item.split('#');
              return (
                <a key={hash} href={`#${hash}`} onClick={() => setMobileMenuOpen(false)} style={{
                  padding: '12px 0', fontSize: 16, fontWeight: 500, color: '#ffffff',
                  borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none'
                }}>{label}</a>
              );
            })}
            <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
              <a href="/login" style={{ flex: 1, textAlign: 'center', padding: '10px', border: '2px solid #10b981', borderRadius: 8, color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Entrar</a>
              <a href="/cadastro" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#10b981', borderRadius: 8, color: '#070913', fontWeight: 600, textDecoration: 'none' }}>Começar grátis</a>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="hero-section" style={{
        background: '#070913',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative Neon Halos */}
        <div style={{ position: 'absolute', top: -150, right: -150, width: 400, height: 400, borderRadius: '50%', background: 'rgba(16,185,129,0.03)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(13,148,136,0.02)', filter: 'blur(60px)' }} />

        <div className="hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 60, position: 'relative' }}>
          {/* Left Content */}
          <div style={{ flex: 1, animation: 'fadeInUp 0.8s ease' }}>
            {/* Mini social proof acima do fold */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, background: '#0c0e1a', padding: '10px 18px',
              borderRadius: 100, fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 24,
              border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 4px 20px rgba(16,185,129,0.05)', maxWidth: 520
            }}>
              <div style={{ display: 'flex' }}>
                {['MO','RC','CF'].map((i, idx) => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: ['#10b981','#0891b2','#7c3aed'][idx], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#070913', fontSize: 9, fontWeight: 800, marginLeft: idx > 0 ? -6 : 0, border: '2px solid #0c0e1a' }}>{i}</div>
                ))}
              </div>
              <span><strong style={{ color: '#10b981' }}>&ldquo;Minha inadimplência caiu de 35% para 6%&rdquo;</strong> — Marina O.</span>
            </div>

            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: -1, color: '#ffffff' }}>
              Seu Funcionário{' '}
              <span style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Financeiro
              </span>{' '}
              Mais Barato do Brasil
            </h1>

            <p className="hero-sub" style={{ fontSize: 19, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
              Uma plataforma completa que gerencia e automatiza suas cobranças de ponta a ponta. Envie lembretes inteligentes e personalizados via WhatsApp e E-mail, acompanhe tudo em um dashboard em tempo real e receba 100% direto no seu Pix — sem taxas e com o suporte da nossa inteligência artificial Catarina.
            </p>

            <div className="hero-cta" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <a href="/cadastro" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                background: '#10b981', color: '#070913', fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.3s', transform: 'translateY(0)', textDecoration: 'none'
              }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 8px 25px rgba(16,185,129,0.5)'; }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)'; }}
              >
                Automatizar Minhas Cobranças Grátis →
              </a>
              <a href="#como-funciona" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12,
                border: '2px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: 14, fontWeight: 600,
                transition: 'all 0.2s', textDecoration: 'none'
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#10b981'; e.target.style.color = '#10b981'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#cbd5e1'; }}
              >
                ▶ Ver como funciona
              </a>
            </div>
            <p style={{ fontSize: 13, color: '#64748b' }}>Sem cartão · Ativo em 2 minutos · Cancele quando quiser — <strong style={{color:'#94a3b8'}}>Não tem pegadinha.</strong></p>

            {/* Trust Badges — com números concretos */}
            <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              {[
                { icon: '🐍', label: '3.500+', text: 'autônomos usando hoje' },
                { icon: '💰', label: 'R$ 1,2 mi', text: 'movimentados sem taxas' },
                { icon: '⚡', label: '2 min', text: 'para 1ª cobrança ir' }
              ].map(badge => (
                <div key={badge.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                  <span>{badge.icon}</span>
                  <strong style={{ color: '#ffffff', fontSize: 14 }}>{badge.label}</strong>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Interactive WhatsApp Simulator with Mascot */}
          <div className="hero-mockup" style={{ flex: 1, position: 'relative', animation: 'fadeInUp 1s ease 0.2s both', zIndex: 5 }}>
            {/* Mascot peeking from top */}
            <div style={{
              position: 'absolute', top: -15, right: 125, background: '#0c0e1a', borderRadius: 12, padding: '8px 14px',
              fontSize: 12, fontWeight: 600, color: '#10b981', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              border: '1px solid rgba(16,185,129,0.2)', zIndex: 10
            }}>
              Deixa que eu cobro! 🐍
              <div style={{ position: 'absolute', bottom: -6, right: 20, width: 12, height: 12, background: '#0c0e1a', border: '1px solid rgba(16,185,129,0.2)', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
            </div>

            <div className="hero-mascot-wrapper" style={{ position: 'absolute', top: -50, right: 20, zIndex: 10, animation: 'float 3s ease-in-out infinite' }}>
              <SnakeMascot size={100} className="mascot-svg" />
            </div>

            <WhatsAppSimulator />
          </div>
        </div>
      </section>

      {/* ===== INTEGRATIONS MARQUEE ===== */}
      <section style={{ background: '#070913', padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
        {/* Shadow overlays */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(90deg, #070913, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(-90deg, #070913, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>Compatível com Pix e qualquer banco brasileiro</p>
        </div>

        <div className="marquee-container" style={{ display: 'flex', overflow: 'hidden', width: '100%' }}>
          <div className="marquee-content" style={{ display: 'flex', gap: 60, animation: 'marqueeScroll 28s linear infinite', whiteSpace: 'nowrap', minWidth: '100%' }}>
            {[
              'Pix', 'Nubank', 'Cora', 'Mercado Pago', 'Banco Inter', 'C6 Bank', 'Neon', 'Stone', 'PagBank',
              'Pix', 'Nubank', 'Cora', 'Mercado Pago', 'Banco Inter', 'C6 Bank', 'Neon', 'Stone', 'PagBank'
            ].map((brand, i) => (
              <span key={i} style={{ fontSize: 14, fontWeight: 900, color: '#334155', letterSpacing: -0.5, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#10b981', fontSize: 16 }}>✓</span> {brand}
              </span>
            ))}
          </div>
        </div>
        
        <style>{`
          @keyframes marqueeScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .mini-snake-hover {
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .mini-snake-hover:hover {
            transform: scale(1.15) rotate(8deg);
          }
        `}</style>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="como-funciona" style={{ padding: '70px 0', background: '#070913', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: 16, color: '#ffffff' }}>Nunca mais você vai precisar<br /><span style={{ color: '#10b981' }}>fingir que esqueceu de cobrar.</span></h2>
          <p className="section-subtitle" style={{ color: '#94a3b8', marginBottom: 40 }}>O Cobbra faz o papel chato por você — e o cliente nem percebe que era automática.</p>
          <div className="how-it-works-steps" style={{ display: 'flex', gap: 40, justifyContent: 'center', position: 'relative' }}>
            {/* Connection line */}
            <div className="how-it-works-line" style={{ position: 'absolute', top: 35, left: '20%', right: '20%', height: 2, background: 'linear-gradient(to right, rgba(16,185,129,0.05), #10b981, rgba(16,185,129,0.05))', zIndex: 0 }} />
            {[
              { step: '1', title: 'Cadastre a cobrança', desc: 'Insira valor, vencimento e o contato do cliente em 30 segundos.', icon: '📝' },
              { step: '2', title: 'A cobra notifica', desc: 'Lembretes gentis disparados no WhatsApp e e-mail no momento certo.', icon: '🐍' },
              { step: '3', title: 'Receba direto no Pix', desc: 'O cliente paga pelo seu QR Code. Você fica com 100% do valor.', icon: '💰' }
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <div className="step-icon" style={{
                  width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #0d9488)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  fontSize: 30, boxShadow: '0 8px 20px rgba(16,185,129,0.2)'
                }}>{item.icon}</div>
                <div style={{
                  position: 'absolute', top: -8, width: 26, height: 26, borderRadius: '50%',
                  background: '#070913', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, left: '50%', marginLeft: 16, border: '1px solid rgba(255,255,255,0.1)'
                }}>{item.step}</div>
                <h3 className="step-title" style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#ffffff' }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BEFORE VS AFTER ===== */}
      <section style={{ padding: '70px 0', background: '#070913' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 12, color: '#ffffff' }}>
            Você fica o bonzinho.<br /><span style={{ color: '#10b981' }}>A cobra faz o serviço sujo.</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 48 }}>Pare de perder amizades (e dinheiro) por não cobrar.</p>
          <div className="before-after-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 0, alignItems: 'stretch' }}>
            {/* Before */}
            <div className="before-panel" style={{ background: 'rgba(239, 68, 68, 0.02)', border: '2px solid rgba(239, 68, 68, 0.15)', borderRadius: '20px 0 0 20px', padding: 40 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 28 }}>
                ❌ Sem o Cobbra
              </div>
              {[
                { emoji: '😰', text: 'Você manda mensagem constrangido no WhatsApp' },
                { emoji: '📉', text: '25% dos clientes esquecem de pagar — e você perde' },
                { emoji: '😤', text: 'Cliente fica chateado com a cobrança direta' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                  <span className="before-after-text" style={{ color: '#fca5a5', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
            {/* VS divider */}
            <div className="before-after-divider" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, rgba(239, 68, 68, 0.08), rgba(16, 185, 129, 0.08))', position: 'relative' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#070913', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
                <MiniSnake size={32} />
              </div>
            </div>
            {/* After */}
            <div className="after-panel" style={{ background: 'rgba(16, 185, 129, 0.02)', border: '2px solid rgba(16, 185, 129, 0.15)', borderRadius: '0 20px 20px 0', padding: 40 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 28 }}>
                ✅ Com o Cobbra
              </div>
              {[
                { emoji: '😌', text: 'A cobra manda o lembrete — você fica o bonzinho' },
                { emoji: '📈', text: '94% pagam antes ou na data. Dinheiro garantido no Pix' },
                { emoji: '😊', text: 'Clientes elogiam a comunicação profissional' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                  <span className="before-after-text" style={{ color: '#a7f3d0', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile-Only Before vs After Tabs */}
          <div className="mobile-before-after" style={{ display: 'none', flexDirection: 'column', gap: 20 }}>
            {/* Tab buttons */}
            <div style={{ display: 'flex', background: '#0c0e1a', borderRadius: 100, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
              <button 
                onClick={() => setBeforeAfterTab('before')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 100, fontSize: 13, fontWeight: 700,
                  background: beforeAfterTab === 'before' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  color: beforeAfterTab === 'before' ? '#f87171' : '#64748b',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif'
                }}
              >❌ Sem o Cobbra</button>
              <button 
                onClick={() => setBeforeAfterTab('after')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 100, fontSize: 13, fontWeight: 700,
                  background: beforeAfterTab === 'after' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: beforeAfterTab === 'after' ? '#10b981' : '#64748b',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif'
                }}
              >💚 Com o Cobbra</button>
            </div>

            {/* Content card */}
            {beforeAfterTab === 'before' ? (
              <div className="before-panel animate-fadeIn" style={{ background: 'rgba(239, 68, 68, 0.02)', border: '2px solid rgba(239, 68, 68, 0.15)', borderRadius: 20, padding: 28 }}>
                {[
                  { emoji: '😰', text: 'Você manda mensagem constrangido no WhatsApp' },
                  { emoji: '📉', text: '25% dos clientes esquecem de pagar — e você perde' },
                  { emoji: '😤', text: 'Cliente fica chateado com a cobrança direta' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontSize: 14, color: '#fca5a5', lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="after-panel animate-fadeIn" style={{ background: 'rgba(16, 185, 129, 0.02)', border: '2px solid rgba(16, 185, 129, 0.15)', borderRadius: 20, padding: 28 }}>
                {[
                  { emoji: '😌', text: 'A cobra manda o lembrete — você fica o bonzinho' },
                  { emoji: '📈', text: '94% pagam antes ou na data. Dinheiro garantido no Pix' },
                  { emoji: '😊', text: 'Clientes elogiam a comunicação profissional' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontSize: 14, color: '#a7f3d0', lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== CATARINA AI ENGINE V3.0 ===== */}
      <section style={{ 
        padding: '85px 0', 
        background: '#070913', 
        color: '#fff', 
        position: 'relative', 
        overflow: 'hidden',
        borderTop: '1px solid rgba(16,185,129,0.1)',
        borderBottom: '1px solid rgba(16,185,129,0.1)'
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: -150, left: -150, width: 350, height: 350, borderRadius: '50%', background: 'rgba(16,185,129,0.03)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -150, right: -150, width: 350, height: 350, borderRadius: '50%', background: 'rgba(13,148,136,0.02)', filter: 'blur(80px)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ 
              fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, 
              background: 'rgba(16,185,129,0.15)', color: '#34d399', textTransform: 'uppercase', 
              letterSpacing: 1, border: '1px solid rgba(16,185,129,0.2)' 
            }}>
              ✨ NOVA ATUALIZAÇÃO 3.0
            </span>
            <h2 className="section-title" style={{ marginTop: 16, marginBottom: 16 }}>
              Conheça a <span style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Catarina AI Engine</span>
            </h2>
            <p className="section-subtitle" style={{ color: '#94a3b8', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
              Muito além de notificações automáticas. Uma engenharia de inteligência artificial completa e de custo zero feita para gerenciar seu fluxo de caixa por você.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, width: '100%' }}>
            
            {/* Top row: 3 Highlighted Feature Boxes in horizontal row on desktop, stack on mobile */}
            <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%' }}>
              {[
                {
                  icon: '🪄',
                  title: 'Dashboard Copilot (Linguagem Natural)',
                  desc: 'Comande a plataforma conversando de forma natural. Catarina traduz frases livres em lançamentos e ações financeiras estruturadas de banco de dados.',
                  badge: '“Cobre R$ 150 do Gustavo amanhã”'
                },
                {
                  icon: '😇',
                  title: 'Copywriter de Lembretes (Humor da IA)',
                  desc: 'Redija mensagens perfeitas para seu WhatsApp com um clique. Escolha o tom de abordagem (Gentil 😇, Firme 👔, Urgente 🚨 ou Divertido 🐍) e evite desgastes comerciais.',
                  badge: 'Livre-se de textos robóticos'
                },
                {
                  icon: '📈',
                  title: 'Insights Financeiros Inteligentes',
                  desc: 'A IA analisa de forma 100% anônima e segura seu histórico financeiro e gera automaticamente 3 conselhos de negócios práticos para otimizar suas datas de recebimento e fluxo de caixa.',
                  badge: 'Decisões orientadas a dados'
                }
              ].map((f, i) => (
                <div 
                  key={i} 
                  style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: 16, padding: 24, 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    transition: 'all 0.3s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: 52, height: 52, borderRadius: 12, background: 'rgba(16,185,129,0.15)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0
                    }}>{f.icon}</div>
                    <div>
                      <h3 className="feature-card-title" style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.title}</h3>
                      <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>{f.desc}</p>
                      <span style={{ 
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, 
                        background: 'rgba(255,255,255,0.04)', color: '#34d399' 
                      }}>{f.badge}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom row: Center-aligned Mock AI chatbot */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div style={{ flex: 1, maxWidth: 440, width: '100%' }}>
                <div style={{ 
                  background: '#0c0e1a', borderRadius: 24, padding: 24, 
                  border: '1px solid rgba(255, 255, 255, 0.06)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐍</div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Catarina — IA Cobrinha</h4>
                      <span style={{ fontSize: 10, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Online e ativa
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 220, justifyContent: 'center' }}>
                    <div style={{ 
                      alignSelf: 'flex-end', background: '#10b981', borderRadius: '16px 16px 2px 16px', 
                      padding: '10px 14px', fontSize: 13, color: '#070913', fontWeight: 600, maxWidth: '85%' 
                    }}>
                      Cobre R$ 150 do Gustavo amanhã
                    </div>
                    
                    <div style={{ 
                      alignSelf: 'flex-start', background: 'rgba(255,255,255,0.03)', borderRadius: '16px 16px 16px 2px', 
                      padding: '10px 14px', fontSize: 13, color: '#cbd5e1', maxWidth: '85%',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      Com certeza! Cadastrei a cobrança de **R$ 150,00** para **Gustavo** com vencimento para amanhã. Ele receberá o lembrete gentil com o Pix copia e cola às 09:00 no WhatsApp. 🐍
                      
                      <div style={{ 
                        marginTop: 10, padding: '8px 12px', background: 'rgba(16,185,129,0.1)', 
                        border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 11, 
                        color: '#10b981', fontWeight: 600 
                      }}>
                        📅 Cobrança agendada: Gustavo · R$ 150,00 · Vence Amanhã
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16,
                    display: 'flex', gap: 10, alignItems: 'center'
                  }}>
                    <div style={{ 
                      flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10, 
                      padding: '12px 14px', fontSize: 12, color: '#64748b' 
                    }}>
                      Escreva sua dúvida aqui...
                    </div>
                    <div style={{ 
                      padding: '12px 16px', borderRadius: 10, background: '#10b981', 
                      color: '#070913', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}>
                      Enviar
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ===== SAVINGS CALCULATOR ===== */}
      <section className="section-pad" style={{ padding: '60px 0', background: '#070913' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 8, color: '#fff' }}>
            🧮 Quanto você <span style={{ color: '#10b981' }}>perde</span> por mês?
          </h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 36, fontSize: 16 }}>
            Descubra quanto o Cobbra pode recuperar para você.
          </p>
          <div className="calc-card" style={{ background: '#0c0e1a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Quantos clientes você tem?</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>{calcClients}</span>
              </label>
              <input type="range" min="1" max="100" value={calcClients} onChange={e => setCalcClients(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: '#10b981', height: 6 }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Valor médio da cobrança</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>R$ {calcAmount}</span>
              </label>
              <input type="range" min="50" max="2000" step="50" value={calcAmount} onChange={e => setCalcAmount(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: '#10b981' }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Percentual de inadimplência</span>
                <span style={{ color: '#f59e0b', fontWeight: 800 }}>{calcLatePercent}%</span>
              </label>
              <input type="range" min="5" max="50" value={calcLatePercent} onChange={e => setCalcLatePercent(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: '#f59e0b' }} />
            </div>

            {/* Dynamic SVG Comparison Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, textAlign: 'center', margin: 0 }}>Projeção Visual Financeira Mensal</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Bar 1: Lost Money */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#fca5a5', fontWeight: 600 }}>Planilha / Cobrança Manual (Inadimplência)</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>R$ {lostPerMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div style={{ height: 12, background: '#1c1012', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.15)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(8, (lostPerMonth / ((calcClients * calcAmount) || 1)) * 100))}%`,
                      background: 'linear-gradient(90deg, #b91c1c, #ef4444)',
                      borderRadius: 8,
                      boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                      transition: 'width 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)'
                    }} />
                  </div>
                </div>

                {/* Bar 2: Recovered Money */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#a7f3d0', fontWeight: 600 }}>Com Automação Cobbra (94% Recuperado)</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>+ R$ {recoveredWithCobbra.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div style={{ height: 12, background: '#091c14', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.15)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(8, (recoveredWithCobbra / ((calcClients * calcAmount) || 1)) * 100))}%`,
                      background: 'linear-gradient(90deg, #0d9488, #10b981)',
                      borderRadius: 8,
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                      transition: 'width 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ROI dinâmico integrado à calculadora */}
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
              <p style={{ color: '#a7f3d0', fontSize: 14, lineHeight: 1.6 }}>
                💡 Com o plano <strong>Crescimento ({billingCycle === 'anual' ? 'R$ 15,90/mês' : 'R$ 19,90/mês'})</strong>, seu ROI seria de{' '}
                <strong style={{ color: '#10b981', fontSize: 17 }}>
                  {recoveredWithCobbra > 0 ? `${Math.round((recoveredWithCobbra / (billingCycle === 'anual' ? 15.90 : 19.90)) * 100 - 100).toLocaleString('pt-BR')}%` : '—'}
                </strong>{' '}já no 1º mês.
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <a href={`/cadastro?plan=crescimento&cycle=${billingCycle}`} style={{
                display: 'inline-block', padding: '10px 22px', borderRadius: 10,
                background: '#10b981', color: '#070913', fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 14px rgba(16,185,129,0.4)', transition: 'all 0.3s', textDecoration: 'none'
              }}>
                {recoveredWithCobbra < 100 ? 'Começar com o plano gratuito →' : recoveredWithCobbra < 500 ? 'Ver plano Crescimento →' : 'Recuperar meu dinheiro agora →'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="depoimentos" style={{ padding: '70px 0', background: '#070913', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 className="section-title" style={{ marginBottom: 12, color: '#ffffff' }}>
              Quem usa, <span style={{ color: '#10b981' }}>comprova</span>
            </h2>
            <p className="section-subtitle" style={{ color: '#94a3b8', marginBottom: 24 }}>Resultados reais de profissionais como você</p>
            {/* Filtros de persona */}
            <div className="faq-filters" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[['todos','🐍 Todos'],['trainer','🏋️ Personal Trainer'],['freelancer','🎨 Freelancer'],['saude','🥗 Saúde'],['locacao','🚗 Locação']].map(([val, label]) => (
                <button key={val} onClick={() => setTestimonialFilter(val)} style={{
                  padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                  background: testimonialFilter === val ? '#10b981' : '#0c0e1a',
                  color: testimonialFilter === val ? '#070913' : '#cbd5e1', fontSize: 13, fontWeight: 600,
                  border: testimonialFilter === val ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: testimonialFilter === val ? '0 4px 12px rgba(16,185,129,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s'
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Featured testimonial excluded to keep layout lightweight and focused on carousel */}

          {/* Other testimonials */}
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { name: 'Rafael Costa', role: 'Designer Freelancer', location: 'Rio de Janeiro, RJ', time: 'Usa há 5 meses', quote: 'Tinha um cliente que me devia R$ 7.500 há 4 meses. Cadastrei no Cobbra e em 3 lembretes ele pagou tudo. A mensagem é tão profissional que ele nem percebeu que era automática. Agora cobro todos meus freelas assim.', result: 'Recuperou R$ 7.500 em dívidas', initials: 'RC', color: '#0891b2', stars: 5, persona: 'freelancer' },
              { name: 'Dra. Camila Ferreira', role: 'Nutricionista', location: 'Belo Horizonte, MG', time: 'Usa há 8 meses', quote: 'Minha secretária gastava 3 horas por semana cobrando pacientes. Com o Cobbra, ela não faz mais nada disso. A taxa de pagamento em dia subiu de 60% para 91%. Economizei tempo e dinheiro.', result: 'Taxa de pagamento: 60% → 91%', initials: 'CF', color: '#7c3aed', stars: 5, persona: 'saude' },
              { name: 'Gustavo Carvalho', role: 'Locadora Rent-a-Car', location: 'Curitiba, PR', time: 'Usa há 2 meses', quote: 'Eu alugo carros e antes os clientes atrasavam semanas. Com a opção de juros diários pós-vencimento do Cobbra, a conversa mudou! Cadastrei 0.5% de juros ao dia e agora todos pagam rigorosamente na data. Facilitou minha vida e aumentou meus lucros!', result: 'Inadimplência zero com juros diários', initials: 'GC', color: '#e11d48', stars: 5, persona: 'locacao' }
            ].filter(item => testimonialFilter === 'todos' || item.persona === testimonialFilter).map((item, i) => (
              <div key={i} style={{
                background: '#0c0e1a', borderRadius: 20, padding: 28, border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(16,185,129,0.05)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array(item.stars).fill(0).map((_, s) => <span key={s} style={{ color: '#f59e0b', fontSize: 16 }}>★</span>)}
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{item.time}</span>
                </div>
                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic', flex: 1 }}>
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                  📊 {item.result}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14
                  }}>{item.initials}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#ffffff' }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>{item.role} · {item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Testimonials Carousel */}
          <div className="mobile-testimonials" style={{ display: 'none', flexDirection: 'column', gap: 16 }}>
            {(() => {
              const activeList = [
                { name: 'Rafael Costa', role: 'Designer Freelancer', location: 'Rio de Janeiro, RJ', time: 'Usa há 5 meses', quote: 'Tinha um cliente que me devia R$ 7.500 há 4 meses. Cadastrei no Cobbra e em 3 lembretes ele pagou tudo. A mensagem é tão profissional que ele nem percebeu que era automática. Agora cobro todos meus freelas assim.', result: 'Recuperou R$ 7.500 em dívidas', initials: 'RC', color: '#0891b2', stars: 5, persona: 'freelancer' },
                { name: 'Dra. Camila Ferreira', role: 'Nutricionista', location: 'Belo Horizonte, MG', time: 'Usa há 8 meses', quote: 'Minha secretária gastava 3 horas por semana cobrando pacientes. Com o Cobbra, ela não faz mais nada disso. A taxa de pagamento em dia subiu de 60% para 91%. Economizei tempo e dinheiro.', result: 'Taxa de pagamento: 60% → 91%', initials: 'CF', color: '#7c3aed', stars: 5, persona: 'saude' },
                { name: 'Gustavo Carvalho', role: 'Locadora Rent-a-Car', location: 'Curitiba, PR', time: 'Usa há 2 meses', quote: 'Eu alugo carros e antes os clientes atrasavam semanas. Com a opção de juros diários pós-vencimento do Cobbra, a conversa mudou! Cadastrei 0.5% de juros ao dia e agora todos pagam rigorosamente na data. Facilitou minha vida e aumentou meus lucros!', result: 'Inadimplência zero com juros diários', initials: 'GC', color: '#e11d48', stars: 5, persona: 'locacao' }
              ].filter(item => testimonialFilter === 'todos' || item.persona === testimonialFilter);
              
              if (activeList.length === 0) return <p style={{ textAlign: 'center', color: '#64748b', margin: '20px 0' }}>Nenhum depoimento encontrado.</p>;
              
              const idx = Math.min(activeTestimonial, activeList.length - 1);
              const item = activeList[idx] || activeList[0];
              
              return (
                <div className="animate-fadeIn" style={{
                  background: '#0c0e1a', borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array(item.stars).fill(0).map((_, s) => <span key={s} style={{ color: '#f59e0b', fontSize: 16 }}>★</span>)}
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{item.time}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic', margin: '0 0 16px' }}>
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                    📊 {item.result}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', background: item.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14
                      }}>{item.initials}</div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{item.role}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => setActiveTestimonial(prev => (prev - 1 + activeList.length) % activeList.length)}
                        style={{
                          width: 32, height: 32, minWidth: 32, minHeight: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                          color: '#fff', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                          flexShrink: 0, padding: 0
                        }}
                      >‹</button>
                      <button 
                        onClick={() => setActiveTestimonial(prev => (prev + 1) % activeList.length)}
                        style={{
                          width: 32, height: 32, minWidth: 32, minHeight: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                          color: '#fff', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                          flexShrink: 0, padding: 0
                        }}
                      >›</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
                    {activeList.map((_, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveTestimonial(i)}
                        style={{
                          width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                          background: i === idx ? '#10b981' : 'rgba(255,255,255,0.15)',
                          transition: 'background 0.2s'
                        }} 
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="precos" style={{ padding: '70px 0', background: '#070913', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: 8, color: '#ffffff' }}>
            Demita a inadimplência.<br /><span style={{ color: '#10b981' }}>Planos que cabem no bolso.</span>
          </h2>
          <p className="section-subtitle" style={{ color: '#cbd5e1', marginBottom: 32 }}>Planos acessíveis e transparentes. Faça upgrade quando precisar. Sem fidelidade.</p>

          {/* Seletor de Faturamento Mensal vs Anual */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: billingCycle === 'mensal' ? '#ffffff' : '#64748b' }}>Cobrança Mensal</span>
            <button 
              onClick={() => setBillingCycle(prev => prev === 'mensal' ? 'anual' : 'mensal')}
              aria-label="Alternar faturamento"
              style={{
                width: 60, height: 32, borderRadius: 100, background: '#10b981', position: 'relative',
                border: 'none', cursor: 'pointer', outline: 'none', transition: 'background 0.3s ease',
                padding: 4, display: 'flex', alignItems: 'center'
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: '#070913',
                position: 'absolute', left: billingCycle === 'mensal' ? 4 : 32,
                transition: 'left 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)'
              }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: billingCycle === 'anual' ? '#ffffff' : '#64748b' }}>Assinatura Anual</span>
              <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: 6 }}>SALVE 20%</span>
            </div>
          </div>

          {/* Âncora de preço / ROI */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)',
            borderRadius: 14, padding: '16px 28px', marginBottom: 48, maxWidth: 640
          }}>
            <span style={{ fontSize: 28 }}>💡</span>
            <p style={{ fontSize: 14, color: '#10b981', lineHeight: 1.6, textAlign: 'left', margin: 0 }}>
              Se você tem <strong>10 clientes</strong> pagando R$ 200/mês e 20% estão atrasados, você perde
              {' '}<strong>R$ 400/mês</strong> em inadimplência. O plano Crescimento custa apenas <strong>{billingCycle === 'anual' ? 'R$ 15,90/mês' : 'R$ 19,90/mês'}</strong>.
              {' '}Isso é um <strong style={{ color: '#10b981', fontSize: 16 }}>ROI de {billingCycle === 'anual' ? '2.415%' : '2.011%'}</strong> no primeiro mês.
            </p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'stretch' }}>
            {/* Starter */}
            <GlowCard style={{ padding: 36, textAlign: 'left' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#ffffff' }}>Starter</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Para testar e começar a cobrar</p>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#ffffff' }}>{billingCycle === 'anual' ? 'R$ 7,90' : 'R$ 9,90'}</span>
                <span style={{ fontSize: 14, color: '#94a3b8' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{billingCycle === 'anual' ? 'menos de R$ 0,26/dia' : 'menos de R$ 0,33/dia'}</p>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 24 }}>{billingCycle === 'anual' ? 'R$ 94,80 cobrado anualmente' : 'cobrado mensalmente'}</p>
              <div style={{ flex: 1 }}>
                {['Até 20 cobranças simultâneas', 'Lembretes por e-mail', 'Dashboard básico', 'Templates padrão', '1 chave Pix'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#cbd5e1' }}>
                    <span style={{ color: '#10b981' }}>✓</span> {f}
                  </div>
                ))}
                {['WhatsApp', 'Relatórios', 'API'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: 'rgba(255,255,255,0.15)' }}>
                    <span>✗</span> {f}
                  </div>
                ))}
              </div>
              <a href={`/cadastro?plan=starter&cycle=${billingCycle}`} style={{
                display: 'block', padding: '11px', borderRadius: 10, marginTop: 20,
                border: '2px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: 14, fontWeight: 700,
                textAlign: 'center', transition: 'all 0.3s', textDecoration: 'none', background: '#0c0e1a'
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#10b981'; e.target.style.color = '#10b981'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#ffffff'; }}
              >Assinar Starter</a>
            </GlowCard>

            {/* Crescimento - POPULAR — com destaque visual forte */}
            <GlowCard className="pricing-featured" style={{
              borderRadius: 28, padding: '44px 36px',
              border: '3px solid #10b981', textAlign: 'left', position: 'relative',
              boxShadow: '0 24px 60px rgba(16,185,129,0.15)',
              transform: 'scale(1.05)'
            }}>
              <div style={{
                position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
                padding: '7px 22px', borderRadius: 100, fontSize: 12, fontWeight: 800, letterSpacing: 0.5,
                boxShadow: '0 4px 12px rgba(245,158,11,0.4)', whiteSpace: 'nowrap', zIndex: 10
              }}>⚡ MAIS POPULAR — MELHOR CUSTO-BENEFÍCIO</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#fff' }}>Crescimento</h3>
              <p style={{ fontSize: 13, color: '#a7f3d0', marginBottom: 20 }}>Para quem está crescendo e quer resultado rápido</p>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: '#10b981' }}>{billingCycle === 'anual' ? 'R$ 15,90' : 'R$ 19,90'}</span>
                <span style={{ fontSize: 14, color: '#a7f3d0' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#a7f3d0', marginBottom: 4 }}>{billingCycle === 'anual' ? 'menos de R$ 0,53/dia' : 'menos de R$ 0,67/dia'}</p>
              <p style={{ fontSize: 11, color: '#68d391', marginBottom: 16 }}>{billingCycle === 'anual' ? 'R$ 190,80 cobrado anualmente' : 'cobrado mensalmente'}</p>
              <div style={{ background: 'rgba(16,185,129,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 24, fontSize: 13, color: '#a7f3d0', fontWeight: 600 }}>
                {billingCycle === 'anual' ? '🔥 ROI médio de 2.500%+ no 1º mês' : '🔥 ROI médio de 2.000%+ no 1º mês'}
              </div>
              <div style={{ flex: 1 }}>
                {['Até 50 cobranças simultâneas', 'WhatsApp + e-mail automático', 'Dashboard completo', 'Templates personalizáveis', 'Relatórios de recebimento', 'Múltiplas chaves Pix', 'Suporte e-mail + WhatsApp'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, color: '#d1fae5' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: 16 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <a href={`/cadastro?plan=crescimento&cycle=${billingCycle}`} style={{
                display: 'block', padding: '11px', borderRadius: 10, marginTop: 20,
                background: '#10b981', color: '#070913', fontSize: 14, fontWeight: 800,
                textAlign: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', transition: 'all 0.3s', textDecoration: 'none'
              }}>Assinar agora — Começar a recuperar →</a>
            </GlowCard>

            {/* Cobra Pro */}
            <GlowCard style={{ padding: 36, textAlign: 'left', color: '#fff' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#fff' }}>Cobra Pro</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Para quem quer o máximo</p>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#10b981' }}>{billingCycle === 'anual' ? 'R$ 39,90' : 'R$ 49,90'}</span>
                <span style={{ fontSize: 14, color: '#64748b' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{billingCycle === 'anual' ? 'menos de R$ 1,33/dia' : 'menos de R$ 1,67/dia'}</p>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 24 }}>{billingCycle === 'anual' ? 'R$ 478,80 cobrado anualmente' : 'cobrado mensalmente'}</p>
              <div style={{ flex: 1 }}>
                {['Cobranças ilimitadas', 'WhatsApp + e-mail', 'Dashboard completo', 'Templates ilimitados', 'Relatórios avançados', 'API para integrações', 'Webhooks em tempo real', 'Suporte prioritário WhatsApp', 'Multi-usuários'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#cbd5e1' }}>
                    <span style={{ color: '#10b981' }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <a href={`/cadastro?plan=cobrapro&cycle=${billingCycle}`} style={{
                display: 'block', padding: '11px', borderRadius: 10, marginTop: 20,
                background: '#10b981', color: '#070913', fontSize: 14, fontWeight: 700,
                textAlign: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.3s', textDecoration: 'none'
              }}>Assinar Cobra Pro →</a>
            </GlowCard>
          </div>

          <p style={{ fontSize: 13, color: '#64748b', marginTop: 40, textAlign: 'center' }}>Todos os planos: 0% sobre o valor recebido · Cancele quando quiser · Pix 100% na sua conta</p>
        </div>
      </section>

      {/* ===== FAQ WITH CATEGORIES ===== */}
      <section id="faq" style={{ padding: '70px 0', background: '#070913' }}>
        <div style={{ maxWidth: 750, margin: '0 auto', padding: '0 24px' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 12, color: '#ffffff' }}>Ainda em dúvida? <span style={{ color: '#10b981' }}>A cobra responde.</span> 🐍</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', color: '#cbd5e1', marginBottom: 32 }}>Tudo que você precisa saber para começar hoje</p>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            {faqCategories.map(cat => (
              <button key={cat} onClick={() => setFaqCategory(cat)} style={{
                padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                background: faqCategory === cat ? '#10b981' : '#0c0e1a',
                color: faqCategory === cat ? '#070913' : '#cbd5e1', fontSize: 13, fontWeight: 600,
                border: faqCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: faqCategory === cat ? '0 4px 12px rgba(16,185,129,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'all 0.2s'
              }}>
                {cat === 'all' ? '🐍 Todas' : cat === 'Conta' ? '👤 Conta' : cat === 'Produto' ? '📦 Produto' : cat === 'Cobranças' ? '💰 Cobranças' : cat === 'Pagamento' ? '💳 Pagamento' : cat === 'Segurança' ? '🔒 Segurança' : cat === 'Integração' ? '🔗 Integração' : cat}
              </button>
            ))}
          </div>

          {/* FAQ Search Bar */}
          <div style={{ maxWidth: 600, margin: '0 auto 36px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Busque por dúvidas (ex: Pix, juros, taxas, WhatsApp...)" 
              value={faqSearch}
              onChange={e => setFaqSearch(e.target.value)}
              style={{
                width: '100%', padding: '14px 20px 14px 46px', borderRadius: 14,
                background: '#0c0e1a', border: '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff', fontSize: 14, transition: 'all 0.3s',
                fontFamily: 'Inter, sans-serif', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
            {faqSearch && (
              <button 
                onClick={() => setFaqSearch('')}
                style={{ 
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', 
                  color: '#10b981', fontSize: 12, fontWeight: 800, border: 'none', background: 'none',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}
              >LIMPAR</button>
            )}
          </div>

          {filteredFaqs.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} category={faq.cat} />
          ))}

          {filteredFaqs.length === 0 && (
            <div style={{
              background: '#0c0e1a', borderRadius: 16, padding: '40px 24px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.3s ease'
            }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🔍</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Nenhuma dúvida encontrada</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Tente buscar termos como "Pix", "boleto", "WhatsApp" ou "taxas".</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #070913, #0c0e1a, #070913)', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(16,185,129,0.2)', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        {/* Floating mini snakes */}
        <div className="desktop-only" style={{ position: 'absolute', top: 20, left: '10%', opacity: 0.2, animation: 'float 4s ease-in-out infinite' }}><MiniSnake size={50} /></div>
        <div className="desktop-only" style={{ position: 'absolute', bottom: 30, right: '15%', opacity: 0.15, animation: 'float 5s ease-in-out infinite 1s' }}><MiniSnake size={60} /></div>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <h2 className="section-title" style={{ color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
            Enquanto você dorme,<br />a cobra cobra.
          </h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 16 }}>
            Em menos de 2 minutos sua primeira cobrança gentil está rodando.
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 40 }}>
            Você fica o bonzinho. A cobra faz o serviço sujo.
          </p>
          <a href="/cadastro" style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: 10,
            background: '#10b981', color: '#070913', fontSize: 15, fontWeight: 800,
            boxShadow: '0 6px 20px rgba(16,185,129,0.3)', transition: 'all 0.3s', textDecoration: 'none'
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-3px) scale(1.03)'; e.target.style.boxShadow = '0 14px 40px rgba(16,185,129,0.5)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 6px 20px rgba(16,185,129,0.3)'; }}
          >Começar grátis agora →</a>
          {/* Garantia explícita */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
            {['🛡️ Sem risco', '✅ Plano gratuito para sempre', '🚫 Sem cartão necessário', '🔓 Cancele quando quiser'].map(g => (
              <span key={g} style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{g}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ padding: '60px 0 30px', background: '#0c0e1a', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <MiniSnake size={30} />
                <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Cobbra</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>Cobrança gentil para autônomos brasileiros.<br />A cobra que trabalha por você 🐍</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Produto</h4>
              {['Benefícios', 'Como funciona', 'Preços'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} style={{ display: 'block', fontSize: 14, marginBottom: 10, color: '#94a3b8', transition: 'color 0.2s', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Empresa</h4>
              {['Sobre nós', 'Blog', 'Contato'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 14, marginBottom: 10, color: '#94a3b8', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Legal</h4>
              {['Termos de uso', 'Privacidade'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 14, marginBottom: 10, color: '#94a3b8', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, textAlign: 'center', fontSize: 13 }}>
            © 2026 Cobbra. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* ===== FLOATING URGENCY BAR ===== */}
      {urgencyVisible && urgencyTime && (
        <div className="urgency-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 14, color: '#e2e8f0' }}>
              <span className="desktop-only">🐍 Última cobrança enviada <strong style={{ color: '#10b981' }}>{urgencyTime}</strong> em <strong style={{ color: '#10b981' }}>{urgencyCity}</strong></span>
              <span className="mobile-only" style={{ display: 'none' }}>🐍 Cobranças automáticas no WhatsApp</span>
            </span>
          </div>
          <a href="/cadastro">Começar agora</a>
          <button onClick={() => setUrgencyVisible(false)} aria-label="Fechar barra de urgência">×</button>
        </div>
      )}

      {/* Floating Mascot chatbot */}
      <Chatbot />
    </div>
  );
}
