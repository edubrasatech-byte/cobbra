'use client';
import { useState, useEffect } from 'react';

const HEALTH = { 
  good: { l: 'Bom pagador', c: '#10b981', b: 'rgba(16,185,129,0.15)', i: '😊' }, 
  warning: { l: 'Atenção', c: '#f59e0b', b: 'rgba(245,158,11,0.15)', i: '⚠️' }, 
  critical: { l: 'Inadimplente', c: '#ef4444', b: 'rgba(239,68,68,0.15)', i: '🚨' } 
};

const STATUS = { 
  pending: { l: 'Pendente', c: '#f59e0b', b: 'rgba(245,158,11,0.15)' }, 
  reminder_sent: { l: 'Lembrete Enviado', c: '#3b82f6', b: 'rgba(59,130,246,0.15)' }, 
  paid: { l: 'Pago', c: '#10b981', b: 'rgba(16,185,129,0.15)' }, 
  overdue: { l: 'Vencido', c: '#ef4444', b: 'rgba(239,68,68,0.15)' }, 
  cancelled: { l: 'Cancelado', c: '#6b7280', b: 'rgba(107,114,128,0.15)' } 
};

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    document: '', 
    category: '', 
    company_name: '', 
    birthday: '', 
    address: '', 
    notes: '' 
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  
  // Detailed client view
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientCharges, setClientCharges] = useState([]);
  const [loadingCharges, setLoadingCharges] = useState(false);

  // Partial Payment (Rebate) modal state
  const [abaterCharge, setAbaterCharge] = useState(null);
  const [rebateVal, setRebateVal] = useState('');

  function loadClients() {
    setLoading(true);
    let url = '/api/clientes?limit=100';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (healthFilter) url += `&health=${healthFilter}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadClients();
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);
  useEffect(() => { loadClients(); }, [search, healthFilter]);

  // Load client charges when client is selected
  useEffect(() => {
    if (selectedClient) {
      setLoadingCharges(true);
      fetch(`/api/cobrancas?client_id=${selectedClient.id}`)
        .then(r => r.json())
        .then(data => {
          setClientCharges(data.charges || []);
          setLoadingCharges(false);
        })
        .catch(() => setLoadingCharges(false));
    } else {
      setClientCharges([]);
    }
  }, [selectedClient]);

  // Helper to re-fetch selected client details to sync balance updates
  const refreshSelectedClient = async (clientId) => {
    try {
      const res = await fetch(`/api/clientes?limit=100`);
      const data = await res.json();
      const updatedList = data.clients || [];
      setClients(updatedList);
      const updatedClient = updatedList.find(c => c.id === clientId);
      if (updatedClient) {
        setSelectedClient(updatedClient);
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function createClient(e) {
    e.preventDefault();
    const res = await fetch('/api/clientes', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form) 
    });
    if (res.ok) { 
      setShowModal(false); 
      setForm({ 
        name: '', 
        email: '', 
        phone: '', 
        document: '', 
        category: '', 
        company_name: '', 
        birthday: '', 
        address: '', 
        notes: '' 
      }); 
      loadClients(); 
      setMsg('Cliente cadastrado! 🐍'); 
      setTimeout(() => setMsg(''), 3000); 
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao cadastrar cliente.');
    }
  }

  async function deleteClient(id, e) {
    e.stopPropagation();
    if (!confirm('Excluir este cliente e todas as cobranças associadas?')) return;
    await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
    loadClients(); 
    setSelectedClient(null);
    setMsg('Cliente excluído.'); 
    setTimeout(() => setMsg(''), 3000);
  }

  async function payCharge(chargeId, clientId) {
    await fetch(`/api/cobrancas/${chargeId}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status: 'paid' }) 
    });
    // Reload charges list
    setLoadingCharges(true);
    const r = await fetch(`/api/cobrancas?client_id=${clientId}`);
    const data = await r.json();
    setClientCharges(data.charges || []);
    setLoadingCharges(false);
    
    // Refresh client stats
    refreshSelectedClient(clientId);
    setMsg('Pagamento confirmado! 💰');
    setTimeout(() => setMsg(''), 3000);
  }

  async function abaterChargeAction() {
    if (!rebateVal || isNaN(rebateVal) || parseFloat(rebateVal) <= 0) {
      alert('Por favor, insira um valor válido para abatimento.');
      return;
    }
    const chargeId = abaterCharge.id;
    const clientId = selectedClient.id;
    const res = await fetch(`/api/cobrancas/${chargeId}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ rebateAmount: parseFloat(rebateVal) }) 
    });
    if (res.ok) {
      setAbaterCharge(null);
      setRebateVal('');
      // Reload charges list
      setLoadingCharges(true);
      const r = await fetch(`/api/cobrancas?client_id=${clientId}`);
      const data = await r.json();
      setClientCharges(data.charges || []);
      setLoadingCharges(false);
      
      // Refresh client stats
      refreshSelectedClient(clientId);
      setMsg('Abatimento registrado com sucesso! 💸');
      setTimeout(() => setMsg(''), 3000);
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao registrar abatimento.');
    }
  }

  const getPayerScore = c => {
    const limitGood = user?.score_limit_good ?? 0.2;
    const limitRegular = user?.score_limit_regular ?? 0.4;
    
    if (!c.total_charged || c.total_charged === 0) {
      return { l: 'Excelente', c: '#10b981', b: 'rgba(16,185,129,0.15)', s: '⭐⭐⭐⭐⭐' };
    }
    const overdueRatio = c.total_overdue / c.total_charged;
    if (c.total_overdue === 0) {
      return { l: 'Excelente', c: '#10b981', b: 'rgba(16,185,129,0.15)', s: '⭐⭐⭐⭐⭐' };
    } else if (overdueRatio < limitGood) {
      return { l: 'Bom', c: '#6ee7b7', b: 'rgba(110,231,183,0.15)', s: '⭐⭐⭐⭐' };
    } else if (overdueRatio < limitRegular) {
      return { l: 'Regular', c: '#f59e0b', b: 'rgba(245,158,11,0.15)', s: '⭐⭐⭐' };
    } else {
      return { l: 'Alto Risco', c: '#ef4444', b: 'rgba(239,68,68,0.15)', s: '⭐' };
    }
  };

  const calcInterest = c => {
    if (c.status === 'paid' || c.status === 'cancelled') return 0;
    if (!c.daily_interest_rate || c.daily_interest_rate <= 0) return 0;
    const due = new Date(c.due_date);
    const today = new Date();
    if (due >= today) return 0;
    const days = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
    return c.amount * (c.daily_interest_rate / 100) * days;
  };

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const inputS = { 
    width: '100%', 
    height: '44px',
    minHeight: '44px',
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
    transition: 'all 0.3s',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  return (
    <div>
      {msg && <div style={{ position: 'fixed', top: 80, right: 32, background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1001, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', animation: 'fadeInUp 0.3s ease' }}>{msg}</div>}

      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 h-11 min-h-[44px] flex-shrink-0" style={inputS} />
          <div className="flex gap-2 h-11 min-h-[44px] flex-shrink-0">
            <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)} className="flex-1 sm:w-44 h-11 min-h-[44px] flex-shrink-0" style={{ ...inputS, appearance: 'auto', color: '#e2e8f0' }}>
              <option style={{ color: '#0f172a' }} value="">Todos os status</option>
              {Object.entries(HEALTH).map(([k, v]) => <option style={{ color: '#0f172a' }} key={k} value={k}>{v.i} {v.l}</option>)}
            </select>
            <button onClick={loadClients} className="px-4 h-11 min-h-[44px] flex-shrink-0 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all">
              🔄
            </button>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ height: 44, padding: '0 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Inter' }} className="w-full md:w-auto text-center flex-shrink-0">+ Novo Cliente</button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
        {clients.map(c => {
          const h = HEALTH[c.health_score] || HEALTH.good;
          const score = getPayerScore(c);
          return (
            <div key={c.id} onClick={() => setSelectedClient(c)} style={cardS}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      {c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{c.name}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{c.category || 'Sem categoria'}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: h.b, color: h.c, fontWeight: 600 }}>{h.i} {h.l}</span>
                </div>

                {/* Bom Pagador Score */}
                <div style={{ background: 'rgba(5,150,105,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(5,150,105,0.1)' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Score Pagador:</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: score.c, marginRight: 6 }}>{score.l}</span>
                    <span style={{ fontSize: 10 }}>{score.s}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Total cobrado</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{fmt(c.total_charged)}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Total pago</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{fmt(c.total_paid)}</p>
                  </div>
                </div>
                {c.total_overdue > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#fca5a5', fontWeight: 600 }}>⚠️ Deve: {fmt(c.total_overdue)}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-white/5 pt-3 mt-1 min-w-0">
                  {c.email && <span className="truncate min-w-0" title={c.email}>✉️ {c.email}</span>}
                  {c.phone && <span className="shrink-0">📱 {c.phone}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>👁️ Ver histórico</span>
                  <button onClick={(e) => deleteClient(c.id, e)} style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>Excluir</button>
                </div>
              </div>
            </div>
          );
        })}
        {clients.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#64748b' }} className="flex-shrink-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin flex-shrink-0"></div>
                <p className="text-slate-500 text-xs font-semibold">Carregando clientes...</p>
              </div>
            ) : 'Nenhum cliente encontrado'}
          </div>
        )}
      </div>

      {/* Expanded Client Details Modal */}
      {selectedClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setSelectedClient(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#1e293b] rounded-2xl p-6 md:p-8 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto border border-white/10">
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '90%' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                  {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ width: '100%' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{selectedClient.name}</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0' }}>
                    {selectedClient.category || 'Sem categoria'} • {selectedClient.phone || 'Sem telefone'} • {selectedClient.email || 'Sem e-mail'}
                  </p>
                  {(selectedClient.company_name || selectedClient.document || selectedClient.birthday || selectedClient.address) && (
                    <div style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '8px 16px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                      {selectedClient.company_name && <span>🏢 <strong>Empresa:</strong> {selectedClient.company_name}</span>}
                      {selectedClient.document && <span>📄 <strong>CPF/CNPJ:</strong> {selectedClient.document}</span>}
                      {selectedClient.birthday && <span>🎂 <strong>Nascimento:</strong> {new Date(selectedClient.birthday).toLocaleDateString('pt-BR')}</span>}
                      {selectedClient.address && <span>📍 <strong>Endereço:</strong> {selectedClient.address}</span>}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#94a3b8', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
            </div>

            {/* Score and Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div style={{ background: 'rgba(5,150,105,0.08)', borderRadius: 12, padding: 14, border: '1px solid rgba(5,150,105,0.15)' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Pontualidade (Score)</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: getPayerScore(selectedClient).c, margin: 0 }}>
                  {getPayerScore(selectedClient).l} {getPayerScore(selectedClient).s}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Total Cobrado</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{fmt(selectedClient.total_charged)}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Total Pago</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#10b981', margin: 0 }}>{fmt(selectedClient.total_paid)}</p>
              </div>
              <div style={{ background: selectedClient.total_overdue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, border: selectedClient.total_overdue > 0 ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 11, color: selectedClient.total_overdue > 0 ? '#ef4444' : '#64748b', marginBottom: 4 }}>Em Aberto</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: selectedClient.total_overdue > 0 ? '#ef4444' : '#94a3b8', margin: 0 }}>{fmt(selectedClient.total_overdue)}</p>
              </div>
            </div>

            {/* Debts list / History */}
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Histórico Completo de Cobranças</h4>
            {loadingCharges ? (
              <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 20 }}>Carregando histórico...</p>
            ) : clientCharges.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhuma cobrança registrada para este cliente.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clientCharges.map(c => {
                  const interest = calcInterest(c);
                  return (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{c.description || 'Cobrança sem descrição'}</p>
                        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>
                          Início: {c.created_at ? new Date(c.created_at.replace(' ', 'T')).toLocaleDateString('pt-BR') : 'N/A'} • Vencimento: {new Date(c.due_date + 'T12:00:00').toLocaleDateString('pt-BR')} • Canal: {c.reminder_channel === 'both' ? 'Whats+Email' : c.reminder_channel}
                        </p>
                        {interest > 0 && (
                          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, display: 'block', marginTop: 4 }}>
                            ⚠️ Juros acumulados: {fmt(interest)} (+{c.daily_interest_rate}%/dia)
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{fmt(c.amount + interest)}</p>
                          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: STATUS[c.status]?.b, color: STATUS[c.status]?.c, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>
                            {STATUS[c.status]?.l}
                          </span>
                        </div>
                        {c.status !== 'paid' && c.status !== 'cancelled' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              onClick={() => setAbaterCharge(c)} 
                              style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}
                            >
                              💸 Abater
                            </button>
                            <button 
                              onClick={() => payCharge(c.id, selectedClient.id)} 
                              style={{ padding: '6px 12px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}
                            >
                              ✓ Receber
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Footer notes */}
            {selectedClient.notes && (
              <div style={{ marginTop: 24, padding: 14, background: 'rgba(255,255,255,0.01)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Observações internas:</span>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{selectedClient.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partial Abatement Modal (Modal Secundário) */}
      {abaterCharge && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setAbaterCharge(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#1e293b] rounded-2xl p-6 max-w-md w-full mx-4 border border-white/15">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>💸 Abater Parte do Valor</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Dívida: <strong>{abaterCharge.description || 'Sem descrição'}</strong><br />
              Valor atual da cobrança: <strong>{fmt(abaterCharge.amount)}</strong>
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Valor do Abatimento (R$)</label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max={abaterCharge.amount}
                placeholder="Ex: 50.00" 
                value={rebateVal} 
                onChange={e => setRebateVal(e.target.value)} 
                style={inputS} 
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setAbaterCharge(null)} 
                style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={abaterChargeAction}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 700, border: 'none', fontFamily: 'Inter', cursor: 'pointer' }}
              >
                Confirmar Abatimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#1e293b] rounded-2xl p-6 md:p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Novo Cliente</h3>
            <form onSubmit={createClient}>
              {[
                { label: 'Nome *', key: 'name', type: 'text', ph: 'Nome completo', required: true },
                { label: 'E-mail', key: 'email', type: 'email', ph: 'email@exemplo.com' },
                { label: 'Telefone', key: 'phone', type: 'tel', ph: '(11) 99999-9999' },
                { label: 'CPF / CNPJ', key: 'document', type: 'text', ph: 'Ex: 123.456.789-00' },
                { label: 'Categoria', key: 'category', type: 'text', ph: 'Ex: Aluno, Empresa, etc.' },
                { label: 'Empresa', key: 'company_name', type: 'text', ph: 'Nome da Empresa (opcional)' },
                { label: 'Data de Nascimento', key: 'birthday', type: 'date', ph: '' },
                { label: 'Endereço', key: 'address', type: 'text', ph: 'Endereço completo (opcional)' },
                { label: 'Observações', key: 'notes', type: 'text', ph: 'Notas sobre o cliente' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} style={inputS} required={f.required} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 700, border: 'none', fontFamily: 'Inter', cursor: 'pointer' }}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
