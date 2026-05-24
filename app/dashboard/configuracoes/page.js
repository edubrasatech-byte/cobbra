'use client';
import { useState, useEffect } from 'react';

export default function ConfiguracoesPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ business_name: '', pix_key: '', pix_key_type: 'email', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Score rates states
  const [scoreRates, setScoreRates] = useState({ excellent: 0.1, regular: 0.3, risk: 0.5 });
  const [scoreThresholds, setScoreThresholds] = useState({ good: 20, regular: 40 });

  // Password change states
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Integration modal states
  const [showIntModal, setShowIntModal] = useState(false);
  const [selectedInt, setSelectedInt] = useState(null);
  const [intForm, setIntForm] = useState({
    whatsappUrl: 'https://api.z-api.io/instances/347281',
    whatsappToken: '6A8B9CD0E1F234567890',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'financeiro@seuemail.com.br',
    smtpPass: '••••••••••••',
    smtpSender: 'Cobranças Cobbra'
  });
  const [intLoading, setIntLoading] = useState(false);

  // WhatsApp Option A connection states
  const [waMethod, setWaMethod] = useState('simplified');
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappQrCode, setWhatsappQrCode] = useState('');
  const [waSimPhone, setWaSimPhone] = useState('');

  useEffect(() => {
    // Fetch active WhatsApp connection status
    fetch('/api/whatsapp/connect')
      .then(r => r.json())
      .then(data => {
        if (data.status) {
          setWhatsappStatus(data.status);
          setWhatsappPhone(data.phone || '');
        }
      })
      .catch(() => {});

    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) { 
        setUser(d.user); 
        setForm({ 
          business_name: d.user.business_name || '', 
          pix_key: d.user.pix_key || '', 
          pix_key_type: d.user.pix_key_type || 'email', 
          phone: d.user.phone || '' 
        }); 
        setScoreThresholds({
          good: Math.round((d.user.score_limit_good ?? 0.2) * 100),
          regular: Math.round((d.user.score_limit_regular ?? 0.4) * 100)
        });
      }
    });

    fetch('/api/cobranca-diaria')
      .then(r => r.json())
      .then(d => {
        if (d.config) {
          setScoreRates({
            excellent: d.config.interest_rate_excellent ?? 0.1,
            regular: d.config.interest_rate_regular ?? 0.3,
            risk: d.config.interest_rate_risk ?? 0.5
          });
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Polling WhatsApp status when scanning or connecting
  useEffect(() => {
    let interval;
    if (whatsappStatus === 'connecting' || whatsappStatus === 'scanning') {
      interval = setInterval(() => {
        fetch('/api/whatsapp/connect')
          .then(r => r.json())
          .then(data => {
            if (data.status === 'connected') {
              setWhatsappStatus('connected');
              setWhatsappPhone(data.phone || '');
              clearInterval(interval);
              showMsg('WhatsApp conectado com sucesso! 📱');
            }
          })
          .catch(() => {});
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [whatsappStatus]);

  function showMsg(text) { setMsg(text); setTimeout(() => setMsg(''), 3000); }

  async function handleStartWaConnection() {
    setWhatsappStatus('connecting');
    try {
      const res = await fetch('/api/whatsapp/connect');
      const data = await res.json();
      if (data.qrCode) {
        setWhatsappQrCode(data.qrCode);
        setWhatsappStatus('scanning');
      } else if (data.status === 'connected') {
        setWhatsappStatus('connected');
        setWhatsappPhone(data.phone || '');
      }
    } catch (e) {
      setWhatsappStatus('disconnected');
      alert('Erro de conexão com o servidor Evolution.');
    }
  }

  async function handleSimulateScan() {
    const phone = waSimPhone || '(11) 99999-9999';
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus('connected');
        setWhatsappPhone(phone);
        showMsg('WhatsApp pareado com sucesso! 🎉');
      }
    } catch (e) {
      alert('Erro ao simular conexão.');
    }
  }

  async function handleDisconnectWa() {
    if (!confirm('Deseja realmente desparear seu WhatsApp do disparador central?')) return;
    try {
      const res = await fetch('/api/whatsapp/connect', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus('disconnected');
        setWhatsappPhone('');
        setWhatsappQrCode('');
        showMsg('WhatsApp desconectado! 🛑');
      }
    } catch (e) { 
      alert('Erro ao desconectar WhatsApp.');
    }
  }

  async function handleSaveScoreRates() {
    setMsg('Salvando configurações de score...');
    
    // 1. Save interest rates configuration
    const res1 = await fetch('/api/cobranca-diaria', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interest_rate_excellent: scoreRates.excellent,
        interest_rate_regular: scoreRates.regular,
        interest_rate_risk: scoreRates.risk
      })
    });

    // 2. Save score percentage thresholds configuration
    const res2 = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score_limit_good: scoreThresholds.good / 100,
        score_limit_regular: scoreThresholds.regular / 100
      })
    });

    if (res1.ok && res2.ok) {
      const data = await res2.json();
      if (data.user) {
        setUser(data.user);
      }
      showMsg('Configurações e taxas por score salvas! 📈');
    } else {
      alert('Erro ao salvar as configurações de score.');
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('Por favor, preencha todos os campos de senha.');
      return;
    }

    if (pwForm.newPw.length < 6) {
      setPwError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('A nova senha e a confirmação não coincidem.');
      return;
    }

    setPwLoading(true);
    // Simulate API request
    setTimeout(() => {
      setPwLoading(false);
      setPwSuccess('Senha alterada com sucesso! 🔒');
      setPwForm({ current: '', newPw: '', confirm: '' });
      showMsg('Senha atualizada!');
    }, 1500);
  }

  async function handleSaveIntegration(e) {
    e.preventDefault();
    setIntLoading(true);
    
    // Simulate validation and API save
    setTimeout(() => {
      setIntLoading(false);
      setShowIntModal(false);
      showMsg('Integração salva com sucesso! 🚀');
    }, 1200);
  }

  const handlePlanChange = async (newPlan) => {
    setMsg(`Alterando seu plano para ${newPlan.toUpperCase()}...`);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          showMsg(`Plano atualizado para ${newPlan.toUpperCase()}! 💎`);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao atualizar plano.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao alterar o plano.');
    }
  };

  const handleSaveProfile = async () => {
    setMsg('Salvando alterações do perfil...');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.business_name,
          phone: form.phone
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          showMsg('Perfil do negócio atualizado com sucesso! 👤');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao atualizar perfil.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar perfil.');
    }
  };

  const handleSavePix = async () => {
    setMsg('Salvando dados do Pix...');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pix_key: form.pix_key,
          pix_key_type: form.pix_key_type
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          showMsg('Dados do Pix salvos com sucesso! 💰');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar Pix.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar Pix.');
    }
  };


  const inputS = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'Inter,sans-serif' };
  const cardS = { background: '#1e293b', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 };
  const tabs = [
    { key: 'profile', label: '👤 Perfil' },
    { key: 'pix', label: '💰 Chave Pix' },
    { key: 'scores', label: '📈 Juros por Score' },
    { key: 'notifications', label: '🔔 Notificações' },
    { key: 'integrations', label: '🔗 Integrações' },
    { key: 'security', label: '🔒 Segurança' },
    { key: 'plan', label: '💎 Plano' },
  ];

  return (
    <div>
      {msg && <div style={{ position: 'fixed', top: 80, right: 32, background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1001, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', animation: 'fadeInUp 0.3s ease' }}>{msg}</div>}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-[220px] flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-2 lg:gap-1 scrollbar-none shrink-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap px-4 py-2.5 lg:px-4 lg:py-3 rounded-xl border-none cursor-pointer font-sans text-sm font-semibold transition-all shrink-0 w-auto lg:w-full text-center lg:text-left ${
                activeTab === t.key
                  ? 'bg-[rgba(5,150,105,0.15)] text-[#10b981]'
                  : 'bg-transparent text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 w-full min-w-0">
          {activeTab === 'profile' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Perfil do Negócio</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24 }}>
                  {user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{user?.name}</p>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</p>
                </div>
              </div>
              {[
                { label: 'Nome do negócio', key: 'business_name', ph: 'Ex: Studio de Personal' },
                { label: 'WhatsApp', key: 'phone', ph: '(11) 99999-9999' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} style={inputS} />
                </div>
              ))}
              <button onClick={handleSaveProfile} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Inter' }}>Salvar alterações</button>
            </div>
          )}

          {activeTab === 'pix' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Chave Pix</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>Configure sua chave Pix para receber pagamentos diretamente.</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Tipo de chave</label>
                <select value={form.pix_key_type} onChange={e => setForm({ ...form, pix_key_type: e.target.value })} style={{ ...inputS, appearance: 'auto', color: '#e2e8f0' }}>
                  <option style={{ color: '#0f172a' }} value="email">E-mail</option>
                  <option style={{ color: '#0f172a' }} value="phone">Telefone</option>
                  <option style={{ color: '#0f172a' }} value="cpf">CPF</option>
                  <option style={{ color: '#0f172a' }} value="cnpj">CNPJ</option>
                  <option style={{ color: '#0f172a' }} value="random">Chave aleatória</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Chave Pix</label>
                <input value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} placeholder="Sua chave Pix" style={inputS} />
              </div>
              <button onClick={handleSavePix} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Inter' }}>Salvar Pix</button>
            </div>
          )}

          {activeTab === 'scores' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Juros por Faixa de Score</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Defina as taxas padrão de juros diários pós-vencimento a serem aplicadas de acordo com o score pagador do cliente.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[rgba(16,185,129,0.08)] rounded-xl p-4 border border-[rgba(16,185,129,0.15)]">
                  <label className="block text-xs font-semibold text-[#10b981] mb-2">😊 Score Excelente (% ao dia)</label>
                  <input type="number" step="0.01" value={scoreRates.excellent} onChange={e => setScoreRates({ ...scoreRates, excellent: parseFloat(e.target.value) || 0 })} style={inputS} />
                </div>
                <div className="bg-[rgba(245,158,11,0.08)] rounded-xl p-4 border border-[rgba(245,158,11,0.15)]">
                  <label className="block text-xs font-semibold text-[#f59e0b] mb-2">⚠️ Score Regular (% ao dia)</label>
                  <input type="number" step="0.01" value={scoreRates.regular} onChange={e => setScoreRates({ ...scoreRates, regular: parseFloat(e.target.value) || 0 })} style={inputS} />
                </div>
                <div className="bg-[rgba(239,68,68,0.08)] rounded-xl p-4 border border-[rgba(239,68,68,0.15)]">
                  <label className="block text-xs font-semibold text-[#ef4444] mb-2">🚨 Score de Risco (% ao dia)</label>
                  <input type="number" step="0.01" value={scoreRates.risk} onChange={e => setScoreRates({ ...scoreRates, risk: parseFloat(e.target.value) || 0 })} style={inputS} />
                </div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Limites de Faixa de Score</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Defina o limite de inadimplência (proporção de cobranças vencidas sobre o faturado total) para classificar o score de risco do cliente.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[rgba(110,231,183,0.08)] rounded-xl p-4 border border-[rgba(110,231,183,0.15)]">
                  <label className="block text-xs font-semibold text-[#6ee7b7] mb-2">😊 Limite Máximo Score Bom (% de inadimplência)</label>
                  <input type="number" min="1" max="99" value={scoreThresholds.good} onChange={e => setScoreThresholds({ ...scoreThresholds, good: parseInt(e.target.value) || 0 })} style={inputS} />
                  <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>Clientes abaixo deste percentual de dívidas vencidas serão considerados <strong>Bons pagadores</strong>.</span>
                </div>
                <div className="bg-[rgba(245,158,11,0.08)] rounded-xl p-4 border border-[rgba(245,158,11,0.15)]">
                  <label className="block text-xs font-semibold text-[#f59e0b] mb-2">⚠️ Limite Máximo Score Regular (% de inadimplência)</label>
                  <input type="number" min="2" max="100" value={scoreThresholds.regular} onChange={e => setScoreThresholds({ ...scoreThresholds, regular: parseInt(e.target.value) || 0 })} style={inputS} />
                  <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>Clientes entre o limite Bom e este serão classificados como <strong>Regulares</strong>. Acima deste serão de <strong>Alto Risco</strong>.</span>
                </div>
              </div>
              
              <button onClick={handleSaveScoreRates} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Inter' }}>Salvar Configurações</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Notificações</h3>
              {[
                { label: 'Receber e-mail quando um pagamento for confirmado', checked: true },
                { label: 'Receber alerta quando uma cobrança vencer', checked: true },
                { label: 'Resumo semanal por e-mail', checked: false },
                { label: 'Notificação de novos cadastros (Admin)', checked: true },
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{n.label}</span>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: n.checked ? '#059669' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: n.checked ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              {/* Catarina AI card (visible to everyone) */}
              <div style={{ ...cardS, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🤖</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Catarina AI Engine & Copilot</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Integração Oficial Google Gemini 2.5 Flash 🐍</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 12, padding: 18, marginBottom: 20, lineHeight: 1.6 }}>
                  <p style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 10px 0', fontWeight: 600 }}>✨ Inteligência Artificial Integrada</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                    Sua conta conta com a assistente inteligente <strong>Catarina AI</strong> ativa por padrão. Ela automatiza e refina seu fluxo financeiro diariamente:
                  </p>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
                    <div>• <strong>Redação Inteligente:</strong> Escreve mensagens de cobrança personalizadas com base no humor selecionado (Gentil, Firme, Urgente, etc.).</div>
                    <div>• <strong>Comandos Copilot:</strong> Entende instruções de linguagem natural no topo do dashboard (ex: <em>"Cobre R$ 150 do Gustavo amanhã"</em>) para lançamentos rápidos.</div>
                    <div>• <strong>Insights Financeiros:</strong> Analisa seus dados de caixa e gera dicas de negócios automáticas na tela inicial.</div>
                  </div>
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Limites diários do seu plano:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12, border: user?.plan === 'starter' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px 0', fontWeight: 600 }}>STARTER</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: user?.plan === 'starter' ? '#10b981' : '#fff', margin: 0 }}>20 chamadas/dia</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12, border: user?.plan === 'crescimento' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px 0', fontWeight: 600 }}>CRESCIMENTO</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: user?.plan === 'crescimento' ? '#10b981' : '#fff', margin: 0 }}>50 chamadas/dia</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12, border: user?.plan === 'cobra_pro' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px 0', fontWeight: 600 }}>COBRA PRO</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: user?.plan === 'cobra_pro' ? '#10b981' : '#fff', margin: 0 }}>Ilimitadas</p>
                  </div>
                </div>
              </div>

              {/* Integrations locking cards */}
              <div style={cardS}>
                {user?.plan !== 'cobra_pro' && user?.plan !== 'trial' ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Integrações Personalizadas</h3>
                  <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
                    A conexão com seu próprio número comercial do WhatsApp (Z-API) e servidor de e-mail SMTP próprio está disponível exclusivamente para assinantes do plano **Cobra Pro**.
                  </p>
                  <button onClick={() => setActiveTab('plan')} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Inter' }}>
                    Ver Planos de Upgrade
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Integrações</h3>
                  <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>Conecte suas APIs favoritas para disparar lembretes e gerenciar fluxos.</p>
                  {[
                    { key: 'whatsapp', name: 'WhatsApp Business API (Z-API / Evolution)', desc: 'Envie lembretes via WhatsApp automaticamente', icon: '📱', status: 'config', color: '#25d366' },
                    { key: 'smtp', name: 'SMTP / E-mail Próprio', desc: 'Configure seu servidor de e-mail para disparos profissionais', icon: '✉️', status: 'config', color: '#3b82f6' },
                    { key: 'stripe', name: 'Stripe', desc: 'Aceite pagamentos internacionais com cartão de crédito', icon: '💳', status: 'soon', color: '#6366f1' },
                    { key: 'mercado_pago', name: 'Mercado Pago', desc: 'Integração para boletos automáticos e Pix integrado', icon: '🏦', status: 'soon', color: '#00b1ea' },
                  ].map((intg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${intg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{intg.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{intg.name}</p>
                          {intg.key === 'whatsapp' && whatsappStatus === 'connected' && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                              🟢 Ativo ({whatsappPhone})
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>{intg.desc}</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (intg.status === 'config') {
                            setSelectedInt(intg.key);
                            setShowIntModal(true);
                          }
                        }}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', cursor: intg.status === 'config' ? 'pointer' : 'default', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, background: intg.status === 'config' ? 'rgba(5,150,105,0.15)' : 'rgba(255,255,255,0.05)', color: intg.status === 'config' ? '#10b981' : '#64748b' }}
                      >
                        {intg.status === 'config' ? 'Configurar' : 'Em breve'}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          )}

          {activeTab === 'security' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Segurança</h3>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Alterar senha</h4>
              
              {pwError && (
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
                  ❌ {pwError}
                </div>
              )}

              {pwSuccess && (
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: 13, marginBottom: 16 }}>
                  ✅ {pwSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordChange}>
                {[
                  { label: 'Senha atual', key: 'current' },
                  { label: 'Nova senha', key: 'newPw' },
                  { label: 'Confirmar nova senha', key: 'confirm' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{f.label}</label>
                    <input 
                      type="password" 
                      value={pwForm[f.key]} 
                      onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })} 
                      style={inputS} 
                      disabled={pwLoading}
                    />
                  </div>
                ))}
                <button 
                  type="submit" 
                  style={{ 
                    padding: '12px 24px', borderRadius: 10, 
                    background: pwLoading ? '#3b4252' : 'linear-gradient(135deg,#059669,#0d9488)', 
                    color: '#fff', fontSize: 14, fontWeight: 700, 
                    cursor: pwLoading ? 'not-allowed' : 'pointer', border: 'none', 
                    fontFamily: 'Inter', marginTop: 8 
                  }}
                  disabled={pwLoading}
                >
                  {pwLoading ? 'Atualizando...' : 'Alterar senha'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'plan' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Seu Plano</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Escolha o plano ideal para a escala de cobranças do seu negócio.</p>
              
              {/* Active Plan Header */}
              <div style={{ background: 'rgba(5,150,105,0.08)', borderRadius: 16, padding: 20, border: '1px solid rgba(5,150,105,0.15)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#059669', color: '#fff', textTransform: 'uppercase' }}>
                    {user?.plan || 'starter'}
                  </span>
                  <h4 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 8 }}>
                    Plano Atual: {user?.plan === 'cobra_pro' ? 'Cobra Pro' : user?.plan === 'crescimento' ? 'Crescimento' : 'Starter'}
                  </h4>
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#10b981', margin: 0 }}>
                  {user?.plan === 'cobra_pro' ? 'R$ 49,90' : user?.plan === 'crescimento' ? 'R$ 19,90' : 'R$ 9,90'}
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>/mês</span>
                </p>
              </div>

              {/* Grid of 3 Plans */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Starter Plan */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: user?.plan === 'starter' ? '2px solid #059669' : '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h5 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Starter</h5>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', margin: '8px 0' }}>R$ 9,90<span style={{ fontSize: 11, color: '#64748b' }}>/mês</span></p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>Ideal para quem está começando o negócio.</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ Até 3 cobranças simultâneas</p>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ WhatsApp + E-mail</p>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ Chave Pix direto</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePlanChange('starter')}
                    disabled={user?.plan === 'starter'}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 8, marginTop: 20,
                      background: user?.plan === 'starter' ? 'rgba(5,150,105,0.1)' : 'rgba(255,255,255,0.05)',
                      color: user?.plan === 'starter' ? '#10b981' : '#fff', border: 'none', fontWeight: 600,
                      cursor: user?.plan === 'starter' ? 'default' : 'pointer', transition: 'all 0.2s', fontSize: 12
                    }}
                  >
                    {user?.plan === 'starter' ? 'Ativo' : 'Downgrade'}
                  </button>
                </div>

                {/* Crescimento Plan */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: user?.plan === 'crescimento' ? '2px solid #059669' : '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: -10, right: 16, fontSize: 10, background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>RECOMENDADO</span>
                  <div>
                    <h5 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Crescimento</h5>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', margin: '8px 0' }}>R$ 19,90<span style={{ fontSize: 11, color: '#64748b' }}>/mês</span></p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>Mais autonomia para o fluxo financeiro.</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ Até 20 cobranças simultâneas</p>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ WhatsApp + E-mail</p>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ Suporte priorizado</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePlanChange('crescimento')}
                    disabled={user?.plan === 'crescimento'}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 8, marginTop: 20,
                      background: user?.plan === 'crescimento' ? 'rgba(5,150,105,0.1)' : 'linear-gradient(135deg,#059669,#0d9488)',
                      color: user?.plan === 'crescimento' ? '#10b981' : '#fff', border: 'none', fontWeight: 600,
                      cursor: user?.plan === 'crescimento' ? 'default' : 'pointer', transition: 'all 0.2s', fontSize: 12
                    }}
                  >
                    {user?.plan === 'crescimento' ? 'Ativo' : user?.plan === 'cobra_pro' ? 'Downgrade' : 'Upgrade'}
                  </button>
                </div>

                {/* Cobra Pro Plan */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: user?.plan === 'cobra_pro' ? '2px solid #059669' : '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h5 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Cobra Pro</h5>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', margin: '8px 0' }}>R$ 49,90<span style={{ fontSize: 11, color: '#64748b' }}>/mês</span></p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>Escala ilimitada de cobranças.</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ Cobranças ILIMITADAS</p>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ WhatsApp + E-mail + Pix</p>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>✓ Suporte 24h & Relatórios</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePlanChange('cobra_pro')}
                    disabled={user?.plan === 'cobra_pro'}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 8, marginTop: 20,
                      background: user?.plan === 'cobra_pro' ? 'rgba(5,150,105,0.1)' : 'linear-gradient(135deg,#059669,#0d9488)',
                      color: user?.plan === 'cobra_pro' ? '#10b981' : '#fff', border: 'none', fontWeight: 600,
                      cursor: user?.plan === 'cobra_pro' ? 'default' : 'pointer', transition: 'all 0.2s', fontSize: 12
                    }}
                  >
                    {user?.plan === 'cobra_pro' ? 'Ativo' : 'Upgrade'}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Configuration Modal */}
      {showIntModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowIntModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 20, padding: 36, width: 500, border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              {selectedInt === 'whatsapp' ? 'Configurar WhatsApp API' : 'Configurar Servidor SMTP'}
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, lineHeight: 1.4 }}>
              {selectedInt === 'whatsapp' 
                ? 'Insira suas credenciais de integração para disparar mensagens diretamente pelo seu número comercial.' 
                : 'Configure suas credenciais SMTP para que os e-mails de cobrança saiam com o domínio da sua empresa.'}
            </p>

            <form onSubmit={handleSaveIntegration}>
              {selectedInt === 'whatsapp' ? (
                <>
                  {/* Method tabs Selector */}
                  <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, marginBottom: 24 }}>
                    <button type="button" onClick={() => setWaMethod('simplified')} style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
                      background: waMethod === 'simplified' ? '#059669' : 'transparent',
                      color: waMethod === 'simplified' ? '#fff' : '#94a3b8', transition: 'all 0.2s'
                    }}>
                      ⚡ Simplificado (Cobbra API)
                    </button>
                    <button type="button" onClick={() => setWaMethod('advanced')} style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
                      background: waMethod === 'advanced' ? '#059669' : 'transparent',
                      color: waMethod === 'advanced' ? '#fff' : '#94a3b8', transition: 'all 0.2s'
                    }}>
                      ⚙️ Avançado (Z-API / BYOK)
                    </button>
                  </div>

                  {waMethod === 'simplified' ? (
                    <div style={{ textAlign: 'center', padding: '10px 0 20px 0' }}>
                      {whatsappStatus === 'disconnected' && (
                        <div>
                          <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 20 }}>
                            Conecte o seu número de WhatsApp pessoal ou comercial no nosso disparador central da Cobbra. Rápido, seguro e incluso no seu plano!
                          </p>
                          <button
                            type="button"
                            onClick={handleStartWaConnection}
                            style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}
                          >
                            Gerar QR Code de Conexão 📱
                          </button>
                        </div>
                      )}

                      {whatsappStatus === 'connecting' && (
                        <div style={{ padding: '20px 0' }}>
                          <div style={{ border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid #10b981', borderRadius: '50%', width: 40, height: 40, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                          <p style={{ fontSize: 13, color: '#94a3b8' }}>Solicitando nova instância ao disparador central...</p>
                        </div>
                      )}

                      {whatsappStatus === 'scanning' && (
                        <div>
                          <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 16 }}>
                            Abra o WhatsApp no seu celular, acesse <strong>Aparelhos Conectados &gt; Conectar um Aparelho</strong> e escaneie o código abaixo:
                          </p>
                          
                          <div style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'inline-block', marginBottom: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                            <img src={whatsappQrCode} alt="WhatsApp QR Code" style={{ width: 180, height: 180, display: 'block' }} />
                          </div>

                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: 10, padding: 14, maxWidth: 360, margin: '0 auto' }}>
                            <p style={{ fontSize: 11, color: '#34d399', margin: '0 0 8px 0', fontWeight: 700 }}>🧪 SIMULADOR DE TESTE RÁPIDO:</p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <input 
                                type="text"
                                placeholder="Seu número Ex: (11) 99999-9999"
                                value={waSimPhone}
                                onChange={e => setWaSimPhone(e.target.value)}
                                style={{ ...inputS, width: 200, padding: '6px 10px', fontSize: 12, height: 32 }}
                              />
                              <button
                                type="button"
                                onClick={handleSimulateScan}
                                style={{ padding: '6px 12px', borderRadius: 8, background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter', height: 32 }}
                              >
                                Parear Celular ⚡
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {whatsappStatus === 'connected' && (
                        <div style={{ padding: '10px 0' }}>
                          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>🟢</div>
                          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>WhatsApp Conectado!</h4>
                          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
                            Aparelho ativo: <strong>{whatsappPhone}</strong>
                          </p>
                          <button
                            type="button"
                            onClick={handleDisconnectWa}
                            style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}
                          >
                            🔴 Desconectar Aparelho
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Instância API (Evolution API / Z-API URL) *</label>
                        <input 
                          type="url" 
                          value={intForm.whatsappUrl} 
                          onChange={e => setIntForm({ ...intForm, whatsappUrl: e.target.value })} 
                          placeholder="https://api.z-api.io/instances/..." 
                          style={inputS} 
                          required 
                        />
                      </div>
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Token / API Key *</label>
                        <input 
                          type="password" 
                          value={intForm.whatsappToken} 
                          onChange={e => setIntForm({ ...intForm, whatsappToken: e.target.value })} 
                          placeholder="Token da instância" 
                          style={inputS} 
                          required 
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Servidor Host SMTP *</label>
                      <input 
                        type="text" 
                        value={intForm.smtpHost} 
                        onChange={e => setIntForm({ ...intForm, smtpHost: e.target.value })} 
                        placeholder="smtp.exemplo.com" 
                        style={inputS} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Porta *</label>
                      <input 
                        type="text" 
                        value={intForm.smtpPort} 
                        onChange={e => setIntForm({ ...intForm, smtpPort: e.target.value })} 
                        placeholder="587" 
                        style={inputS} 
                        required 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Usuário SMTP *</label>
                      <input 
                        type="email" 
                        value={intForm.smtpUser} 
                        onChange={e => setIntForm({ ...intForm, smtpUser: e.target.value })} 
                        placeholder="usuario@dominio.com" 
                        style={inputS} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Senha SMTP *</label>
                      <input 
                        type="password" 
                        value={intForm.smtpPass} 
                        onChange={e => setIntForm({ ...intForm, smtpPass: e.target.value })} 
                        style={inputS} 
                        required 
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Nome de Exibição do Remetente</label>
                    <input 
                      type="text" 
                      value={intForm.smtpSender} 
                      onChange={e => setIntForm({ ...intForm, smtpSender: e.target.value })} 
                      placeholder="Ex: Financeiro da Minha Empresa" 
                      style={inputS} 
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowIntModal(false)} 
                  style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter' }}
                  disabled={intLoading} 
                >
                  {selectedInt === 'whatsapp' && waMethod === 'simplified' ? 'Fechar' : 'Cancelar'}
                </button>
                {!(selectedInt === 'whatsapp' && waMethod === 'simplified') && (
                  <button 
                    type="submit" 
                    style={{ 
                      padding: '12px 24px', borderRadius: 10, 
                      background: intLoading ? '#3b4252' : 'linear-gradient(135deg,#059669,#0d9488)', 
                      color: '#fff', fontSize: 14, fontWeight: 700, 
                      cursor: intLoading ? 'not-allowed' : 'pointer', border: 'none', 
                      fontFamily: 'Inter' 
                    }} 
                    disabled={intLoading} 
                  >
                    {intLoading ? 'Salvando...' : 'Salvar e Testar Conexão'}
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
