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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const setMonthPreset = (monthOffset) => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    
    // Format to YYYY-MM-DD local timezone safely
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setPeriod(''); // Clear preset
  };

  const loadData = () => {
    setData(null);
    let url = `/api/relatorios?type=${activeTab}`;
    if (startDate) {
      url += `&start_date=${startDate}`;
    }
    if (endDate) {
      url += `&end_date=${endDate}`;
    }
    if (!startDate && !endDate && period) {
      url += `&period=${period}`;
    }
    fetch(url)
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
  }, [activeTab, period, startDate, endDate]);

  const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const selectedBar = selectedBarIndex !== null && data?.daily ? data.daily[selectedBarIndex] : null;

  if (user?.plan === 'starter') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', minHeight: '60vh', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 24, padding: '48px 32px', maxWidth: 540, border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>📈</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Relatórios Avançados</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
            Acesse rankings detalhados de pagadores, análise de efetividade de lembretes, taxas de inadimplência histórica e projeções de faturamento em tempo real.
          </p>
          <div style={{ background: 'var(--bg-input)', borderRadius: 16, padding: 20, textAlign: 'left', border: '1px solid var(--border-color)', marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>✓ Recursos inclusos a partir do Crescimento:</p>
            {[
              'Gráficos interativos e dinâmicos de receita diária',
              'Ranking automatizado dos melhores pagadores',
              'Auditoria de inadimplência consolidada por cliente',
              'Métricas e taxas de leitura dos disparos no WhatsApp'
            ].map((beneficio, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> {beneficio}
              </div>
            ))}
          </div>
          <a href="/dashboard/configuracoes" style={{
            display: 'inline-block', width: '100%', padding: '14px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #059669, #0d9488)', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700,
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
    { key: 'vehicles', label: '🚗 Veículos', desc: 'Desempenho da frota' },
    { key: 'reminders', label: '🔔 Lembretes', desc: 'Efetividade dos lembretes' },
  ];

  const cardS = { 
    background: 'var(--bg-surface)', 
    borderRadius: 20, 
    padding: isMobile ? '16px' : '24px', 
    border: '1px solid var(--border-color)' 
  };

  return (
    <div className="pb-24">
      {/* Printable CSS style rules */}
      <style>{`
        @media print {
          aside, nav, header, footer, button, select, input, .no-print, [class*="Sidebar"], [class*="MobileNav"], [class*="TopBar"] {
            display: none !important;
          }
          body, html, main, .pb-24 {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-\\[\\#0C0E1A\\], [style*="background"] {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
          h2, h3, h4, p, span, th, td {
            color: #000000 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th {
            border-bottom: 2px solid #475569 !important;
          }
          td, tr {
            border-bottom: 1px solid #e2e8f0 !important;
          }
          svg {
            filter: brightness(0.2) contrast(1.5) !important;
          }
        }
      `}</style>

      {/* Tabs and Reload */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4 no-print">
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
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 8, padding: '8px 14px', color: '#10b981', cursor: 'pointer',
              fontFamily: 'Inter', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
          >
            <span>🖨️</span> Exportar PDF
          </button>
          <button 
            onClick={loadData}
            style={{
              background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 14px', color: 'var(--text-secondary)', cursor: 'pointer',
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
      </div>

      {/* Date Filter & Presets Panel (Frente 20) */}
      <div className="no-print bg-card-theme rounded-2xl border border-theme p-4 mb-6 flex flex-col gap-4">
        {/* Row 1: Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginRight: 4 }}>Períodos:</span>
          {['7', '30', '90', '365'].map(p => (
            <button 
              key={p} 
              onClick={() => {
                setPeriod(p);
                setStartDate('');
                setEndDate('');
              }} 
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
                background: period === p && !startDate ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                color: period === p && !startDate ? '#10b981' : '#94a3b8',
                border: period === p && !startDate ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {p === '7' ? '7 dias' : p === '30' ? '30 dias' : p === '90' ? '3 meses' : '1 ano'}
            </button>
          ))}
          
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

          <button 
            onClick={() => setMonthPreset(0)} 
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
              background: 'var(--bg-input)', color: 'var(--text-secondary)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            Este Mês
          </button>
          <button 
            onClick={() => setMonthPreset(1)} 
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
              background: 'var(--bg-input)', color: 'var(--text-secondary)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            Mês Passado
          </button>
          <button 
            onClick={() => setMonthPreset(2)} 
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
              background: 'var(--bg-input)', color: 'var(--text-secondary)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            2 Meses Atrás
          </button>
        </div>

        {/* Row 2: Custom Date Inputs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 flex gap-2 items-center">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Data Inicial</label>
              <input 
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPeriod('');
                }}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Data Final</label>
              <input 
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPeriod('');
                }}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none'
                }}
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPeriod('30');
              }}
              style={{
                alignSelf: 'flex-end', padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none',
                color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Revenue */}
      {activeTab === 'revenue' && data && (
        <div style={{ marginTop: '16px' }}>
          {/* Note: Period picker removed here as it is now global above */}
          <div className="bg-card-theme rounded-2xl border border-theme" style={{ padding: isMobile ? '16px' : '24px', marginBottom: 20 }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-bold text-secondary-theme uppercase tracking-wider">Histórico de Receita</h3>
                <p className="text-[11px] text-muted-theme mt-0.5">
                  Total no período: <span className="text-[#10B981] font-bold">{fmt(data.total)}</span>
                </p>
              </div>
              
              <div className="text-right">
                {selectedBar ? (
                  <div>
                    <p className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider leading-none">
                      {new Date(selectedBar.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </p>
                    <p className="text-sm font-extrabold text-primary-theme mt-1 leading-none">{fmt(selectedBar.total)}</p>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-theme font-medium bg-input-theme px-2.5 py-1 rounded border border-theme">
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
              <div className="flex items-center justify-center h-40 text-xs text-muted-theme italic">
                Sem dados de faturamentos registrados no período.
              </div>
            )}
          </div>
          {data.monthly && data.monthly.length > 0 && (
            <div style={cardS}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Receita mensal</h3>
              {data.monthly.map((m, i) => {
                const max = Math.max(...data.monthly.map(x => x.total), 1);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', width: 60 }}>{m.month}</span>
                    <div style={{ flex: 1, height: 24, background: 'var(--bg-input)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(m.total / max) * 100}%`, background: 'linear-gradient(to right,#059669,#34d399)', borderRadius: 6, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, width: 100, textAlign: 'right' }}>{fmt(m.total)}</span>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Inadimplência por mês</h3>
            {data.overdueByMonth?.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{m.month}</span>
                <div>
                  <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14 }}>{fmt(m.total)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>({m.count} {m.count === 1 ? 'cobrança' : 'cobranças'})</span>
                </div>
              </div>
            ))}
            {(!data.overdueByMonth || data.overdueByMonth.length === 0) && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Sem inadimplência! 🎉</p>}
          </div>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Inadimplência por cliente</h3>
            {data.overdueByClient?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', fontWeight: 700, fontSize: 12 }}>
                  {c.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }} className="truncate">{c.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.count} {c.count === 1 ? 'cobrança vencida' : 'cobranças vencidas'}</p>
                </div>
                <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 14, shrink: 0 }} className="shrink-0">{fmt(c.total)}</span>
              </div>
            ))}
            {(!data.overdueByClient || data.overdueByClient.length === 0) && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Nenhum devedor! 🎉</p>}
          </div>
        </div>
      )}

      {/* Clients */}
      {activeTab === 'clients' && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: '16px' }}>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>🏆 Melhores pagadores</h3>
            {data.topPayers?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 16, width: 24, shrink: 0 }} className="shrink-0">{i + 1}º</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }} className="truncate">{c.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Taxa: {c.payment_rate || 0}%</p>
                </div>
                <span style={{ color: '#10b981', fontWeight: 700, shrink: 0 }} className="shrink-0">{fmt(c.total_paid)}</span>
              </div>
            ))}
          </div>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>⚠️ Maiores devedores</h3>
            {data.topDebtors?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 16, width: 24, shrink: 0 }} className="shrink-0">{i + 1}º</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }} className="truncate">{c.name}</p>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontWeight: 600, display: 'inline-block', marginTop: 2 }}>{c.health_score}</span>
                </div>
                <span style={{ color: '#fca5a5', fontWeight: 700, shrink: 0 }} className="shrink-0">{fmt(c.total_overdue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles */}
      {activeTab === 'vehicles' && data && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Company General Card */}
          {data.company && (
            <div style={{ ...cardS, background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏢 Desempenho Geral Corporativo</h4>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Sem veículo vinculado</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>RECEITA GERAL</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{fmt(data.company.income)}</p>
                </div>
                <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>DESPESAS GERAIS</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 900, color: '#f87171' }}>-{fmt(data.company.expense)}</p>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.04)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>LUCRO GERAL</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 900, color: data.company.profit >= 0 ? '#10b981' : '#f87171' }}>{fmt(data.company.profit)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          <div style={cardS}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Desempenho Financeiro da Frota</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.vehicles?.length || 0} veículos apurados</span>
            </div>
            
            {(!data.vehicles || data.vehicles.length === 0) ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>
                Nenhum veículo registrado na frota com movimentações no período.
              </div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.vehicles.map((v, i) => (
                  <div key={v.id || i} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>{v.model}</h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Placa: <strong>{v.plate}</strong> • Cor: {v.color || 'N/A'}</p>
                      </div>
                      <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 20, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
                        Margem {v.margin}%
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '8px 0', fontSize: 11.5 }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>RECEITA (LOCAÇÃO)</span>
                        <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: 'var(--text-secondary)' }}>{fmt(v.income)}</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>DESPESAS (MANUTENÇÃO)</span>
                        <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#f87171' }}>-{fmt(v.expense)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>RENDIMENTO LÍQUIDO</span>
                      <span style={{ fontWeight: 800, color: v.profit >= 0 ? '#10b981' : '#f87171', fontSize: 13 }}>{fmt(v.profit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      <th style={{ padding: '10px 8px' }}>Veículo</th>
                      <th style={{ padding: '10px 8px' }}>Placa</th>
                      <th style={{ padding: '10px 8px' }}>Cor</th>
                      <th style={{ padding: '10px 8px' }}>Receita Locação</th>
                      <th style={{ padding: '10px 8px' }}>Despesa Oficina</th>
                      <th style={{ padding: '10px 8px' }}>Saldo Líquido</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vehicles.map((v, i) => (
                      <tr key={v.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>{v.model}</td>
                        <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>{v.plate}</td>
                        <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>{v.color || '-'}</td>
                        <td style={{ padding: '14px 8px', color: '#34d399', fontWeight: 600 }}>{fmt(v.income)}</td>
                        <td style={{ padding: '14px 8px', color: '#f87171' }}>-{fmt(v.expense)}</td>
                        <td style={{ padding: '14px 8px', fontWeight: 800, color: v.profit >= 0 ? '#10b981' : '#f87171' }}>{fmt(v.profit)}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', color: '#38bdf8', fontWeight: 700 }}>{v.margin}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminders */}
      {activeTab === 'reminders' && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ marginTop: '16px' }}>
          <div style={{ ...cardS, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📤</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#3b82f6' }}>{data.totalSent || 0}</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Lembretes enviados</p>
          </div>
          <div style={{ ...cardS, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>👁️</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{data.totalRead || 0}</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Lidos pelo cliente</p>
          </div>
          <div style={{ ...cardS, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📊</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b' }}>{data.readRate || 0}%</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Taxa de leitura</p>
          </div>
        </div>
      )}

      {!data && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 flex-shrink-0">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin flex-shrink-0 mx-auto"></div>
          <p className="text-muted-theme text-xs font-semibold">Carregando relatórios...</p>
        </div>
      )}
    </div>
  );
}
