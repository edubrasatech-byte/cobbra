'use client';
import { useState, useEffect } from 'react';

const FREQUENCY_LABELS = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal'
};

const HEALTH = {
  good: { l: 'Excelente', c: '#10b981', b: 'rgba(16,185,129,0.15)', i: '😊' },
  warning: { l: 'Regular', c: '#f59e0b', b: 'rgba(245,158,11,0.15)', i: '⚠️' },
  critical: { l: 'Alto Risco', c: '#ef4444', b: 'rgba(239,68,68,0.15)', i: '🚨' }
};

export default function CustodiaPage() {
  const [contracts, setContracts] = useState([]);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({
    totalLocado: 0,
    saldoAtualLocado: 0,
    taxaDiariaTotal: 0,
    ativosCount: 0
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAmortizeModal, setShowAmortizeModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Active items/actions state
  const [editingContract, setEditingContract] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  
  // Forms state
  const [form, setForm] = useState({
    client_id: '',
    principal_amount: '',
    daily_fee: '',
    billing_frequency: 'daily',
    collateral_info: '',
    custom_message_template: '',
    late_interest_rate: '1'
  });

  const [amortizeAmount, setAmortizeAmount] = useState('');
  const [chargeResult, setChargeResult] = useState(null); // stores generated charge for checkout visualization

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function loadData() {
    setLoading(true);
    fetch('/api/custodia')
      .then(r => r.json())
      .then(d => {
        setContracts(d.contracts || []);
        setHistory(d.history || []);
        if (d.metrics) {
          setMetrics(d.metrics);
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
  }, []);

  // Set default message template placeholder when creating/updating
  useEffect(() => {
    if (!form.custom_message_template && !editingContract) {
      setForm(prev => ({
        ...prev,
        custom_message_template: 'Olá {cliente_nome}! ⚡ Segue a taxa de custódia diária do capital locado sob sua responsabilidade, no valor de {taxa_diaria}. Pague pelo Pix copia e cola ou no link: {link_pagamento}'
      }));
    }
  }, [form.client_id, editingContract]);

  // Form handlers
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.client_id || !form.principal_amount || !form.daily_fee) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      client_id: form.client_id,
      principal_amount: parseFloat(form.principal_amount),
      daily_fee: parseFloat(form.daily_fee),
      billing_frequency: form.billing_frequency,
      collateral_info: form.collateral_info,
      custom_message_template: form.custom_message_template,
      late_interest_rate: parseFloat(form.late_interest_rate) || 1
    };

    const url = editingContract ? `/api/custodia/${editingContract.id}` : '/api/custodia';
    const method = editingContract ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingContract ? { ...payload, action: 'edit' } : payload)
    });

    if (res.ok) {
      setShowFormModal(false);
      setEditingContract(null);
      setForm({ client_id: '', principal_amount: '', daily_fee: '', billing_frequency: 'daily', collateral_info: '', custom_message_template: '', late_interest_rate: '1' });
      loadData();
      showToast(editingContract ? 'Contrato de custódia atualizado! 🔒' : 'Contrato de custódia criado com sucesso! 🔒');
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao salvar contrato de custódia.');
    }
  }

  // Trigger manual billing fee for today
  async function handleTriggerManualFee(contractId) {
    if (!confirm('Deseja realmente gerar a taxa diária de custódia para hoje manualmente?')) return;
    
    try {
      const res = await fetch(`/api/custodia/${contractId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok) {
        loadData();
        showToast('Taxa de hoje gerada e cobrada com sucesso! ⚡');
        if (data.charge) {
          setChargeResult({
            title: 'Taxa Diária Gerada',
            amount: data.charge.amount,
            paymentLink: data.charge.payment_link,
            pixCopyPaste: data.charge.pix_copy_paste
          });
          setShowResultModal(true);
        }
      } else {
        alert(data.error || 'Falha ao processar cobrança manual.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao servidor.');
    }
  }

  // Amortize principal
  async function handleAmortizeSubmit(e) {
    e.preventDefault();
    if (!selectedContract || !amortizeAmount || parseFloat(amortizeAmount) <= 0) {
      alert('Preencha um valor válido para amortização.');
      return;
    }

    try {
      const res = await fetch(`/api/custodia/${selectedContract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'amortize',
          amount: parseFloat(amortizeAmount)
        })
      });
      const data = await res.json();

      if (res.ok) {
        setShowAmortizeModal(false);
        setAmortizeAmount('');
        loadData();
        showToast('Cobrança de amortização criada! Envie o link ou Pix de pagamento ao cliente.');
        if (data.charge) {
          setChargeResult({
            title: `Amortização de R$ ${data.charge.amount.toFixed(2)}`,
            amount: data.charge.amount,
            paymentLink: data.charge.payment_link,
            pixCopyPaste: data.charge.pix_copy_paste
          });
          setShowResultModal(true);
        }
      } else {
        alert(data.error || 'Erro ao processar amortização.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao servidor.');
    }
  }

  // Quitar integral
  async function handleRepaySubmit() {
    if (!selectedContract) return;

    try {
      const res = await fetch(`/api/custodia/${selectedContract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'repay'
        })
      });
      const data = await res.json();

      if (res.ok) {
        setShowRepayModal(false);
        loadData();
        showToast('Cobrança de quitação integral gerada! Envie os dados de pagamento ao cliente.');
        if (data.charge) {
          setChargeResult({
            title: `Quitação de R$ ${data.charge.amount.toFixed(2)}`,
            amount: data.charge.amount,
            paymentLink: data.charge.payment_link,
            pixCopyPaste: data.charge.pix_copy_paste
          });
          setShowResultModal(true);
        }
      } else {
        alert(data.error || 'Erro ao processar quitação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
  }

  // Cancelar contrato manualmente
  async function handleCancelContract(contractId) {
    if (!confirm('Deseja realmente cancelar este contrato de custódia de capital? Isso encerrará a cobrança diária imediatamente e marcará o contrato como cancelado.')) return;

    try {
      const res = await fetch(`/api/custodia/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
      if (res.ok) {
        loadData();
        showToast('Contrato encerrado e finalizado! 🔒');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao cancelar contrato.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
  }

  // Helper actions
  function handleEditClick(contract) {
    setEditingContract(contract);
    setForm({
      client_id: contract.client_id,
      principal_amount: contract.principal_amount.toString(),
      daily_fee: contract.daily_fee.toString(),
      billing_frequency: contract.billing_frequency || 'daily',
      collateral_info: contract.collateral_info || '',
      custom_message_template: contract.custom_message_template || '',
      late_interest_rate: contract.late_interest_rate ? (contract.late_interest_rate * 100).toString() : '1'
    });
    setShowFormModal(true);
  }

  function handleCreateClick() {
    setEditingContract(null);
    setForm({
      client_id: '',
      principal_amount: '',
      daily_fee: '',
      billing_frequency: 'daily',
      collateral_info: '',
      custom_message_template: 'Olá {cliente_nome}! ⚡ Segue a taxa de custódia diária do capital locado sob sua responsabilidade, no valor de {taxa_diaria}. Pague pelo Pix copia e cola ou no link: {link_pagamento}',
      late_interest_rate: '1'
    });
    setShowFormModal(true);
  }

  function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text);
    showToast(message || 'Copiado para a área de transferência! 📋');
  }

  function showToast(text) {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  }

  const filteredContracts = contracts.filter(c =>
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.collateral_info?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // Styles
  const cardS = {
    background: 'var(--bg-surface)',
    borderRadius: 20,
    padding: isMobile ? '16px' : '24px',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s'
  };

  const inputS = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'Inter,sans-serif',
    transition: 'all 0.2s'
  };

  return (
    <div className="pb-24">
      {/* Toast Notification */}
      {msg && (
        <div className="fixed top-20 right-8 bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-xl font-bold text-sm shadow-2xl z-[1001] animate-bounce">
          {msg}
        </div>
      )}

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div style={cardS}>
          <p className="text-xs text-secondary-theme font-semibold uppercase tracking-wider mb-1">Total Locado</p>
          <h4 className="text-2xl font-black text-emerald-400">{fmt(metrics.totalLocado)}</h4>
        </div>
        <div style={cardS}>
          <p className="text-xs text-secondary-theme font-semibold uppercase tracking-wider mb-1">Saldo Principal Devedor</p>
          <h4 className="text-2xl font-black text-slate-100">{fmt(metrics.saldoAtualLocado)}</h4>
        </div>
        <div style={cardS}>
          <p className="text-xs text-secondary-theme font-semibold uppercase tracking-wider mb-1">Custódia Diária Total</p>
          <h4 className="text-2xl font-black text-emerald-400">{fmt(metrics.taxaDiariaTotal)}<span className="text-xs text-slate-500 font-medium">/dia</span></h4>
        </div>
        <div style={cardS}>
          <p className="text-xs text-secondary-theme font-semibold uppercase tracking-wider mb-1">Contratos Ativos</p>
          <h4 className="text-2xl font-black text-slate-100">{metrics.ativosCount} <span className="text-xs text-slate-500 font-medium">contratos</span></h4>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-3 items-center w-full sm:w-auto flex-1">
          <input
            placeholder="Buscar por cliente ou garantia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputS}
            className="w-full sm:w-72"
          />
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 bg-input-theme hover:bg-slate-800 text-slate-200 border border-theme rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-all"
          >
            🔄 Recarregar
          </button>
        </div>
        <button
          onClick={handleCreateClick}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-xl text-sm cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all text-center"
        >
          🔒 + Novo Contrato de Custódia
        </button>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map(c => {
          const isActive = c.status === 'active';
          const isCompleted = c.status === 'completed';
          
          // Compute current proportional fee
          let currentFee = c.daily_fee;
          if (c.current_principal < c.principal_amount && c.principal_amount > 0) {
            currentFee = c.daily_fee * (c.current_principal / c.principal_amount);
            currentFee = Math.round(currentFee * 100) / 100;
          }

          return (
            <div
              key={c.id}
              style={{
                ...cardS,
                opacity: isActive ? 1 : 0.7,
                borderColor: isActive ? 'rgba(16,185,129,0.15)' : isCompleted ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)'
              }}
              className="flex flex-col justify-between"
            >
              <div>
                {/* Header card details */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="text-base font-bold text-slate-100 leading-tight">{c.client_name}</h5>
                    <p className="text-xs text-secondary-theme mt-0.5">{c.client_phone || c.client_email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isActive ? 'bg-emerald-500/15 text-emerald-400' : isCompleted ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-500/15 text-slate-400'
                  }`}>
                    {isActive ? '● Ativo' : isCompleted ? '✓ Quitado' : '■ Cancelado'}
                  </span>
                </div>

                {/* Ledger metrics details */}
                <div className="bg-input-theme rounded-xl p-3.5 space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary-theme">Capital Inicial:</span>
                    <span className="font-bold text-slate-100">{fmt(c.principal_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary-theme">Saldo Devedor Atual:</span>
                    <span className="font-extrabold text-slate-100">{fmt(c.current_principal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary-theme">Juros de Atraso:</span>
                    <span className="font-bold text-amber-500">
                      {c.late_interest_rate ? (c.late_interest_rate * 100).toFixed(2) : '1.00'}%/dia
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-800/80 pt-2">
                    <span className="text-secondary-theme">Taxa de Custódia:</span>
                    <span className="font-bold text-emerald-400">
                      {fmt(currentFee)}/{FREQUENCY_LABELS[c.billing_frequency] || 'Dia'}
                    </span>
                  </div>
                  {c.current_principal < c.principal_amount && (
                    <div className="text-[10px] text-slate-500 italic text-right mt-1">
                      * Taxa reduzida proporcionalmente à amortização
                    </div>
                  )}
                </div>

                {c.collateral_info && (
                  <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-2.5 mb-4 text-xs">
                    <span className="font-semibold text-secondary-theme block mb-0.5">🔒 Garantia/Bens em Custódia:</span>
                    <p className="text-slate-300 italic">{c.collateral_info}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="border-t border-slate-800/60 pt-4 mt-auto">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {isActive && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedContract(c);
                          setAmortizeAmount('');
                          setShowAmortizeModal(true);
                        }}
                        className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        💸 Amortizar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContract(c);
                          setShowRepayModal(true);
                        }}
                        className="py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        🔒 Quitar Tudo
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(c)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center"
                  >
                    ⚙️ Configurar
                  </button>
                  {isActive && (
                    <button
                      onClick={() => handleTriggerManualFee(c.id)}
                      title="Gerar taxa proporcional manualmente para hoje"
                      className="px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ⚡ Taxar Hoje
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() => handleCancelContract(c.id)}
                      title="Encerrar contrato de custódia"
                      className="px-2.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ⏸️ Parar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredContracts.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500">
            {loading ? 'Carregando contratos...' : 'Nenhum contrato de custódia de capital cadastrado.'}
          </div>
        )}
      </div>

      {/* Audit History Log */}
      {history.length > 0 && (
        <div style={cardS} className="mt-10">
          <h4 className="text-base font-extrabold text-slate-100 mb-4 flex items-center gap-2">
            📋 Histórico de Movimentações Recentes
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-secondary-theme font-semibold">
                  <th className="py-2.5">Data/Hora</th>
                  <th className="py-2.5">Cliente</th>
                  <th className="py-2.5">Tipo</th>
                  <th className="py-2.5">Valor</th>
                  <th className="py-2.5">Detalhes/Observações</th>
                  <th className="py-2.5 text-right">Comprovantes/Checkout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-slate-900/30">
                    <td className="py-2.5 text-slate-400">
                      {new Date(h.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-200">
                      {h.client_name}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        h.type === 'lease_start' ? 'bg-emerald-500/10 text-emerald-400' :
                        h.type === 'daily_fee' ? 'bg-amber-500/10 text-amber-400' :
                        h.type === 'fee_payment' ? 'bg-emerald-600/15 text-emerald-400' :
                        h.type === 'amortization' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {h.type === 'lease_start' ? 'Início' :
                         h.type === 'daily_fee' ? 'Taxa Gerada' :
                         h.type === 'fee_payment' ? 'Taxa Paga' :
                         h.type === 'amortization' ? 'Amortização' : 'Quitação'}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold">
                      {h.amount > 0 ? fmt(h.amount) : '-'}
                    </td>
                    <td className="py-2.5 italic text-slate-400">
                      {h.notes}
                    </td>
                    <td className="py-2.5 text-right">
                      {h.charge_id ? (
                        <a
                          href={`/dashboard/cobrancas?search=${h.charge_id}`}
                          className="text-emerald-400 hover:underline font-semibold text-[11px]"
                        >
                          Ver Fatura 🔍
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Contract Modal */}
      {showFormModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={() => setShowFormModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-modal-theme w-full max-w-lg rounded-2xl p-6 border border-theme shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <h3 className="text-lg font-bold text-slate-100 mb-1">
              {editingContract ? '⚙️ Ajustar Custódia de Capital' : '🔒 Novo Contrato de Custódia'}
            </h3>
            <p className="text-xs text-secondary-theme mb-5">
              Defina as taxas, garantias e mensagens de cobrança para a locação de capital.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Cliente PJ/Autônomo *</label>
                {editingContract ? (
                  <input
                    type="text"
                    value={editingContract.client_name}
                    style={{ ...inputS, color: 'var(--text-muted)', cursor: 'not-allowed' }}
                    disabled
                  />
                ) : (
                  <select
                    value={form.client_id}
                    onChange={e => setForm({ ...form, client_id: e.target.value })}
                    style={{ ...inputS, appearance: 'auto', color: 'var(--text-primary)' }}
                    required
                  >
                    <option style={{ color: '#0f172a' }} value="">Selecione o cliente...</option>
                    {clients.map(c => (
                      <option style={{ color: '#0f172a' }} key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Principal amount */}
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Capital Total Locado (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 5000.00"
                  value={form.principal_amount}
                  onChange={e => setForm({ ...form, principal_amount: e.target.value })}
                  style={inputS}
                  required
                />
              </div>

              {/* Daily fee */}
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Taxa de Aluguel/Custódia Diária (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 25.00"
                  value={form.daily_fee}
                  onChange={e => setForm({ ...form, daily_fee: e.target.value })}
                  style={inputS}
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Esta taxa será reduzida proporcionalmente conforme o cliente realizar amortizações.
                </span>
              </div>

              {/* Late interest rate */}
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Juros de Atraso Diário (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 1.00"
                  value={form.late_interest_rate}
                  onChange={e => setForm({ ...form, late_interest_rate: e.target.value })}
                  style={inputS}
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Taxa de juros de mora aplicada diariamente sobre o saldo acumulado devedor das taxas em atraso.
                </span>
              </div>

              {/* Billing Frequency */}
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Frequência de Faturamento *</label>
                <select
                  value={form.billing_frequency}
                  onChange={e => setForm({ ...form, billing_frequency: e.target.value })}
                  style={{ ...inputS, appearance: 'auto' }}
                  required
                >
                  <option style={{ color: '#0f172a' }} value="daily">Diário (Cobrado todo dia)</option>
                  <option style={{ color: '#0f172a' }} value="weekly">Semanal (Acumulado da semana)</option>
                  <option style={{ color: '#0f172a' }} value="monthly">Mensal (Acumulado do mês)</option>
                </select>
              </div>

              {/* Collateral details */}
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Garantias vinculadas (Opcional)</label>
                <textarea
                  placeholder="Ex: Carro placa XYZ-1234, Imóvel matrícula X, Nota Promissória assinalada."
                  value={form.collateral_info}
                  onChange={e => setForm({ ...form, collateral_info: e.target.value })}
                  style={inputS}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* WhatsApp message template */}
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Mensagem WhatsApp Customizada (Opcional)</label>
                <textarea
                  placeholder="Olá {cliente_nome}... use tags: {cliente_nome}, {taxa_diaria}, {capital_total}, {link_pagamento}"
                  value={form.custom_message_template}
                  onChange={e => setForm({ ...form, custom_message_template: e.target.value })}
                  style={inputS}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['{cliente_nome}', '{taxa_diaria}', '{capital_total}', '{link_pagamento}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setForm({ ...form, custom_message_template: form.custom_message_template + ' ' + tag })}
                      className="px-2 py-0.5 bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-700 hover:bg-slate-700 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal footer buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-sm cursor-pointer transition"
                >
                  {editingContract ? 'Salvar Alterações' : 'Iniciar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amortize Modal */}
      {showAmortizeModal && selectedContract && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={() => setShowAmortizeModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-modal-theme w-full max-w-sm rounded-2xl p-6 border border-theme shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-100 mb-1">💸 Amortizar Capital Locado</h3>
            <p className="text-xs text-secondary-theme mb-4">
              Cliente: <strong>{selectedContract.client_name}</strong><br />
              Saldo Devedor Atual: <strong>{fmt(selectedContract.current_principal)}</strong>
            </p>

            <form onSubmit={handleAmortizeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary-theme mb-1.5">Valor da Amortização (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedContract.current_principal}
                  placeholder="Ex: 1000.00"
                  value={amortizeAmount}
                  onChange={e => setAmortizeAmount(e.target.value)}
                  style={inputS}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAmortizeModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl text-sm cursor-pointer hover:bg-emerald-600 transition"
                >
                  Gerar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Modal (Quitação Integral) */}
      {showRepayModal && selectedContract && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={() => setShowRepayModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-modal-theme w-full max-w-sm rounded-2xl p-6 border border-theme shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-100 mb-1">🔒 Quitar Contrato de Custódia</h3>
            <p className="text-xs text-secondary-theme mb-5">
              Isso gerará uma fatura no valor integral do saldo principal devedor para encerramento do contrato.
            </p>

            <div className="bg-input-theme rounded-xl p-3.5 space-y-2 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary-theme">Cliente:</span>
                <span className="font-bold text-slate-200">{selectedContract.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-theme">Valor de Quitação:</span>
                <span className="font-extrabold text-emerald-400">{fmt(selectedContract.current_principal)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowRepayModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRepaySubmit}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm cursor-pointer transition"
              >
                Gerar Quitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal - Shows Generated Charge Details */}
      {showResultModal && chargeResult && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[1010] p-4"
          onClick={() => setShowResultModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-modal-theme w-full max-w-md rounded-2xl p-6 border border-theme shadow-2xl text-center"
          >
            <span className="text-3xl block mb-2">🎉</span>
            <h3 className="text-lg font-bold text-slate-100 mb-1">{chargeResult.title}</h3>
            <p className="text-xs text-secondary-theme mb-5">
              Valor: <strong className="text-slate-100 text-sm">{fmt(chargeResult.amount)}</strong>
            </p>

            <div className="space-y-4">
              {chargeResult.pixCopyPaste && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Pix Copia e Cola</span>
                  <div className="text-[11px] font-mono text-emerald-400 break-all select-all max-h-24 overflow-y-auto bg-slate-950 p-2 rounded.5 border border-slate-850">
                    {chargeResult.pixCopyPaste}
                  </div>
                  <button
                    onClick={() => copyToClipboard(chargeResult.pixCopyPaste, 'Pix Copia e Cola copiado! 📋')}
                    className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition active:scale-95"
                  >
                    📋 Copiar Código Pix
                  </button>
                </div>
              )}

              {chargeResult.paymentLink && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Link de Fatura/Checkout</span>
                  <a
                    href={chargeResult.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:underline break-all block font-semibold"
                  >
                    {chargeResult.paymentLink}
                  </a>
                  <button
                    onClick={() => copyToClipboard(chargeResult.paymentLink, 'Link de pagamento copiado! 📋')}
                    className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition active:scale-95"
                  >
                    🔗 Copiar Link de Pagamento
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-500 italic mt-3">
                * Assim que o cliente pagar, o sistema atualizará automaticamente o status e abaterá o saldo.
              </p>

              <button
                onClick={() => setShowResultModal(false)}
                className="w-full mt-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-sm transition"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
