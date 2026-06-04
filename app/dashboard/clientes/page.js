'use client';

import { useState, useEffect } from 'react';

const HEALTH = { 
  good: { l: 'Bom pagador', c: 'text-emerald-400', b: 'bg-emerald-500/10 border-emerald-500/20', i: '😊' }, 
  warning: { l: 'Atenção', c: 'text-amber-500', b: 'bg-amber-500/10 border-amber-500/20', i: '⚠️' }, 
  critical: { l: 'Inadimplente', c: 'text-rose-500', b: 'bg-rose-500/10 border-rose-500/20', i: '🚨' } 
};

const STATUS = { 
  pending: { l: 'Pendente', c: 'text-amber-500', b: 'bg-amber-500/15' }, 
  reminder_sent: { l: 'Lembrete Enviado', c: 'text-blue-400', b: 'bg-blue-500/15' }, 
  paid: { l: 'Pago', c: 'text-emerald-400', b: 'bg-emerald-500/15' }, 
  overdue: { l: 'Vencido', c: 'text-rose-500', b: 'bg-rose-500/15' }, 
  cancelled: { l: 'Cancelado', c: 'text-slate-500', b: 'bg-slate-800/60' } 
};

// SVG Star helper
function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <svg 
        key={i} 
        className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');

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
      showToast('Cliente cadastrado com sucesso! 🐍'); 
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
    showToast('Cliente excluído com sucesso.'); 
  }

  async function payCharge(chargeId, clientId) {
    await fetch(`/api/cobrancas/${chargeId}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status: 'paid' }) 
    });
    setLoadingCharges(true);
    const r = await fetch(`/api/cobrancas?client_id=${clientId}`);
    const data = await r.json();
    setClientCharges(data.charges || []);
    setLoadingCharges(false);
    
    refreshSelectedClient(clientId);
    showToast('Pagamento confirmado com sucesso! 💰');
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
      setLoadingCharges(true);
      const r = await fetch(`/api/cobrancas?client_id=${clientId}`);
      const data = await r.json();
      setClientCharges(data.charges || []);
      setLoadingCharges(false);
      
      refreshSelectedClient(clientId);
      showToast('Abatimento registrado com sucesso! 💸');
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao registrar abatimento.');
    }
  }

  const showToast = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const getPayerScore = c => {
    const limitGood = user?.score_limit_good ?? 0.2;
    const limitRegular = user?.score_limit_regular ?? 0.4;
    
    if (!c.total_charged || c.total_charged === 0) {
      return { l: 'Excelente', c: 'text-emerald-400', b: 'bg-emerald-500/10', s: 5 };
    }
    const overdueRatio = c.total_overdue / c.total_charged;
    if (c.total_overdue === 0) {
      return { l: 'Excelente', c: 'text-emerald-400', b: 'bg-emerald-500/10', s: 5 };
    } else if (overdueRatio < limitGood) {
      return { l: 'Bom', c: 'text-emerald-350', b: 'bg-emerald-500/5', s: 4 };
    } else if (overdueRatio < limitRegular) {
      return { l: 'Regular', c: 'text-amber-500', b: 'bg-amber-500/5', s: 3 };
    } else {
      return { l: 'Alto Risco', c: 'text-rose-500', b: 'bg-rose-500/5', s: 1 };
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 space-y-6 text-left animate-fadeIn">
      {msg && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold z-50 shadow-lg shadow-emerald-500/20 animate-fadeInUp">
          {msg}
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1 max-w-xl">
          <input 
            placeholder="Buscar clientes..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="bg-slate-900 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/40 h-10 min-h-[40px] transition-all"
          />
          <div className="flex gap-2">
            <select 
              value={healthFilter} 
              onChange={e => setHealthFilter(e.target.value)} 
              className="bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-emerald-500/40 h-10 min-h-[40px] transition-all flex-1 min-w-[140px]"
            >
              <option value="">Status geral (Todos)</option>
              {Object.entries(HEALTH).map(([k, v]) => (
                <option key={k} value={k}>{v.i} {v.l}</option>
              ))}
            </select>
            <button 
              onClick={loadClients} 
              className="h-10 min-h-[40px] w-10 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 flex items-center justify-center rounded-xl transition-all cursor-pointer"
              title="Recarregar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setShowModal(true)} 
          className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:from-emerald-500 hover:to-teal-500 cursor-pointer shadow shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          <span>+</span> Novo Cliente
        </button>
      </div>

      {/* Grid List of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(c => {
          const h = HEALTH[c.health_score] || HEALTH.good;
          const score = getPayerScore(c);
          return (
            <div 
              key={c.id} 
              onClick={() => setSelectedClient(c)}
              className="bg-[#0C0E1A] hover:bg-[#0C0E1A]/80 border border-slate-900 hover:border-emerald-500/20 rounded-2xl p-4 cursor-pointer shadow-md transition-all flex flex-col justify-between group min-h-[190px]"
            >
              <div className="space-y-3">
                {/* Header card info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xs select-none flex-shrink-0">
                      {c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate leading-none mt-0.5">{c.category || 'Motorista'}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex-shrink-0 ${h.b} ${h.c}`}>
                    {h.i} {h.l}
                  </span>
                </div>

                {/* Score rating summary */}
                <div className="bg-slate-900/40 rounded-xl p-2 border border-slate-900 flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-bold">Pontualidade:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black uppercase tracking-wider ${score.c}`}>{score.l}</span>
                    <StarRating rating={score.s} />
                  </div>
                </div>

                {/* Billing statistics summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/20 rounded-lg p-2 border border-slate-950/30 text-left">
                    <span className="text-[9px] text-slate-500 font-bold block">Cobrado</span>
                    <span className="text-[11px] font-bold text-slate-350">{fmt(c.total_charged)}</span>
                  </div>
                  <div className="bg-slate-950/20 rounded-lg p-2 border border-slate-950/30 text-left">
                    <span className="text-[9px] text-slate-500 font-bold block">Pago</span>
                    <span className="text-[11px] font-bold text-emerald-400">{fmt(c.total_paid)}</span>
                  </div>
                </div>

                {/* Overdue alert */}
                {c.total_overdue > 0 && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg py-1.5 px-2.5 text-[10px] text-rose-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Débito em aberto: {fmt(c.total_overdue)}</span>
                  </div>
                )}
              </div>

              {/* Card Footer contacts */}
              <div className="border-t border-slate-900/50 pt-2.5 mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] text-slate-500 truncate max-w-[70%]">
                  {c.phone && <span className="truncate">📱 {c.phone}</span>}
                </div>
                
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold text-emerald-400 group-hover:underline transition-all">Ver Histórico →</span>
                </div>
              </div>
            </div>
          );
        })}

        {clients.length === 0 && (
          <div className="col-span-full py-16 bg-slate-950/20 border border-slate-900/60 rounded-3xl text-center text-xs text-slate-500">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="font-semibold">Buscando motoristas...</span>
              </div>
            ) : 'Nenhum motorista localizado.'}
          </div>
        )}
      </div>

      {/* ==================== 👤 DETAILED CLIENT DRAWER MODAL ==================== */}
      {selectedClient && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedClient(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl relative p-5 space-y-5"
          >
            {/* Top Close button */}
            <button 
              onClick={() => setSelectedClient(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
            >
              ×
            </button>

            {/* Profile Info block */}
            <div className="flex gap-3.5 items-center pb-4 border-b border-slate-800/40">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 select-none">
                {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0 w-full text-left">
                <h3 className="text-base font-black text-slate-100 leading-tight truncate">{selectedClient.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  {selectedClient.category || 'Motorista'} • {selectedClient.phone || 'Sem contato'} • {selectedClient.email || 'Sem e-mail'}
                </p>
                
                {/* Secondary data wrapper */}
                {(selectedClient.document || selectedClient.birthday || selectedClient.address) && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-850/50 text-[10px] text-slate-400 space-y-1">
                    {selectedClient.document && <p>📄 <strong>Documento:</strong> {selectedClient.document}</p>}
                    {selectedClient.birthday && <p>🎂 <strong>Nascimento:</strong> {new Date(selectedClient.birthday).toLocaleDateString('pt-BR')}</p>}
                    {selectedClient.address && <p className="truncate">📍 <strong>Endereço:</strong> {selectedClient.address}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Overview quick cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/20 border border-slate-850/40 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Score</span>
                <span className={`text-xs font-black mt-1.5 ${getPayerScore(selectedClient).c}`}>
                  {getPayerScore(selectedClient).l}
                </span>
              </div>
              <div className="bg-slate-950/20 border border-slate-850/40 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Cobrado</span>
                <span className="text-xs font-black text-slate-300 mt-1.5">{fmt(selectedClient.total_charged)}</span>
              </div>
              <div className="bg-slate-950/20 border border-slate-850/40 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Pago</span>
                <span className="text-xs font-black text-emerald-400 mt-1.5">{fmt(selectedClient.total_paid)}</span>
              </div>
              <div className={`border rounded-xl p-3 flex flex-col justify-between ${
                selectedClient.total_overdue > 0 ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-950/20 border-slate-850/40'
              }`}>
                <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Em Aberto</span>
                <span className={`text-xs font-black mt-1.5 ${selectedClient.total_overdue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {fmt(selectedClient.total_overdue)}
                </span>
              </div>
            </div>

            {/* Invoices list statement */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Histórico de Cobranças</h4>
              
              {loadingCharges ? (
                <p className="text-slate-500 text-xs text-center py-6">Carregando faturas...</p>
              ) : clientCharges.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-6">Nenhuma cobrança ativa registrada.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {clientCharges.map(c => {
                    const interest = calcInterest(c);
                    return (
                      <div 
                        key={c.id} 
                        className="bg-slate-950/20 border border-slate-850/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:border-slate-800 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{c.description || 'Cobrança Sem Descrição'}</p>
                          <p className="text-[9px] text-slate-500 font-semibold leading-none">
                            Vencimento: {new Date(c.due_date + 'T12:00:00').toLocaleDateString('pt-BR')} • {c.payment_method?.toUpperCase()}
                          </p>
                          {interest > 0 && (
                            <span className="text-[9px] text-amber-500 font-bold block mt-1">
                              ⚠️ Juros de mora: +{fmt(interest)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-slate-850/30 pt-2 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-black text-slate-200">{fmt(c.amount + interest)}</p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-1 inline-block ${STATUS[c.status]?.b} ${STATUS[c.status]?.c}`}>
                              {STATUS[c.status]?.l}
                            </span>
                          </div>

                          {c.status !== 'paid' && c.status !== 'cancelled' && (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => setAbaterCharge(c)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-700 hover:text-white text-slate-300 font-extrabold text-[10px] transition-colors cursor-pointer"
                              >
                                Abater
                              </button>
                              <button 
                                onClick={() => payCharge(c.id, selectedClient.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition-colors cursor-pointer"
                              >
                                Receber
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Notes area */}
            {selectedClient.notes && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850/50 text-[10px] text-slate-500 leading-normal text-left">
                <strong className="text-slate-400 font-bold block mb-1">Observações do Cliente:</strong>
                {selectedClient.notes}
              </div>
            )}

            {/* Delete button option */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800/40">
              <button 
                onClick={(e) => deleteClient(selectedClient.id, e)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500 hover:text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Excluir Cadastro
              </button>
              <button 
                onClick={() => setSelectedClient(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 💸 ABATEMENT MODAL ==================== */}
      {abaterCharge && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setAbaterCharge(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative"
          >
            <h3 className="text-base font-bold text-slate-200">Abatimento Parcial</h3>
            <p className="text-xs text-slate-400 leading-relaxed text-left">
              Registrar abatimento na cobrança: <strong className="text-slate-200">{abaterCharge.description || 'Aluguel/Cobrança'}</strong><br />
              Valor total original: <strong className="text-slate-200">{fmt(abaterCharge.amount)}</strong>
            </p>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Valor de Abatimento (R$)</label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max={abaterCharge.amount}
                placeholder="0,00" 
                value={rebateVal} 
                onChange={e => setRebateVal(e.target.value)} 
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setAbaterCharge(null)} 
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={abaterChargeAction}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ➕ CREATE CLIENT MODAL ==================== */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-200 text-left">Novo Cliente / Motorista</h3>
            
            <form onSubmit={createClient} className="space-y-3.5">
              <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-3">
                {[
                  { label: 'Nome *', key: 'name', type: 'text', ph: 'Nome completo', required: true },
                  { label: 'E-mail', key: 'email', type: 'email', ph: 'email@exemplo.com' },
                  { label: 'Telefone', key: 'phone', type: 'tel', ph: '(11) 99999-9999' },
                  { label: 'CPF / CNPJ', key: 'document', type: 'text', ph: 'Ex: 123.456.789-00' },
                  { label: 'Categoria', key: 'category', type: 'text', ph: 'Ex: Motorista Pro, Próprio' },
                  { label: 'Empresa', key: 'company_name', type: 'text', ph: 'Nome da Empresa (opcional)' },
                  { label: 'Data de Nascimento', key: 'birthday', type: 'date', ph: '' },
                  { label: 'Endereço', key: 'address', type: 'text', ph: 'Endereço completo (opcional)' },
                  { label: 'Observações', key: 'notes', type: 'text', ph: 'Notas internas adicionais' },
                ].map(f => (
                  <div key={f.key} className="space-y-1 text-left">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">{f.label}</label>
                    <input 
                      type={f.type} 
                      value={form[f.key]} 
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })} 
                      placeholder={f.ph} 
                      required={f.required}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-slate-200 outline-none text-xs"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
