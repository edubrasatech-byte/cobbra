'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🐍</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 16 }}>Cobbra</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 400 }}>
            Seu funcionário financeiro mais barato do Brasil.
            Cobranças gentis, recebimentos em dia.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40 }}>
            {[
              { value: '94%', label: 'pagam em dia' },
              { value: '3.500+', label: 'autônomos' },
              { value: 'R$ 0', label: 'taxas sobre Pix' }
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>Entrar na sua conta</h2>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 36 }}>Acesse seu painel e continue recebendo em dia.</p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                style={inputStyle} required
                onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                style={inputStyle} required
                onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #059669, #0d9488)',
              color: '#fff', fontSize: 16, fontWeight: 700, transition: 'all 0.3s',
              boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
            }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              Não tem conta? <a href="/cadastro" style={{ color: '#059669', fontWeight: 600 }}>Cadastre-se grátis</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
