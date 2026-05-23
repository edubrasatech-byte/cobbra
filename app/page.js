'use client';
import { useState, useEffect, useRef } from 'react';
import Chatbot from './components/Chatbot';

// ========== SNAKE MASCOT SVG ==========
function SnakeMascot({ size = 120, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={style}>
      {/* Body coil */}
      <ellipse cx="100" cy="120" rx="55" ry="40" fill="url(#snakeGrad)" opacity="0.3" />
      <path d="M70 140 C40 140, 30 110, 50 90 C70 70, 100 65, 120 80 C140 95, 155 80, 155 60 C155 40, 140 30, 125 35" stroke="url(#snakeGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
      {/* Body pattern */}
      <path d="M70 140 C40 140, 30 110, 50 90 C70 70, 100 65, 120 80 C140 95, 155 80, 155 60 C155 40, 140 30, 125 35" stroke="rgba(255,255,255,0.15)" strokeWidth="8" strokeLinecap="round" fill="none" strokeDasharray="4 12" />
      {/* Head */}
      <circle cx="120" cy="32" r="22" fill="url(#snakeGrad)" />
      <circle cx="120" cy="32" r="20" fill="url(#headGrad)" />
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
      <path d="M70 140 C65 150, 75 155, 85 148" stroke="url(#snakeGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ========== MINI SNAKE (for decorations) ==========
function MiniSnake({ size = 40, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
      <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke="url(#miniGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="8" r="5" fill="url(#miniGrad)" />
      <circle cx="23" cy="7" r="1.2" fill="white" />
      <circle cx="26" cy="7" r="1.2" fill="white" />
      <circle cx="23.2" cy="7.3" r="0.7" fill="#0f172a" />
      <circle cx="26.2" cy="7.3" r="0.7" fill="#0f172a" />
      <defs>
        <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
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
      border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 12, overflow: 'hidden',
      background: open ? '#f0fdf4' : '#fff', transition: 'all 0.3s ease'
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 16, fontWeight: 600, color: '#0f172a', textAlign: 'left', cursor: 'pointer',
        background: 'none', border: 'none', fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {category && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{category}</span>}
          {question}
        </div>
        <span style={{ fontSize: 24, transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.3s', color: '#059669', flexShrink: 0, marginLeft: 12 }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease',
        padding: open ? '0 24px 20px' : '0 24px', color: '#475569', fontSize: 15, lineHeight: 1.7
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
  const [testimonialFilter, setTestimonialFilter] = useState('todos');
  const [urgencyTime, setUrgencyTime] = useState('');
  const [urgencyCity, setUrgencyCity] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const headerBg = scrollY > 50 ? 'rgba(255,255,255,0.95)' : 'transparent';
  const headerShadow = scrollY > 50 ? '0 1px 10px rgba(0,0,0,0.08)' : 'none';

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

  const filteredFaqs = faqCategory === 'all' ? faqs : faqs.filter(f => f.cat === faqCategory);
  const faqCategories = ['all', ...new Set(faqs.map(f => f.cat))];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      {/* ===== HEADER ===== */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: headerBg, backdropFilter: 'blur(20px)', boxShadow: headerShadow,
        transition: 'all 0.3s ease', borderBottom: scrollY > 50 ? '1px solid #e2e8f0' : 'none'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo with Snake */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MiniSnake size={38} />
            <span style={{ fontSize: 30, fontWeight: 900, background: 'linear-gradient(135deg, #059669, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -1 }}>
              Cobbra
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', marginTop: -8, marginLeft: -2 }}>.ai</span>
          </div>

          {/* Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', fontSize: 24, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer' }}
            className="mobile-hamburger"
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Nav */}
          <nav className="landing-nav" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Benefícios', 'Como funciona', 'Depoimentos', 'Preços', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}
                style={{ fontSize: 14, fontWeight: 500, color: '#475569', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#059669'}
                onMouseLeave={e => e.target.style.color = '#475569'}
              >{item}</a>
            ))}
            <a href="/login" style={{
              fontSize: 14, fontWeight: 600, color: '#059669', padding: '8px 20px', borderRadius: 8,
              border: '2px solid #059669', transition: 'all 0.2s', textDecoration: 'none'
            }}
              onMouseEnter={e => { e.target.style.background = '#059669'; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#059669'; }}
            >Entrar</a>
            <a href="/cadastro" style={{
              fontSize: 14, fontWeight: 600, color: '#fff', padding: '10px 24px', borderRadius: 8,
              background: 'linear-gradient(135deg, #059669, #0d9488)', boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
              transition: 'all 0.2s', transform: 'translateY(0)', textDecoration: 'none'
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(5,150,105,0.4)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(5,150,105,0.3)'; }}
            >Começar grátis</a>
          </nav>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="landing-nav-mobile" style={{
            position: 'fixed', top: 60, left: 0, right: 0, background: '#fff',
            borderBottom: '1px solid #e2e8f0', padding: '16px 24px', zIndex: 999,
            display: 'none', flexDirection: 'column', gap: 4, boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
          }}>
            {['Benefícios#beneficios','Como funciona#como-funciona','Depoimentos#depoimentos','Preços#precos','FAQ#faq'].map(item => {
              const [label, hash] = item.split('#');
              return (
                <a key={hash} href={`#${hash}`} onClick={() => setMobileMenuOpen(false)} style={{
                  padding: '12px 0', fontSize: 16, fontWeight: 500, color: '#0f172a',
                  borderBottom: '1px solid #f1f5f9', textDecoration: 'none'
                }}>{label}</a>
              );
            })}
            <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
              <a href="/login" style={{ flex: 1, textAlign: 'center', padding: '10px', border: '2px solid #059669', borderRadius: 8, color: '#059669', fontWeight: 600, textDecoration: 'none' }}>Entrar</a>
              <a href="/cadastro" style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'linear-gradient(135deg,#059669,#0d9488)', borderRadius: 8, color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Começar grátis</a>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section style={{
        paddingTop: 120, paddingBottom: 60, background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 30%, #f8fafc 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(5,150,105,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(13,148,136,0.05)' }} />

        <div className="hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 60, position: 'relative' }}>
          {/* Left Content */}
          <div style={{ flex: 1, animation: 'fadeInUp 0.8s ease' }}>
            {/* Mini social proof acima do fold */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', padding: '10px 18px',
              borderRadius: 100, fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 24,
              border: '1px solid #d1fae5', boxShadow: '0 2px 12px rgba(5,150,105,0.1)', maxWidth: 520
            }}>
              <div style={{ display: 'flex' }}>
                {['MO','RC','CF'].map((i, idx) => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: ['#059669','#0891b2','#7c3aed'][idx], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800, marginLeft: idx > 0 ? -6 : 0, border: '2px solid #fff' }}>{i}</div>
                ))}
              </div>
              <span><strong style={{ color: '#059669' }}>&ldquo;Minha inadimplência caiu de 35% para 6%&rdquo;</strong> — Marina O., Personal Trainer</span>
            </div>

            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: -1 }}>
              Seu Funcionário{' '}
              <span style={{ background: 'linear-gradient(135deg, #059669, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Financeiro
              </span>{' '}
              Mais Barato do Brasil
            </h1>

            <p className="hero-sub" style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
              Você avisa uma vez. A cobra cobra no WhatsApp toda semana — até o dinheiro entrar direto no seu Pix.
              Sem constrangimento. Sem taxas. Sem você precisar fazer nada.
            </p>

            <div className="hero-cta" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <a href="/cadastro" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 12,
                background: 'linear-gradient(135deg, #059669, #0d9488)', color: '#fff', fontSize: 17, fontWeight: 700,
                boxShadow: '0 4px 14px rgba(5,150,105,0.4)', transition: 'all 0.3s', transform: 'translateY(0)', textDecoration: 'none'
              }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 8px 25px rgba(5,150,105,0.5)'; }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(5,150,105,0.4)'; }}
              >
                Parar de perder dinheiro — Começar grátis →
              </a>
              <a href="#como-funciona" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 28px', borderRadius: 12,
                border: '2px solid #e2e8f0', color: '#475569', fontSize: 16, fontWeight: 600,
                transition: 'all 0.2s', textDecoration: 'none'
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#059669'; e.target.style.color = '#059669'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
              >
                ▶ Ver como funciona
              </a>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Sem cartão · Ativo em 2 minutos · Cancele quando quiser — <strong style={{color:'#64748b'}}>Não tem pegadinha.</strong></p>

            {/* Trust Badges — com números concretos */}
            <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              {[
                { icon: '🐍', label: '3.500+', text: 'autônomos usando hoje' },
                { icon: '💰', label: 'R$ 1,2 mi', text: 'movimentados sem taxas' },
                { icon: '⚡', label: '2 min', text: 'para 1ª cobrança ir' }
              ].map(badge => (
                <div key={badge.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                  <span>{badge.icon}</span>
                  <strong style={{ color: '#0f172a', fontSize: 14 }}>{badge.label}</strong>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Dashboard Preview with Mascot */}
          <div className="hero-mockup" style={{ flex: 1, position: 'relative', animation: 'fadeInUp 1s ease 0.2s both' }}>
            {/* Mascot peeking from top */}
            <div style={{ position: 'absolute', top: -60, right: 30, zIndex: 2, animation: 'float 3s ease-in-out infinite' }}>
              <SnakeMascot size={110} />
            </div>
            {/* Speech bubble */}
            <div style={{
              position: 'absolute', top: -20, right: 140, background: '#fff', borderRadius: 12, padding: '8px 14px',
              fontSize: 12, fontWeight: 600, color: '#059669', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #d1fae5', zIndex: 3
            }}>
              Psst... pode deixar comigo! 🐍
              <div style={{ position: 'absolute', bottom: -6, right: 20, width: 12, height: 12, background: '#fff', border: '1px solid #d1fae5', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
            </div>

            <div style={{
              background: '#0f172a', borderRadius: 20, padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
              transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)', transition: 'transform 0.5s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>Recebido este mês</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>R$ 8.420,00</p>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.15)', padding: '6px 12px', borderRadius: 8, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                  ↑ 23% vs mês anterior
                </div>
              </div>
              {/* Mini chart bars */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60, marginBottom: 20 }}>
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 95, 50, 70, 88].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: `linear-gradient(to top, #059669, #34d399)`, borderRadius: 3, opacity: 0.8 + (i * 0.01) }} />
                ))}
              </div>
              {/* Client list */}
              {[
                { name: 'Mariana Alves', status: 'Pago', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
                { name: 'Rodrigo Pacheco', status: 'Lembrete enviado', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
                { name: 'Studio Bem Estar', status: 'Aguardando', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
                { name: 'Juliana Mendes', status: 'Pago', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
              ].map(item => (
                <div key={item.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(5,150,105,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#34d399', fontWeight: 700 }}>
                      {item.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: 14 }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: item.bg, color: item.color, fontWeight: 600 }}>
                    {item.status}
                  </span>
                </div>
              ))}
              {/* WhatsApp preview */}
              <div style={{ marginTop: 16, background: 'rgba(37,211,102,0.1)', borderRadius: 12, padding: 14, border: '1px solid rgba(37,211,102,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>💬</span>
                  <span style={{ fontSize: 11, color: '#25d366', fontWeight: 600 }}>WhatsApp · agora</span>
                </div>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                  Oi Mari! 🐍 Lembrete gentil: sua mensalidade vence amanhã. Pode pagar pelo Pix no link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ===== HOW IT WORKS ===== */}
      <section id="como-funciona" style={{ padding: '70px 0', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5, #f8fafc)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Nunca mais você vai precisar<br /><span style={{ color: '#059669' }}>fingir que esqueceu de cobrar.</span></h2>
          <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40 }}>O Cobbra faz o papel chato por você — e o cliente nem percebe que é automático.</p>
          <div className="how-it-works-steps" style={{ display: 'flex', gap: 40, justifyContent: 'center', position: 'relative' }}>
            {/* Connection line */}
            <div className="how-it-works-line" style={{ position: 'absolute', top: 35, left: '20%', right: '20%', height: 2, background: 'linear-gradient(to right, #d1fae5, #059669, #d1fae5)', zIndex: 0 }} />
            {[
              { step: '1', title: 'Cadastre a cobrança', desc: 'Insira valor, vencimento e o contato do cliente em 30 segundos.', icon: '📝' },
              { step: '2', title: 'A cobra notifica', desc: 'Lembretes gentis disparados no WhatsApp e e-mail no momento certo.', icon: '🐍' },
              { step: '3', title: 'Receba direto no Pix', desc: 'O cliente paga pelo seu QR Code. Você fica com 100% do valor.', icon: '💰' }
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #0d9488)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  fontSize: 30, boxShadow: '0 8px 20px rgba(5,150,105,0.3)'
                }}>{item.icon}</div>
                <div style={{
                  position: 'absolute', top: -8, width: 30, height: 30, borderRadius: '50%',
                  background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, left: '50%', marginLeft: 20
                }}>{item.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BEFORE VS AFTER ===== */}
      <section style={{ padding: '70px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>
            Você fica o bonzinho.<br /><span style={{ color: '#059669' }}>A cobra faz o serviço sujo.</span>
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 17, marginBottom: 48 }}>Pare de perder amizades (e dinheiro) por não cobrar.</p>
          <div className="before-after-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 0, alignItems: 'stretch' }}>
            {/* Before */}
            <div className="before-panel" style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '20px 0 0 20px', padding: 40 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 28 }}>
                ❌ Sem o Cobbra
              </div>
              {[
                { emoji: '😰', text: 'Você manda mensagem constrangido no WhatsApp' },
                { emoji: '📉', text: '25% dos clientes esquecem de pagar — e você perde' },
                { emoji: '😤', text: 'Cliente fica chateado com a cobrança direta' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                  <span style={{ fontSize: 15, color: '#7f1d1d', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
            {/* VS divider */}
            <div className="before-after-divider" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #fef2f2, #f0fdf4)', position: 'relative' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <MiniSnake size={32} />
              </div>
            </div>
            {/* After */}
            <div className="after-panel" style={{ background: '#f0fdf4', border: '2px solid #a7f3d0', borderRadius: '0 20px 20px 0', padding: 40 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 28 }}>
                ✅ Com o Cobbra
              </div>
              {[
                { emoji: '😌', text: 'A cobra manda o lembrete — você fica o bonzinho' },
                { emoji: '📈', text: '94% pagam antes ou na data. Dinheiro garantido no Pix' },
                { emoji: '😊', text: 'Clientes elogiam a comunicação profissional' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                  <span style={{ fontSize: 15, color: '#064e3b', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SAVINGS CALCULATOR ===== */}
      <section style={{ padding: '70px 0', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#fff' }}>
            🧮 Quanto você <span style={{ color: '#34d399' }}>perde</span> por mês?
          </h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 48, fontSize: 16 }}>
            Descubra quanto o Cobbra pode recuperar para você.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 40, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Quantos clientes você tem?</span>
                <span style={{ color: '#34d399', fontWeight: 800 }}>{calcClients}</span>
              </label>
              <input type="range" min="1" max="100" value={calcClients} onChange={e => setCalcClients(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: '#059669', height: 6 }} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Valor médio da cobrança</span>
                <span style={{ color: '#34d399', fontWeight: 800 }}>R$ {calcAmount}</span>
              </label>
              <input type="range" min="50" max="2000" step="50" value={calcAmount} onChange={e => setCalcAmount(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: '#059669' }} />
            </div>
            <div style={{ marginBottom: 36 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Percentual de inadimplência</span>
                <span style={{ color: '#f59e0b', fontWeight: 800 }}>{calcLatePercent}%</span>
              </label>
              <input type="range" min="5" max="50" value={calcLatePercent} onChange={e => setCalcLatePercent(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: '#f59e0b' }} />
            </div>
            <div className="calc-results" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ fontSize: 13, color: '#fca5a5', marginBottom: 8 }}>Você perde por mês</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>R$ {lostPerMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ fontSize: 13, color: '#6ee7b7', marginBottom: 8 }}>Cobbra recupera até</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>R$ {recoveredWithCobbra.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
            {/* ROI dinâmico integrado à calculadora */}
            <div style={{ marginTop: 20, padding: 20, background: 'rgba(5,150,105,0.12)', borderRadius: 14, border: '1px solid rgba(5,150,105,0.25)', textAlign: 'center' }}>
              <p style={{ color: '#6ee7b7', fontSize: 14, lineHeight: 1.6 }}>
                💡 Com o plano <strong>Crescimento (R$ 19,90/mês)</strong>, seu ROI seria de{' '}
                <strong style={{ color: '#34d399', fontSize: 17 }}>
                  {recoveredWithCobbra > 0 ? `${Math.round((recoveredWithCobbra / 19.90) * 100 - 100).toLocaleString('pt-BR')}%` : '—'}
                </strong>{' '}já no 1º mês.
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <a href="/cadastro" style={{
                display: 'inline-block', padding: '14px 36px', borderRadius: 12,
                background: 'linear-gradient(135deg, #059669, #0d9488)', color: '#fff', fontSize: 16, fontWeight: 700,
                boxShadow: '0 4px 14px rgba(5,150,105,0.4)', transition: 'all 0.3s', textDecoration: 'none'
              }}>
                {recoveredWithCobbra < 100 ? 'Começar com o plano gratuito →' : recoveredWithCobbra < 500 ? 'Ver plano Crescimento →' : 'Recuperar meu dinheiro agora →'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="depoimentos" style={{ padding: '70px 0', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>
              Quem usa, <span style={{ color: '#059669' }}>comprova</span>
            </h2>
            <p style={{ fontSize: 18, color: '#64748b', marginBottom: 24 }}>Resultados reais de profissionais como você</p>
            {/* Filtros de persona */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[['todos','🐍 Todos'],['trainer','🏋️ Personal Trainer'],['freelancer','🎨 Freelancer'],['saude','🥗 Saúde'],['locacao','🚗 Locação']].map(([val, label]) => (
                <button key={val} onClick={() => setTestimonialFilter(val)} style={{
                  padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                  background: testimonialFilter === val ? 'linear-gradient(135deg,#059669,#0d9488)' : '#fff',
                  color: testimonialFilter === val ? '#fff' : '#64748b', fontSize: 13, fontWeight: 600,
                  boxShadow: testimonialFilter === val ? '0 4px 12px rgba(5,150,105,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s'
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Featured testimonial - sempre visível no filtro 'todos' e 'trainer' */}
          {(testimonialFilter === 'todos' || testimonialFilter === 'trainer') && (
          <div className="featured-testimonial" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', borderRadius: 24, padding: 48, marginBottom: 32, display: 'flex', gap: 40, alignItems: 'center', color: '#fff' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 20 }}>★</span>)}
              </div>
              <p style={{ fontSize: 20, lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic', opacity: 0.95 }}>
                &ldquo;Em 3 meses usando o Cobbra, minha inadimplência caiu de 35% para 6%. Recuperei R$ 4.200 que estavam parados. A mensagem pelo WhatsApp é tão gentil que meus alunos até agradecem o lembrete. Sério.&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>MO</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 17 }}>Marina Oliveira</p>
                  <p style={{ fontSize: 14, opacity: 0.8 }}>Personal Trainer · 32 alunos ativos · São Paulo, SP</p>
                </div>
              </div>
            </div>
            <div className="featured-stats" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 200 }}>
              {[{ value: '-83%', label: 'inadimplência' }, { value: 'R$ 4.200', label: 'recuperados' }, { value: '3 meses', label: 'usando Cobbra' }].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                  <p style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</p>
                  <p style={{ fontSize: 12, opacity: 0.7 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Other testimonials */}
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { name: 'Rafael Costa', role: 'Designer Freelancer', location: 'Rio de Janeiro, RJ', time: 'Usa há 5 meses', quote: 'Tinha um cliente que me devia R$ 7.500 há 4 meses. Cadastrei no Cobbra e em 3 lembretes ele pagou tudo. A mensagem é tão profissional que ele nem percebeu que era automática. Agora cobro todos meus freelas assim.', result: 'Recuperou R$ 7.500 em dívidas', initials: 'RC', color: '#0891b2', stars: 5, persona: 'freelancer' },
              { name: 'Dra. Camila Ferreira', role: 'Nutricionista', location: 'Belo Horizonte, MG', time: 'Usa há 8 meses', quote: 'Minha secretária gastava 3 horas por semana cobrando pacientes. Com o Cobbra, ela não faz mais nada disso. A taxa de pagamento em dia subiu de 60% para 91%. Economizei tempo e dinheiro.', result: 'Taxa de pagamento: 60% → 91%', initials: 'CF', color: '#7c3aed', stars: 5, persona: 'saude' },
              { name: 'Gustavo Carvalho', role: 'Locadora Rent-a-Car', location: 'Curitiba, PR', time: 'Usa há 2 meses', quote: 'Eu alugo carros e antes os clientes atrasavam semanas. Com a opção de juros diários pós-vencimento do Cobbra, a conversa mudou! Cadastrei 0.5% de juros ao dia e agora todos pagam rigorosamente na data. Facilitou minha vida e aumentou meus lucros!', result: 'Inadimplência zero com juros diários', initials: 'GC', color: '#e11d48', stars: 5, persona: 'locacao' }
            ].filter(item => testimonialFilter === 'todos' || item.persona === testimonialFilter).map((item, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array(item.stars).fill(0).map((_, s) => <span key={s} style={{ color: '#f59e0b', fontSize: 16 }}>★</span>)}
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>{item.time}</span>
                </div>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic', flex: 1 }}>
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                  📊 {item.result}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14
                  }}>{item.initials}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>{item.role} · {item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ===== PRICING ===== */}
      <section id="precos" style={{ padding: '70px 0', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
            Demita a inadimplência.<br /><span style={{ color: '#059669' }}>Planos que cabem no bolso.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32 }}>Planos acessíveis e transparentes. Faça upgrade quando precisar. Sem fidelidade.</p>

          {/* Âncora de preço / ROI */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #a7f3d0',
            borderRadius: 14, padding: '16px 28px', marginBottom: 48, maxWidth: 640
          }}>
            <span style={{ fontSize: 28 }}>💡</span>
            <p style={{ fontSize: 14, color: '#047857', lineHeight: 1.6, textAlign: 'left', margin: 0 }}>
              Se você tem <strong>10 clientes</strong> pagando R$ 200/mês e 20% estão atrasados, você perde
              {' '}<strong>R$ 400/mês</strong> em inadimplência. O plano Crescimento custa <strong>R$ 19,90</strong>.
              {' '}Isso é um <strong style={{ color: '#059669', fontSize: 16 }}>ROI de 2.011%</strong> no primeiro mês.
            </p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'stretch' }}>
            {/* Starter */}
            <div style={{ background: '#fff', borderRadius: 24, padding: 36, border: '2px solid #e2e8f0', textAlign: 'left', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Starter</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Para testar e começar a cobrar</p>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#0f172a' }}>R$ 9,90</span>
                <span style={{ fontSize: 14, color: '#94a3b8' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>menos de R$ 0,33/dia</p>
              <div style={{ flex: 1 }}>
                {['Até 3 cobranças simultâneas', 'Lembretes por e-mail', 'Dashboard básico', 'Templates padrão', '1 chave Pix'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#334155' }}>
                    <span style={{ color: '#10b981' }}>✓</span> {f}
                  </div>
                ))}
                {['WhatsApp', 'Relatórios', 'API'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#cbd5e1' }}>
                    <span>✗</span> {f}
                  </div>
                ))}
              </div>
              <a href="/cadastro" style={{
                display: 'block', padding: '14px', borderRadius: 12, marginTop: 24,
                border: '2px solid #e2e8f0', color: '#475569', fontSize: 15, fontWeight: 700,
                textAlign: 'center', transition: 'all 0.3s', textDecoration: 'none', background: '#fff'
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#059669'; e.target.style.color = '#059669'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
              >Assinar Starter</a>
            </div>

            {/* Crescimento - POPULAR — com destaque visual forte */}
            <div className="pricing-featured" style={{
              background: 'linear-gradient(145deg, #064e3b, #065f46)', borderRadius: 28, padding: '44px 36px',
              border: '3px solid #10b981', textAlign: 'left', position: 'relative',
              boxShadow: '0 0 0 1px #059669, 0 24px 60px rgba(5,150,105,0.45)',
              transform: 'scale(1.05)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 0 1px #34d399, 0 30px 80px rgba(5,150,105,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 0 1px #059669, 0 24px 60px rgba(5,150,105,0.45)'; }}
            >
              <div style={{
                position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
                padding: '7px 22px', borderRadius: 100, fontSize: 12, fontWeight: 800, letterSpacing: 0.5,
                boxShadow: '0 4px 12px rgba(245,158,11,0.4)', whiteSpace: 'nowrap'
              }}>⚡ MAIS POPULAR — MELHOR CUSTO-BENEFÍCIO</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#fff' }}>Crescimento</h3>
              <p style={{ fontSize: 13, color: '#6ee7b7', marginBottom: 20 }}>Para quem está crescendo e quer resultado rápido</p>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: '#34d399' }}>R$ 19,90</span>
                <span style={{ fontSize: 14, color: '#6ee7b7' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#6ee7b7', marginBottom: 8 }}>menos de R$ 0,67/dia</p>
              <div style={{ background: 'rgba(16,185,129,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 24, fontSize: 13, color: '#a7f3d0', fontWeight: 600 }}>
                🔥 ROI médio de 2.000%+ no 1º mês
              </div>
              <div style={{ flex: 1 }}>
                {['Até 20 cobranças simultâneas', 'WhatsApp + e-mail automático', 'Dashboard completo', 'Templates personalizáveis', 'Relatórios de recebimento', 'Múltiplas chaves Pix', 'Suporte e-mail + WhatsApp'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, color: '#d1fae5' }}>
                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: 16 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="/cadastro" style={{
                display: 'block', padding: '16px', borderRadius: 14, marginTop: 28,
                background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#064e3b', fontSize: 16, fontWeight: 800,
                textAlign: 'center', boxShadow: '0 4px 20px rgba(52,211,153,0.5)', transition: 'all 0.3s', textDecoration: 'none'
              }}>Assinar agora — Começar a recuperar →</a>
            </div>

            {/* Cobra Pro */}
            <div style={{ background: '#0f172a', borderRadius: 24, padding: 36, border: '2px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#fff', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Cobra Pro</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Para quem quer o máximo</p>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#34d399' }}>R$ 49,90</span>
                <span style={{ fontSize: 14, color: '#64748b' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>menos de R$ 1,67/dia</p>
              <div style={{ flex: 1 }}>
                {['Cobranças ilimitadas', 'WhatsApp + e-mail', 'Dashboard completo', 'Templates ilimitados', 'Relatórios avançados', 'API para integrações', 'Webhooks em tempo real', 'Suporte prioritário WhatsApp', 'Multi-usuários'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#e2e8f0' }}>
                    <span style={{ color: '#34d399' }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="/cadastro" style={{
                display: 'block', padding: '14px', borderRadius: 12, marginTop: 24,
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 15, fontWeight: 700,
                textAlign: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', transition: 'all 0.3s', textDecoration: 'none'
              }}>Assinar Cobra Pro →</a>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 40, textAlign: 'center' }}>Todos os planos: 0% sobre o valor recebido · Cancele quando quiser · Pix 100% na sua conta</p>
        </div>
      </section>

      {/* ===== FAQ WITH CATEGORIES ===== */}
      <section id="faq" style={{ padding: '70px 0', background: '#f8fafc' }}>
        <div style={{ maxWidth: 750, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Ainda em dúvida? <span style={{ color: '#059669' }}>A cobra responde.</span> 🐍</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32, fontSize: 16 }}>Tudo que você precisa saber para começar hoje</p>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            {faqCategories.map(cat => (
              <button key={cat} onClick={() => setFaqCategory(cat)} style={{
                padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                background: faqCategory === cat ? 'linear-gradient(135deg,#059669,#0d9488)' : '#fff',
                color: faqCategory === cat ? '#fff' : '#64748b', fontSize: 13, fontWeight: 600,
                boxShadow: faqCategory === cat ? '0 4px 12px rgba(5,150,105,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 0.2s'
              }}>
                {cat === 'all' ? '🐍 Todas' : cat === 'Conta' ? '👤 Conta' : cat === 'Produto' ? '📦 Produto' : cat === 'Cobranças' ? '💰 Cobranças' : cat === 'Pagamento' ? '💳 Pagamento' : cat === 'Segurança' ? '🔒 Segurança' : cat === 'Integração' ? '🔗 Integração' : cat}
              </button>
            ))}
          </div>

          {filteredFaqs.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} category={faq.cat} />
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #059669, #0d9488, #0891b2)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Floating mini snakes */}
        <div style={{ position: 'absolute', top: 20, left: '10%', opacity: 0.2, animation: 'float 4s ease-in-out infinite' }}><MiniSnake size={50} /></div>
        <div style={{ position: 'absolute', bottom: 30, right: '15%', opacity: 0.15, animation: 'float 5s ease-in-out infinite 1s' }}><MiniSnake size={60} /></div>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
            Enquanto você dorme,<br />a cobra cobra.
          </h2>
          <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.9)', marginBottom: 16 }}>
            Em menos de 2 minutos sua primeira cobrança gentil está rodando.
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 40 }}>
            Você fica o bonzinho. A cobra faz o serviço sujo.
          </p>
          <a href="/cadastro" style={{
            display: 'inline-block', padding: '20px 56px', borderRadius: 16,
            background: '#fff', color: '#059669', fontSize: 19, fontWeight: 800,
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)', transition: 'all 0.3s', textDecoration: 'none'
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-3px) scale(1.03)'; e.target.style.boxShadow = '0 14px 40px rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
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
      <footer style={{ padding: '60px 0 30px', background: '#0f172a', color: '#94a3b8' }}>
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
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} style={{ display: 'block', fontSize: 14, marginBottom: 10, color: '#94a3b8', transition: 'color 0.2s', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Empresa</h4>
              {['Sobre nós', 'Blog', 'Contato'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 14, marginBottom: 10, color: '#94a3b8', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Legal</h4>
              {['Termos de uso', 'Privacidade'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 14, marginBottom: 10, color: '#94a3b8', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, textAlign: 'center', fontSize: 13 }}>
            © 2026 Cobbra. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* ===== FLOATING URGENCY BAR — dados dinâmicos reais ===== */}
      {urgencyVisible && urgencyTime && (
        <div className="urgency-bar" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
          background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          borderTop: '1px solid rgba(5,150,105,0.3)', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 14, color: '#e2e8f0' }}>
              🐍 Última cobrança enviada <strong style={{ color: '#34d399' }}>{urgencyTime}</strong> em <strong style={{ color: '#34d399' }}>{urgencyCity}</strong>
            </span>
          </div>
          <a href="/cadastro" style={{
            padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #059669, #0d9488)',
            color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none'
          }}>Começar agora</a>
          <button onClick={() => setUrgencyVisible(false)} style={{
            color: '#64748b', fontSize: 20, cursor: 'pointer', background: 'none', border: 'none', padding: '0 4px'
          }}>×</button>
        </div>
      )}

      {/* Floating Mascot chatbot */}
      <Chatbot />
    </div>
  );
}
