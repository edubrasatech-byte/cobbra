'use client';
import { useState, useEffect } from 'react';
import Chatbot from '../components/Chatbot';

// ========== MINI SNAKE (for branding) ==========
function MiniSnake({ size = 40, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
      <g transform="translate(1.5, 1.5)">
        <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke="url(#miniGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="8" r="5" fill="url(#miniGrad)" />
        <circle cx="23" cy="7" r="1.2" fill="white" />
        <circle cx="26" cy="7" r="1.2" fill="white" />
        <circle cx="23.2" cy="7.3" r="0.7" fill="#070913" />
        <circle cx="26.2" cy="7.3" r="0.7" fill="#070913" />
      </g>
      <defs>
        <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ========== SHARED FINTECH FOOTER ==========
function SharedFintechFooter() {
  return (
    <footer style={{ padding: '80px 0 40px', background: '#070913', color: '#94a3b8', borderTop: '1px solid rgba(16,185,129,0.15)', textAlign: 'left' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Main Footer Links Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 60 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <MiniSnake size={36} />
              <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5, fontFamily: 'sans-serif' }}>Cobbra</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginTop: -6, fontFamily: 'sans-serif' }}>.ai</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#cbd5e1', marginBottom: 20 }}>
              Combinamos automação inteligente de cobranças, inteligência artificial avançada e educação financeira de ponta para erradicar a inadimplência e fortalecer o ecossistema de profissionais independentes e microempresas no Brasil.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#64748b' }}>
              <strong>Cobbra Tecnologia e Serviços Financeiros Ltda.</strong>
              <span>CNPJ: 45.892.123/0001-89</span>
              <span>Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100</span>
            </div>
          </div>
          
          <div>
            <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Produto</h4>
            {[
              { name: 'Cobrança Automática', link: '/produto/cobranca-automatica' },
              { name: 'Catarina IA Robot', link: '/produto/catarina-ia' },
              { name: 'Gestão de Locações', link: '/produto/locacoes' },
              { name: 'Gestão de Empréstimos', link: '/produto/emprestimos' },
              { name: 'Pix Direto 0% Taxas', link: '/produto/pix' },
              { name: 'APIs & Integrações', link: '/produto/api' }
            ].map(item => (
              <a key={item.name} href={item.link} style={{ display: 'block', fontSize: 13, marginBottom: 12, color: '#94a3b8', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >{item.name}</a>
            ))}
          </div>

          <div>
            <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Educação</h4>
            {[
              { name: 'Blog do Cobbra', link: '/educacao/blog' },
              { name: 'Guia Anti-Inadimplência', link: '/educacao/guia-anti-inadimplencia' },
              { name: 'Planilha de Caixa', link: '/educacao/planilha-caixa' },
              { name: 'Biblioteca de Templates', link: '/educacao/templates' },
              { name: 'Central de Suporte', link: '/#faq' }
            ].map(item => (
              <a key={item.name} href={item.link} style={{ display: 'block', fontSize: 13, marginBottom: 12, color: '#94a3b8', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >{item.name}</a>
            ))}
          </div>

          <div>
            <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Institucional</h4>
            {[
              { name: 'Sobre a Cobbra', link: '/institucional/sobre' },
              { name: 'Segurança da Informação', link: '/institucional/seguranca' },
              { name: 'Termos de Serviço', link: '/legal/termos' },
              { name: 'Política de Privacidade', link: '/legal/privacidade' },
              { name: 'LGPD Compliance', link: '/legal/lgpd' }
            ].map(item => (
              <a key={item.name} href={item.link} style={{ display: 'block', fontSize: 13, marginBottom: 12, color: '#94a3b8', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >{item.name}</a>
            ))}
          </div>

          <div>
            <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contato & Ouvidoria</h4>
            {[
              { name: 'contato@cobbra.ai', link: 'mailto:contato@cobbra.ai' },
              { name: 'Suporte via WhatsApp', link: '#' },
              { name: 'Ouvidoria Fintech', link: '/institucional/ouvidoria' },
              { name: 'Parcerias Comerciais', link: '/institucional/parcerias' },
              { name: 'Assessoria de Imprensa', link: '/institucional/imprensa' }
            ].map(item => (
              <a key={item.name} href={item.link} style={{ display: 'block', fontSize: 13, marginBottom: 12, color: '#94a3b8', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >{item.name}</a>
            ))}
          </div>
        </div>

        {/* Compliance Info Banner */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '24px 0',
          marginBottom: 30,
          fontSize: 11.5,
          lineHeight: 1.8,
          color: '#64748b',
          textAlign: 'justify'
        }}>
          <strong>DISCLAIMER REGULATÓRIO / CONFORMIDADE FINTECH:</strong> O Cobbra é um software de automação de cobranças, gestão de aluguéis, controle de empréstimos mútuos e facilitação de recebimentos operado pela Cobbra Tecnologia Ltda. Não somos uma instituição financeira, tampouco realizamos captação de recursos ou concessão de crédito direto de maneira regulada. Nossos serviços financeiros e soluções Pix e Boleto são providos de forma integrada em parceria com instituições de pagamento e parceiros autorizados pelo Banco Central do Brasil (BACEN) para atuar como correspondentes bancários. O Cobbra preza pela total transparência de taxas: 0% de tarifas administrativas sobre seus Pix recebidos, cobrando apenas uma assinatura SaaS fixa e previsível. Nossas conexões com a API de disparo de WhatsApp cumprem com todas as diretrizes de proteção de dados, segurança da informação e a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </div>

        {/* Bottom Bar: Trust badges, Copyright and Flag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.18)', fontWeight: 700 }}>
              <span>🛡️</span> SSL SECURE CONNECTION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#34d399', background: 'rgba(52,211,153,0.08)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(52,211,153,0.18)', fontWeight: 700 }}>
              <span>🏦</span> BACEN COMPLIANT PLATFORM
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#60a5fa', background: 'rgba(96,165,250,0.08)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.18)', fontWeight: 700 }}>
              <span>🔒</span> 100% LGPD PROTECTED
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748b' }}>
            <span>© 2026 Cobbra.ai. Feito com 💚 no Brasil</span>
            <span style={{ fontSize: 14 }}>🇧🇷</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
}

// ========== MAIN WRAPPER COMPONENT ==========
export default function InfoPageWrapper({ title, category, children }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerBg = scrollY > 50 ? 'rgba(12, 14, 26, 0.9)' : 'transparent';
  const headerShadow = scrollY > 50 ? '0 4px 30px rgba(0,0,0,0.3)' : 'none';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#fff', background: '#070913', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: headerBg, boxShadow: headerShadow,
        transition: 'all 0.3s ease', borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo with Snake */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <MiniSnake size={38} />
            <span style={{ fontSize: 30, fontWeight: 900, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -1, fontFamily: 'sans-serif' }}>
              Cobbra
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginTop: -8, marginLeft: -2, fontFamily: 'sans-serif' }}>.ai</span>
          </a>

          {/* Quick Nav */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="/" style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#10b981'} onMouseLeave={e => e.target.style.color = '#94a3b8'}
            >Voltar ao Início</a>
            <a href="/login" style={{
              fontSize: 14, fontWeight: 600, color: '#10b981', padding: '8px 20px', borderRadius: 8,
              border: '2px solid #10b981', transition: 'all 0.2s', textDecoration: 'none', background: 'transparent'
            }}
              onMouseEnter={e => { e.target.style.background = '#10b981'; e.target.style.color = '#070913'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#10b981'; }}
            >Entrar</a>
            <a href="/cadastro" style={{
              fontSize: 13, fontWeight: 600, color: '#070913', padding: '8px 18px', borderRadius: 8,
              background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              transition: 'all 0.2s', textDecoration: 'none'
            }}
              onMouseEnter={e => e.target.style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)'}
              onMouseLeave={e => e.target.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)'}
            >Começar grátis</a>
          </div>

        </div>
      </header>

      {/* PAGE HERO HEADER */}
      <section style={{ padding: '140px 0 60px', background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 80%)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          {category && (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 1 }}>
              {category}
            </span>
          )}
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginTop: 16, marginBottom: 8, letterSpacing: -1, fontFamily: 'sans-serif' }}>
            {title}
          </h1>
          <div style={{ width: 60, height: 4, background: '#10b981', margin: '20px auto 0', borderRadius: 2 }} />
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '60px 0 100px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', fontSize: 15, lineHeight: 1.8, color: '#cbd5e1', textAlign: 'justify' }}>
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <SharedFintechFooter />

      {/* FLOATING CHATBOT */}
      <Chatbot />

    </div>
  );
}
