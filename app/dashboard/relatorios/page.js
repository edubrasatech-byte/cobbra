'use client';
import { useState, useEffect } from 'react';

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

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = () => {
    setData(null);
    fetch(`/api/relatorios?type=${activeTab}&period=${period}`)
      .then(r => r.json()).then(setData).catch(() => setData(null));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); });
  }, []);

  useEffect(() => {
    loadData();
    setSelectedBarIndex(null);
  }, [activeTab, period]);

  const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const selectedBar = selectedBarIndex !== null && data?.daily ? data.daily[selectedBarIndex] : null;

  if (user?.plan === 'starter') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', minHeight: '60vh', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#1e293b', borderRadius: 24, padding: '48px 32px', maxWidth: 540, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>📈</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Relatórios Avançados</h2>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
            Acesse rankings detalhados de pagadores, análise de efetividade de lembretes, taxas de inadimplência histórica e projeções de faturamento em tempo real.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, textAlign: 'left', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>✓ Recursos inclusos a partir do Crescimento:</p>
            {[
              'Gráficos interativos e dinâmicos de receita diária',
              'Ranking automatizado dos melhores pagadores',
              'Auditoria de inadimplência consolidada por cliente',
              'Métricas e taxas de leitura dos disparos no WhatsApp'
            ].map((beneficio, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: '#cbd5e1' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> {beneficio}
              </div>
            ))}
          </div>
          <a href="/dashboard/configuracoes" style={{
            display: 'inline-block', width: '100%', padding: '14px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #059669, #0d9488)', color: '#fff', fontSize: 15, fontWeight: 700,
            textAlign: 'center', cursor: 'pointer', border: 'none', textDecoration: 'none', boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
            transition: 'all 0.2s'
          }}>
            Fazer Upgrade de Plano 💎
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'revenue', label: '💰 Receita', desc: 'Análise de receita por período' },
    { key: 'inadimplencia', label: '⚠️ Inadimplência', desc: 'Acompanhe inadimplência por cliente' },
    { key: 'clients', label: '👥 Clientes', desc: 'Rankings de clientes' },
    { key: 'reminders', label: '🔔 Lembretes', desc: 'Efetividade dos lembretes' },
  ];

  const cardS = { 
    background: '#0C0E1A', 
    borderRadius: 20, 
    padding: isMobile ? '16px' : '24px', 
    border: '1px solid rgba(255,255,255,0.04)' 
  };

  return (
    <div className="pb-24">
      {/* Tabs and Reload */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none whitespace-nowrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
              background: activeTab === t.key ? 'linear-gradient(135deg,#059669,#0d9488)' : 'rgba(255,255,255,0.05)',
              color: activeTab === t.key ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600,
              transition: 'all 0.2s'
            }}>{t.label}</button>
          ))}
        </div>
        <button 
          onClick={loadData}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 14px', color: '#cbd5e1', cursor: 'pointer',
            fontFamily: 'Inter', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path>
          </svg>
          Recarregar
        </button>
      </div>

      {/* Revenue */}
      {activeTab === 'revenue' && data && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {['7', '30', '90', '365'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                background: period === p ? '#059669' : 'rgba(255,255,255,0.05)', color: period === p ? '#fff' : '#94a3b8', fontSize: 13
              }}>{p === '7' ? '7 dias' : p === '30' ? '30 dias' : p === '90' ? '3 meses' : '1 ano'}</button>
            ))}
          </div>
          <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40" style={{ padding: isMobile ? '16px' : '24px', marginBottom: 20 }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Histórico de Receita</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total no período: <span className="text-[#10B981] font-bold">{fmt(data.total)}</span>
                </p>
              </div>
              
              <div className="text-right">
                {selectedBar ? (
                  <div>
                    <p className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider leading-none">
                      {new Date(selectedBar.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </p>
                    <p className="text-sm font-extrabold text-slate-200 mt-1 leading-none">{fmt(selectedBar.total)}</p>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium bg-slate-900 px-2.5 py-1 rounded border border-slate-800/60">
                    Selecione um ponto
                  </span>
                )}
              </div>
            </div>

            {data.daily && data.daily.length > 0 ? (
              <div className="space-y-4">
                <AreaChart 
                  data={data.daily} 
                  onSelectPoint={setSelectedBarIndex} 
                  selectedIndex={selectedBarIndex} 
                />
                
                <div className="flex justify-between text-[9px] font-bold text-slate-600 px-2 pt-2 border-t border-slate-900/40">
                  <span>{new Date(data.daily[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span>{new Date(data.daily[Math.floor(data.daily.length / 2)].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span>{new Date(data.daily[data.daily.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-xs text-slate-500 italic">
                Sem dados de faturamentos registrados no período.
              </div>
            )}
          </div>
          {data.monthly && data.monthly.length > 0 && (
            <div style={cardS}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Receita mensal</h3>
              {data.monthly.map((m, i) => {
                const max = Math.max(...data.monthly.map(x => x.total), 1);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', width: 60 }}>{m.month}</span>
                    <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(m.total / max) * 100}%`, background: 'linear-gradient(to right,#059669,#34d399)', borderRadius: 6, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, width: 100, textAlign: 'right' }}>{fmt(m.total)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inadimplência */}
      {activeTab === 'inadimplencia' && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: '16px' }}>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Inadimplência por mês</h3>
            {data.overdueByMonth?.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{m.month}</span>
                <div>
                  <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14 }}>{fmt(m.total)}</span>
                  <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>({m.count} {m.count === 1 ? 'cobrança' : 'cobranças'})</span>
                </div>
              </div>
            ))}
            {(!data.overdueByMonth || data.overdueByMonth.length === 0) && <p style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>Sem inadimplência! 🎉</p>}
          </div>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Inadimplência por cliente</h3>
            {data.overdueByClient?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', fontWeight: 700, fontSize: 12 }}>
                  {c.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }} className="truncate">{c.name}</p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>{c.count} {c.count === 1 ? 'cobrança vencida' : 'cobranças vencidas'}</p>
                </div>
                <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 14, shrink: 0 }} className="shrink-0">{fmt(c.total)}</span>
              </div>
            ))}
            {(!data.overdueByClient || data.overdueByClient.length === 0) && <p style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>Nenhum devedor! 🎉</p>}
          </div>
        </div>
      )}

      {/* Clients */}
      {activeTab === 'clients' && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: '16px' }}>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>🏆 Melhores pagadores</h3>
            {data.topPayers?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 16, width: 24, shrink: 0 }} className="shrink-0">{i + 1}º</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }} className="truncate">{c.name}</p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>Taxa: {c.payment_rate || 0}%</p>
                </div>
                <span style={{ color: '#10b981', fontWeight: 700, shrink: 0 }} className="shrink-0">{fmt(c.total_paid)}</span>
              </div>
            ))}
          </div>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>⚠️ Maiores devedores</h3>
            {data.topDebtors?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 16, width: 24, shrink: 0 }} className="shrink-0">{i + 1}º</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }} className="truncate">{c.name}</p>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontWeight: 600, display: 'inline-block', marginTop: 2 }}>{c.health_score}</span>
                </div>
                <span style={{ color: '#fca5a5', fontWeight: 700, shrink: 0 }} className="shrink-0">{fmt(c.total_overdue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders */}
      {activeTab === 'reminders' && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ marginTop: '16px' }}>
          <div style={{ ...cardS, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📤</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#3b82f6' }}>{data.totalSent || 0}</p>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>Lembretes enviados</p>
          </div>
          <div style={{ ...cardS, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>👁️</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{data.totalRead || 0}</p>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>Lidos pelo cliente</p>
          </div>
          <div style={{ ...cardS, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📊</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b' }}>{data.readRate || 0}%</p>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>Taxa de leitura</p>
          </div>
        </div>
      )}

      {!data && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 flex-shrink-0">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin flex-shrink-0 mx-auto"></div>
          <p className="text-slate-500 text-xs font-semibold">Carregando relatórios...</p>
        </div>
      )}
    </div>
  );
}
