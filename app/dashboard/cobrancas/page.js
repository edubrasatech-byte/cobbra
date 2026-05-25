'use client';
import { useState, useEffect } from 'react';

const STATUS = { 
  pending: { l: 'Pendente', c: 'text-amber-400', b: 'bg-amber-500/10 border border-amber-500/20' }, 
  reminder_sent: { l: 'Enviado', c: 'text-blue-400', b: 'bg-blue-500/10 border border-blue-500/20' }, 
  paid: { l: 'Pago', c: 'text-emerald-400', b: 'bg-emerald-500/10 border border-emerald-500/20' }, 
  overdue: { l: 'Vencido', c: 'text-rose-400', b: 'bg-rose-500/10 border border-rose-500/20' }, 
  cancelled: { l: 'Cancelado', c: 'text-slate-400', b: 'bg-slate-500/10 border border-slate-500/20' } 
};

export default function CobrancasPage() {
  const [charges, setCharges] = useState([]);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    client_id: '', 
    amount: '', 
    description: '', 
    due_date: '', 
    recurrence: 'once', 
    reminder_channel: 'both', 
    payment_method: 'pix', 
    daily_interest_rate: '0' 
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success'); 
  const [cobrancaHumor, setCobrancaHumor] = useState('gentil');
  const [cobrancaAiLoading, setCobrancaAiLoading] = useState(false);

  // Bottom drawer state for mobile interactive cards
  const [activeDrawerCharge, setActiveDrawerCharge] = useState(null);

  const triggerToast = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    if (type !== 'loading') {
      setTimeout(() => {
        setMsg('');
      }, 4000);
    }
  };

  // Rebate states
  const [showRebateModal, setShowRebateModal] = useState(false);
  const [rebateCharge, setRebateCharge] = useState(null);
  const [rebateAmount, setRebateAmount] = useState('');

  // User & Contract states
  const [user, setUser] = useState(null);
  const [selectedChargeForContract, setSelectedChargeForContract] = useState(null);

  function loadCharges() {
    setLoading(true);
    let url = '/api/cobrancas?limit=50';
    if (filter) url += `&status=${filter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setCharges(d.charges || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  function handleReload() {
    if (filter === '' && search === '') {
      loadCharges();
    } else {
      setFilter('');
      setSearch('');
    }
    triggerToast('Tabela de cobranças recarregada! 🔄', 'success');
  }

  useEffect(() => { 
    loadCharges(); 
    fetch('/api/clientes?limit=100').then(r=>r.json()).then(d=>setClients(d.clients||[])); 
    fetch('/api/auth/me').then(r=>r.json()).then(d=>{ 
      if (d.user) {
        setUser(d.user); 
        if (d.user.plan === 'starter') {
          setForm(prev => ({ ...prev, reminder_channel: 'email' }));
        }
      }
    });
  }, []);

  useEffect(() => { 
    loadCharges(); 
  }, [filter, search]);

  async function createCharge(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/cobrancas', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          ...form, 
          amount: parseFloat(form.amount), 
          daily_interest_rate: parseFloat(form.daily_interest_rate || '0') 
        }) 
      });
      if (res.ok) { 
        setShowModal(false); 
        setForm({ 
          client_id: '', 
          amount: '', 
          description: '', 
          due_date: '', 
          recurrence: 'once', 
          reminder_channel: 'both', 
          payment_method: 'pix', 
          daily_interest_rate: '0' 
        }); 
        loadCharges(); 
        triggerToast('Cobrança criada com sucesso! 🐍', 'success'); 
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar cobrança.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao criar cobrança.');
    }
  }

  async function handleRedigirComIA() {
    if (!form.client_id) {
      alert('Por favor, selecione um cliente primeiro.');
      return;
    }
    if (!form.amount) {
      alert('Por favor, insira o valor da cobrança.');
      return;
    }
    if (!form.due_date) {
      alert('Por favor, defina a data de vencimento.');
      return;
    }

    const client = clients.find(c => c.id === form.client_id);
    const clientName = client ? client.name : 'Cliente';
    const amountVal = parseFloat(form.amount).toFixed(2);
    const formattedDate = new Date(form.due_date + 'T12:00:00').toLocaleDateString('pt-BR');

    setCobrancaAiLoading(true);

    const promptText = `Olá Catarina, por favor redija uma mensagem curta e educada de lembrete de cobrança no tom '${cobrancaHumor}' para o cliente '${clientName}' no valor de R$ ${amountVal} com vencimento em ${formattedDate}. Não inclua nenhum cabeçalho, introdução ou bloco de código markdown. Retorne apenas o texto exato da mensagem pronto para ser enviado! 🐍`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setForm(prev => ({ ...prev, description: data.text.trim() }));
      } else {
        alert('Catarina está ocupada no momento. Tente novamente! 🐍');
      }
    } catch (e) {
      alert('Erro de conexão ao gerar texto de cobrança.');
    } finally {
      setCobrancaAiLoading(false);
    }
  }

  async function updateStatus(id, status) {
    await fetch(`/api/cobrancas/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status }) 
    });
    loadCharges(); 
    triggerToast('Status de pagamento atualizado! 💰', 'success');
  }

  async function deleteCharge(id) {
    if (!confirm('Excluir esta cobrança?')) return;
    await fetch(`/api/cobrancas/${id}`, { method: 'DELETE' });
    loadCharges(); 
    triggerToast('Cobrança excluída com sucesso! 🗑️', 'success');
  }

  async function sendManualReminder(c, channel) {
    if (channel === 'whatsapp' && user?.plan === 'starter') {
      triggerToast('O disparo via WhatsApp está disponível a partir do plano Crescimento. Faça upgrade para utilizar!', 'error');
      return;
    }
    
    if (channel === 'email' && !c.client_email) {
      triggerToast('Este cliente não possui e-mail cadastrado para receber lembretes.', 'error');
      return;
    }

    if (!user?.pix_key) {
      if (!confirm('Atenção: Você ainda não cadastrou sua Chave Pix nas Configurações do seu perfil! O lembrete será enviado, mas sem o QR Code e código Copia e Cola para pagamento imediato. Deseja enviar assim mesmo?')) {
        return;
      }
    }
    
    triggerToast(`Enviando cobrança avulsa via ${channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}... 🚀`, 'loading');
    
    const message = c.description || `Olá! Passando para lembrar sobre seu pagamento de R$ ${c.amount.toFixed(2)} com vencimento em ${new Date(c.due_date).toLocaleDateString('pt-BR')}.`;
    
    try {
      const res = await fetch('/api/lembretes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charge_id: c.id,
          channel: channel,
          message: message
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(`Sucesso: Cobrança enviada via ${channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}! 🚀`, 'success');
        loadCharges();
      } else {
        triggerToast(`Falha no envio: ${data.error || 'Erro inesperado.'}`, 'error');
      }
    } catch (e) {
      triggerToast(`Erro de conexão: ${e.message}`, 'error');
    }
  }

  async function handleRebateSubmit(e) {
    e.preventDefault();
    if (!rebateCharge || !rebateAmount || parseFloat(rebateAmount) <= 0) return;

    const res = await fetch(`/api/cobrancas/${rebateCharge.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rebateAmount: parseFloat(rebateAmount) })
    });

    if (res.ok) {
      setShowRebateModal(false);
      setRebateAmount('');
      setRebateCharge(null);
      loadCharges();
      triggerToast('Abatimento parcial registrado com sucesso! 💸', 'success');
    }
  }

  const handlePrintContract = () => {
    const printContent = document.getElementById('printable-contract-sheet').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Contrato - Cobbra</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h2 { text-align: center; text-transform: uppercase; margin-bottom: 30px; font-size: 20px; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
            h3 { font-size: 14px; text-transform: uppercase; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            p { font-size: 13px; text-align: justify; margin-bottom: 14px; }
            strong { color: #0f172a; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .sig-line { border-top: 1px solid #1e293b; text-align: center; padding-top: 8px; font-size: 12px; font-weight: 600; margin-top: 40px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Toast Alert */}
      {msg && (() => {
        let bg = 'bg-emerald-500 shadow-emerald-500/20'; 
        let icon = '✅';
        if (msgType === 'error') {
          bg = 'bg-rose-500 shadow-rose-500/20'; 
          icon = '❌';
        } else if (msgType === 'loading') {
          bg = 'bg-blue-500 shadow-blue-500/20'; 
          icon = '🔄';
        } else if (msgType === 'info') {
          bg = 'bg-slate-800 shadow-black/40'; 
          icon = '💡';
        }

        return (
          <div className={`fixed top-20 right-6 p-4 rounded-xl text-xs font-bold text-white z-50 flex items-center gap-3 shadow-lg border border-slate-700/10 animate-bounce ${bg}`}>
            {msgType === 'loading' ? (
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : <span>{icon}</span>}
            <span>{msg}</span>
          </div>
        );
      })()}

      {/* Minimal Header and Filter Panel */}
      <div className="flex flex-col gap-4 border-b border-slate-900/60 pb-5" style={{ paddingBottom: '20px' }}>
        
        {/* Row 1: Search Input + Reload Button + Add Charge Button (Unified single-row for extreme screen-space efficiency) */}
        <div className="flex items-center gap-2.5 w-full">
          {/* Search bar input */}
          <div className="relative flex-1 h-11 min-h-[44px]">
            <input 
              placeholder="Buscar cobranças..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full h-11 min-h-[44px] py-2.5 text-xs bg-[#0C0E1A] border border-slate-800/60 text-white rounded-xl outline-none focus:border-emerald-500 transition-colors placeholder-slate-500 font-medium"
              style={{ paddingLeft: '38px' }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">🔍</span>
          </div>

          <button 
            onClick={handleReload}
            title="Recarregar dados"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#0C0E1A] border border-slate-800/60 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 transition-all cursor-pointer group active:scale-95"
          >
            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path>
            </svg>
          </button>
          
          <button 
            onClick={() => setShowModal(true)} 
            className="h-11 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 border border-emerald-400/20 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            <span className="text-sm font-bold">+</span>
            <span className="hidden sm:inline">Nova Cobrança</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>

        {/* Row 2: Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          <button 
            onClick={() => setFilter('')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
              filter === '' 
                ? 'bg-slate-100 text-slate-900 border-white' 
                : 'bg-slate-900 text-slate-400 border-slate-800/60 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Todos
          </button>
          {Object.entries(STATUS).map(([k, v]) => {
            const isSelected = filter === k;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#10B981] text-white border-[#10B981]'
                    : 'bg-slate-900 text-slate-400 border-slate-800/60 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {v.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* 📱 Mobile UI: Card Lists with Drawer Menu (Operable with one hand) */}
      <div className="md:hidden space-y-3">
        {charges.map(c => {
          const interest = calcInterest(c);
          return (
            <div 
              key={c.id} 
              onClick={() => setActiveDrawerCharge(c)}
              className="bg-[#0C0E1A] hover:bg-slate-900/40 border border-slate-800/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98]"
              style={{ padding: '16px' }}
            >
              <div className="min-w-0 pr-4 flex-1">
                <p className="font-extrabold text-sm text-slate-100 truncate">{c.client_name || 'Cliente Sem Nome'}</p>
                <p className="text-[11px] text-slate-400 truncate mt-1">{c.description || 'Cobrança Avulsa'}</p>
                <p className="text-[10px] text-slate-500 mt-2.5 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  Vencimento: {new Date(c.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2.5">
                <p className={`font-black text-sm tracking-tight ${c.status === 'paid' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {fmt(c.amount + interest)}
                </p>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border scale-90 origin-right ${STATUS[c.status]?.b} ${STATUS[c.status]?.c}`}>
                  {STATUS[c.status]?.l || c.status}
                </span>
              </div>
            </div>
          );
        })}

        {charges.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-[#0C0E1A] rounded-2xl border border-slate-800/40">
            {loading ? 'Carregando cobranças...' : 'Nenhuma cobrança encontrada'}
          </div>
        )}
      </div>


      {/* 🖥️ Desktop UI: Flat Minimalist Stripe-style Table */}
      <div className="hidden md:block bg-[#0C0E1A] rounded-xl border border-slate-800/40 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Descrição</th>
                <th className="px-5 py-3.5">Valor Original</th>
                <th className="px-5 py-3.5">Juros Diários</th>
                <th className="px-5 py-3.5">Vencimento</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Canal</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-medium">
              {charges.map(c => {
                const interest = calcInterest(c);
                return (
                  <tr key={c.id} className="hover:bg-slate-900/20 text-slate-200 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-100">{c.client_name || 'N/A'}</td>
                    <td className="px-5 py-4 text-slate-400 max-w-[180px] truncate">{c.description}</td>
                    <td className="px-5 py-4 font-extrabold">{fmt(c.amount)}</td>
                    <td className={`px-5 py-4 ${interest > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                      {interest > 0 ? `+${fmt(interest)} (${c.daily_interest_rate}%/dia)` : c.daily_interest_rate > 0 ? `0,00 (${c.daily_interest_rate}%/dia)` : '-'}
                    </td>
                    <td className="px-5 py-4 text-slate-400">{new Date(c.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS[c.status]?.b} ${STATUS[c.status]?.c}`}>
                        {STATUS[c.status]?.l || c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {c.reminder_channel === 'both' ? '📱+✉️' : c.reminder_channel === 'whatsapp' ? '📱' : '✉️'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-1.5 justify-end flex-wrap">
                        {c.status !== 'paid' && c.status !== 'cancelled' && (
                          <>
                            <button 
                              onClick={() => updateStatus(c.id, 'paid')} 
                              className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold transition-all"
                            >
                              ✓ Pago
                            </button>
                            
                            <button 
                              onClick={() => {
                                setRebateCharge(c);
                                setShowRebateModal(true);
                              }} 
                              className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold transition-all"
                            >
                              Abater
                            </button>
                            
                            <button 
                              onClick={() => sendManualReminder(c, 'whatsapp')} 
                              className="px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold transition-all"
                            >
                              📱 Whats
                            </button>
                            
                            <button 
                              onClick={() => sendManualReminder(c, 'email')} 
                              className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold transition-all"
                            >
                              ✉️ Email
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => {
                            if (user?.plan === 'starter') {
                              alert('A emissão e impressão de contratos estão disponíveis exclusivamente nos planos Crescimento e Cobra Pro. Faça upgrade para ter acesso!');
                              return;
                            }
                            setSelectedChargeForContract(c);
                          }} 
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/60"
                        >
                          📄 Contrato
                        </button>
                        
                        <button 
                          onClick={() => deleteCharge(c.id)} 
                          className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/35 text-rose-400 font-bold transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {charges.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500 text-xs flex-shrink-0">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-6">
                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin flex-shrink-0 mx-auto"></div>
                        <p className="text-slate-500 text-xs font-semibold">Carregando cobranças...</p>
                      </div>
                    ) : 'Nenhuma cobrança encontrada'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 Mobile One-Hand Bottom Drawer Sheet */}
      {activeDrawerCharge && (
        <>
          {/* Drawer Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/95 z-[45] md:hidden"
            onClick={() => setActiveDrawerCharge(null)}
          />
          
          <div className="fixed inset-x-0 bottom-0 bg-[#0C0E1A] border-t border-slate-800/80 rounded-t-3xl z-[46] md:hidden space-y-5 shadow-2xl" style={{ padding: '24px' }}>
            
            {/* Grabber Handle */}
            <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto" onClick={() => setActiveDrawerCharge(null)} />
            
            {/* Header info */}
            <div className="text-center">
              <h4 className="font-extrabold text-slate-100 text-base">{activeDrawerCharge.client_name}</h4>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px] mx-auto mt-1">{activeDrawerCharge.description || 'Cobrança Avulsa'}</p>
              
              <div className="flex items-center justify-center gap-2.5 mt-3">
                <span className="text-lg font-black text-slate-200">
                  {fmt(activeDrawerCharge.amount + calcInterest(activeDrawerCharge))}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${STATUS[activeDrawerCharge.status]?.b} ${STATUS[activeDrawerCharge.status]?.c}`}>
                  {STATUS[activeDrawerCharge.status]?.l}
                </span>
              </div>
            </div>
            
            {/* Quick Action Grid (Big thumb-friendly buttons) */}
            <div className="grid grid-cols-3 gap-2.5">
              {activeDrawerCharge.status !== 'paid' && activeDrawerCharge.status !== 'cancelled' && (
                <>
                  <button 
                    onClick={() => {
                      updateStatus(activeDrawerCharge.id, 'paid');
                      setActiveDrawerCharge(null);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all active:scale-95"
                  >
                    <span className="text-lg mb-1">✓</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide">Pago</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setRebateCharge(activeDrawerCharge);
                      setShowRebateModal(true);
                      setActiveDrawerCharge(null);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all active:scale-95"
                  >
                    <span className="text-lg mb-1">💸</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide">Abater</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      sendManualReminder(activeDrawerCharge, 'whatsapp');
                      setActiveDrawerCharge(null);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all active:scale-95"
                  >
                    <span className="text-lg mb-1">📱</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide">Whats</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      sendManualReminder(activeDrawerCharge, 'email');
                      setActiveDrawerCharge(null);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-all active:scale-95"
                  >
                    <span className="text-lg mb-1">✉️</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide">Email</span>
                  </button>
                </>
              )}
              
              <button 
                onClick={() => {
                  if (user?.plan === 'starter') {
                    alert('A emissão e impressão de contratos estão disponíveis exclusivamente nos planos Crescimento e Cobra Pro. Faça upgrade para ter acesso!');
                    return;
                  }
                  setSelectedChargeForContract(activeDrawerCharge);
                  setActiveDrawerCharge(null);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 border border-slate-800/60 transition-all active:scale-95"
              >
                <span className="text-lg mb-1">📄</span>
                <span className="text-[9px] font-bold uppercase tracking-wide">Contrato</span>
              </button>
              
              <button 
                onClick={() => {
                  deleteCharge(activeDrawerCharge.id);
                  setActiveDrawerCharge(null);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all active:scale-95"
              >
                <span className="text-lg mb-1">🗑️</span>
                <span className="text-[9px] font-bold uppercase tracking-wide">Excluir</span>
              </button>
            </div>

            <button 
              onClick={() => setActiveDrawerCharge(null)}
              className="w-full py-3 bg-slate-900 border border-slate-800/60 text-slate-400 rounded-xl text-xs font-bold transition-all"
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {/* 💸 Minimalist Rebate Modal Form */}
      {showRebateModal && rebateCharge && (
        <div 
          className="fixed inset-0 bg-slate-950/95 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowRebateModal(false);
            setRebateCharge(null);
          }}
        >
          <div onClick={e => e.stopPropagation()} className="bg-[#0C0E1A] rounded-2xl p-6 w-full max-w-sm border border-slate-800/60 shadow-2xl" style={{ padding: '24px' }}>
            <h3 className="text-base font-bold text-slate-100 mb-1">Abatimento de Fatura</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Deduza uma quantia paga avulso da cobrança <strong className="text-slate-300">{rebateCharge.description}</strong>.
            </p>
            <form onSubmit={handleRebateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">Valor do Abatimento (R$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={rebateCharge.amount}
                  value={rebateAmount}
                  onChange={e => setRebateAmount(e.target.value)}
                  placeholder="Ex: 50.00"
                  className="w-full py-2 px-3 text-sm bg-slate-900 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <span className="block text-[10px] text-slate-500 mt-1">
                  Saldo pendente na fatura: {fmt(rebateCharge.amount)}
                </span>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowRebateModal(false);
                    setRebateCharge(null);
                  }} 
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-800 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏗️ Create Modal (New Charge) */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-950/95 z-[50] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-[#0C0E1A] rounded-2xl p-6 w-full max-w-lg border border-slate-800/60 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ padding: '24px' }}
          >
            <h3 className="text-base font-bold text-slate-100 mb-5">Nova Cobrança</h3>
            
            <form onSubmit={createCharge} className="space-y-5">
              
              {/* Client Selection */}
              <div>
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Cliente *</label>
                <select 
                  value={form.client_id} 
                  onChange={e => setForm({ ...form, client_id: e.target.value })} 
                  className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all cursor-pointer focus:ring-1 focus:ring-emerald-500/20"
                  required
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>

              {/* Amount & Due Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Valor (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    value={form.amount} 
                    onChange={e => setForm({ ...form, amount: e.target.value })} 
                    className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all focus:ring-1 focus:ring-emerald-500/20" 
                    placeholder="0,00"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Vencimento *</label>
                  <input 
                    type="date" 
                    value={form.due_date} 
                    onChange={e => setForm({ ...form, due_date: e.target.value })} 
                    className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all cursor-pointer focus:ring-1 focus:ring-emerald-500/20" 
                    required 
                  />
                </div>
              </div>
              
              {/* AI Writer Helper Option */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-900/30 p-4 rounded-xl border border-slate-800/40" style={{ marginTop: '24px' }}>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Tom da Cobrança (AI Writer)</label>
                  <select 
                    value={cobrancaHumor} 
                    onChange={e => setCobrancaHumor(e.target.value)} 
                    className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-slate-300 rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all cursor-pointer focus:ring-1 focus:ring-emerald-500/20"
                  >
                    <option value="gentil">😇 Gentil (Amigável)</option>
                    <option value="firme">👔 Firme (Profissional)</option>
                    <option value="urgente">🚨 Urgente (Importante)</option>
                    <option value="divertido">🐍 Divertido (Trocadilhos)</option>
                  </select>
                </div>
                
                <button 
                  type="button" 
                  onClick={handleRedigirComIA}
                  disabled={cobrancaAiLoading}
                  className="w-full py-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {cobrancaAiLoading ? 'Escrevendo...' : '🪄 Redigir com IA'}
                </button>
              </div>

              {/* Description textarea */}
              <div style={{ marginTop: '24px' }}>
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Descrição / Mensagem de Cobrança</label>
                <textarea 
                  rows="3"
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  placeholder="Ex: Lembrete da parcela mensal. Clique no botão de IA acima para redigir um texto incrível!" 
                  className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all resize-y focus:ring-1 focus:ring-emerald-500/20" 
                />
              </div>
              
              {/* Recurrence & Late fee Interest */}
              <div className="grid grid-cols-2 gap-4" style={{ marginTop: '24px' }}>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Recorrência</label>
                  <select 
                    value={form.recurrence} 
                    onChange={e => setForm({ ...form, recurrence: e.target.value })} 
                    className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all cursor-pointer focus:ring-1 focus:ring-emerald-500/20"
                  >
                    <option value="once">Única</option>
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Juros Diários Pós-Vencimento (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={form.daily_interest_rate} 
                    onChange={e => setForm({ ...form, daily_interest_rate: e.target.value })} 
                    placeholder="Ex: 0.1" 
                    className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all focus:ring-1 focus:ring-emerald-500/20" 
                  />
                </div>
              </div>

              {/* Channels & Payment Method Grid */}
              <div className="grid grid-cols-2 gap-4" style={{ marginTop: '24px' }}>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Canal de Lembrete</label>
                  <select 
                    value={form.reminder_channel} 
                    onChange={e => setForm({ ...form, reminder_channel: e.target.value })} 
                    className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all cursor-pointer focus:ring-1 focus:ring-emerald-500/20"
                  >
                    {user?.plan !== 'starter' && <option value="both">WhatsApp + Email</option>}
                    {user?.plan !== 'starter' && <option value="whatsapp">WhatsApp</option>}
                    <option value="email">E-mail</option>
                  </select>
                  {user?.plan === 'starter' && (
                    <span className="block text-[10px] text-amber-500 mt-1.5">
                      ⚠️ WhatsApp requer plano superior.
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Método de Liquidação</label>
                  <select 
                    value={form.payment_method} 
                    onChange={e => setForm({ ...form, payment_method: e.target.value })} 
                    className="w-full py-3.5 px-4 text-sm bg-[#090b14] border border-slate-800/80 text-white rounded-xl outline-none focus:border-emerald-500 focus:bg-[#06070c] transition-all cursor-pointer focus:ring-1 focus:ring-emerald-500/20"
                  >
                    <option value="pix">Pix</option>
                    <option value="boleto">Boleto</option>
                    <option value="link">Link</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4" style={{ marginTop: '32px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider border border-emerald-400/20 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                >
                  Criar Cobrança
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Contract Sheet Preview Modal */}
      {selectedChargeForContract && (() => {
        const c = selectedChargeForContract;
        const client = clients.find(cl => cl.id === c.client_id) || {};
        const formattedDate = new Date().toLocaleDateString('pt-BR');
        const dueDateFormatted = new Date(c.due_date).toLocaleDateString('pt-BR');
        
        return (
          <div 
            className="fixed inset-0 bg-slate-950/95 z-[50] flex items-center justify-center p-4"
            onClick={() => setSelectedChargeForContract(null)}
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="bg-[#0C0E1A] rounded-2xl p-6 w-full max-w-2xl border border-slate-800/60 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ padding: '24px' }}
            >
              
              <div className="flex justify-between items-center border-b border-slate-800/40 pb-4 mb-4">
                <h3 className="text-sm font-bold text-slate-100">📄 Instrumento de Contrato</h3>
                <button onClick={() => setSelectedChargeForContract(null)} className="w-8 h-8 rounded-full bg-slate-800/40 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-colors">×</button>
              </div>

              {/* Printable sheet container */}
              <div 
                id="printable-contract-sheet" 
                className="bg-white text-[#1e293b] p-8 rounded-xl shadow-inner mb-6 font-serif leading-relaxed text-xs max-h-[50vh] overflow-y-auto"
              >
                <h2 className="text-center text-sm font-extrabold mb-6 uppercase border-b-2 border-[#0f172a] pb-2">
                  INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS
                </h2>
                
                <p className="text-justify mb-4">Pelo presente instrumento particular, de um lado:</p>
                <p className="text-justify mb-4">
                  <strong>CONTRATADA:</strong> <strong>{user?.business_name || user?.name || 'PRESTADOR DE SERVIÇOS'}</strong>, doravante denominada simplesmente CONTRATADA.
                </p>
                <p className="text-justify mb-4">E de outro lado:</p>
                <p className="text-justify mb-4">
                  <strong>CONTRATANTE:</strong> <strong>{c.client_name || 'N/A'}</strong>, {client.document ? `inscrito(a) no CPF/CNPJ sob o nº ${client.document},` : ''} {client.address ? `residente e domiciliado(a) em ${client.address},` : ''} doravante denominado simplesmente CONTRATANTE.
                </p>
                <p className="text-justify mb-4">Têm, entre si, justo e contratado o seguinte:</p>

                <h3 className="text-xs font-bold mt-4 mb-2 uppercase border-b border-slate-300 pb-1">
                  CLÁUSULA PRIMEIRA – DO OBJETO
                </h3>
                <p className="text-justify mb-4">
                  O objeto del presente contrato consiste na realização dos seguintes serviços / fornecimento de produtos pela CONTRATADA: <strong>{c.description || 'Prestação de serviços diversos conforme combinado'}</strong>.
                </p>

                <h3 className="text-xs font-bold mt-4 mb-2 uppercase border-b border-slate-300 pb-1">
                  CLÁUSULA SEGUNDA – DO VALOR E DO VENCIMENTO
                </h3>
                <p className="text-justify mb-4">
                  Pela prestação dos serviços referidos na cláusula anterior, a CONTRATANTE pagará à CONTRATADA o valor bruto de <strong>{fmt(c.amount)}</strong>, com vencimento impreterivelmente em <strong>{dueDateFormatted}</strong>, através de <strong>{c.payment_method?.toUpperCase()}</strong>.
                </p>

                <h3 className="text-xs font-bold mt-4 mb-2 uppercase border-b border-slate-300 pb-1">
                  CLÁUSULA TERCEIRA – DOS ENCARGOS POR ATRASO
                </h3>
                <p className="text-justify mb-4">
                  Em caso de inadimplemento da parcela referida na cláusula segunda até a data estabelecida, serão aplicados juros diários moratórios de <strong>{c.daily_interest_rate || 0}% ao dia</strong> pro rata die, a contar do primeiro dia subsequente ao vencimento até o dia de seu integral pagamento.
                </p>

                <h3 className="text-xs font-bold mt-4 mb-2 uppercase border-b border-slate-300 pb-1">
                  CLÁUSULA QUARTA – DO FORO
                </h3>
                <p className="text-justify mb-4">
                  Fica eleito o foro da comarca da CONTRATADA para dirimir quaisquer controvérsias que possam originar-se deste contrato, com exclusão de qualquer outro por mais privilegiado que seja.
                </p>

                <p className="text-justify mt-6 mb-12">
                  E, por estarem assim justas e acordadas, as partes firmam o presente instrumento na data de <strong>{formattedDate}</strong>.
                </p>

                <div className="grid grid-cols-2 gap-8 mt-12">
                  <div className="border-t border-slate-800 text-center pt-2 font-bold text-[10px]">
                    CONTRATANTE<br />{c.client_name}
                  </div>
                  <div className="border-t border-slate-800 text-center pt-2 font-bold text-[10px]">
                    CONTRATADA<br />{user?.business_name || user?.name || 'PRESTADOR'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => setSelectedChargeForContract(null)} 
                  className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-800"
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  onClick={handlePrintContract} 
                  className="px-4 py-2.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
                >
                  🖨️ Imprimir / Salvar PDF
                </button>
              </div>

            </div>
          </div>
        );
      })()}
      
    </div>
  );
}
