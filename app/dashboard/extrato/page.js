'use client';
import { useState, useEffect } from 'react';

export default function ExtratoPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = '/api/transactions?';
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      if (typeFilter) url += `&type=${typeFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error('Erro ao buscar extrato:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const filteredTransactions = transactions.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      (t.notes && t.notes.toLowerCase().includes(term)) ||
      (t.client_name && t.client_name.toLowerCase().includes(term)) ||
      (t.vehicle_model && t.vehicle_model.toLowerCase().includes(term)) ||
      (t.reference && t.reference.toLowerCase().includes(term))
    );
  });

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 pb-20 text-left animate-fadeIn">
      {/* Page Title */}
      <div className="flex flex-row justify-between items-center border-b border-theme pb-5">
        <div>
          <h1 id="page-title-extrato" className="text-xl md:text-2xl font-black text-primary-theme tracking-tight">
            Extrato da Conta
          </h1>
          <p className="text-xs text-muted-theme mt-1">
            Histórico financeiro completo de recebimentos, estornos e despesas.
          </p>
        </div>
        <button
          id="btn-print-extrato"
          onClick={handlePrint}
          className="btn-premium btn-premium-secondary flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 text-primary-theme" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.318-3.096A19.571 19.571 0 0019.5 12a19.571 19.571 0 00-1.842-2.904M6.34 18a19.507 19.507 0 01-1.84-2.904m0 0A19.56 19.56 0 013 12c0-3.322 1.66-6.257 4.2-8.242M18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-card-theme border border-theme rounded-2xl p-4 md:p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end shadow-md">
        <div>
          <label htmlFor="search-input" className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-2">Buscar</label>
          <input
            id="search-input"
            placeholder="Cliente, nota, ref..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 min-h-[40px] px-3.5 py-2 text-xs bg-input-theme border border-theme text-primary-theme rounded-xl outline-none focus:border-emerald-500 transition-colors placeholder-muted-theme"
          />
        </div>
        <div>
          <label htmlFor="type-filter" className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-2">Tipo de Lançamento</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full h-10 min-h-[40px] px-3 py-2 text-xs bg-input-theme border border-theme text-secondary-theme rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="">Todos os fluxos</option>
            <option value="income">Créditos (Entradas)</option>
            <option value="expense">Débitos (Saídas/Despesas)</option>
            <option value="refund">Estornos (Reembolsos)</option>
          </select>
        </div>
        <div>
          <label htmlFor="start-date" className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-2">Período Inicial</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full h-10 min-h-[40px] px-3.5 py-2 text-xs bg-input-theme border border-theme text-secondary-theme rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-2">Período Final</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full h-10 min-h-[40px] px-3.5 py-2 text-xs bg-input-theme border border-theme text-secondary-theme rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Transactions Container */}
      <div className="bg-card-theme border border-theme rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="border-b border-theme bg-surface-theme text-secondary-theme font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Data/Hora</th>
                <th className="px-5 py-3.5">Descrição</th>
                <th className="px-5 py-3.5">Cliente / Vínculo</th>
                <th className="px-5 py-3.5">Método</th>
                <th className="px-5 py-3.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme font-medium">
              {filteredTransactions.map(t => {
                const isIncome = t.type === 'income';
                const isRefund = t.type === 'refund';
                
                let valueColor = 'text-primary-theme';
                let prefix = '';
                if (isIncome) {
                  valueColor = 'text-emerald-500';
                  prefix = '+ ';
                } else if (isRefund) {
                  valueColor = 'text-amber-500';
                  prefix = 'Estorno - ';
                } else {
                  valueColor = 'text-rose-500';
                  prefix = '- ';
                }

                return (
                  <tr key={t.id} className="hover:bg-card-hover-theme text-primary-theme transition-colors">
                    <td className="px-5 py-4 text-muted-theme font-semibold">
                      {new Date(t.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-primary-theme leading-none">{t.notes || 'Transação Sem Descrição'}</p>
                      {t.reference && (
                        <span className="text-[10px] text-muted-theme mt-1.5 block">Ref: {t.reference}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-secondary-theme">
                      {t.client_name ? (
                        <p className="font-bold">{t.client_name}</p>
                      ) : (
                        <p className="text-muted-theme font-semibold">Administração Geral</p>
                      )}
                      {t.vehicle_model && (
                        <span className="text-[9.5px] text-muted-theme mt-1 block">Veículo: {t.vehicle_model} ({t.vehicle_plate})</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-surface-theme border border-theme text-secondary-theme">
                        {t.payment_method?.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-right font-black text-sm tracking-tight ${valueColor}`}>
                      {prefix}{fmt(t.amount)}
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center text-muted-theme">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-xs font-semibold">Buscando lançamentos...</p>
                      </div>
                    ) : (
                      'Nenhuma transação localizada no período consultado.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
