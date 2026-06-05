'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [magicValue, setMagicValue] = useState('');
  const [magicSuccess, setMagicSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLinkSubmit(e) {
    e.preventDefault();
    setError('');
    setMagicSuccess('');
    setLoading(true);
    try {
      const isEmail = magicValue.includes('@');
      const payload = isEmail ? { email: magicValue } : { phone: magicValue };
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMagicSuccess('Link de acesso enviado com sucesso! Verifique seu e-mail ou o seu WhatsApp.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleMode = () => {
    setIsMagicLink(!isMagicLink);
    setError('');
    setMagicSuccess('');
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    fontSize: 13.5,
    color: '#f8fafc',
    transition: 'all 0.3s ease',
    background: 'rgba(15, 23, 42, 0.6)',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      fontFamily: "'Inter', sans-serif",
      background: '#090d16',
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* Global Neon Glow Effects (CSS styled) */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes pulse-emerald {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.15), inset 0 0 5px rgba(16, 185, 129, 0.1); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.35), inset 0 0 10px rgba(16, 185, 129, 0.2); }
        }
        @keyframes border-glow {
          0%, 100% { border-color: rgba(16, 185, 129, 0.2); }
          50% { border-color: rgba(20, 184, 166, 0.5); }
        }
        .input-glow:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.25), inset 0 0 4px rgba(16, 185, 129, 0.15);
        }
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45);
          filter: brightness(1.1);
        }
        .btn-hover:active {
          transform: translateY(0px);
        }
      `}</style>

      {/* Decorative Blur Background Blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* Left - Branding & Cobbra Live Mobile Mockup */}
      <div style={{
        flex: 1.1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 32px',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'radial-gradient(circle at 40% 50%, rgba(10, 25, 41, 0.7) 0%, rgba(9, 13, 22, 0.95) 100%)',
        position: 'relative'
      }} className="desktop-branding-section">
        
        {/* Visual elements container */}
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          
          {/* Platform Title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.06)', padding: '6px 12px', borderRadius: 30, border: '1px solid rgba(16, 185, 129, 0.15)', marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>🐍</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '1px', textTransform: 'uppercase' }}>COBBRA AUTOMATION V3.8</span>
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', margin: '0 0 8px 0' }}>Cobbra</h1>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, maxWidth: 350, margin: '0 auto' }}>
              Cobranças gentis, automações por WhatsApp e E-mail com Pix direto na sua conta.
            </p>
          </div>

          {/* Interactive CSS Smartphone Simulator (Cobbra Mobile Preview - Scaled Down Slightly) */}
          <div style={{
            width: 260,
            height: 500,
            borderRadius: 32,
            border: '7px solid #2d3748',
            background: '#090d16',
            boxShadow: '0 20px 50px -15px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.03)',
            position: 'relative',
            padding: '12px 11px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'float-slow 6s ease-in-out infinite'
          }}>
            {/* Phone Top Notch */}
            <div style={{
              width: 80,
              height: 16,
              background: '#2d3748',
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10
            }} />

            {/* Phone Mini Status Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#64748b', fontWeight: 600, padding: '0 4px', marginTop: 2 }}>
              <span>17:58</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>

            {/* 1. Simulated Catarina AI Active Pill */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '4px 8px',
              borderRadius: 20,
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              alignSelf: 'center',
              animation: 'pulse-emerald 3s infinite'
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
              Catarina AI Engine • Online
            </div>

            {/* 2. Simulated WhatsApp Push Notification Banner */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span>💬</span> Cobbra WhatsApp
                </span>
                <span style={{ fontSize: 8, color: '#64748b' }}>Agora</span>
              </div>
              <p style={{ margin: 0, fontSize: 9, color: '#f1f5f9', lineHeight: 1.35, fontWeight: 500 }}>
                <strong>Mariana Alves</strong>, lembrete gentil: sua mensalidade de Pilates vence amanhã. Pix no link! 🙏
              </p>
            </div>

            {/* 3. Simulated Mobile Emerald Pix Card */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
              borderRadius: 12,
              padding: '10px 10px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '0 10px 25px rgba(5, 150, 105, 0.25)'
            }}>
              <div>
                <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.5px' }}>Total com Juros diários</span>
                <h4 style={{ margin: '1px 0 0 0', fontSize: 16, fontWeight: 800 }}>R$ 603,00</h4>
                <span style={{ fontSize: 7, opacity: 0.7, fontStyle: 'italic' }}>*R$ 600,00 original + 1 dia de atraso (0.5%)</span>
              </div>

              {/* QR Code Container */}
              <div style={{ 
                background: '#ffffff', 
                borderRadius: 6, 
                padding: 4, 
                width: 76, 
                height: 76, 
                alignSelf: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Simulated CSS Pixelated QR Code Grid */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  opacity: 0.85,
                  background: 'repeating-linear-gradient(45deg, #0f172a, #0f172a 3px, #ffffff 3px, #ffffff 6px)',
                  borderRadius: 3
                }} />
                {/* Central Snake Icon */}
                <div style={{ position: 'absolute', background: '#ffffff', borderRadius: '50%', padding: 1.5, fontSize: 9 }}>🐍</div>
              </div>

              {/* Pix Copia e Cola Simulated Box */}
              <div style={{
                fontFamily: 'monospace',
                fontSize: 7.5,
                background: 'rgba(255,255,255,0.08)',
                border: '1px dashed rgba(255,255,255,0.2)',
                borderRadius: 4,
                padding: '4px 6px',
                wordBreak: 'break-all',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                00020126360014br.gov.bcb.pix...603.00
              </div>
            </div>

            {/* Zero Intermediary Fee Indicator */}
            <div style={{ 
              marginTop: 'auto', 
              textAlign: 'center', 
              paddingBottom: 4, 
              borderTop: '1px solid rgba(255,255,255,0.05)', 
              paddingTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <span style={{ fontSize: 9, color: '#f1f5f9', fontWeight: 700 }}>Taxa Zero de Intermediação</span>
              <span style={{ fontSize: 8, color: '#64748b' }}>O dinheiro cai direto na sua chave Pix registrada.</span>
            </div>

          </div>

          {/* Simple Bottom Stats */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            {[
              { value: '94%', label: 'Pagam em dia' },
              { value: 'R$ 0', label: 'Taxa sobre Pix' },
              { value: '3.500+', label: 'Autônomos' }
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: '0 0 2px 0' }}>{stat.value}</p>
                <p style={{ fontSize: 10.5, color: '#64748b', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Right - Glassmorphic Fintech Login Form */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '50px 32px',
        background: '#090d16',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          
          {/* Unified Branding Header (Visible on Desktop and Mobile) */}
          <div className="form-branding-header" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 20,
            animation: 'float-slow 6s ease-in-out infinite'
          }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
              marginBottom: 10
            }}>
              <span style={{ fontSize: 22 }}>🐍</span>
            </div>
            <h1 style={{ 
              fontSize: 30, 
              fontWeight: 900, 
              color: '#ffffff', 
              letterSpacing: '-1px', 
              margin: 0,
              background: 'linear-gradient(to right, #ffffff, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Cobbra</h1>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 5, 
              background: 'rgba(16, 185, 129, 0.06)', 
              padding: '4px 10px', 
              borderRadius: 20, 
              border: '1px solid rgba(16, 185, 129, 0.15)', 
              marginTop: 6 
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 4px #34d399' }} />
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#34d399', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Automação Financeira</span>
            </div>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 25, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: 8 }}>Entrar na sua conta</h2>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Acesse seu painel e continue recebendo em dia com a Catarina AI.</p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: 10, 
              padding: '10px 14px', 
              marginBottom: 20, 
              color: '#fca5a5', 
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.4
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {magicSuccess && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              borderRadius: 10, 
              padding: '10px 14px', 
              marginBottom: 20, 
              color: '#34d399', 
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.4
            }}>
              <span>✅</span>
              <span>{magicSuccess}</span>
            </div>
          )}

          {!isMagicLink ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 8, color: '#cbd5e1' }}>E-mail corporativo</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="nome@empresa.com"
                  style={inputStyle} 
                  required
                  className="input-glow"
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', margin: 0 }}>Senha de acesso</label>
                  <a href="#forgot" style={{ fontSize: 12, color: '#34d399', textDecoration: 'none', fontWeight: 600 }}>Esqueceu?</a>
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  style={inputStyle} 
                  required
                  className="input-glow"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                style={{
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: 10, 
                  border: 'none', 
                  cursor: loading ? 'default' : 'pointer',
                  background: loading ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff', 
                  fontSize: 13.5, 
                  fontWeight: 700, 
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.25)',
                  marginTop: 8,
                  fontFamily: 'Inter, sans-serif'
                }}
                className="btn-hover"
              >
                {loading ? 'Validando credenciais...' : 'Entrar com Segurança'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 8, color: '#cbd5e1' }}>E-mail ou WhatsApp cadastrado</label>
                <input 
                  type="text" 
                  value={magicValue} 
                  onChange={e => setMagicValue(e.target.value)} 
                  placeholder="nome@empresa.com ou (11) 99999-9999"
                  style={inputStyle} 
                  required
                  className="input-glow"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                style={{
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: 10, 
                  border: 'none', 
                  cursor: loading ? 'default' : 'pointer',
                  background: loading ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff', 
                  fontSize: 13.5, 
                  fontWeight: 700, 
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.25)',
                  marginTop: 8,
                  fontFamily: 'Inter, sans-serif'
                }}
                className="btn-hover"
              >
                {loading ? 'Enviando link...' : 'Enviar Link de Acesso'}
              </button>
            </form>
          )}

          {/* Form Footer */}
          <div style={{ textAlign: 'center', marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px 0' }}>
              <button 
                onClick={toggleMode}
                type="button"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#34d399', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  textDecoration: 'underline',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {!isMagicLink ? 'Entrar sem Senha (Link de Acesso)' : 'Voltar para Login tradicional'}
              </button>
            </p>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Novo na plataforma? <a href="/cadastro" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>Cadastre-se grátis</a>
            </p>
          </div>

        </div>
      </div>

      {/* Responsive Breakpoints CSS */}
      <style jsx>{`
        @media (max-width: 900px) {
          .desktop-branding-section {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
