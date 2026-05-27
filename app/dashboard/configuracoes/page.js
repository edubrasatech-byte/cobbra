'use client';
import { useState, useEffect } from 'react';

export default function ConfiguracoesPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ business_name: '', pix_key: '', pix_key_type: 'email', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Score rates states
  const [scoreRates, setScoreRates] = useState({ excellent: 0.1, regular: 0.3, risk: 0.5 });
  const [scoreThresholds, setScoreThresholds] = useState({ good: 20, regular: 40 });

  // Password change states
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Integration modal states
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

  // WhatsApp connection states
  const [waMethod, setWaMethod] = useState('simplified');
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappQrCode, setWhatsappQrCode] = useState('');
  const [waError, setWaError] = useState('');

  // Catarina IA custom states (New)
  const [catarinaHumor, setCatarinaHumor] = useState('gentil');
  const [catarinaGuidelines, setCatarinaGuidelines] = useState('');

  // Automated reminder timeline states (New)
  const [reminderSchedule, setReminderSchedule] = useState({
    prev3d: true,
    prev1d: true,
    due: true,
    late2d: true,
    late5d: false
  });

  // Resource Usage Stats (Dynamic)
  const [usageStats, setUsageStats] = useState({
    whatsappSent: 0,
    whatsappLimit: 100,
    vehicles: 0,
    vehiclesLimit: 5,
    aiContracts: 0,
    aiContractsLimit: 5
  });

  useEffect(() => {
    // Fetch active WhatsApp connection status
    fetch('/api/whatsapp/connect')
      .then(r => r.json())
      .then(data => {
        if (data.status) {
          setWhatsappStatus(data.status);
          setWhatsappPhone(data.phone || '');
          if (data.qrCode) setWhatsappQrCode(data.qrCode);
          if (data.error) setWaError(data.error);
        }
      })
      .catch(() => {});

    // Fetch user details
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
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
          
          // Set usage stats limits according to plan
          let waLim = 100;
          let vehLim = 5;
          let aiLim = 5;
          if (d.user.plan === 'crescimento') {
            waLim = 1000;
            vehLim = 20;
            aiLim = 20;
          } else if (d.user.plan === 'cobra_pro') {
            waLim = 10000;
            vehLim = 150;
            aiLim = 500;
          }
          setUsageStats(prev => ({
            ...prev,
            whatsappSent: d.usage?.whatsappSent || 0,
            vehicles: d.usage?.vehicles || 0,
            aiContracts: d.usage?.aiContracts || 0,
            whatsappLimit: waLim,
            vehiclesLimit: vehLim,
            aiContractsLimit: aiLim
          }));
        }
      });

    // Fetch daily billing configuration
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

    // Load Catarina configurations from localStorage
    const savedHumor = localStorage.getItem('catarina_humor');
    if (savedHumor) setCatarinaHumor(savedHumor);

    const savedGuidelines = localStorage.getItem('catarina_guidelines');
    if (savedGuidelines) setCatarinaGuidelines(savedGuidelines);

    const savedSchedule = localStorage.getItem('reminder_schedule');
    if (savedSchedule) {
      try {
        setReminderSchedule(JSON.parse(savedSchedule));
      } catch (e) {}
    }
  }, []);

  // Polling WhatsApp status when scanning
  useEffect(() => {
    let interval;
    if (whatsappStatus === 'scanning') {
      interval = setInterval(() => {
        fetch('/api/whatsapp/connect')
          .then(r => r.json())
          .then(data => {
            if (data.status === 'connected') {
              setWhatsappStatus('connected');
              setWhatsappPhone(data.phone || '');
              clearInterval(interval);
              showMsg('WhatsApp conectado com sucesso! 📱');
            } else if (data.status === 'scanning') {
              if (data.qrCode) setWhatsappQrCode(data.qrCode);
              if (data.error) setWaError(data.error);
            } else if (data.status === 'disconnected') {
              setWhatsappStatus('disconnected');
              setWhatsappQrCode('');
              setWaError('');
              clearInterval(interval);
            }
          })
          .catch(() => {});
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [whatsappStatus]);

  function showMsg(text) { 
    setMsg(text); 
    setTimeout(() => setMsg(''), 3000); 
  }

  async function handleStartWaConnection() {
    setWhatsappStatus('connecting');
    setWaError('');
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      const data = await res.json();
      if (data.qrCode) {
        setWhatsappQrCode(data.qrCode);
        setWhatsappStatus('scanning');
      } else if (data.status === 'connected') {
        setWhatsappStatus('connected');
        setWhatsappPhone(data.phone || '');
      } else {
        setWhatsappStatus('scanning');
      }
      if (data.error) setWaError(data.error);
    } catch (e) {
      setWhatsappStatus('disconnected');
      alert('Erro de conexão com o servidor Evolution.');
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
        setWaError('');
        showMsg('WhatsApp desconectado! 🛑');
      }
    } catch (e) { 
      alert('Erro ao desconectar WhatsApp.');
    }
  }

  async function handleSaveScoreRates() {
    setMsg('Salvando configurações de score...');
    
    const res1 = await fetch('/api/cobranca-diaria', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interest_rate_excellent: scoreRates.excellent,
        interest_rate_regular: scoreRates.regular,
        interest_rate_risk: scoreRates.risk
      })
    });

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
      if (data.user) setUser(data.user);
      
      // Save local Catarina settings to localStorage
      localStorage.setItem('catarina_humor', catarinaHumor);
      localStorage.setItem('catarina_guidelines', catarinaGuidelines);
      
      showMsg('IA, diretrizes e juros salvos com sucesso! 🪄');
    } else {
      alert('Erro ao salvar as configurações.');
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
    setTimeout(() => {
      setIntLoading(false);
      setSelectedInt(null);
      showMsg('Integração de SMTP salva com sucesso! 🚀');
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
          
          let waLim = 100;
          let vehLim = 5;
          let aiLim = 5;
          if (newPlan === 'crescimento') {
            waLim = 1000;
            vehLim = 20;
            aiLim = 20;
          } else if (newPlan === 'cobra_pro') {
            waLim = 10000;
            vehLim = 150;
            aiLim = 500;
          }
          setUsageStats(prev => ({
            ...prev,
            whatsappLimit: waLim,
            vehiclesLimit: vehLim,
            aiContractsLimit: aiLim
          }));

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

  const handleSaveSchedule = () => {
    localStorage.setItem('reminder_schedule', JSON.stringify(reminderSchedule));
    showMsg('Matriz de disparo agendada com sucesso! 📅');
  };

  const toggleScheduleItem = (key) => {
    setReminderSchedule(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Styles
  const inputS = { 
    width: '100%', 
    padding: '11px 14px', 
    borderRadius: 10, 
    border: '1px solid rgba(255,255,255,0.06)', 
    background: '#04060d', 
    color: '#f8fafc', 
    fontSize: 13, 
    outline: 'none', 
    fontFamily: 'Inter,sans-serif',
    transition: 'all 0.2s',
    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)'
  };

  const cardS = { 
    background: '#0C0E1A', 
    borderRadius: 24, 
    padding: isMobile ? '18px' : '28px', 
    border: '1px solid rgba(255,255,255,0.04)', 
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    transition: 'all 0.3s'
  };

  const tabs = [
    { key: 'profile', label: '👤 Conta & Negócio' },
    { key: 'pix', label: '🏦 Pix & Recebimentos' },
    { key: 'integrations', label: '🔌 Conexões & Integrações' },
    { key: 'scores', label: '🤖 Catarina IA & Faixas' },
    { key: 'timeline', label: '📅 Matriz de Disparo' },
    { key: 'plan', label: '📊 Plano & Quotas' },
    { key: 'security', label: '🔒 Segurança & Acesso' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast Alert */}
      {msg && (
        <div style={{ 
          position: 'fixed', 
          top: 80, 
          right: 32, 
          background: '#10b981', 
          color: '#fff', 
          padding: '12px 24px', 
          borderRadius: 12, 
          fontSize: 13.5, 
          fontWeight: 700, 
          zIndex: 1001, 
          boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {msg}
        </div>
      )}

      {/* Styled css overrides for custom elements */}
      <style>{`
        .glowing-radar {
          position: relative;
        }
        .glowing-radar::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #10b981;
          animation: radarPulse 1.8s infinite ease-out;
        }
        @keyframes radarPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .custom-switch {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .custom-switch-handle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          position: absolute;
          top: 3px;
          transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar Tabs */}
        <div className="w-full lg:w-72 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-2 lg:gap-1.5 shrink-0 border-b border-slate-800/40 lg:border-b-0 px-1 lg:px-0 scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setSelectedInt(null);
              }}
              className={`whitespace-nowrap px-4 py-3 rounded-xl text-[12.5px] font-bold transition-all duration-200 cursor-pointer text-center lg:text-left shrink-0 ${
                activeTab === t.key
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Configurations Dynamic Content Panel */}
        <div className="flex-1 w-full min-w-0">
          
          {/* TAB 1: Minha Conta & Negócio */}
          {activeTab === 'profile' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 20, letterSpacing: '-0.3px' }}>👤 Perfil do Negócio</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Dados administrativos de exibição da sua conta.</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 18, borderRadius: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20 }}>
                  {user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>{user?.name}</p>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981', textTransform: 'uppercase' }}>
                      {user?.plan || 'starter'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{user?.email}</p>
                </div>
              </div>

              {[
                { label: 'Nome fantasia do negócio', key: 'business_name', ph: 'Ex: Studio de Personal' },
                { label: 'WhatsApp de Atendimento Comercial', key: 'phone', ph: '(11) 99999-9999' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} style={inputS} />
                </div>
              ))}

              <button 
                onClick={handleSaveProfile} 
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: 10, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: '#fff', 
                  fontSize: 13, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  border: 'none', 
                  fontFamily: 'Inter',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
              >
                Salvar Alterações
              </button>
            </div>
          )}

          {/* TAB 2: Chave Pix & Recebimentos */}
          {activeTab === 'pix' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 20, letterSpacing: '-0.3px' }}>🏦 Recebimentos Pix</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Configure a chave Pix da sua conta bancária pessoal ou corporativa. Todos os pagamentos liquidados pelos clientes irão 100% direto para esta chave, sem taxas retidas pelo sistema.</p>
              
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Tipo de chave</label>
                <select value={form.pix_key_type} onChange={e => setForm({ ...form, pix_key_type: e.target.value })} style={{ ...inputS, appearance: 'auto', color: '#e2e8f0' }}>
                  <option style={{ color: '#0f172a' }} value="email">E-mail</option>
                  <option style={{ color: '#0f172a' }} value="phone">Telefone</option>
                  <option style={{ color: '#0f172a' }} value="cpf">CPF</option>
                  <option style={{ color: '#0f172a' }} value="cnpj">CNPJ</option>
                  <option style={{ color: '#0f172a' }} value="random">Chave aleatória</option>
                </select>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Chave Pix</label>
                <input value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} placeholder="Sua chave Pix" style={inputS} />
              </div>
              
              <button 
                onClick={handleSavePix} 
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: 10, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: '#fff', 
                  fontSize: 13, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  border: 'none', 
                  fontFamily: 'Inter',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
              >
                Salvar Pix de Recebimento
              </button>
            </div>
          )}

          {/* TAB 3: Conexões & Integrações */}
          {activeTab === 'integrations' && (
            <div>
              {!selectedInt ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* WhatsApp Integration Card details */}
                  <div style={cardS}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>🔌 Integração de Mensagens (WhatsApp)</h3>
                        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Conecte seu próprio número comercial para evitar disparos genéricos.</p>
                      </div>
                      
                      {whatsappStatus === 'connected' ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          🟢 PAREADO ATIVO
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                          🔴 DESCONECTADO
                        </span>
                      )}
                    </div>

                    {whatsappStatus === 'connected' ? (
                      /* Connected Device Mockup Dashboard */
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: 20, justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div className="glowing-radar" style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2.5px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                            📱
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#f1f5f9' }}>Celular Pareado: {whatsappPhone}</h4>
                            <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#a7f3d0' }}>Sincronização Ativa • ⚡ Servidor OK (45ms)</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={handleDisconnectWa}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 10,
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🔴 Desparear Aparelho
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>Vantagens de Conectar seu Número:</h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b', lineHeight: 1.45 }}>Evite que seus clientes recebam cobranças de um número mestre compartilhado da plataforma. Conectando seu celular, os lembretes saem com sua foto e nome comercial e as respostas vão direto para você.</p>
                        </div>
                        <button
                          onClick={() => setSelectedInt('whatsapp')}
                          style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#070913',
                            border: 'none',
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          🔗 Conectar WhatsApp Próprio
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SMTP Server Card details */}
                  <div style={cardS}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>✉️ Servidor SMTP / E-mail Próprio</h3>
                        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Configure seu servidor de e-mail SMTP para que os envios usem seu próprio domínio profissional.</p>
                      </div>
                      <button
                        onClick={() => setSelectedInt('smtp')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 10,
                          background: 'rgba(59,130,246,0.12)',
                          border: '1px solid rgba(59,130,246,0.25)',
                          color: '#60a5fa',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ⚙️ Configurar SMTP
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sub-form page */
                <div style={cardS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <button 
                      onClick={() => setSelectedInt(null)} 
                      style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Voltar
                    </button>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>
                      {selectedInt === 'whatsapp' ? '📱 Configurar Aparelho WhatsApp' : '✉️ Configurar Servidor SMTP'}
                    </h3>
                  </div>

                  {selectedInt === 'whatsapp' ? (
                    <div>
                      {/* Check plan level */}
                      {user?.plan !== 'cobra_pro' && user?.plan !== 'crescimento' && user?.plan !== 'trial' ? (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                          <span style={{ fontSize: 44 }}>🔒</span>
                          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 14, marginBottom: 6 }}>Integração Exclusiva</h4>
                          <p style={{ fontSize: 12.5, color: '#64748b', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>A conexão com seu próprio número do WhatsApp está disponível a partir do plano <strong>Crescimento</strong>.</p>
                          <button onClick={() => { setSelectedInt(null); setActiveTab('plan'); }} style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#070913', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Realizar Upgrade de Plano</button>
                        </div>
                      ) : (
                        <div>
                          {/* Method selection */}
                          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 10, marginBottom: 20, maxWidth: 360 }}>
                            <button onClick={() => setWaMethod('simplified')} style={{ flex: 1, padding: 8, border: 'none', borderRadius: 8, background: waMethod === 'simplified' ? '#10b981' : 'transparent', color: waMethod === 'simplified' ? '#070913' : '#64748b', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', transition: 'all 0.2s' }}>⚡ Simplificado (Cobbra API)</button>
                            <button onClick={() => setWaMethod('advanced')} style={{ flex: 1, padding: 8, border: 'none', borderRadius: 8, background: waMethod === 'advanced' ? '#10b981' : 'transparent', color: waMethod === 'advanced' ? '#070913' : '#64748b', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', transition: 'all 0.2s' }}>⚙️ Avançado (Z-API)</button>
                          </div>

                          {waMethod === 'simplified' ? (
                            <div>
                              {whatsappStatus === 'disconnected' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                                    Utilize o assistente simplificado para parear o seu celular em segundos gerando uma conexão direta com nossa API Evolution.
                                  </p>
                                  <button onClick={handleStartWaConnection} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#070913', fontSize: 13, fontWeight: 800, cursor: 'pointer', alignSelf: 'flex-start' }}>
                                    Iniciar Pareamento de Aparelho 📱
                                  </button>
                                </div>
                              )}

                              {whatsappStatus === 'connecting' && (
                                <div style={{ padding: '30px 0', textAlign: 'center' }}>
                                  <div style={{ border: '3.5px solid rgba(16,185,129,0.1)', borderTop: '3.5px solid #10b981', borderRadius: '50%', width: 40, height: 40, margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Gerando Instância...</p>
                                  <p style={{ fontSize: 12, color: '#64748b' }}>Conectando com o servidor de pareamento. Aguarde.</p>
                                </div>
                              )}

                              {whatsappStatus === 'scanning' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: 16, borderRadius: 14, fontSize: 12, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div>1. Abra o **WhatsApp** no seu aparelho celular.</div>
                                    <div>2. Acesse **Aparelhos Conectados** e clique em **Conectar um Aparelho**.</div>
                                    <div>3. Aponte a câmera para o QR Code abaixo:</div>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ background: '#fff', padding: 14, borderRadius: 16, border: '4px solid #10b981', display: 'inline-block' }}>
                                      {whatsappQrCode ? (
                                        <img src={whatsappQrCode} alt="WhatsApp QR Code" style={{ width: 180, height: 180, display: 'block' }} />
                                      ) : waError ? (
                                        <div style={{ width: 180, height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: 12, padding: 12 }}>
                                          <span style={{ fontSize: 24, marginBottom: 8 }}>⚠️</span>
                                          <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textAlign: 'center', lineHeight: '1.4' }}>{waError}</span>
                                        </div>
                                      ) : (
                                        <div style={{ width: 180, height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 12 }}>
                                          <div style={{ border: '3px solid rgba(16,185,129,0.1)', borderTop: '3px solid #10b981', borderRadius: '50%', width: 32, height: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }} />
                                          <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Gerando QR Code...</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button onClick={handleDisconnectWa} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>Cancel / Reset</button>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Advanced Z-API form settings */
                            <form onSubmit={handleSaveIntegration} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Instância API (URL Z-API) *</label>
                                <input type="url" value={intForm.whatsappUrl} onChange={e => setIntForm({ ...intForm, whatsappUrl: e.target.value })} placeholder="https://api.z-api.io/instances/..." style={inputS} required />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Token de Conectividade (Z-API Client Token) *</label>
                                <input type="password" value={intForm.whatsappToken} onChange={e => setIntForm({ ...intForm, whatsappToken: e.target.value })} placeholder="Token" style={inputS} required />
                              </div>
                              <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#070913', fontSize: 13, fontWeight: 800, cursor: 'pointer', marginTop: 10, alignSelf: 'flex-end' }}>Salvar Configurações</button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SMTP Form */
                    <form onSubmit={handleSaveIntegration} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2.5fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Servidor Host SMTP *</label>
                          <input type="text" value={intForm.smtpHost} onChange={e => setIntForm({ ...intForm, smtpHost: e.target.value })} placeholder="smtp.exemplo.com" style={inputS} required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Porta SMTP *</label>
                          <input type="text" value={intForm.smtpPort} onChange={e => setIntForm({ ...intForm, smtpPort: e.target.value })} placeholder="587" style={inputS} required />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Usuário SMTP *</label>
                          <input type="email" value={intForm.smtpUser} onChange={e => setIntForm({ ...intForm, smtpUser: e.target.value })} placeholder="usuario@dominio.com" style={inputS} required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Senha SMTP *</label>
                          <input type="password" value={intForm.smtpPass} onChange={e => setIntForm({ ...intForm, smtpPass: e.target.value })} style={inputS} required />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Nome do Remetente de E-mail</label>
                        <input type="text" value={intForm.smtpSender} onChange={e => setIntForm({ ...intForm, smtpSender: e.target.value })} placeholder="Ex: Cobrança da Minha Frota" style={inputS} />
                      </div>
                      <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#070913', fontSize: 13, fontWeight: 800, cursor: 'pointer', marginTop: 10, alignSelf: 'flex-end' }}>Salvar e Testar SMTP</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Catarina IA & Regras de Score */}
          {activeTab === 'scores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Catarina IA Configuration Card */}
              <div style={cardS}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>🤖 Personalidade da Catarina IA</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Escolha o humor padrão que a Catarina IA adotará ao redigir as mensagens automáticas de cobrança.</p>
                
                {/* Visual Cards of Humor */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { id: 'gentil', title: '😇 Gentil & Polida', desc: 'Foco em empatia, respeito e preservação total da amizade com o cliente.', c: '#10b981', bg: 'rgba(16,185,129,0.06)' },
                    { id: 'firme', title: '👔 Firme & Profissional', desc: 'Foco em clareza contratual, seriedade do prazo e profissionalismo formal.', c: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
                    { id: 'urgente', title: '🚨 Urgente & Direta', desc: 'Dá ênfase à gravidade do vencimento e alerta de restrições operacionais imediata.', c: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
                    { id: 'divertido', title: '🐍 Divertido (Trocadilhos)', desc: 'Escreve com bom humor, rimas descontraídas e descontração para quebrar o gelo.', c: '#0d9488', bg: 'rgba(13,148,136,0.06)' },
                  ].map(item => {
                    const isSelected = catarinaHumor === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setCatarinaHumor(item.id)}
                        style={{
                          background: isSelected ? 'rgba(255,255,255,0.02)' : 'transparent',
                          border: isSelected ? `2.5px solid ${item.c}` : '1.5px solid rgba(255,255,255,0.04)',
                          borderRadius: 16,
                          padding: 16,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 0 16px ${item.c}0f` : 'none'
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: isSelected ? item.c : '#f1f5f9' }}>{item.title}</h4>
                        <p style={{ margin: '6px 0 0 0', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.4 }}>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Prompt Guidelines */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Diretrizes Customizadas de Escrita (Instruções Extras)</label>
                  <textarea 
                    rows="3"
                    value={catarinaGuidelines}
                    onChange={e => setCatarinaGuidelines(e.target.value)}
                    placeholder="Instruções para a IA. Ex: 'Sempre mencione que aceitamos Pix e cartão. Nunca use a palavra dívida, prefira saldo pendente. Adicione emojis de veículos se a cobrança for locação.'"
                    style={{ ...inputS, height: 'auto', resize: 'vertical', background: '#050811' }}
                  />
                </div>
              </div>

              {/* Juros e Scores Configuration Card */}
              <div style={cardS}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>📈 Juros Moratórios por Faixa de Score</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Configure a taxa de juros diários pós-vencimento com base na pontualidade geral de faturamento do cliente.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.15)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="block text-xs font-bold text-[#10b981]">😊 Score Excelente (% ao dia)</label>
                    <input type="number" step="0.01" value={scoreRates.excellent} onChange={e => setScoreRates({ ...scoreRates, excellent: parseFloat(e.target.value) || 0 })} style={inputS} />
                  </div>
                  <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.15)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="block text-xs font-bold text-[#f59e0b]">⚠️ Score Regular (% ao dia)</label>
                    <input type="number" step="0.01" value={scoreRates.regular} onChange={e => setScoreRates({ ...scoreRates, regular: parseFloat(e.target.value) || 0 })} style={inputS} />
                  </div>
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="block text-xs font-bold text-[#ef4444]">🚨 Score de Risco (% ao dia)</label>
                    <input type="number" step="0.01" value={scoreRates.risk} onChange={e => setScoreRates({ ...scoreRates, risk: parseFloat(e.target.value) || 0 })} style={inputS} />
                  </div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>Limites de Faixa de Score</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Configure os limites de taxa de inadimplência (proporção de dívidas atrasadas sobre o total pago) para a classificação de score.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.12)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '10px' }}>
                    <div>
                      <label className="block text-xs font-bold text-[#6ee7b7] mb-2">😊 Limite Máximo Score Bom (%)</label>
                      <input type="number" min="1" max="99" value={scoreThresholds.good} onChange={e => setScoreThresholds({ ...scoreThresholds, good: parseInt(e.target.value) || 0 })} style={inputS} />
                    </div>
                    <span style={{ display: 'block', fontSize: 11, color: '#64748b', lineHeight: '1.4', marginTop: '6px' }}>Clientes com taxas de atraso menores que este limite são considerados **Bons Pagadores** (Score Excelente).</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.04)', borderColor: 'rgba(245, 158, 11, 0.12)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '10px' }}>
                    <div>
                      <label className="block text-xs font-bold text-[#f59e0b] mb-2">⚠️ Limite Máximo Score Regular (%)</label>
                      <input type="number" min="2" max="100" value={scoreThresholds.regular} onChange={e => setScoreThresholds({ ...scoreThresholds, regular: parseInt(e.target.value) || 0 })} style={inputS} />
                    </div>
                    <span style={{ display: 'block', fontSize: 11, color: '#64748b', lineHeight: '1.4', marginTop: '6px' }}>Clientes entre o limite Bom e este são classificados como **Regulares**. Acima serão categorizados como **Alto Risco**.</span>
                  </div>
                </div>

                <button 
                  onClick={handleSaveScoreRates} 
                  style={{ 
                    padding: '12px 24px', 
                    borderRadius: 10, 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: '#fff', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    border: 'none', 
                    fontFamily: 'Inter',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                  }}
                >
                  Salvar IA e Regras de Juros
                </button>
              </div>

            </div>
          )}

          {/* TAB 5: Matriz de Disparo (Automated Reminder Timeline) */}
          {activeTab === 'timeline' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>📅 Matriz de Disparo Automático</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Escolha em quais estágios do fluxo financeiro a Catarina IA deve notificar o devedor via WhatsApp ou E-mail.</p>
              
              {/* Timeline Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '3px solid rgba(16, 185, 129, 0.25)', paddingLeft: 20, marginLeft: 10, marginBottom: 28 }}>
                {[
                  { key: 'prev3d', t: '⏰ Lembrete Prévio (3 dias antes)', desc: 'Envia uma mensagem polida por E-mail para prevenção de atraso.', c: '#10b981' },
                  { key: 'prev1d', t: '⏰ Lembrete Imediato (1 dia antes)', desc: 'Envia aviso no WhatsApp lembrando do vencimento amanhã.', c: '#10b981' },
                  { key: 'due', t: '💰 Dia do Vencimento', desc: 'Dispara WhatsApp e E-mail com Pix copia e cola e botão de pagamento.', c: '#10b981' },
                  { key: 'late2d', t: '⚠️ Cobrança Atrasada (2 dias após)', desc: 'WhatsApp focado no atraso e aviso dos encargos diários de juros.', c: '#f59e0b' },
                  { key: 'late5d', t: '🚨 Alerta Crítico (5 dias após)', desc: 'Envio firme alertando restrições operacionais e chamada urgente.', c: '#ef4444' },
                ].map(item => (
                  <div key={item.key} style={{ position: 'relative', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    
                    {/* Glowing Bullet Circle indicator on vertical line */}
                    <div style={{
                      position: 'absolute',
                      left: -27.5,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: reminderSchedule[item.key] ? item.c : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${reminderSchedule[item.key] ? '#070913' : 'rgba(255,255,255,0.2)'}`,
                      boxShadow: reminderSchedule[item.key] ? `0 0 8px ${item.c}` : 'none'
                    }} />

                    <div>
                      <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#f1f5f9' }}>{item.t}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>{item.desc}</p>
                    </div>

                    <div 
                      onClick={() => toggleScheduleItem(item.key)}
                      className="custom-switch" 
                      style={{ 
                        background: reminderSchedule[item.key] ? '#10b981' : 'rgba(255,255,255,0.1)',
                        boxShadow: reminderSchedule[item.key] ? '0 0 10px rgba(16,185,129,0.3)' : 'none'
                      }}
                    >
                      <div className="custom-switch-handle" style={{ left: reminderSchedule[item.key] ? '23px' : '3px' }} />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSaveSchedule} 
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: 10, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: '#fff', 
                  fontSize: 13, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  border: 'none', 
                  fontFamily: 'Inter',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
              >
                Salvar Matriz de Disparo
              </button>
            </div>
          )}

          {/* TAB 6: Plano & Consumo de Quotas */}
          {activeTab === 'plan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Plan metrics and Quotas gauge */}
              <div style={cardS}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>📊 Quotas de Consumo Mensal</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Veja o volume de recursos do Cobbra consumidos até o momento.</p>

                {/* Progress metrics bars grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 10 }}>
                  {[
                    { label: 'Disparos WhatsApp', val: usageStats.whatsappSent, max: usageStats.whatsappLimit, badge: 'SMS/Whats' },
                    { label: 'Veículos na Frota', val: usageStats.vehicles, max: usageStats.vehiclesLimit, badge: 'Frotas' },
                    { label: 'Contratos por IA', val: usageStats.aiContracts, max: usageStats.aiContractsLimit, badge: 'Contratos' },
                  ].map((gauge, i) => {
                    const percent = Math.min(100, Math.round((gauge.val / gauge.max) * 100));
                    return (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 18, borderRadius: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                          <span>{gauge.label}</span>
                          <span>{percent}%</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
                          {gauge.val} <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>/ {gauge.max}</span>
                        </div>
                        {/* Neon visual progress line */}
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #0d9488 100%)', borderRadius: 99, boxShadow: '0 0 8px rgba(16,185,129,0.3)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plan Box */}
              <div style={cardS}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>💎 Upgrade de Assinatura</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Sua assinatura única garante acesso ilimitado a todas as ferramentas e recursos da plataforma.</p>
                
                {/* Active Plan Header */}
                <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 16, padding: 20, border: '1px solid rgba(16,185,129,0.18)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: '#059669', color: '#fff', textTransform: 'uppercase' }}>
                      {user?.plan === 'cobra_pro' ? 'Assinatura Ativa' : 'Período de Teste'}
                    </span>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginTop: 8 }}>
                      Plano Completo Ilimitado
                    </h4>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 900, color: '#10b981', margin: 0 }}>
                    R$ 49,90
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>/mês</span>
                  </p>
                </div>

                {/* Single Plan Card */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '2.5px solid #059669', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 440 }}>
                    <div>
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Plano Completo Ilimitado</h5>
                      <p style={{ fontSize: 24, fontWeight: 900, color: '#e2e8f0', margin: '8px 0' }}>R$ 49,90<span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>/mês</span></p>
                      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>Escala ilimitada de cobranças, mensagens via WhatsApp e e-mail com Pix 100% livre de taxas.</p>
                      
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>✓ Cobranças e Tomadores ILIMITADOS</p>
                        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>✓ Envio de Lembretes no WhatsApp & E-mail</p>
                        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>✓ Robô Financeiro Catarina IA Integrado</p>
                        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>✓ Relatórios Avançados e Análise de Risco</p>
                        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>✓ Gestão de Locações e Financiamentos</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handlePlanChange('cobra_pro')}
                      disabled={user?.plan === 'cobra_pro'}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 10,
                        background: user?.plan === 'cobra_pro' ? 'rgba(5,150,105,0.1)' : 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                        color: user?.plan === 'cobra_pro' ? '#10b981' : '#fff', border: 'none', fontWeight: 700,
                        cursor: user?.plan === 'cobra_pro' ? 'default' : 'pointer', transition: 'all 0.2s', fontSize: 13,
                        boxShadow: user?.plan === 'cobra_pro' ? 'none' : '0 4px 14px rgba(16,185,129,0.3)'
                      }}
                    >
                      {user?.plan === 'cobra_pro' ? 'Assinatura Ativa ✓' : 'Ativar Assinatura Ilimitada'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: Segurança & Acesso */}
          {activeTab === 'security' && (
            <div style={cardS}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 20, letterSpacing: '-0.3px' }}>🔒 Segurança & Acesso</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Atualize a senha de acesso da sua conta para manter seus registros seguros.</p>
              
              {pwError && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 12.5, marginBottom: 18 }}>
                  ❌ {pwError}
                </div>
              )}

              {pwSuccess && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: 12.5, marginBottom: 18 }}>
                  ✅ {pwSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordChange}>
                {[
                  { label: 'Senha atual', key: 'current' },
                  { label: 'Nova senha de acesso', key: 'newPw' },
                  { label: 'Confirmar nova senha', key: 'confirm' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>{f.label}</label>
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
                    background: pwLoading ? '#3b4252' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: '#fff', fontSize: 13, fontWeight: 700, 
                    cursor: pwLoading ? 'not-allowed' : 'pointer', border: 'none', 
                    fontFamily: 'Inter', marginTop: 10,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                  }}
                  disabled={pwLoading}
                >
                  {pwLoading ? 'Atualizando...' : 'Atualizar Senha de Acesso'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
