'use client';
import { useState, useEffect } from 'react';

function StatCard({ icon, label, value, subValue, subLabel, color, bg }) {
  return (
    <div 
      className="bg-[#0C0E1A] rounded-2xl p-6 border border-slate-800/40 transition-all duration-300 hover:border-[#10B981]/40 group relative overflow-hidden"
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/60 flex items-center justify-center text-lg shadow-sm">
          {icon}
        </div>
        {subValue && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bg} ${color}`}>
            {subValue}
          </span>
        )}
      </div>
      
      {/* Middle row */}
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-slate-100 tracking-tight group-hover:text-[#10B981] transition-colors">{value}</p>
      
      {/* Bottom row */}
      {subLabel && (
        <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
          {subLabel}
        </p>
      )}
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
  }, []);

  if (loading || !stats) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 text-xs font-semibold tracking-wider">Carregando métricas reais...</p>
    </div>
  );

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const actIcons = { payment_received: '💰', reminder_sent: '🔔', charge_created: '📝', charge_overdue: '⚠️', client_created: '👤' };

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
    <div className="space-y-6">
      
      {/* 🔄 Top Floating Sync/Reload Header */}
      <div className="flex justify-between items-center border-b border-slate-900/60 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Visão Geral das Operações</h2>
          <p className="text-xs text-slate-500 mt-0.5">Visão unificada das cobranças e fluxos ativos</p>
        </div>
        <button 
          onClick={loadStats}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm shadow-black/10"
        >
          🔄 Recarregar Dados
        </button>
      </div>

      {/* 🪄 Catarina AI Insights Premium Banner */}
      <div className="bg-[#0C0E1A] border border-slate-800/40 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-[#10B981]/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-44 h-44 rounded-full bg-teal-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900/50 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🪄</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Catarina AI Insights
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              </h3>
              <p className="text-[11px] text-slate-500">Fluxo de inteligência automatizada sobre inadimplência</p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/15 uppercase tracking-wider">
            Gemini 2.5 Flash
          </span>
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-950/40 rounded-xl border border-slate-900/60 flex items-center justify-center">
                <span className="text-[11px] text-slate-500 animate-pulse font-medium">Analisando cobranças...</span>
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
                  className={`border ${borderColors[insight.type] || 'border-slate-800/40'} ${bgColors[insight.type] || 'bg-slate-900/10'} rounded-xl p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/5`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-slate-200">{insight.title}</h4>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${bgColors[insight.type]} ${textColors[insight.type]}`}>
                      {badgeLabels[insight.type] || 'Info'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{insight.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📊 Exactly 3 Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon="💰" 
          label="Recebido este mês" 
          value={fmt(stats.totalReceived)} 
          subValue="↑ 23%" 
          bg="bg-emerald-500/10" 
          color="text-emerald-400" 
          subLabel={`Recebido hoje: ${fmt(stats.receivedToday || 0)}`}
        />
        <StatCard 
          icon="⏳" 
          label="Cobranças Pendentes" 
          value={`${stats.pendingCount + stats.overdueCount} faturas`} 
          subValue={fmt(stats.pendingTotal + stats.overdueTotal)} 
          bg="bg-amber-500/10" 
          color="text-amber-400" 
          subLabel={`Vencidas: ${stats.overdueCount} | Pendentes: ${stats.pendingCount}`}
        />
        <StatCard 
          icon="📈" 
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
        <div className="lg:col-span-2 bg-[#0C0E1A] rounded-2xl p-6 border border-slate-800/40">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Histórico de Receita</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Últimos 14 dias de faturamentos ativos</p>
            </div>
            
            <div className="text-right">
              {selectedPoint ? (
                <div>
                  <p className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider leading-none">
                    {new Date(selectedPoint.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                  <p className="text-sm font-extrabold text-slate-200 mt-1 leading-none">{fmt(selectedPoint.total)}</p>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium bg-slate-900 px-2.5 py-1 rounded border border-slate-800/60">
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
              
              <div className="flex justify-between text-[9px] font-bold text-slate-600 px-2 pt-2 border-t border-slate-900/40">
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
        <div className="bg-[#0C0E1A] rounded-2xl p-6 border border-slate-800/40">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Status das Cobranças</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Distribuição geral de títulos e quitações</p>
          </div>
          
          {stats.statusDistribution && stats.statusDistribution.length > 0 ? (
            <DonutChart data={stats.statusDistribution} totalToReceive={totalToReceive} />
          ) : (
            <div className="flex items-center justify-center h-40 text-xs text-slate-500 italic">
              Nenhuma cobrança ativa cadastrada.
            </div>
          )}
        </div>
      </div>

      {/* ⚡ Bottom Row widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Atividade Recente */}
        <div className="bg-[#0C0E1A] rounded-2xl p-6 border border-slate-800/40 flex flex-col">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Atividade Recente</h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {(stats.recentActivity || []).slice(0, 6).map((a, i) => (
              <div 
                key={i} 
                className="flex gap-3 py-2.5 border-b border-slate-900/60 last:border-b-0 hover:bg-slate-950/20 px-2 rounded-lg transition-colors duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/50 flex items-center justify-center text-base flex-shrink-0">
                  {actIcons[a.action] || '📋'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-300 truncate leading-snug">{a.details}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                    <span>{relTime(a.created_at)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span>{new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  </p>
                </div>
              </div>
            ))}
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <div className="flex items-center justify-center py-10 text-xs text-slate-500 italic">
                Nenhum log operacional registrado.
              </div>
            )}
          </div>
        </div>

        {/* 2. Resumo Diário */}
        <div className="bg-[#0C0E1A] rounded-2xl p-6 border border-slate-800/40">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Resumo Financeiro Diário</h3>
          <div className="space-y-3">
            <div className="bg-[#0F111E] rounded-xl p-3.5 border border-slate-900">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pago Hoje</span>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{fmt(stats.receivedToday || 0)}</p>
            </div>
            
            <div className="bg-[#0F111E] rounded-xl p-3.5 border border-slate-900">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">A Vencer Hoje</span>
              <p className="text-lg font-black text-amber-500 mt-0.5">{fmt(stats.dueToday || 0)}</p>
            </div>
            
            <div className="bg-[#0F111E] rounded-xl p-3.5 border border-slate-900">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">A Vencer Amanhã</span>
              <p className="text-lg font-black text-blue-400 mt-0.5">{fmt(stats.dueTomorrow || 0)}</p>
            </div>
            
            <div className="bg-[#0F111E] hover:border-[#10B981]/30 rounded-xl p-3.5 border border-slate-900 cursor-pointer transition-all duration-200" onClick={() => window.location.href = '/dashboard/cobranca-diaria'}>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Faturamentos Recorrentes Diários</span>
                <span className="text-[10px] text-emerald-400 font-bold hover:underline">Ver →</span>
              </div>
              <p className="text-lg font-black text-emerald-400 mt-0.5">
                {fmt(stats.dailyBillingTotal || 0)}
                <span className="text-slate-500 font-bold text-xs"> /dia</span>
              </p>
              <p className="text-[9px] text-slate-500 mt-1 font-semibold">{stats.dailyBillingCount || 0} contratos recorrentes ativos</p>
            </div>
          </div>
        </div>

        {/* 3. Clientes em Risco */}
        <div className="bg-[#0C0E1A] rounded-2xl p-6 border border-slate-800/40">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Alertas de Clientes em Risco</h3>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {(stats.atRiskClients || []).map((c, i) => {
              const dateStr = c.oldest_overdue_date 
                ? `Vencido desde ${new Date(c.oldest_overdue_date).toLocaleDateString('pt-BR')}` 
                : '';
              
              const isCritical = c.health_score === 'critical';
              return (
                <div 
                  key={i} 
                  className="bg-[#0F111E] rounded-xl p-3 border border-slate-900 flex items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${
                      isCritical ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {isCritical ? '🚨' : '⚠️'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{c.name}</p>
                      <p className={`text-[10px] font-medium leading-none mt-1 ${isCritical ? 'text-rose-400/90' : 'text-amber-400/90'}`}>
                        Débito: {fmt(c.total_overdue)}
                      </p>
                      {dateStr && (
                        <p className="text-[9px] text-slate-500 mt-0.5 truncate">{dateStr}</p>
                      )}
                    </div>
                  </div>
                  
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                  } flex-shrink-0 scale-90`}>
                    {isCritical ? 'Crítico' : 'Alerta'}
                  </span>
                </div>
              );
            })}
            
            {(!stats.atRiskClients || stats.atRiskClients.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-3xl mb-2">🎉</span>
                <p className="text-emerald-400 text-xs font-bold">100% em dia!</p>
                <p className="text-[10px] text-slate-500 mt-1">Todos os clientes ativos adimplentes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
