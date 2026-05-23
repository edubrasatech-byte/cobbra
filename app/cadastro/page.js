'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!acceptTerms) { setError('Aceite os termos de uso para continuar.'); return; }
    if (form.password !== form.confirmPassword) { setError('As senhas não coincidem.'); return; }
    if (form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password })
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

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 10, border: '2px solid #e2e8f0',
    fontSize: 15, transition: 'border-color 0.2s', background: '#f8fafc', outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Left - Branding */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #059669, #0d9488, #0891b2)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 60,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🐍</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 16 }}>Cobbra</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 400 }}>
            Comece grátis com o plano Starter. Sem cartão, sem compromisso.
          </p>
          <div style={{ marginTop: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, backdropFilter: 'blur(10px)' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: 12 }}>✨ O que você ganha:</p>
            {['Cobranças ilimitadas', 'WhatsApp + E-mail automático', 'Dashboard completo', 'Relatórios de recebimento', 'Suporte humano'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ color: '#a7f3d0' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>Crie sua conta grátis</h2>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 36 }}>Plano Starter gratuito · Sem cartão · Cancele quando quiser.</p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Nome completo</label>
              <input type="text" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Seu nome"
                style={inputStyle} required onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>E-mail</label>
              <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="seu@email.com"
                style={inputStyle} required onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>WhatsApp</label>
              <input type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="(11) 99999-9999"
                style={inputStyle} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Senha</label>
              <input type="password" value={form.password} onChange={e => updateForm('password', e.target.value)} placeholder="Mínimo 6 caracteres"
                style={inputStyle} required onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Confirmar senha</label>
              <input type="password" value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} placeholder="Repita a senha"
                style={inputStyle} required onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                style={{ marginTop: 3, accentColor: '#059669' }} />
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Li e aceito os <a href="#" style={{ color: '#059669', fontWeight: 600 }}>Termos de Uso</a> e a{' '}
                <a href="#" style={{ color: '#059669', fontWeight: 600 }}>Política de Privacidade</a>
              </span>
            </label>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #059669, #0d9488)',
              color: '#fff', fontSize: 16, fontWeight: 700, transition: 'all 0.3s',
              boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
            }}>
              {loading ? 'Criando conta...' : 'Criar minha conta grátis'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            Já tem conta? <a href="/login" style={{ color: '#059669', fontWeight: 600 }}>Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
