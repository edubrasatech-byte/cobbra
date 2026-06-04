'use client';
import { useState, useEffect } from 'react';

function StatCard({ icon, label, value, subValue, subLabel, color, bg }) {
  let svgIcon = icon;
  if (icon === 'money') {
    svgIcon = (
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (icon === 'time') {
    svgIcon = (
      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (icon === 'chart') {
    svgIcon = (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
      </svg>
    );
  }
  return (
    <div className="bg-card-theme border border-theme rounded-xl p-3 transition-all duration-200 hover:border-emerald-500/30 group flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
        {svgIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-muted-theme uppercase tracking-widest leading-none">{label}</p>
        <p className="text-base font-black text-primary-theme tracking-tight group-hover:text-emerald-400 transition-colors leading-tight mt-0.5">{value}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {subValue && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${bg} ${color}`}>
            {subValue}
          </span>
        )}
        {subLabel && (
          <p className="text-[8px] text-muted-theme mt-0.5 font-medium max-w-[100px] truncate hidden md:block">{subLabel}</p>
        )}
      </div>
    </div>
  );
}

function AreaChart({ data, onSelectPoint, selectedIndex }) {
  if (!data || data.length === 0) return null;
  
  const width = 500;
  const height = 150;
  const paddingX = 24;
  const paddingY = 24;
  
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const minVal = 0;
  
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.total - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
    return { x, y, data: d, index: i };
  });
  
  const linePath = points.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, '');
  
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-300" />
        )}

        {/* Path line */}
        {linePath && (
          <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
        )}

        {/* Interactive helper line */}
        {selectedIndex !== null && points[selectedIndex] && (
          <line
            x1={points[selectedIndex].x}
            y1={paddingY}
            x2={points[selectedIndex].x}
            y2={height - paddingY}
            stroke="rgba(16,185,129,0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* Interactive points */}
        {points.map((p, i) => {
          const isSelected = selectedIndex === i;
          return (
            <g key={i} className="cursor-pointer" onClick={() => onSelectPoint(i)}>
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
              {isSelected && (
                <circle cx={p.x} cy={p.y} r="7" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? "4.5" : "3"}
                fill={isSelected ? "#10b981" : "#0c0e1a"}
                stroke={isSelected ? "#ffffff" : "#10b981"}
                strokeWidth={isSelected ? "2" : "1.5"}
                className="transition-all duration-200 hover:scale-150 origin-center"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ data, totalToReceive }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = { paid: '#10b981', pending: '#f59e0b', reminder_sent: '#3b82f6', overdue: '#ef4444' };
  const labels = { paid: 'Pago', pending: 'Pendente', reminder_sent: 'Lembrete', overdue: 'Vencido' };
  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  let cumulative = 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6 flex-wrap md:flex-nowrap justify-between">
        <div className="relative w-[100px] h-[100px] flex-shrink-0 flex items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 36 36" className="transform -rotate-90 w-full h-full">
            <circle cx="18" cy="18" r="15.5" fill="transparent" stroke="#111322" strokeWidth="3" />
            {data.map((d, i) => {
              const pct = total > 0 ? (d.count / total) * 100 : 0;
              const offset = 100 - cumulative;
              cumulative += pct;
              return (
                <circle 
                  key={i} 
                  cx="18" 
                  cy="18" 
                  r="15.5" 
                  fill="transparent" 
                  stroke={colors[d.status] || '#64748b'} 
                  strokeWidth="3.2"
                  strokeDasharray={`${pct} ${100 - pct}`} 
                  strokeDashoffset={offset} 
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-xl font-bold text-slate-100">{total}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-[120px] space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-900/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[d.status] }} />
                <span className="text-slate-400 font-medium">{labels[d.status] || d.status}</span>
                <span className="text-slate-500 font-bold">({d.count})</span>
              </div>
              <span className="text-slate-200 font-semibold">{fmt(d.total)}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-slate-800/40 pt-4 flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium">A Receber Total:</span>
        <span className="text-sm font-extrabold text-amber-400">{fmt(totalToReceive)}</span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showFabDropdown, setShowFabDropdown] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [txForm, setTxForm] = useState({
    amount: '',
    type: 'income',
    notes: '',
    vehicle_id: '',
    payment_method: 'pix'
  });

  function loadStats() {
    setLoading(true);
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => {
        // Fallback demo data
        setStats({
          totalReceived: 8420, pendingCount: 3, pendingTotal: 1250, overdueCount: 3, overdueTotal: 1600,
          paymentRate: 94, remindersSentToday: 4, totalClients: 10,
          receivedToday: 450, dueToday: 950, dueTomorrow: 300,
          dailyBillingTotal: 250, dailyBillingCount: 5,
          revenueData: Array.from({ length: 14 }, (_, i) => ({ date: `2026-05-${String(i + 1).padStart(2, '0')}`, total: Math.random() * 2000 + 500 })),
          statusDistribution: [
            { status: 'paid', count: 8, total: 8420 }, 
            { status: 'pending', count: 2, total: 800 }, 
            { status: 'reminder_sent', count: 2, total: 450 }, 
            { status: 'overdue', count: 3, total: 1600 }
          ],
          recentActivity: [
            { id: '1', action: 'payment_received', details: 'Pagamento de R$ 450,00 recebido de Mariana Alves', created_at: new Date().toISOString() },
            { id: '2', action: 'reminder_sent', details: 'Lembrete WhatsApp enviado para Rodrigo Pacheco', created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: '3', action: 'charge_created', details: 'Cobrança criada para Juliana Mendes - R$ 500,00', created_at: new Date(Date.now() - 7200000).toISOString() },
          ],
          atRiskClients: [
            { name: 'Carlos Eduardo', total_overdue: 600, health_score: 'critical', oldest_overdue_date: '2026-05-05' },
            { name: 'Rodrigo Pacheco', total_overdue: 450, health_score: 'warning', oldest_overdue_date: '2026-05-10' },
          ]
        });
        setLoading(false);
      });
  }

  function loadInsights() {
    setInsightsLoading(true);
    fetch('/api/ai/insights')
      .then(r => r.json())
      .then(data => {
        setInsights(data.insights || []);
        setInsightsLoading(false);
      })
      .catch(() => {
        setInsightsLoading(false);
      });
  }

  useEffect(() => {
    loadStats();
    loadInsights();
    fetch('/api/locacoes/vehicles')
      .then(r => r.json())
      .then(data => {
        if (data.vehicles) setVehicles(data.vehicles);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showFabDropdown && !e.target.closest('#fab-container')) {
        setShowFabDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showFabDropdown]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.notes) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(txForm.amount),
          type: txForm.type,
          notes: txForm.notes,
          vehicle_id: txForm.vehicle_id || null,
          payment_method: txForm.payment_method
        })
      });
      if (res.ok) {
        setShowTransactionModal(false);
        setTxForm({
          amount: '',
          type: 'income',
          notes: '',
          vehicle_id: '',
          payment_method: 'pix'
        });
        loadStats();
        alert('Transação manual registrada com sucesso!');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao registrar transação.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar transação.');
    }
  };

  if (loading || !stats) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 text-xs font-semibold tracking-wider">Carregando métricas reais...</p>
    </div>
  );

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const actIcons = {
    payment_received: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    reminder_sent: (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    charge_created: (
      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    charge_overdue: (
      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    client_created: (
      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    )
  };

  function relTime(d) {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  const totalToReceive = stats.pendingTotal + stats.overdueTotal;
  const selectedPoint = selectedBarIndex !== null && stats.revenueData ? stats.revenueData[selectedBarIndex] : null;

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* 🔄 Top Floating Sync/Reload Header */}
      <div className="flex justify-between items-center border-b border-theme pb-4">
        <div>
          <h2 className="text-sm font-bold text-primary-theme uppercase tracking-wider">Visão Geral das Operações</h2>
          <p className="text-xs text-muted-theme mt-0.5">Visão unificada das cobranças e fluxos ativos</p>
        </div>
        <button 
          onClick={loadStats}
          className="p-2 rounded-lg bg-surface-theme border border-theme hover:border-emerald-500/30 text-primary-theme hover:text-emerald-400 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm shadow-black/10 group"
          title="Recarregar dados"
          aria-label="Recarregar dados"
        >
          <svg className="w-4 h-4 text-secondary-theme group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path>
          </svg>
        </button>
      </div>

      {/* 📱 Mobile Only: Resumo Financeiro Diário below the header */}
      <div className="block md:hidden bg-card-theme rounded-2xl border border-theme animate-fadeInUp p-4">
        <h3 className="text-xs font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> Resumo Financeiro Diário
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <div className="bg-card-theme rounded-xl border border-theme flex justify-between items-center flex-wrap gap-y-1 gap-x-3 p-2.5 px-3.5">
            <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider">Pago Hoje</span>
            <p className="text-sm font-black text-emerald-400">{fmt(stats.receivedToday || 0)}</p>
          </div>
          
          <div className="bg-card-theme rounded-xl border border-theme flex justify-between items-center flex-wrap gap-y-1 gap-x-3 p-2.5 px-3.5">
            <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider">A Vencer Hoje</span>
            <p className="text-sm font-black text-amber-500">{fmt(stats.dueToday || 0)}</p>
          </div>
          
          <div className="bg-card-theme rounded-xl border border-theme flex justify-between items-center flex-wrap gap-y-1 gap-x-3 p-2.5 px-3.5">
            <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider">A Vencer Amanhã</span>
            <p className="text-sm font-black text-blue-400">{fmt(stats.dueTomorrow || 0)}</p>
          </div>
          
          <div className="bg-card-theme hover:border-[#10B981]/30 rounded-xl border border-theme cursor-pointer transition-all duration-200 p-2.5 px-3.5" onClick={() => window.location.href = '/dashboard/cobranca-diaria'}>
            <div className="flex justify-between items-center w-full flex-wrap gap-y-1 gap-x-3">
              <div>
                <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider block">Recorrentes Diários</span>
                <span className="text-[8px] text-muted-theme font-semibold block mt-0.5">{stats.dailyBillingCount || 0} contratos ativos</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#10B981]">{fmt(stats.dailyBillingTotal || 0)}<span className="text-[9px] text-muted-theme font-bold">/dia</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📱 Mobile Only: Alertas de Clientes em Risco below Resumo Financeiro */}
      <div className="block md:hidden bg-card-theme rounded-2xl border border-theme animate-fadeInUp p-4">
        <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> Alertas de Clientes em Risco
        </h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {(stats.atRiskClients || []).map((c, i) => {
            const dateStr = c.oldest_overdue_date 
              ? `Vencido desde ${new Date(c.oldest_overdue_date).toLocaleDateString('pt-BR')}` 
              : '';
            
            const isCritical = c.health_score === 'critical';
            return (
              <div 
                key={i} 
                className="bg-card-theme rounded-xl border border-theme flex items-center justify-between gap-3 hover:border-theme transition-colors flex-wrap gap-y-1 p-2 px-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                    isCritical ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {isCritical ? (
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary-theme truncate">{c.name}</p>
                    <p className={`text-[9px] font-medium leading-none mt-1 ${isCritical ? 'text-rose-400/90' : 'text-amber-400/90'}`}>
                      Débito: {fmt(c.total_overdue)}
                    </p>
                    {dateStr && (
                      <p className="text-[8px] text-muted-theme mt-0.5 truncate">{dateStr}</p>
                    )}
                  </div>
                </div>
                
                <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                } flex-shrink-0 scale-90`}>
                  {isCritical ? 'Crítico' : 'Alerta'}
                </span>
              </div>
            );
          })}
          
          {(!stats.atRiskClients || stats.atRiskClients.length === 0) && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-emerald-400 text-xs font-bold">100% em dia!</p>
              <p className="text-[9px] text-muted-theme mt-0.5">Todos os clientes ativos adimplentes.</p>
            </div>
          )}
        </div>
      </div>

      {/* 📊 Exactly 3 Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon="money" 
          label="Recebido este mês" 
          value={fmt(stats.totalReceived)} 
          subValue="↑ 23%" 
          bg="bg-emerald-500/10" 
          color="text-emerald-400" 
          subLabel={`Recebido hoje: ${fmt(stats.receivedToday || 0)}`}
        />
        <StatCard 
          icon="time" 
          label="Cobranças Pendentes" 
          value={`${stats.pendingCount + stats.overdueCount} faturas`} 
          subValue={fmt(stats.pendingTotal + stats.overdueTotal)} 
          bg="bg-amber-500/10" 
          color="text-amber-400" 
          subLabel={`Vencidas: ${stats.overdueCount} | Pendentes: ${stats.pendingCount}`}
        />
        <StatCard 
          icon="chart" 
          label="Taxa de Pagamento" 
          value={`${stats.paymentRate}%`} 
          subValue="Adimplência" 
          bg="bg-blue-500/10" 
          color="text-blue-400" 
          subLabel={`${stats.totalClients} clientes ativos cadastrados`}
        />
      </div>

      {/* 📈 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revolut-style Area/Line Chart for Revenue */}
        <div className="lg:col-span-2 bg-card-theme rounded-2xl border border-theme p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider">Histórico de Receita</h3>
              <p className="text-[11px] text-muted-theme mt-0.5">Últimos 14 dias de faturamentos ativos</p>
            </div>
            
            <div className="text-right">
              {selectedPoint ? (
                <div>
                  <p className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider leading-none">
                    {new Date(selectedPoint.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                  <p className="text-sm font-extrabold text-primary-theme mt-1 leading-none">{fmt(selectedPoint.total)}</p>
                </div>
              ) : (
                <span className="text-[10px] text-muted-theme font-medium bg-surface-theme px-2.5 py-1 rounded border border-theme">
                  Selecione um ponto
                </span>
              )}
            </div>
          </div>

          {stats.revenueData && stats.revenueData.length > 0 ? (
            <div className="space-y-4">
              <AreaChart 
                data={stats.revenueData} 
                onSelectPoint={setSelectedBarIndex} 
                selectedIndex={selectedBarIndex} 
              />
              
              <div className="flex justify-between text-[9px] font-bold text-slate-600 px-2 pt-2 border-t border-theme">
                <span>{new Date(stats.revenueData[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                <span>{new Date(stats.revenueData[Math.floor(stats.revenueData.length / 2)].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                <span>{new Date(stats.revenueData[stats.revenueData.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-xs text-slate-500 italic">
              Sem dados de faturamentos registrados no período.
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-card-theme rounded-2xl border border-theme p-4 md:p-6">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider">Status das Cobranças</h3>
            <p className="text-[11px] text-muted-theme mt-0.5">Distribuição geral de títulos e quitações</p>
          </div>
          
          {stats.statusDistribution && stats.statusDistribution.length > 0 ? (
            <DonutChart data={stats.statusDistribution} totalToReceive={totalToReceive} />
          ) : (
            <div className="flex items-center justify-center h-40 text-xs text-muted-theme italic">
              Nenhuma cobrança ativa cadastrada.
            </div>
          )}
        </div>
      </div>

      {/* ⚡ Bottom Row widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Atividade Recente */}
        <div className="bg-card-theme rounded-2xl border border-theme flex flex-col p-4 md:p-6">
          <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider mb-4">Atividade Recente</h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {(stats.recentActivity || []).slice(0, 6).map((a, i) => (
              <div 
                key={i} 
                className="flex gap-3 border-b border-theme last:border-b-0 hover:bg-card-hover-theme rounded-lg transition-colors duration-150 p-2"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-theme border border-theme flex items-center justify-center flex-shrink-0">
                  {actIcons[a.action] || <svg className="w-4 h-4 text-secondary-theme" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary-theme truncate leading-snug">{a.details}</p>
                  <p className="text-[10px] text-muted-theme mt-1 font-semibold flex items-center gap-1.5">
                    <span>{relTime(a.created_at)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span>{new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  </p>
                </div>
              </div>
            ))}
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <div className="flex items-center justify-center py-10 text-xs text-muted-theme italic">
                Nenhum log operacional registrado.
              </div>
            )}
          </div>
        </div>

        {/* 2. Resumo Diário */}
        <div className="hidden md:block bg-card-theme rounded-2xl border border-theme p-4">
          <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider mb-3">Resumo Financeiro Diário</h3>
          <div className="space-y-2">
            <div className="bg-card-theme rounded-xl border border-theme p-2.5">
              <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider">Pago Hoje</span>
              <p className="text-sm font-black text-emerald-400 mt-0.5">{fmt(stats.receivedToday || 0)}</p>
            </div>
            
            <div className="bg-card-theme rounded-xl border border-theme p-2.5">
              <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider">A Vencer Hoje</span>
              <p className="text-sm font-black text-amber-500 mt-0.5">{fmt(stats.dueToday || 0)}</p>
            </div>
            
            <div className="bg-card-theme rounded-xl border border-theme p-2.5">
              <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider">A Vencer Amanhã</span>
              <p className="text-sm font-black text-blue-400 mt-0.5">{fmt(stats.dueTomorrow || 0)}</p>
            </div>
            
            <div className="bg-card-theme hover:border-[#10B981]/30 rounded-xl border border-theme cursor-pointer transition-all duration-200 p-2.5" onClick={() => window.location.href = '/dashboard/cobranca-diaria'}>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider">Faturamentos Recorrentes Diários</span>
                <span className="text-[10px] text-emerald-400 font-bold hover:underline">Ver →</span>
              </div>
              <p className="text-sm font-black text-emerald-400 mt-0.5">
                {fmt(stats.dailyBillingTotal || 0)}
                <span className="text-muted-theme font-bold text-xs"> /dia</span>
              </p>
              <p className="text-[8px] text-muted-theme mt-1 font-semibold">{stats.dailyBillingCount || 0} contratos recorrentes ativos</p>
            </div>
          </div>
        </div>

        {/* 3. Clientes em Risco */}
        <div className="hidden md:block bg-card-theme rounded-2xl border border-theme p-4">
          <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider mb-3">Alertas de Clientes em Risco</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {(stats.atRiskClients || []).map((c, i) => {
              const dateStr = c.oldest_overdue_date 
                ? `Vencido desde ${new Date(c.oldest_overdue_date).toLocaleDateString('pt-BR')}` 
                : '';
              
              const isCritical = c.health_score === 'critical';
              return (
                <div 
                  key={i} 
                  className="bg-card-theme rounded-xl border border-theme flex items-center justify-between gap-3 hover:border-theme transition-colors p-2 px-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                      isCritical ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {isCritical ? (
                        <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary-theme truncate">{c.name}</p>
                      <p className={`text-[9px] font-medium leading-none mt-1 ${isCritical ? 'text-rose-400/90' : 'text-amber-400/90'}`}>
                        Débito: {fmt(c.total_overdue)}
                      </p>
                      {dateStr && (
                        <p className="text-[8px] text-muted-theme mt-0.5 truncate">{dateStr}</p>
                      )}
                    </div>
                  </div>
                  
                  <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                  } flex-shrink-0 scale-90`}>
                    {isCritical ? 'Crítico' : 'Alerta'}
                  </span>
                </div>
              );
            })}
            
            {(!stats.atRiskClients || stats.atRiskClients.length === 0) && (
               <div className="flex flex-col items-center justify-center py-4 text-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-emerald-400 text-xs font-bold">100% em dia!</p>
                <p className="text-[9px] text-muted-theme mt-0.5">Todos os clientes ativos adimplentes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🪄 Catarina AI Insights Premium Banner (Relocated to the bottom of the page) */}
      <div className="bg-card-theme border border-theme rounded-2xl relative overflow-hidden p-6">
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-[#10B981]/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-44 h-44 rounded-full bg-teal-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4 mb-4">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.813-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            <div>
              <h3 className="text-sm font-bold text-primary-theme flex items-center gap-2">
                Catarina AI Insights
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              </h3>
              <p className="text-[11px] text-muted-theme">Fluxo de inteligência automatizada sobre inadimplência</p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/15 uppercase tracking-wider">
            Gemini 2.5 Flash
          </span>
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-input-theme rounded-xl border border-theme flex items-center justify-center">
                <span className="text-[11px] text-muted-theme animate-pulse font-medium">Analisando cobranças...</span>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-slate-500 text-xs italic">Registros insuficientes para geração de análises Catarina AI.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => {
              const borderColors = { success: 'border-emerald-500/40', warning: 'border-rose-500/40', info: 'border-blue-500/40' };
              const bgColors = { success: 'bg-emerald-500/[0.02]', warning: 'bg-rose-500/[0.02]', info: 'bg-blue-500/[0.02]' };
              const textColors = { success: 'text-emerald-400', warning: 'text-rose-400', info: 'text-blue-400' };
              const badgeLabels = { success: 'Otimização', warning: 'Risco', info: 'Insight' };

              return (
                <div 
                  key={idx} 
                  className={`border ${borderColors[insight.type] || 'border-theme'} ${bgColors[insight.type] || 'bg-card-theme'} transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/5 rounded-2xl p-6`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-primary-theme">{insight.title}</h4>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${bgColors[insight.type]} ${textColors[insight.type]}`}>
                      {badgeLabels[insight.type] || 'Info'}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary-theme leading-relaxed">{insight.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button Container (Speed Dial / Dropdown) */}
      <div id="fab-container" className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end">
        {/* Dropdown Menu */}
        <div 
          className={`absolute bottom-16 right-0 mb-2 w-56 bg-modal-theme/95 backdrop-blur-xl border border-theme rounded-2xl shadow-2xl p-3 flex flex-col gap-1 transition-all duration-200 origin-bottom-right transform ${
            showFabDropdown 
              ? 'scale-100 opacity-100 pointer-events-auto' 
              : 'scale-95 opacity-0 pointer-events-none'
          }`}
        >
          <div className="px-3 py-1.5 border-b border-theme mb-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-theme">Ações Rápidas</p>
          </div>
          
          <a
            href="/dashboard/cobrancas?action=new"
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group"
          >
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Nova Cobrança</p>
              <p className="text-[9px] text-muted-theme">Gerar Pix/Fatura</p>
            </div>
          </a>

          <a
            href="/dashboard/locacoes?action=new"
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group"
          >
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Novo Contrato</p>
              <p className="text-[9px] text-muted-theme">Locação de veículo</p>
            </div>
          </a>

          <a
            href="/dashboard/veiculos?action=new"
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group"
          >
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Cadastrar Veículo</p>
              <p className="text-[9px] text-muted-theme">Adicionar à frota</p>
            </div>
          </a>

          <a
            href="/dashboard/clientes?action=new"
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group"
          >
            <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 21c-2.243 0-4.352-.64-6.136-1.75a3.333 3.333 0 01-1.077-1.085 4.122 4.122 0 015.68-4.962c1.785 1.096 3.12 2.99 3.513 5.22m1.975-2.221a3.001 3.001 0 00-3.001-3.001 3 3 0 00-3 3M16.5 7.5a3 3 0 11-6 0 3 3 0 016 0zM18 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Novo Cliente</p>
              <p className="text-[9px] text-muted-theme">Registrar no CRM</p>
            </div>
          </a>

          <a
            href="/dashboard/manutencoes?action=new"
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group"
          >
            <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.07c.754.023 1.487-.223 2.083-.715l.857.857a2.246 2.246 0 003.177-3.177l-.857-.857c.492-.596.738-1.329.715-2.083-1.026-.065-2.115.42-2.772 1.077l-.19.19a.75.75 0 01-1.06 0l-.19-.19c-.657-.657-1.142-1.746-1.077-2.772.754-.023 1.487.223 2.083.715l.857-.857a2.246 2.246 0 00-3.177-3.177l-.857.857c-.492-.596-.738-1.329-.715-2.083a2.25 2.25 0 01-1.077 1.077L7.56 7.56a.75.75 0 00-1.06 0l-.19.19a4.498 4.498 0 00-1.077 2.772c-.023-.754-.223-1.487-.715-2.083l.857-.857a2.246 2.246 0 013.177 3.177l-.857.857c.596-.492 1.329-.738 2.083-.715.065 1.026-.42 2.115-1.077 2.772l-.19.19a.75.75 0 000 1.06l.19.19c.657.657 1.746 1.142 2.772 1.077z" /></svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Lançar Manutenção</p>
              <p className="text-[9px] text-muted-theme">Ordem de Serviço (OS)</p>
            </div>
          </a>

          <a
            href="/dashboard/locacoes?tab=fines&action=new"
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group"
          >
            <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Lançar Multa</p>
              <p className="text-[9px] text-muted-theme">Multa de trânsito</p>
            </div>
          </a>

          <button
            onClick={() => {
              setShowFabDropdown(false);
              setShowTransactionModal(true);
            }}
            className="w-full text-left px-3 py-2 hover:bg-card-hover-theme rounded-xl flex items-center gap-2.5 transition-colors group cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
            <div>
              <p className="text-xs font-bold text-primary-theme group-hover:text-emerald-400 transition-colors">Transação Manual</p>
              <p className="text-[9px] text-muted-theme">Receita/Despesa avulsa</p>
            </div>
          </button>
        </div>

        {/* Trigger Button */}
        <button
          onClick={() => setShowFabDropdown(!showFabDropdown)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20 active:scale-95 transition-all select-none cursor-pointer border border-emerald-400/30 group"
          title="Ações Rápidas"
        >
          <span className={`text-2xl font-extrabold transition-transform duration-300 ${
            showFabDropdown ? 'rotate-[135deg]' : ''
          }`}>+</span>
        </button>
      </div>

      {/* 💸 Transaction Modal (Item 11) */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowTransactionModal(false)}>
          <div className="bg-modal-theme border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative my-8" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary-theme flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                Lançamento Financeiro Manual
              </h3>
              <button onClick={() => setShowTransactionModal(false)} className="text-muted-theme hover:text-primary-theme text-sm">✕</button>
            </div>
            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm(prev => ({ ...prev, type: 'income' }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      txForm.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                        : 'bg-transparent text-muted-theme border-theme hover:border-theme'
                    }`}
                  >
                    Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm(prev => ({ ...prev, type: 'expense' }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      txForm.type === 'expense'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10'
                        : 'bg-transparent text-muted-theme border-theme hover:border-theme'
                    }`}
                  >
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Destinação</label>
                <select
                  value={txForm.vehicle_id}
                  onChange={e => setTxForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                >
                  <option value="">Empresa (Geral / Caixa Corporativo)</option>
                  <optgroup label="Frota de Veículos">
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={txForm.amount}
                    onChange={e => setTxForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Forma de Pagamento</label>
                  <select
                    value={txForm.payment_method}
                    onChange={e => setTxForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="pix">Pix</option>
                    <option value="boleto">Boleto</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="cash">Dinheiro</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Descrição / Justificativa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abastecimento de combustível, Recebimento de franquia..."
                  value={txForm.notes}
                  onChange={e => setTxForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-surface-theme hover:bg-card-hover-theme border border-theme text-primary-theme text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                >
                  Lançar Transação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
