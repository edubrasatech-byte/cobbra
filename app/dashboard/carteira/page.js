'use client';

import { useState, useEffect } from 'react';

export default function CarteiraPage() {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawalCount, setWithdrawalCount] = useState(0);
  const [clients, setClients] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'credit' | 'debit'

  // Modals state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Charge client form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [pixCopyPaste, setPixCopyPaste] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  // Load wallet data
  const loadWalletData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pay/balance');
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.wallet_balance || 0);
        setWithdrawalCount(data.withdrawal_count || 0);
        setClients(data.clients || []);
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da carteira:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

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
          amount: parseFloat(withdrawAmount),
          pix_key: pixKey,
          pix_key_type: pixKeyType
        })
      });

      const data = await res.json();
      if (res.ok) {
        setWithdrawSuccess(true);
        loadWalletData();
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

  // Handle creating a charge for a client
  const handleCreateCharge = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !chargeAmount || parseFloat(chargeAmount) <= 0) return;

    try {
      setChargeLoading(true);
      const res = await fetch('/api/pay/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          amount: parseFloat(chargeAmount)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPixCopyPaste(data.pix_copy_paste || 'Chave Pix indisponível');
        setPaymentLink(data.payment_link || '');
        setChargeSuccess(true);
        loadWalletData();
      } else {
        alert(data.error || 'Falha ao gerar cobrança.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao gerar cobrança.');
    } finally {
      setChargeLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredTimeline = timeline.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-secondary-theme text-xs font-semibold">Carregando Cobbra Pay...</span>
        </div>
      </div>
    );
  }

  // Calculate upcoming withdrawal fee
  const withdrawalFee = withdrawalCount === 0 ? 0.0 : 3.90;

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-20 space-y-5 text-left animate-fadeIn">
      
      {/* Premium Glassmorphic Balance Card */}
      <div className="relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 border border-emerald-500/20 shadow-2xl overflow-hidden flex flex-col justify-between aspect-[1.7/1]">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
        
        {/* Card Header */}
        <div className="flex justify-between items-start z-10">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black tracking-widest text-muted-theme uppercase">Cobbra Pay</span>
            <h2 className="text-xs font-bold text-primary-theme uppercase">Conta Digital</h2>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-black text-emerald-400 uppercase tracking-wider">
            Ativa
          </div>
        </div>

        {/* Main Balance Display */}
        <div className="z-10 my-2">
          <span className="text-[9px] font-bold text-muted-theme uppercase tracking-widest block">Saldo Disponível</span>
          <h3 className="text-3xl font-black text-primary-theme mt-0.5 tracking-tight">
            {formatCurrency(walletBalance)}
          </h3>
        </div>

        {/* Card Footer */}
        <div className="flex justify-between items-end z-10 border-t border-theme pt-3">
          <div>
            <p className="text-[8px] text-muted-theme font-bold uppercase tracking-wider">Assinante</p>
            <p className="text-xs font-bold text-primary-theme leading-none truncate max-w-[160px] uppercase mt-0.5">
              {clients[0]?.name ? "Acesso Premium" : "Dashboard"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-muted-theme font-bold uppercase tracking-wider">Resgates Realizados</p>
            <p className="text-xs font-bold text-primary-theme mt-0.5">{withdrawalCount} saques</p>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={() => {
            setWithdrawSuccess(false);
            setWithdrawAmount('');
            setWithdrawError('');
            setShowWithdrawModal(true);
          }}
          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 active:scale-98 transition-all text-emerald-400 cursor-pointer"
        >
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5L12 14.5L5 7.5" />
          </svg>
          <span className="text-xs font-bold tracking-tight">Sacar Pix (Resgate)</span>
        </button>

        <button
          onClick={() => {
            setChargeSuccess(false);
            setChargeAmount('');
            setSelectedClientId('');
            setShowChargeModal(true);
          }}
          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 active:scale-98 transition-all text-blue-400 cursor-pointer"
        >
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-xs font-bold tracking-tight">Cobrar Motorista</span>
        </button>
      </div>

      {/* Banking Timeline Statement Section */}
      <div className="bg-card-theme border border-theme rounded-3xl p-4 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-theme">
          <div>
            <h4 className="text-xs font-extrabold text-primary-theme uppercase tracking-wider">Histórico da Conta</h4>
            <p className="text-[9px] text-muted-theme">Últimas movimentações e repasses</p>
          </div>
          
          {/* Timeline Filter Toggle */}
          <div className="flex bg-surface-theme p-0.5 rounded-lg border border-theme text-[9px] font-bold text-secondary-theme">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded-md transition-all ${filterType === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'hover:text-primary-theme'}`}
            >
              Tudo
            </button>
            <button 
              onClick={() => setFilterType('credit')}
              className={`px-2 py-1 rounded-md transition-all ${filterType === 'credit' ? 'bg-emerald-500 text-slate-950 font-black' : 'hover:text-primary-theme'}`}
            >
              Entradas
            </button>
            <button 
              onClick={() => setFilterType('debit')}
              className={`px-2 py-1 rounded-md transition-all ${filterType === 'debit' ? 'bg-emerald-500 text-slate-950 font-black' : 'hover:text-primary-theme'}`}
            >
              Saídas
            </button>
          </div>
        </div>

        {/* Timeline rows */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredTimeline.length === 0 ? (
            <div className="py-12 text-center text-slate-600 text-xs">
              Nenhuma movimentação localizada.
            </div>
          ) : (
            filteredTimeline.map((item, idx) => {
              const isCredit = item.type === 'credit';
              return (
                <div 
                  key={item.id || idx}
                  className="bg-surface-theme border border-theme rounded-xl p-3 flex items-center justify-between gap-3 hover:border-theme transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                      isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {isCredit ? '↓' : '↑'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary-theme truncate">{item.description}</p>
                      <p className="text-[9px] text-muted-theme mt-0.5">
                        {new Date(item.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {item.notes ? ` • ${item.notes}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`text-xs font-black flex-shrink-0 ${isCredit ? 'text-emerald-400' : 'text-primary-theme'}`}>
                    {isCredit ? '+' : '-'} {formatCurrency(item.amount)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ==================== 🟢 WITHDRAWAL MODAL ==================== */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-modal-theme border border-theme rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-secondary-theme hover:text-primary-theme text-xl font-light cursor-pointer"
            >
              ×
            </button>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-primary-theme">Resgate Pix Instantâneo</h3>
                <p className="text-[11px] text-secondary-theme mt-0.5">Retire fundos da sua carteira Cobbra Pay direto para sua conta bancária.</p>
              </div>

              {/* Fee Information Box */}
              <div className="p-3 bg-card-theme border border-theme rounded-xl text-xs space-y-1">
                <span className="font-extrabold text-[9px] text-muted-theme uppercase tracking-wider block">Regra de Tarifas</span>
                {withdrawalCount === 0 ? (
                  <p className="text-emerald-400 font-bold">Este é o seu 1º saque do mês. Tarifa Cobbra é 100% GRÁTIS!</p>
                ) : (
                  <p className="text-primary-theme">
                    Tarifa por saque: <span className="text-rose-400 font-bold">R$ 3,90</span> (deduzida do valor).
                  </p>
                )}
                <span className="text-[10px] text-muted-theme block">Saldo disponível para saque: {formatCurrency(walletBalance)}</span>
              </div>

              {!withdrawSuccess ? (
                <form onSubmit={handleProcessWithdraw} className="space-y-4">
                  {withdrawError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                      <svg className="w-3.5 h-3.5 text-rose-500 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> {withdrawError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Valor do Saque (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-primary-theme outline-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Tipo de Chave</label>
                        <select
                          value={pixKeyType}
                          onChange={(e) => setPixKeyType(e.target.value)}
                          className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-2 py-2.5 text-primary-theme outline-none text-xs"
                        >
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
                          <option value="email">E-mail</option>
                          <option value="phone">Telefone</option>
                          <option value="evp">Chave Aleatória (EVP)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Chave Pix</label>
                        <input
                          type="text"
                          placeholder="Insira a chave"
                          required
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3 py-2.5 text-primary-theme outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {withdrawLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Solicitar Transferência'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center text-xl">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-theme">Resgate efetuado!</h4>
                    <p className="text-[11px] text-secondary-theme mt-1">
                      A transferência Pix está sendo enviada da conta Asaas corporativa direto para sua conta de destino.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawSuccess(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-primary-theme border border-theme font-bold text-xs transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 🔵 CHARGE CLIENT MODAL ==================== */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-modal-theme border border-theme rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowChargeModal(false)}
              className="absolute top-4 right-4 text-secondary-theme hover:text-primary-theme text-xl font-light cursor-pointer"
            >
              ×
            </button>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-primary-theme">Emitir Cobrança Pix para Motorista</h3>
                <p className="text-[11px] text-secondary-theme mt-0.5">Gere um código de pagamento instantâneo. Assim que o motorista pagar, o saldo cai direto aqui.</p>
              </div>

              {!chargeSuccess ? (
                <form onSubmit={handleCreateCharge} className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Selecione o Motorista</label>
                      <select
                        required
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3 py-2.5 text-primary-theme outline-none text-xs"
                      >
                        <option value="">Selecione um motorista...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-secondary-theme uppercase tracking-wider block">Valor da Cobrança (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        required
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        className="w-full bg-input-theme border border-theme focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-primary-theme outline-none text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={chargeLoading}
                    className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {chargeLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Gerar Código Pix'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center text-xl">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-theme">Código Pix Gerado!</h4>
                    <p className="text-[11px] text-secondary-theme mt-1">Copie o código Pix Copia e Cola abaixo e envie para o motorista realizar o pagamento.</p>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[8px] font-extrabold text-muted-theme uppercase tracking-wider">Pix Copia e Cola</label>
                    <textarea
                      readOnly
                      rows="3"
                      value={pixCopyPaste}
                      onClick={(e) => e.target.select()}
                      className="w-full bg-input-theme border border-theme rounded-xl p-2.5 text-[9px] text-primary-theme font-mono outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixCopyPaste);
                        alert('Pix copiado com sucesso!');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 font-bold text-xs transition-all cursor-pointer"
                    >
                      Copiar Código
                    </button>
                    <button
                      onClick={() => {
                        setShowChargeModal(false);
                        setChargeSuccess(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-primary-theme font-bold text-xs transition-all cursor-pointer"
                    >
                      Concluído
                    </button>
                  </div>

                  {paymentLink && (
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[10px] text-muted-theme hover:text-emerald-400 underline transition-colors"
                    >
                      Visualizar link completo de fatura
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
