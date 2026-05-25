'use client';
import { useState, useEffect } from 'react';

const HEALTH = { 
  good: { l: 'Bom pagador', c: '#10b981', b: 'rgba(16,185,129,0.15)', i: '😊' }, 
  warning: { l: 'Atenção', c: '#f59e0b', b: 'rgba(245,158,11,0.15)', i: '⚠️' }, 
  critical: { l: 'Inadimplente', c: '#ef4444', b: 'rgba(239,68,68,0.15)', i: '🚨' } 
};

export default function CobrancaDiariaPage() {
  const [dailyBills, setDailyBills] = useState([]);
  const [userConfig, setUserConfig] = useState({ interest_rate_excellent: 0.1, interest_rate_regular: 0.3, interest_rate_risk: 0.5 });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [form, setForm] = useState({
    client_id: '',
    amount: '',
    description: '',
    interest_rate: '',
    status: 'active',
    end_date: '',
    exclude_saturdays: false,
    exclude_sundays_holidays: false
  });

  // Payment Modal state for early rebate/payoff
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [finalizeContract, setFinalizeContract] = useState(false);

  const [search, setSearch] = useState('');

  function loadData() {
    setLoading(true);
    fetch('/api/cobranca-diaria')
      .then(r => r.json())
      .then(d => {
        setDailyBills(d.dailyBills || []);
        if (d.config) {
          setUserConfig(d.config);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/clientes?limit=200')
      .then(r => r.json())
      .then(d => {
        setClients(d.clients || []);
      })
      .catch(err => console.error(err));
  }

  useEffect(() => {
    loadData();
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); });
  }, []);

  // Auto-fill recommended interest rate based on selected client's health/score
  useEffect(() => {
    if (form.client_id && !editingBill) {
      const client = clients.find(c => c.id === form.client_id);
      if (client) {
        let rate = 0.3;
        if (client.health_score === 'good') rate = userConfig.interest_rate_excellent ?? 0.1;
        else if (client.health_score === 'warning') rate = userConfig.interest_rate_regular ?? 0.3;
        else if (client.health_score === 'critical') rate = userConfig.interest_rate_risk ?? 0.5;
        
        setForm(prev => ({ ...prev, interest_rate: rate }));
      }
    }
  }, [form.client_id, clients, userConfig, editingBill]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.client_id || !form.amount) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      id: editingBill ? editingBill.id : undefined,
      client_id: form.client_id,
      amount: parseFloat(form.amount),
      description: form.description,
      interest_rate: parseFloat(form.interest_rate) || 0,
      status: form.status,
      end_date: form.end_date || null,
      exclude_saturdays: form.exclude_saturdays,
      exclude_sundays_holidays: form.exclude_sundays_holidays
    };

    const res = await fetch('/api/cobranca-diaria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setShowModal(false);
      setEditingBill(null);
      setForm({ client_id: '', amount: '', description: '', interest_rate: '', status: 'active', end_date: '', exclude_saturdays: false, exclude_sundays_holidays: false });
      loadData();
      setMsg(editingBill ? 'Faturamento atualizado! 🐍' : 'Cobrança diária configurada! 🐍');
      setTimeout(() => setMsg(''), 3000);
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao salvar faturamento diário.');
    }
  }

  async function handleToggleStatus(bill) {
    const nextStatus = bill.status === 'active' ? 'paused' : 'active';
    
    if (user?.plan === 'crescimento' && nextStatus === 'active') {
      const activeCount = dailyBills.filter(b => b.status === 'active').length;
      if (activeCount >= 1) {
        alert('O plano Crescimento permite apenas 1 faturamento diário ativo simultaneamente. Pause o outro faturamento antes de reativar este ou faça upgrade nas Configurações!');
        return;
      }
    }

    const payload = {
      id: bill.id,
      client_id: bill.client_id,
      amount: bill.amount,
      description: bill.description,
      interest_rate: bill.interest_rate,
      status: nextStatus,
      end_date: bill.end_date || null,
      exclude_saturdays: !!bill.exclude_saturdays,
      exclude_sundays_holidays: !!bill.exclude_sundays_holidays
    };

    const res = await fetch('/api/cobranca-diaria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      loadData();
      setMsg(nextStatus === 'active' ? 'Cobrança retomada!' : 'Cobrança pausada!');
      setTimeout(() => setMsg(''), 3000);
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao alterar status.');
    }
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!selectedBillForPayment || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      daily_billing_id: selectedBillForPayment.id,
      amount: parseFloat(paymentAmount),
      finalize: finalizeContract
    };

    const res = await fetch('/api/cobranca-diaria/pagar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setShowPaymentModal(false);
      setSelectedBillForPayment(null);
      setPaymentAmount('');
      setFinalizeContract(false);
      loadData();
      setMsg(finalizeContract ? 'Contrato quitado antecipado! 💸' : 'Abatimento efetuado com sucesso! 💸');
      setTimeout(() => setMsg(''), 3000);
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao realizar o pagamento do faturamento.');
    }
  }

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setForm({
      client_id: bill.client_id,
      amount: bill.amount.toString(),
      description: bill.description || '',
      interest_rate: bill.interest_rate.toString(),
      status: bill.status,
      end_date: bill.end_date || '',
      exclude_saturdays: !!bill.exclude_saturdays,
      exclude_sundays_holidays: !!bill.exclude_sundays_holidays
    });
    setShowModal(true);
  };

  const handleNewBillClick = () => {
    if (user?.plan === 'crescimento') {
      const activeCount = dailyBills.filter(b => b.status === 'active').length;
      if (activeCount >= 1) {
        alert('O plano Crescimento permite apenas 1 faturamento diário ativo simultaneamente. Pause o outro faturamento ou faça upgrade para o Cobra Pro nas Configurações!');
        return;
      }
    }
    setEditingBill(null);
    setForm({ client_id: '', amount: '', description: '', interest_rate: '', status: 'active', end_date: '', exclude_saturdays: false, exclude_sundays_holidays: false });
    setShowModal(true);
  };

  const filteredBills = dailyBills.filter(b => 
    b.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculation
  const totalDaily = dailyBills.filter(b => b.status === 'active').reduce((acc, curr) => acc + curr.amount, 0);
  const activeCount = dailyBills.filter(b => b.status === 'active').length;
  const avgInterest = dailyBills.length > 0 
    ? dailyBills.reduce((acc, curr) => acc + curr.interest_rate, 0) / dailyBills.length 
    : 0;
  const projectedMonthly = totalDaily * 30;

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const inputS = { 
    width: '100%', 
    padding: '10px 14px', 
    borderRadius: 12, 
    border: '1px solid rgba(255,255,255,0.08)', 
    background: '#020617', 
    color: '#f8fafc', 
    fontSize: 13, 
    outline: 'none', 
    fontFamily: 'Inter,sans-serif',
    transition: 'all 0.2s'
  };
  const cardS = { 
    background: '#0C0E1A', 
    borderRadius: 20, 
    padding: isMobile ? '16px' : '24px', 
    border: '1px solid rgba(255,255,255,0.04)', 
    transition: 'all 0.3s'
  };

  // Clients configured less than 2 times
  const unconfiguredClients = clients.filter(c => dailyBills.filter(b => b.client_id === c.id).length < 2);

  if (user?.plan === 'starter') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', minHeight: '60vh', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#1e293b', borderRadius: 24, padding: '48px 32px', maxWidth: 540, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>📅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Cobrança e Faturamento Diário</h2>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
            O faturamento diário é uma ferramenta de alta performance que automatiza juros diários personalizados por Score, permite abatimentos recorrentes e oferece quitação antecipada de contratos.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, textAlign: 'left', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>✓ Recursos inclusos a partir do Crescimento:</p>
            {[
              'Automação completa de cobrança diária recorrente',
              'Cálculo e aplicação automática de juros diários',
              'Quitação antecipada e abatimentos inteligentes',
              'Indicadores de Score e saúde do pagador'
            ].map((beneficio, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: '#cbd5e1' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> {beneficio}
              </div>
            ))}
          </div>
          <a href="/dashboard/configuracoes" style={{
            display: 'inline-block', width: '100%', padding: '14px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #059669, #0d9488)', color: '#fff', fontSize: 15, fontWeight: 700,
            textAlign: 'center', cursor: 'pointer', border: 'none', textDecoration: 'none', boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
            transition: 'all 0.2s'
          }}>
            Fazer Upgrade de Plano 💎
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .cd-responsive .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .cd-responsive .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .cd-responsive .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .cd-responsive .modal-content { width: 460px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
        @media (max-width: 1024px) {
          .cd-responsive .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .cd-responsive .cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .cd-responsive .stats-grid { grid-template-columns: 1fr; }
          .cd-responsive .cards-grid { grid-template-columns: 1fr; }
          .cd-responsive .filter-bar { flex-direction: column; align-items: stretch; }
          .cd-responsive .modal-content { width: 100%; border-radius: 20px 20px 0 0 !important; position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important; top: auto !important; margin: 0 !important; }
        }
      `}</style>

      <div className="cd-responsive pb-24">
        {msg && <div style={{ position: 'fixed', top: 80, right: 32, background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1001, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', animation: 'fadeInUp 0.3s ease' }}>{msg}</div>}
 
        {/* Overview Stats Cards */}
        <div className="stats-grid">
          <div style={cardS}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>Faturamento Diário Ativo</p>
            <h4 style={{ fontSize: 22, fontWeight: 800, color: '#10b981', margin: 0 }}>{fmt(totalDaily)}<span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>/dia</span></h4>
          </div>
          <div style={cardS}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>Faturamento Mensal Projetado</p>
            <h4 style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', margin: 0 }}>{fmt(projectedMonthly)}<span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>/mês</span></h4>
          </div>
          <div style={cardS}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>Clientes com Faturamento</p>
            <h4 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{activeCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>ativos</span></h4>
          </div>
          <div style={cardS}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>Média de Juros Diários</p>
            <h4 style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', margin: 0 }}>{avgInterest.toFixed(2)}%<span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>/dia</span></h4>
          </div>
        </div>
 
        {/* Filters Bar */}
        <div className="filter-bar">
          <div className="flex gap-3 items-center w-full md:w-auto flex-1">
            <input placeholder="Buscar faturamentos..." value={search} onChange={e => setSearch(e.target.value)} style={inputS} className="w-full md:w-72 min-w-0" />
            <button 
              onClick={loadData} 
              style={{ 
                padding: '12px 16px', 
                borderRadius: 10, 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: '#e2e8f0', 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                transition: 'all 0.2s', 
                outline: 'none', 
                whiteSpace: 'nowrap' 
              }} 
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} 
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              className="group"
            >
              <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path>
              </svg>
              Recarregar
            </button>
          </div>
          <button onClick={handleNewBillClick} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Inter', whiteSpace: 'nowrap' }} className="w-full md:w-auto text-center">+ Ativar Cobrança Diária</button>
        </div>

        {/* Cards list */}
        <div className="cards-grid">
          {filteredBills.map(b => {
            const h = HEALTH[b.health_score] || HEALTH.good;
            const isActive = b.status === 'active';
            const isPaidEarly = b.status === 'paid_early';
            return (
              <div key={b.id} style={{ 
                ...cardS, 
                opacity: isActive ? 1 : 0.65, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                borderColor: isActive ? 'rgba(255,255,255,0.06)' : isPaidEarly ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.15)' 
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: isActive ? 'linear-gradient(135deg,#059669,#0d9488)' : isPaidEarly ? '#3b82f6' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                        {b.client_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{b.client_name}</p>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: h.b, color: h.c, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>{h.i} {h.l}</span>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: 11, padding: '3px 8px', borderRadius: 6, 
                      background: isActive ? 'rgba(16,185,129,0.15)' : isPaidEarly ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)', 
                      color: isActive ? '#10b981' : isPaidEarly ? '#3b82f6' : '#94a3b8', 
                      fontWeight: 700 
                    }}>
                      {isActive ? '● ATIVO' : isPaidEarly ? '✓ QUITADO' : '■ PAUSADO'}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Valor Diário:</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{fmt(b.amount)}/dia</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Juros Pós-Vencimento:</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{b.interest_rate}%/dia</span>
                    </div>
                    {b.end_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Vigência Até:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{new Date(b.end_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Projeção Mensal:</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{fmt(b.amount * 30)}/mês</span>
                    </div>
                  </div>

                  {/* Exclusion badges */}
                  {(b.exclude_saturdays || b.exclude_sundays_holidays) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {b.exclude_saturdays ? (
                        <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          🚫 Sem Sábado
                        </span>
                      ) : null}
                      {b.exclude_sundays_holidays ? (
                        <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          🚫 Sem Dom/Feriados
                        </span>
                      ) : null}
                    </div>
                  )}

                  {b.description && (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px 0', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.06)' }}>
                      📝 {b.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14, flexWrap: 'wrap' }}>
                  {isActive && (
                    <button 
                      onClick={() => {
                        setSelectedBillForPayment(b);
                        setPaymentAmount(b.amount.toString()); // Default to daily amount
                        setShowPaymentModal(true);
                      }}
                      style={{ 
                        flex: 1.2, padding: '8px', borderRadius: 8, 
                        background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none', 
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' 
                      }}
                    >
                      💸 Quitar/Abater
                    </button>
                  )}
                  <button onClick={() => handleEdit(b)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}>
                    ⚙️ Configurar
                  </button>
                  {!isPaidEarly && (
                    <button 
                      onClick={() => handleToggleStatus(b)} 
                      style={{ 
                        flex: 1, padding: '8px', borderRadius: 8, 
                        background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', 
                        color: isActive ? '#f59e0b' : '#10b981', border: 'none', 
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' 
                      }}
                    >
                      {isActive ? '⏸️ Pausar' : '▶️ Retomar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredBills.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#64748b' }}>
              {loading ? 'Carregando faturamentos...' : 'Nenhum faturamento diário configurado'}
            </div>
          )}
        </div>

        {/* Configure/Edit Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
            <div onClick={e => e.stopPropagation()} className="modal-content" style={{ background: '#1e293b', borderRadius: 20, padding: 36, border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                {editingBill ? '⚙️ Ajustar Faturamento Diário' : '📅 Ativar Faturamento Diário'}
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                {editingBill 
                  ? 'Modifique as condições de cobrança e juros diários para este cliente.' 
                  : 'Selecione um cliente para ativar o faturamento diário automático.'}
              </p>

              <form onSubmit={handleSubmit}>
                
                {/* Client Selection */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Cliente *</label>
                  {editingBill ? (
                    <input type="text" value={editingBill.client_name} style={{ ...inputS, color: '#64748b', cursor: 'not-allowed' }} disabled />
                  ) : (
                    <select 
                      value={form.client_id} 
                      onChange={e => setForm({ ...form, client_id: e.target.value })} 
                      style={{ ...inputS, appearance: 'auto', color: '#e2e8f0' }} 
                      required
                    >
                      <option style={{ color: '#0f172a' }} value="">Selecione um cliente...</option>
                      {unconfiguredClients.map(c => (
                        <option style={{ color: '#0f172a' }} key={c.id} value={c.id}>
                          {c.name} ({c.health_score === 'good' ? '😊 Bom' : c.health_score === 'warning' ? '⚠️ Atenção' : '🚨 Risco'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Base Daily Amount */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Valor Faturado Diariamente (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    placeholder="Ex: 50.00" 
                    value={form.amount} 
                    onChange={e => setForm({ ...form, amount: e.target.value })} 
                    style={inputS} 
                    required 
                  />
                </div>

                {/* Custom Daily Interest Rate */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Juros Diários Pós-Vencimento (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="Ex: 0.3" 
                    value={form.interest_rate} 
                    onChange={e => setForm({ ...form, interest_rate: e.target.value })} 
                    style={inputS} 
                  />
                  <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>
                    💡 Baseado no score do cliente. Deixe em branco para usar 0% ou use taxas personalizadas.
                  </span>
                </div>

                {/* Vigência / End Date */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Vigência Até (Data Final Opcional)</label>
                  <input 
                    type="date" 
                    value={form.end_date} 
                    onChange={e => setForm({ ...form, end_date: e.target.value })} 
                    style={inputS} 
                  />
                  <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>
                    Deixe em branco para tempo indeterminado (recorrência contínua).
                  </span>
                </div>

                {/* Exclusion Checkboxes */}
                <div style={{ marginBottom: 14, background: 'rgba(139,92,246,0.06)', borderRadius: 12, padding: 16, border: '1px solid rgba(139,92,246,0.12)' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 12 }}>
                    📅 Restrições de Cobrança
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: form.exclude_saturdays ? 'rgba(139,92,246,0.12)' : 'transparent', transition: 'all 0.2s' }}>
                    <input 
                      type="checkbox" 
                      checked={form.exclude_saturdays}
                      onChange={e => setForm({ ...form, exclude_saturdays: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: '#8b5cf6', cursor: 'pointer' }}
                    />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>🚫 Não cobrar aos sábados</span>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>Remove sábados do calendário de cobranças</p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, background: form.exclude_sundays_holidays ? 'rgba(239,68,68,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                    <input 
                      type="checkbox" 
                      checked={form.exclude_sundays_holidays}
                      onChange={e => setForm({ ...form, exclude_sundays_holidays: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: '#ef4444', cursor: 'pointer' }}
                    />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>🚫 Não cobrar em domingos e feriados</span>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>Remove domingos e feriados nacionais do calendário</p>
                    </div>
                  </label>
                </div>

                {/* Description / Project name */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Descrição do Serviço / Contrato</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Mensalidade Academia, Aluguel de Equipamento, etc." 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    style={inputS} 
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 700, border: 'none', fontFamily: 'Inter', cursor: 'pointer' }}>
                    {editingBill ? 'Salvar Alterações' : 'Configurar Contrato'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Payment/Rebate/Payoff Modal */}
        {showPaymentModal && selectedBillForPayment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPaymentModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 20, padding: 36, width: 440, border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                💸 Pagar/Abater Faturamento Diário
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Cliente: <strong>{selectedBillForPayment.client_name}</strong><br />
                Valor por dia: <strong>{fmt(selectedBillForPayment.amount)}/dia</strong><br />
                Descrição: <strong>{selectedBillForPayment.description || 'Faturamento Diário'}</strong>
              </p>

              <form onSubmit={handlePaymentSubmit}>
                {/* Amount Paid */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Valor Recebido (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    placeholder="Ex: 150.00" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    style={inputS} 
                    required 
                    autoFocus
                  />
                </div>

                {/* Finalize contract Checkbox */}
                <div style={{ marginBottom: 24, padding: 14, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={finalizeContract}
                      onChange={e => setFinalizeContract(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#ef4444', cursor: 'pointer' }}
                    />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>Quitar e finalizar contrato diário</span>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>Altera o status para quitado e interrompe as cobranças no calendário</p>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 700, border: 'none', fontFamily: 'Inter', cursor: 'pointer' }}>
                    Confirmar Recebimento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
