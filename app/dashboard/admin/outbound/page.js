'use client';
import { useState, useEffect } from 'react';

export default function OutboundAdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [page, setPage] = useState(1);

  function fetchStats() {
    setLoading(true);
    setError('');
    
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '25');
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (nicheFilter) params.set('niche', nicheFilter);

    fetch(`/api/admin/outbound-stats?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível carregar as métricas da fila.');
        return res.json();
      })
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchStats();
  }, [page, statusFilter, nicheFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStats();
  };

  const executeAction = async (actionType) => {
    setActionLoading(true);
    setSuccessMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/outbound-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Falha ao executar ação.');
      
      setSuccessMessage(resData.message);
      setPage(1);
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
      // Auto-hide success after 5s
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const fmtNumber = (num) => Number(num || 0).toLocaleString('pt-BR');

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider">Carregando fila outbound...</p>
      </div>
    );
  }

  const summary = data?.summary || { total: 0, ready: 0, sent: 0, failed: 0 };
  const leads = data?.leads || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 25, pages: 1 };

  return (
    <div className="flex flex-col gap-6 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Controle Outbound (Prospecção)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Gestão administrativa dos leads qualificados por IA Catarina</p>
        </div>

        <button 
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-[#10B981]/30 text-slate-300 hover:text-[#10B981] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm shadow-black/10 disabled:opacity-50"
        >
          🔄 Atualizar Painel
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons Cards */}
      <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ações Administrativas de Fila</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Manutenção rápida e recalibração em lote</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => executeAction('RECALIBRATE')}
            disabled={actionLoading || loading}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-[#10B981]/30 text-xs font-bold text-[#10B981] rounded-xl cursor-pointer disabled:opacity-50 transition-all"
            title="Aplica domínio cobbra.com.br, remove 'régua' e injeta a precificação R$ 49,90"
          >
            🪄 Calibrar Abordagens
          </button>
          
          <button
            onClick={() => {
              if (confirm('Deseja reiniciar todos os leads com status falho para tentar reenviar?')) {
                executeAction('RESET_FAILED');
              }
            }}
            disabled={actionLoading || loading || summary.failed === 0}
            className="px-4 py-2 bg-[#ef4444]/10 border border-[#ef4444]/20 hover:border-[#ef4444]/40 text-xs font-bold text-rose-400 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
          >
            🔄 Reenviar Falhas ({summary.failed})
          </button>
        </div>
      </div>

      {/* Grid das Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total leads card */}
        <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-lg">📁</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800/60">
              Total Minerado
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Histórico Geral</p>
          <p className="text-2xl font-extrabold text-slate-100 mt-1">{fmtNumber(summary.total)} leads</p>
        </div>

        {/* Ready leads card */}
        <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-lg">⏳</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/15">
              Prontos na Fila
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aguardando Envio</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{fmtNumber(summary.ready)} leads</p>
        </div>

        {/* Sent leads card */}
        <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-lg">✅</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">
              Disparados
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Abordagens Feitas</p>
          <p className="text-2xl font-extrabold text-blue-400 mt-1">{fmtNumber(summary.sent)} leads</p>
        </div>

        {/* Failed leads card */}
        <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-lg">❌</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/15">
              Falhas
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Erros de Disparo</p>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{fmtNumber(summary.failed)} leads</p>
        </div>

      </div>

      {/* Tabelas de Segmentação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Nichos */}
        <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Divisão por Nichos Comerciais</h3>
          <div className="space-y-3">
            {data?.nicheStats?.map((n, i) => (
              <div key={i} className="bg-slate-950/20 border border-slate-900/60 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-200 block capitalize">{n.niche}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Prontos: <strong className="text-emerald-400">{n.ready}</strong> | 
                    Enviados: <strong className="text-blue-400">{n.sent}</strong> | 
                    Falhas: <strong className="text-rose-400">{n.failed}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-300 block">{n.total}</span>
                  <span className="text-[9px] text-slate-500">Leads totais</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cidades */}
        <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Cidades Mineradas (Top 10)</h3>
          <div className="space-y-3">
            {data?.cityStats?.map((c, i) => (
              <div key={i} className="bg-slate-950/20 border border-slate-900/60 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-200 block">{c.city}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Fila Pronta: <strong className="text-emerald-400">{c.ready}</strong> | Falhas: <strong className="text-rose-400">{c.failed}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-[#10B981] block">{c.total}</span>
                  <span className="text-[9px] text-slate-500">Qualificados</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tabela Interativa de Leads */}
      <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fila e Histórico Individual de Leads</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Explore, filtre e busque leads qualificados</p>
          </div>

          {/* Form de Filtros */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-wrap w-full md:w-auto items-center">
            <input
              type="text"
              placeholder="Buscar por nome, telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-[#10B981]/40 w-full md:w-48"
            />
            
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-900 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none cursor-pointer focus:border-[#10B981]/40"
            >
              <option value="">Todos Status</option>
              <option value="ready_to_send">Fila Pronta (ready)</option>
              <option value="sent">Disparado (sent)</option>
              <option value="failed">Falha (failed)</option>
            </select>

            <select
              value={nicheFilter}
              onChange={e => { setNicheFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-900 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none cursor-pointer focus:border-[#10B981]/40"
            >
              <option value="">Todos Nichos</option>
              <option value="aluguel de carro para uber">Locador Uber</option>
              <option value="locador de veiculos">Locador Geral</option>
              <option value="emprestimo pessoal">Empréstimo P2P</option>
              <option value="credito autonomo">Crédito</option>
              <option value="servicos de pedreiro">Pedreiros</option>
              <option value="empreiteiro">Empreiteiros</option>
              <option value="personal trainer">Personal Trainer</option>
              <option value="estudio de pilates">Pilates</option>
            </select>

            <button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-[#070913] text-xs font-bold rounded-lg px-3 py-1.5 transition-colors cursor-pointer w-full md:w-auto">
              🔍 Filtrar
            </button>
          </form>
        </div>

        {/* Tabela Bruta */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Nicho</th>
                <th className="py-3 px-4">Cidade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Mensagem Personalizada</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-950/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-200">{l.name || 'Não informado'}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{l.phone}</td>
                  <td className="py-3 px-4 text-slate-400 capitalize">{l.niche}</td>
                  <td className="py-3 px-4 text-slate-400">{l.city}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.status === 'ready_to_send' ? 'bg-emerald-500/10 text-emerald-400' :
                      l.status === 'sent' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-500 hover:text-slate-300 cursor-pointer" title={l.custom_message}>
                    {l.custom_message}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 italic">
                    Nenhum lead qualificado encontrado com as condições especificadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-900">
            <span className="text-slate-500 text-[10px]">
              Exibindo página <strong>{pagination.page}</strong> de <strong>{pagination.pages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold rounded-lg text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                ◀ Anterior
              </button>
              
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => Math.min(p + 1, pagination.pages))}
                className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold rounded-lg text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                Próxima ▶
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
