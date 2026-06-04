'use client';

import { useState, useEffect } from 'react';

const HEALTH = { 
  good: { l: 'Bom pagador', c: 'text-emerald-400', b: 'bg-emerald-500/10 border-emerald-500/20', i: <svg className="w-3 h-3 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg> }, 
  warning: { l: 'Atenção', c: 'text-amber-500', b: 'bg-amber-500/10 border-amber-500/20', i: <svg className="w-3 h-3 text-amber-500 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> }, 
  critical: { l: 'Inadimplente', c: 'text-rose-500', b: 'bg-rose-500/10 border-rose-500/20', i: <svg className="w-3 h-3 text-rose-500 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> } 
};

const STATUS = { 
  pending: { l: 'Pendente', c: 'text-amber-500', b: 'bg-amber-500/15' }, 
  reminder_sent: { l: 'Lembrete Enviado', c: 'text-blue-400', b: 'bg-blue-500/15' }, 
  paid: { l: 'Pago', c: 'text-emerald-400', b: 'bg-emerald-500/15' }, 
  overdue: { l: 'Vencido', c: 'text-rose-500', b: 'bg-rose-500/15' }, 
  cancelled: { l: 'Cancelado', c: 'text-muted-theme', b: 'bg-surface-theme/60' } 
};

// SVG Star helper
function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <svg 
        key={i} 
        className={`w-3.5 h-3.5 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-muted-theme"}`} 
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
  const [clientDocs, setClientDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

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

  const loadClientDocs = async (clientId) => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/clientes/${clientId}/documents`);
      const data = await res.json();
      setClientDocs(data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione apenas arquivos PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Tamanho máximo permitido: 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch(`/api/clientes/${selectedClient.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name.replace('.pdf', ''),
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_base64: base64
          })
        });
        if (res.ok) {
          showToast('PDF anexado com sucesso!');
          loadClientDocs(selectedClient.id);
        } else {
          const err = await res.json();
          alert(err.error || 'Erro ao fazer upload do PDF.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro de conexão ao enviar PDF.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfDownload = async (docId, fileName) => {
    try {
      const res = await fetch(`/api/clientes/${selectedClient.id}/documents/${docId}`);
      const data = await res.json();
      if (data.document && data.document.file_base64) {
        const base64 = data.document.file_base64;
        const linkSource = `data:application/pdf;base64,${base64}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
      } else {
        alert('Erro ao recuperar o arquivo PDF.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao baixar PDF.');
    }
  };

  const handlePdfDelete = async (docId) => {
    if (!confirm('Deseja realmente excluir este documento PDF?')) return;
    try {
      const res = await fetch(`/api/clientes/${selectedClient.id}/documents/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('PDF removido com sucesso!');
        loadClientDocs(selectedClient.id);
      } else {
        alert('Erro ao excluir documento.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao excluir PDF.');
    }
  };

  const handleClientAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Tamanho máximo da imagem: 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch(`/api/clientes/${selectedClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...selectedClient,
            avatar_url: base64
          })
        });
        if (res.ok) {
          showToast('Foto do cliente atualizada!');
          refreshSelectedClient(selectedClient.id);
        } else {
          const err = await res.json();
          alert(err.error || 'Erro ao atualizar foto.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro de conexão ao salvar foto.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRefundCharge = async (chargeId) => {
    if (!confirm('Deseja realmente estornar esta cobrança? O valor será deduzido do seu saldo e o status será marcado como reembolsado.')) return;
    try {
      const res = await fetch(`/api/cobrancas/${chargeId}/refund`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast('Cobrança estornada com sucesso!');
        refreshSelectedClient(selectedClient.id);
        fetch(`/api/cobrancas?client_id=${selectedClient.id}`)
          .then(r => r.json())
          .then(data => setClientCharges(data.charges || []));
      } else {
        const err = await res.json();
        alert(err.error || 'Falha ao estornar cobrança.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao realizar estorno.');
    }
  };

  useEffect(() => {
    loadClients();
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadClients(); }, [search, healthFilter]);

  // Load client charges and docs when client is selected
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
      loadClientDocs(selectedClient.id);
    } else {
      setClientCharges([]);
      setClientDocs([]);
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
      showToast('Cliente cadastrado com sucesso!'); 
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
    showToast('Pagamento confirmado com sucesso!');
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
      showToast('Abatimento registrado com sucesso!');
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
      return { l: 'Bom', c: 'text-emerald-400', b: 'bg-emerald-500/5', s: 4 };
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
            className="bg-surface-theme border border-theme rounded-xl px-3.5 py-2 text-xs text-primary-theme placeholder-slate-500 outline-none focus:border-emerald-500/40 h-10 min-h-[40px] transition-all"
          />
          <div className="flex gap-2">
            <select 
              value={healthFilter} 
              onChange={e => setHealthFilter(e.target.value)} 
              className="bg-surface-theme border border-theme rounded-xl px-3 py-2 text-xs text-secondary-theme outline-none focus:border-emerald-500/40 h-10 min-h-[40px] transition-all flex-1 min-w-[140px]"
            >
              <option value="">Status geral (Todos)</option>
              {Object.entries(HEALTH).map(([k, v]) => (
                <option key={k} value={k}>{v.l}</option>
              ))}
            </select>
            <button 
              onClick={loadClients} 
              className="h-10 min-h-[40px] w-10 bg-surface-theme border border-theme hover:bg-surface-theme text-secondary-theme hover:text-emerald-400 flex items-center justify-center rounded-xl transition-all cursor-pointer"
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
          className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-center gap-1.5"
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
              className="bg-card-theme hover:bg-card-hover-theme border border-theme hover:border-emerald-500/20 rounded-2xl p-4 cursor-pointer shadow-md transition-all flex flex-col justify-between group min-h-[150px]"
            >
              <div className="space-y-3">
                {/* Header card info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xs select-none flex-shrink-0">
                      {c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-theme font-semibold truncate leading-none mt-0.5">{c.category || 'Geral'}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex-shrink-0 ${h.b} ${h.c}`}>
                    {h.i} {h.l}
                  </span>
                </div>

                {/* Score rating summary */}
                <div className="bg-surface-theme rounded-xl p-2 border border-theme flex justify-between items-center text-[10px]">
                  <span className="text-muted-theme font-bold">Pontualidade:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black uppercase tracking-wider ${score.c}`}>{score.l}</span>
                    <StarRating rating={score.s} />
                  </div>
                </div>

                {/* Billing statistics summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card-theme rounded-lg p-2 border border-theme text-left">
                    <span className="text-[9px] text-muted-theme font-bold block">Cobrado</span>
                    <span className="text-[11px] font-bold text-secondary-theme">{fmt(c.total_charged)}</span>
                  </div>
                  <div className="bg-card-theme rounded-lg p-2 border border-theme text-left">
                    <span className="text-[9px] text-muted-theme font-bold block">Pago</span>
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
              <div className="border-t border-theme pt-2.5 mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] text-muted-theme truncate max-w-[70%]">
                  {c.phone && <span className="truncate"><svg className="w-3 h-3 text-muted-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> {c.phone}</span>}
                </div>
                
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold text-emerald-400 group-hover:underline transition-all">Ver Histórico →</span>
                </div>
              </div>
            </div>
          );
        })}

        {clients.length === 0 && (
          <div className="col-span-full py-16 bg-card-theme border border-theme rounded-3xl text-center text-xs text-muted-theme">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="font-semibold">Buscando clientes...</span>
              </div>
            ) : 'Nenhum cliente localizado.'}
          </div>
        )}
      </div>

      {/* ==================== 👤 DETAILED CLIENT DRAWER MODAL ==================== */}
      {selectedClient && (
        <div 
          className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedClient(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-surface-theme border border-theme rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl relative p-5 space-y-5"
          >
            {/* Top Close button */}
            <button 
              onClick={() => setSelectedClient(null)} 
              className="absolute top-4 right-4 text-secondary-theme hover:text-primary-theme text-lg cursor-pointer"
            >
              ×
            </button>

            {/* Profile Info block */}
            <div className="flex gap-3.5 items-center pb-4 border-b border-theme/40">
              <div className="relative group w-12 h-12 flex-shrink-0 select-none">
                {selectedClient.avatar_url ? (
                  <img src={selectedClient.avatar_url} alt={selectedClient.name} className="w-12 h-12 rounded-full object-cover border border-theme" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-sm">
                    {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] text-white font-bold">
                  Alterar
                  <input type="file" accept="image/*" onChange={handleClientAvatarUpload} className="hidden" />
                </label>
              </div>
              <div className="min-w-0 w-full text-left">
                <h3 className="text-base font-black text-primary-theme leading-tight truncate">{selectedClient.name}</h3>
                <p className="text-[11px] text-secondary-theme mt-1 truncate">
                  {selectedClient.category || 'Geral'} • {selectedClient.phone || 'Sem contato'} • {selectedClient.email || 'Sem e-mail'}
                </p>
                
                {/* Secondary data wrapper */}
                {(selectedClient.document || selectedClient.birthday || selectedClient.address) && (
                  <div className="mt-2.5 p-2 rounded-lg bg-input-theme border border-theme text-[10px] text-secondary-theme space-y-1">
                    {selectedClient.document && <p><svg className="w-3 h-3 text-muted-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> <strong>Documento:</strong> {selectedClient.document}</p>}
                    {selectedClient.birthday && <p><svg className="w-3 h-3 text-muted-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> <strong>Nascimento:</strong> {new Date(selectedClient.birthday).toLocaleDateString('pt-BR')}</p>}
                    {selectedClient.address && <p className="truncate"><svg className="w-3 h-3 text-muted-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" /></svg> <strong>Endereço:</strong> {selectedClient.address}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Overview quick cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-card-theme border border-theme rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] text-muted-theme font-bold block uppercase leading-none">Score</span>
                <span className={`text-xs font-black mt-1.5 ${getPayerScore(selectedClient).c}`}>
                  {getPayerScore(selectedClient).l}
                </span>
              </div>
              <div className="bg-card-theme border border-theme rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] text-muted-theme font-bold block uppercase leading-none">Cobrado</span>
                <span className="text-xs font-black text-primary-theme mt-1.5">{fmt(selectedClient.total_charged)}</span>
              </div>
              <div className="bg-card-theme border border-theme rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] text-muted-theme font-bold block uppercase leading-none">Pago</span>
                <span className="text-xs font-black text-emerald-400 mt-1.5">{fmt(selectedClient.total_paid)}</span>
              </div>
              <div className={`border rounded-xl p-3 flex flex-col justify-between ${
                selectedClient.total_overdue > 0 ? 'bg-rose-500/5 border-rose-500/10' : 'bg-card-theme border-theme'
              }`}>
                <span className="text-[9px] text-muted-theme font-bold block uppercase leading-none">Em Aberto</span>
                <span className={`text-xs font-black mt-1.5 ${selectedClient.total_overdue > 0 ? 'text-rose-400' : 'text-secondary-theme'}`}>
                  {fmt(selectedClient.total_overdue)}
                </span>
              </div>
            </div>

            {/* Invoices list statement */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-primary-theme uppercase tracking-wider">Histórico de Cobranças</h4>
              
              {loadingCharges ? (
                <p className="text-muted-theme text-xs text-center py-6">Carregando faturas...</p>
              ) : clientCharges.length === 0 ? (
                <p className="text-muted-theme text-xs text-center py-6">Nenhuma cobrança ativa registrada.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {clientCharges.map(c => {
                    const interest = calcInterest(c);
                    return (
                      <div 
                        key={c.id} 
                        className="bg-card-theme border border-theme rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:border-theme transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-bold text-primary-theme truncate">{c.description || 'Cobrança Sem Descrição'}</p>
                          <p className="text-[9px] text-muted-theme font-semibold leading-none">
                            Vencimento: {new Date(c.due_date + 'T12:00:00').toLocaleDateString('pt-BR')} • {c.payment_method?.toUpperCase()}
                          </p>
                          {interest > 0 && (
                            <span className="text-[9px] text-amber-500 font-bold block mt-1">
                              <svg className="w-3 h-3 text-amber-500 inline mr-1 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> Juros de mora: +{fmt(interest)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-theme/30 pt-2 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-black text-primary-theme">{fmt(c.amount + interest)}</p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-1 inline-block ${STATUS[c.status]?.b} ${STATUS[c.status]?.c}`}>
                              {STATUS[c.status]?.l}
                            </span>
                          </div>

                          {c.status !== 'paid' && c.status !== 'cancelled' ? (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => setAbaterCharge(c)}
                                className="px-2.5 py-1.5 rounded-lg bg-surface-theme border border-theme hover:bg-card-hover-theme hover:text-primary-theme text-primary-theme font-extrabold text-[10px] transition-colors cursor-pointer"
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
                          ) : c.status === 'paid' && (
                            <button 
                              onClick={() => handleRefundCharge(c.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 font-extrabold text-[10px] transition-all cursor-pointer"
                            >
                              Estornar
                            </button>
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
              <div className="p-3 bg-input-theme rounded-xl border border-theme text-[10px] text-muted-theme leading-normal text-left">
                <strong className="text-secondary-theme font-bold block mb-1">Observações do Cliente:</strong>
                {selectedClient.notes}
              </div>
            )}

            {/* PDF Documents and Archive Panel */}
            <div className="p-4 bg-card-theme rounded-2xl border border-theme space-y-3 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-theme/40">
                <h4 className="text-xs font-black text-primary-theme uppercase tracking-wider flex items-center gap-1.5">
                  📁 Documentos e Arquivo PDF
                </h4>
                <label className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-[10px] cursor-pointer transition-all">
                  + Anexar PDF
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
              </div>

              {loadingDocs ? (
                <p className="text-[11px] text-muted-theme text-center py-2">Carregando documentos...</p>
              ) : clientDocs.length === 0 ? (
                <p className="text-[11px] text-muted-theme text-center py-2">Nenhum documento anexado ao perfil.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {clientDocs.map(doc => (
                    <div key={doc.id} className="p-2 rounded-xl bg-input-theme border border-theme/60 flex items-center justify-between gap-3 text-[11px]">
                      <div className="min-w-0 flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        <div className="min-w-0">
                          <p className="font-bold text-primary-theme truncate" title={doc.file_name}>{doc.name}</p>
                          <p className="text-[9px] text-muted-theme">{(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button 
                          onClick={() => handlePdfDownload(doc.id, doc.file_name)}
                          className="p-1 text-emerald-400 hover:text-emerald-300 font-bold transition-all text-[10px]"
                          title="Baixar PDF"
                        >
                          Baixar
                        </button>
                        <button 
                          onClick={() => handlePdfDelete(doc.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 font-bold transition-all text-[10px]"
                          title="Excluir PDF"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete button option */}
            <div className="flex justify-between items-center pt-3 border-t border-theme/40">
              <button 
                onClick={(e) => deleteClient(selectedClient.id, e)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500 hover:text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Excluir Cadastro
              </button>
              <button 
                onClick={() => setSelectedClient(null)}
                className="px-3.5 py-2 rounded-xl bg-surface-theme hover:bg-card-hover-theme text-primary-theme font-bold text-xs transition-all cursor-pointer"
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
          className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setAbaterCharge(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-surface-theme border border-theme rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative"
          >
            <h3 className="text-base font-bold text-primary-theme">Abatimento Parcial</h3>
            <p className="text-xs text-secondary-theme leading-relaxed text-left">
              Registrar abatimento na cobrança: <strong className="text-primary-theme">{abaterCharge.description || 'Aluguel/Cobrança'}</strong><br />
              Valor total original: <strong className="text-primary-theme">{fmt(abaterCharge.amount)}</strong>
            </p>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-extrabold text-muted-theme uppercase tracking-wider block">Valor de Abatimento (R$)</label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max={abaterCharge.amount}
                placeholder="0,00" 
                value={rebateVal} 
                onChange={e => setRebateVal(e.target.value)} 
                className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-primary-theme outline-none text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setAbaterCharge(null)} 
                className="flex-1 py-2.5 rounded-xl bg-surface-theme hover:bg-card-hover-theme text-secondary-theme font-bold text-xs transition-all cursor-pointer"
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
          className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-surface-theme border border-theme rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4"
          >
            <h3 className="text-base font-bold text-primary-theme text-left">Novo Cliente</h3>
            
            <form onSubmit={createClient} className="space-y-3.5">
              <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-3">
                {[
                  { label: 'Nome *', key: 'name', type: 'text', ph: 'Nome completo', required: true },
                  { label: 'E-mail', key: 'email', type: 'email', ph: 'email@exemplo.com' },
                  { label: 'Telefone', key: 'phone', type: 'tel', ph: '(11) 99999-9999' },
                  { label: 'CPF / CNPJ', key: 'document', type: 'text', ph: 'Ex: 123.456.789-00' },
                  { label: 'Categoria', key: 'category', type: 'text', ph: 'Ex: Mensalista, Avulso, VIP' },
                  { label: 'Empresa', key: 'company_name', type: 'text', ph: 'Nome da Empresa (opcional)' },
                  { label: 'Data de Nascimento', key: 'birthday', type: 'date', ph: '' },
                  { label: 'Endereço', key: 'address', type: 'text', ph: 'Endereço completo (opcional)' },
                  { label: 'Observações', key: 'notes', type: 'text', ph: 'Notas internas adicionais' },
                ].map(f => (
                  <div key={f.key} className="space-y-1 text-left">
                    <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">{f.label}</label>
                    <input 
                      type={f.type} 
                      value={form[f.key]} 
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })} 
                      placeholder={f.ph} 
                      required={f.required}
                      className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3 py-2 text-primary-theme outline-none text-xs"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-theme">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-2.5 rounded-xl bg-surface-theme hover:bg-card-hover-theme text-secondary-theme font-bold text-xs transition-all cursor-pointer"
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
