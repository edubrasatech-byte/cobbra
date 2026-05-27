'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [chosenPlan, setChosenPlan] = useState('cobra_pro'); // defaults to Cobra Pro

  // Load URL plan parameter safely on mount (client-side only to prevent Next.js hydration issues)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get('plan');
      // All paths map to cobra_pro for the unified plan overhaul
      setChosenPlan('cobra_pro');
    }
  }, []);

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // Calculate real-time password entropy / strength
  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, text: 'Digite sua senha', color: '#64748b' };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 1) return { score, text: 'Senha Fraca 🔴', color: '#ef4444' };
    if (score <= 3) return { score, text: 'Senha Média 🟡', color: '#f59e0b' };
    return { score, text: 'Senha Forte! 🟢', color: '#10b981' };
  };

  const pwStrength = getPasswordStrength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client-side security validations
    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Uso e Políticas de Privacidade.');
      return;
    }
    if (form.password.length < 8) {
      setError('Por segurança, a senha deve conter pelo menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula e um número.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          phone: form.phone, 
          password: form.password,
          plan: chosenPlan 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao efetuar o registro');
      
      // Push directly to the onboarding flow!
      router.push('/dashboard/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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

  const planNames = {
    starter: 'Plano Completo Ilimitado (3 dias grátis)',
    crescimento: 'Plano Completo Ilimitado (3 dias grátis)',
    cobra_pro: 'Plano Completo Ilimitado (3 dias grátis)'
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
      
      {/* Global CSS Inject */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes pulse-emerald {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.15), inset 0 0 5px rgba(16, 185, 129, 0.1); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.35), inset 0 0 10px rgba(16, 185, 129, 0.2); }
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

      {/* Background Neon Blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13, 148, 136, 0.07) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* Left Column - Branding (Hidden on Mobile) */}
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
        
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.06)', padding: '6px 12px', borderRadius: 30, border: '1px solid rgba(16, 185, 129, 0.15)', marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>🐍</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '1px', textTransform: 'uppercase' }}>Cobbra Onboarding V3.8</span>
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', margin: '0 0 8px 0' }}>Crie sua conta</h1>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, maxWidth: 350, margin: '0 auto' }}>
              Descubra o poder da automação de faturamento personalizada para o nicho da sua empresa.
            </p>
          </div>

          {/* Smartphone Simulator */}
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
            <div style={{ width: 80, height: 16, background: '#2d3748', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#64748b', fontWeight: 600, padding: '0 4px', marginTop: 2 }}>
              <span>18:00</span>
              <div><span>📶</span> <span>🔋</span></div>
            </div>

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
                <strong>Catarina AI:</strong> Olá! Configurando seu dashboard de Locações ou Empréstimo em tempo real... 🚗💰
              </p>
            </div>

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
                <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.5px' }}>Mensalidade</span>
                <h4 style={{ margin: '1px 0 0 0', fontSize: 16, fontWeight: 800 }}>R$ 49,90/mês</h4>
                <span style={{ fontSize: 7, opacity: 0.7, fontStyle: 'italic' }}>*Cobrado apenas após o período grátis</span>
              </div>

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
                <div style={{ width: '100%', height: '100%', opacity: 0.85, background: 'repeating-linear-gradient(45deg, #0f172a, #0f172a 3px, #ffffff 3px, #ffffff 6px)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', background: '#ffffff', borderRadius: '50%', padding: 1.5, fontSize: 9 }}>🐍</div>
              </div>
            </div>

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
              <span style={{ fontSize: 9, color: '#f1f5f9', fontWeight: 700 }}>3 Dias de Teste Grátis</span>
              <span style={{ fontSize: 8, color: '#64748b' }}>Acesso irrestrito a todos os nichos e recursos.</span>
            </div>

          </div>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            {[
              { value: '3 Dias', label: 'Período de Teste' },
              { value: 'R$ 0', label: 'Taxa Pix' },
              { value: '100%', label: 'Mobile-First' }
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: '0 0 2px 0' }}>{stat.value}</p>
                <p style={{ fontSize: 10.5, color: '#64748b', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Right Column - Register Form */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px 24px',
        background: '#090d16',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          
          {/* Unified Branding Header for Mobile and Small Viewports */}
          <div className="form-branding-header" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 20
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
              marginBottom: 8
            }}>
              <span style={{ fontSize: 20 }}>🐍</span>
            </div>
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 900, 
              color: '#ffffff', 
              letterSpacing: '-1px', 
              margin: 0,
              background: 'linear-gradient(to right, #ffffff, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Cobbra</h1>
            
            {/* Chosen Plan Pill */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 5, 
              background: 'rgba(16, 185, 129, 0.08)', 
              padding: '4px 12px', 
              borderRadius: 20, 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              marginTop: 8 
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 6px #34d399' }} />
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#34d399', letterSpacing: '0.5px' }}>
                {planNames[chosenPlan] || planNames.starter}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: 4 }}>Crie sua conta grátis</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Falta pouco para revolucionar seu faturamento.</p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: 10, 
              padding: '10px 14px', 
              marginBottom: 16, 
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>Nome completo</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => updateForm('name', e.target.value)} 
                placeholder="Seu nome"
                style={inputStyle} 
                required
                className="input-glow"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>E-mail corporativo</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => updateForm('email', e.target.value)} 
                placeholder="seu@negocio.com"
                style={inputStyle} 
                required
                className="input-glow"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>WhatsApp de contato</label>
              <input 
                type="tel" 
                value={form.phone} 
                onChange={e => updateForm('phone', e.target.value)} 
                placeholder="(11) 99999-9999"
                style={inputStyle} 
                required
                className="input-glow"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>Senha de acesso</label>
              <input 
                type="password" 
                value={form.password} 
                onChange={e => updateForm('password', e.target.value)} 
                placeholder="Mínimo 8 caracteres"
                style={inputStyle} 
                required
                className="input-glow"
              />
              
              {/* Real-time Password Strength Meter */}
              {form.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>Segurança da senha:</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: pwStrength.color }}>{pwStrength.text}</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(pwStrength.score / 4) * 100}%`, 
                      height: '100%', 
                      background: pwStrength.color, 
                      transition: 'all 0.3s ease' 
                    }} />
                  </div>
                  <span style={{ fontSize: 9.5, color: '#64748b', display: 'block', marginTop: 3 }}>
                    Use letras maiúsculas, números e símbolos (!@#$).
                  </span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>Confirmar senha</label>
              <input 
                type="password" 
                value={form.confirmPassword} 
                onChange={e => updateForm('confirmPassword', e.target.value)} 
                placeholder="Repita sua senha"
                style={inputStyle} 
                required
                className="input-glow"
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '4px 0 8px 0', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={acceptTerms} 
                onChange={e => setAcceptTerms(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#10b981', cursor: 'pointer' }} 
              />
              <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                Li e aceito os <a href="#terms" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>Termos de Uso</a> e a{' '}
                <a href="#privacy" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>Política de Privacidade</a>.
              </span>
            </label>

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
                fontFamily: 'Inter, sans-serif'
              }}
              className="btn-hover"
            >
              {loading ? 'Preparando Onboarding...' : 'Começar Meu Teste de 3 Dias'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Já possui uma conta? <a href="/login" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>Fazer Login</a>
            </p>
          </div>

        </div>
      </div>

      {/* Mobile-first Media Query Responsive system */}
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
