'use client';
import { useState } from 'react';

export default function OnboardingModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !phone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!email.includes('@')) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      // Register the user - this also sets the cobroo_token cookie on the browser
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          plan: 'starter'
        })
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.error || 'Erro ao realizar o cadastro. Tente outro e-mail.');
      }

      // Success callback
      if (onSuccess) {
        onSuccess(registerData.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Ocorreu um erro no cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-card {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />

      <div className="modal-card" style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 24,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header decoration */}
        <div style={{
          height: 6,
          background: 'linear-gradient(90deg, #10b981, #059669)'
        }} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: 20,
            cursor: 'pointer',
            padding: 4,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.backgroundColor = '#334155'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          ✕
        </button>

        <div style={{ padding: '36px 32px' }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>🐍</span>
            <span style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#f1f5f9',
              letterSpacing: '-0.5px'
            }}>
              Cobbra <span style={{ color: '#10b981', fontWeight: 500, fontSize: 13, marginLeft: 4, padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 20 }}>Onboarding</span>
            </span>
          </div>

          <h3 style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#f8fafc',
            marginBottom: 6,
            letterSpacing: '-0.5px'
          }}>
            Crie sua conta grátis
          </h3>
          <p style={{
            fontSize: 14,
            color: '#94a3b8',
            marginBottom: 24,
            lineHeight: 1.5
          }}>
            Crie seu cadastro rápido em segundos. Você configurará seu Pix e suas automações financeiras no passo seguinte.
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 20,
              lineHeight: 1.4
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Seu Nome Completo *</label>
              <input 
                type="text" 
                required
                placeholder="Ex: João da Silva" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>E-mail de Trabalho *</label>
              <input 
                type="email" 
                required
                placeholder="Ex: joao@seuemail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>WhatsApp com DDD *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="Ex: 11999998888" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Senha de Acesso *</label>
                <input 
                  type="password" 
                  required
                  placeholder="Mínimo 8 dígitos" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: 8,
                transition: 'transform 0.1s, opacity 0.2s',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
              }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseOut={(e) => { if (!loading) e.currentTarget.style.opacity = '1'; }}
              onClick={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? 'Cadastrando...' : 'Criar Conta e Configurar Painel ➜'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
