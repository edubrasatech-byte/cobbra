'use client';

import { useState, useEffect } from 'react';

export default function CarteiraPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawalCount, setWithdrawalCount] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [loadingClient, setLoadingClient] = useState(false);

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [pixCopyPaste, setPixCopyPaste] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Load general overview (all clients and total balance)
  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pay/balance');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        setTotalBalance(data.totalBalance || 0);
      }
    } catch (err) {
      console.error('Erro ao carregar saldo geral:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load detailed client data
  const loadClientDetails = async (clientId) => {
    try {
      setLoadingClient(true);
      const res = await fetch(`/api/pay/balance?client_id=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClient(data.client);
        setWalletBalance(data.wallet_balance);
        setWithdrawalCount(data.withdrawal_count);
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do motorista:', err);
    } finally {
      setLoadingClient(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientDetails(selectedClientId);
    } else {
      setSelectedClient(null);
      setTimeline([]);
    }
  }, [selectedClientId]);

  // Handle deposit creation
  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    try {
      setDepositLoading(true);
      const res = await fetch('/api/pay/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          amount: parseFloat(depositAmount)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPixCopyPaste(data.pix_copy_paste || 'Código Pix Indisponível (Sem chave Asaas)');
        setPaymentLink(data.payment_link || '');
        setDepositSuccess(true);
        // Refresh details
        loadClientDetails(selectedClientId);
      } else {
        alert(data.error || 'Falha ao gerar depósito');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao processar depósito.');
    } finally {
      setDepositLoading(false);
    }
  };

  // Handle withdrawal process
  const handleProcessWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !pixKey) return;

    setWithdrawError('');
    try {
      setWithdrawLoading(true);
      const res = await fetch('/api/pay/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          amount: parseFloat(withdrawAmount),
          pix_key: pixKey,
          pix_key_type: pixKeyType
        })
      });

      const data = await res.json();
      if (res.ok) {
        setWithdrawSuccess(true);
        // Refresh details
        loadClientDetails(selectedClientId);
        loadOverview();
      } else {
        setWithdrawError(data.error || 'Falha ao processar saque.');
      }
    } catch (err) {
      console.error(err);
      setWithdrawError('Erro ao comunicar com o servidor.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Filter clients list
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 font-medium">Carregando Cobbra Pay...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2.5">
            💳 Cobbra <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Pay</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Intermediação financeira inteligente e gestão de saldos da frota</p>
        </div>

        {selectedClientId && (
          <button
            onClick={() => setSelectedClientId(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            ← Voltar para Visão Geral
          </button>
        )}
      </div>

      {/* Mode 1: Visão Geral (Overview) */}
      {!selectedClientId && (
        <div className="space-y-6">
          {/* Stats Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Saldo Total Custodiado</span>
              <h3 className="text-3xl font-black text-emerald-400 mt-2 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                {formatCurrency(totalBalance)}
              </h3>
              <p className="text-xs text-slate-400 mt-2">Soma dos saldos virtuais de todos os motoristas</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Contas Ativas</span>
              <h3 className="text-3xl font-black text-slate-200 mt-2">
                {clients.filter(c => (c.wallet_balance || 0) > 0).length} <span className="text-sm font-medium text-slate-400">de {clients.length}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-2">Motoristas com saldo ativo na plataforma</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Tarifa de Saque</span>
              <h3 className="text-3xl font-black text-slate-200 mt-2">R$ 3,90</h3>
              <p className="text-xs text-emerald-400 mt-2 font-semibold">1º saque de cada motorista é 100% grátis</p>
            </div>
          </div>

          {/* Motoristas list */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Saldos dos Motoristas</h2>
                <p className="text-xs text-slate-400">Selecione um motorista para gerenciar extratos, recargas e saques</p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Buscar motorista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pl-4">Motorista / Contato</th>
                    <th className="pb-3 text-right">Saldo Virtual</th>
                    <th className="pb-3 text-center">Saques Realizados</th>
                    <th className="pb-3 pr-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">
                        Nenhum motorista com saldo localizado.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/10 group transition-all">
                        <td className="py-3.5 pl-4">
                          <div className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {c.phone || c.email || 'Sem contato cadastrado'}
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-black text-slate-300">
                          <span className={(c.wallet_balance || 0) > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {formatCurrency(c.wallet_balance || 0)}
                          </span>
                        </td>
                        <td className="py-3.5 text-center text-slate-400 font-semibold">
                          {c.withdrawal_count || 0}
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <button
                            onClick={() => setSelectedClientId(c.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold transition-all text-[11px] cursor-pointer"
                          >
                            Acessar Carteira →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Detalhes do Cliente (Client Detail) */}
      {selectedClientId && selectedClient && (
        <div className="space-y-8">
          {loadingClient ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Neon Card & Quick Actions */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 💳 Neon Glassmorphic Card */}
                <div className="relative aspect-[1.586/1] w-full rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 border border-emerald-500/30 overflow-hidden shadow-2xl flex flex-col justify-between group">
                  {/* Glowing highlights */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Cobbra Pay</span>
                      <h4 className="text-xs font-bold text-slate-200 mt-0.5">CARTEIRA DIGITAL</h4>
                    </div>
                    {/* Chip / Signal */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="w-8 h-6 rounded bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
                        <div className="w-5 h-4 bg-yellow-600/40 rounded-sm"></div>
                      </div>
                      <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Ativa</span>
                    </div>
                  </div>

                  {/* Card Middle: Balance */}
                  <div className="z-10 my-4">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Saldo Disponível</span>
                    <h2 className="text-3xl font-black text-slate-100 mt-1 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
                      {formatCurrency(walletBalance)}
                    </h2>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-end z-10">
                    <div>
                      <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Titular da Conta</p>
                      <p className="text-xs font-bold text-slate-200 leading-tight mt-0.5 uppercase">{selectedClient.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Histórico</p>
                      <p className="text-xs font-bold text-slate-300 mt-0.5">{withdrawalCount} Saques</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Ações de Saldo</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setDepositSuccess(false);
                        setDepositAmount('');
                        setShowDepositModal(true);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 transition-all cursor-pointer active:scale-95 group"
                    >
                      <svg className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span className="text-xs font-bold">Depositar (Pix)</span>
                    </button>

                    <button
                      onClick={() => {
                        setWithdrawSuccess(false);
                        setWithdrawAmount('');
                        setWithdrawError('');
                        setShowWithdrawModal(true);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 transition-all cursor-pointer active:scale-95 group"
                    >
                      <svg className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-bold">Sacar (Pix)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Statement Timeline */}
              <div className="lg:col-span-7">
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 shadow-xl min-h-[300px]">
                  <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-6">Extrato da Carteira</h3>
                  
                  {timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                      <svg className="w-10 h-10 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs">Nenhuma movimentação registrada nesta carteira.</span>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-800/80 ml-3.5 space-y-6">
                      {timeline.map((item, idx) => {
                        const isCredit = item.type === 'credit';
                        return (
                          <div key={item.id || idx} className="relative pl-6 group">
                            {/* Circle bullet */}
                            <div className={`absolute -left-[9px] top-1 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md ${
                              isCredit ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                            }`}>
                              {isCredit ? (
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              ) : (
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                              )}
                            </div>

                            {/* Timeline Content */}
                            <div>
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="font-bold text-slate-200 text-xs">{item.description}</h4>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(item.date).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                                <span className={`font-black text-xs ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isCredit ? '+' : '-'} {formatCurrency(item.amount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 🟢 DEPOSIT MODAL ==================== */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowDepositModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl font-light cursor-pointer"
            >
              ×
            </button>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-200">Depositar Saldo (Recarga)</h3>
                <p className="text-xs text-slate-400 mt-1">Gere um código Pix para depositar dinheiro na carteira de {selectedClient?.name}</p>
              </div>

              {!depositSuccess ? (
                <form onSubmit={handleCreateDeposit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valor do Depósito (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-slate-200 outline-none transition-all text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={depositLoading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    {depositLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Gerar Código Pix'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Pix Gerado com Sucesso!</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Copie o código abaixo e pague no aplicativo do seu banco</p>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pix Copia e Cola</label>
                    <textarea
                      readOnly
                      rows="4"
                      value={pixCopyPaste}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 font-mono outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixCopyPaste);
                      alert('Código Pix copiado!');
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs transition-all cursor-pointer"
                  >
                    Copiar Código Pix
                  </button>

                  {paymentLink && (
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[11px] text-slate-400 hover:text-emerald-400 underline transition-colors"
                    >
                      Visualizar fatura completa no Asaas
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 🔵 WITHDRAW MODAL ==================== */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl font-light cursor-pointer"
            >
              ×
            </button>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-200">Solicitar Saque Pix</h3>
                <p className="text-xs text-slate-400 mt-1">Transfira fundos da carteira do motorista para a conta bancária dele.</p>
              </div>

              {/* Informações sobre tarifas */}
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-xs space-y-1">
                <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">Regra de Tarifas</span>
                {withdrawalCount === 0 ? (
                  <p className="text-emerald-400 font-bold">✨ Este será o 1º saque do motorista. A tarifa Cobbra é GRÁTIS!</p>
                ) : (
                  <p className="text-slate-300">
                    Tarifa de Saque: <span className="text-rose-400 font-bold">R$ 3,90</span> (deduzido do valor total).
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">Restante do saldo disponível: {formatCurrency(walletBalance)}</span>
              </div>

              {!withdrawSuccess ? (
                <form onSubmit={handleProcessWithdraw} className="space-y-4">
                  {withdrawError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                      ⚠️ {withdrawError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valor do Saque (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-slate-200 outline-none transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tipo de Chave Pix</label>
                      <select
                        value={pixKeyType}
                        onChange={(e) => setPixKeyType(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-3 text-slate-200 outline-none transition-all text-xs"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="evp">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Chave Pix</label>
                      <input
                        type="text"
                        placeholder="Insira a chave Pix"
                        required
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-slate-200 outline-none transition-all text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    {withdrawLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Solicitar Transferência'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Saque Processado!</h4>
                    <p className="text-[11px] text-slate-400 mt-1">A transferência foi autorizada na conta master do Asaas e o saldo foi deduzido da carteira local.</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawSuccess(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold text-xs transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
