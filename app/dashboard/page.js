'use client';
import { useState, useEffect } from 'react';

function StatCard({ icon, label, value, subValue, color, bg }) {
  return (
    <div style={{
      background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)',
      transition: 'all 0.3s'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
        {subValue && <span style={{ fontSize: 12, color, fontWeight: 700, background: bg, padding: '4px 8px', borderRadius: 6 }}>{subValue}</span>}
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{value}</p>
    </div>
  );
}

function MiniBarChart({ data, onSelectBar, selectedIndex }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 120, padding: '0 4px' }}>
      {data.map((d, i) => {
        const isSelected = selectedIndex === i;
        return (
          <div key={i}
            onClick={() => onSelectBar(i)}
            style={{
              flex: 1, height: `${(d.total / max) * 100}%`, minHeight: 4,
              background: isSelected ? 'linear-gradient(to top, #10b981, #34d399)' : 'linear-gradient(to top, #059669, #34d399)',
              borderRadius: 3, transition: 'all 0.3s ease',
              opacity: isSelected ? 1 : 0.6,
              cursor: 'pointer',
              transform: isSelected ? 'scaleY(1.05)' : 'scaleY(1)',
              transformOrigin: 'bottom',
              boxShadow: isSelected ? '0 0 8px rgba(16,185,129,0.4)' : 'none'
            }}
            title={`${new Date(d.date).toLocaleDateString('pt-BR')}: R$ ${d.total.toFixed(2)}`}
          />
        );
      })}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <svg width="110" height="110" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx="18" cy="18" r="15.5" fill="transparent" stroke="#1e293b" strokeWidth="3" />
          {data.map((d, i) => {
            const pct = total > 0 ? (d.count / total) * 100 : 0;
            const offset = 100 - cumulative;
            cumulative += pct;
            return <circle key={i} cx="18" cy="18" r="15.5" fill="transparent" stroke={colors[d.status] || '#64748b'} strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />;
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: colors[d.status] || '#64748b', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{labels[d.status] || d.status}</span>
              <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>({d.count})</span>
              <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, marginLeft: 'auto' }}>{fmt(d.total)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Valor total a receber:</span>
        <span style={{ fontSize: 15, color: '#f59e0b', fontWeight: 800 }}>{fmt(totalToReceive)}</span>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: 16 }}>Carregando dados do painel...</p>
      </div>
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
  const selectedBar = selectedBarIndex !== null && stats.revenueData ? stats.revenueData[selectedBarIndex] : null;

  return (
    <div>
      <style>{`
        .dash-responsive .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px; }
        .dash-responsive .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 28px; }
        .dash-responsive .bottom-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        @media (max-width: 1024px) {
          .dash-responsive .stats-row { grid-template-columns: repeat(2, 1fr); }
          .dash-responsive .charts-row { grid-template-columns: 1fr; }
          .dash-responsive .bottom-row { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .dash-responsive .stats-row { grid-template-columns: 1fr; gap: 12px; }
          .dash-responsive .charts-row { grid-template-columns: 1fr; gap: 12px; }
          .dash-responsive .bottom-row { grid-template-columns: 1fr; gap: 12px; }
          .dash-responsive .stats-row p { font-size: 12px !important; }
        }
      `}</style>

      <div className="dash-responsive">
        {/* Reload Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button 
            onClick={loadStats}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 14px', color: '#cbd5e1', cursor: 'pointer',
              fontFamily: 'Inter', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            🔄 Recarregar Dados
          </button>
        </div>

        {/* AI Insights Section */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)', borderRadius: 20, padding: 24,
          border: '1px solid rgba(5,150,105,0.15)', marginBottom: 28,
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🪄</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Catarina AI Insights</h3>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Conselhos automáticos baseados nos seus números reais</p>
              </div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', textTransform: 'uppercase'
            }}>Gemini 2.5 Flash</span>
          </div>

          {insightsLoading ? (
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 0' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, minWidth: 240, height: 100, background: '#1e293b', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="animate-pulse" style={{ fontSize: 12, color: '#64748b' }}>Analisando fluxo de caixa...</span>
                </div>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13, margin: 0, fontStyle: 'italic' }}>Nenhum insight gerado ainda. Registre cobranças para Catarina começar a analisar!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, overflowX: 'auto' }} className="insights-grid">
              {insights.map((insight, idx) => {
                const borderColors = { success: '#10b981', warning: '#ef4444', info: '#3b82f6' };
                const bgColors = { success: 'rgba(16,185,129,0.03)', warning: 'rgba(239,68,68,0.03)', info: 'rgba(59,130,246,0.03)' };
                return (
                  <div 
                    key={idx} 
                    style={{
                      background: '#1e293b', borderRadius: 12, padding: 16,
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderLeft: `4px solid ${borderColors[insight.type] || '#64748b'}`,
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 700, color: '#fff' }}>{insight.title}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{insight.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .insights-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Stats Cards */}
        <div className="stats-row">
          <StatCard icon="💰" label="Recebido este mês" value={fmt(stats.totalReceived)} subValue="↑ 23%" color="#10b981" bg="rgba(16,185,129,0.15)" />
          <StatCard icon="⏳" label="Cobranças pendentes" value={`${stats.pendingCount + stats.overdueCount}`} subValue={fmt(stats.pendingTotal + stats.overdueTotal)} color="#f59e0b" bg="rgba(245,158,11,0.15)" />
          <StatCard icon="📈" label="Taxa de pagamento" value={`${stats.paymentRate}%`} subValue="em dia" color="#3b82f6" bg="rgba(59,130,246,0.15)" />
          <StatCard icon="🔔" label="Lembretes hoje" value={`${stats.remindersSentToday}`} subValue={`${stats.totalClients} clientes`} color="#8b5cf6" bg="rgba(139,92,246,0.15)" />
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Revenue Chart */}
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>📊 Receita (últimos 30 dias)</h3>
            {stats.revenueData && stats.revenueData.length > 0 ? (
              <>
                <MiniBarChart data={stats.revenueData} onSelectBar={setSelectedBarIndex} selectedIndex={selectedBarIndex} />
                {/* Interactive date readout */}
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: selectedBar ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedBar ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)'}`, transition: 'all 0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  {selectedBar ? (
                    <>
                      <span style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>
                        📅 {new Date(selectedBar.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0' }}>
                        {fmt(selectedBar.total)}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>👆 Toque em uma barra para ver a data e o valor</span>
                  )}
                </div>
                {/* Date range labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{new Date(stats.revenueData[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{new Date(stats.revenueData[stats.revenueData.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: 40 }}>Sem dados de receita ainda</p>
            )}
          </div>
          
          {/* Status Distribution */}
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>📋 Status das cobranças totais</h3>
            {stats.statusDistribution && stats.statusDistribution.length > 0 ? (
              <DonutChart data={stats.statusDistribution} totalToReceive={totalToReceive} />
            ) : (
              <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: 40 }}>Sem cobranças ainda</p>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="bottom-row">
          {/* Recent Activity */}
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>⚡ Atividade recente</h3>
            {(stats.recentActivity || []).slice(0, 6).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 18 }}>{actIcons[a.action] || '📋'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.details}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {relTime(a.created_at)} · {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhuma atividade recente</p>
            )}
          </div>

          {/* Resumo Financeiro Diário */}
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>📅 Resumo financeiro diário</h3>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 14, fontWeight: 500 }}>
              📅 {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>PAGO HOJE ATÉ AGORA</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981', margin: 0 }}>{fmt(stats.receivedToday || 0)}</p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>A RECEBER HOJE</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', margin: 0 }}>{fmt(stats.dueToday || 0)}</p>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>A RECEBER AMANHÃ</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', margin: 0 }}>{fmt(stats.dueTomorrow || 0)}</p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => window.location.href = '/dashboard/cobranca-diaria'}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.12)'}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>CONTRATOS DIÁRIOS ATIVOS</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981', margin: 0 }}>{fmt(stats.dailyBillingTotal || 0)}<span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}> /dia</span></p>
                  <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>{stats.dailyBillingCount || 0} ativos →</span>
                </div>
              </div>
            </div>
          </div>

          {/* At-Risk Clients */}
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>🔥 Clientes em risco</h3>
            {(stats.atRiskClients || []).map((c, i) => {
              const dateStr = c.oldest_overdue_date 
                ? `desde ${new Date(c.oldest_overdue_date).toLocaleDateString('pt-BR')}` 
                : '';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: c.health_score === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0
                  }}>{c.health_score === 'critical' ? '🚨' : '⚠️'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: c.health_score === 'critical' ? '#fca5a5' : '#fcd34d' }}>
                      Deve {fmt(c.total_overdue)} {dateStr && <span style={{ fontSize: 11, opacity: 0.8 }}>({dateStr})</span>}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: c.health_score === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: c.health_score === 'critical' ? '#fca5a5' : '#fcd34d',
                    textTransform: 'uppercase', whiteSpace: 'nowrap'
                  }}>{c.health_score === 'critical' ? 'Crítico' : 'Atenção'}</span>
                </div>
              );
            })}
            {(!stats.atRiskClients || stats.atRiskClients.length === 0) && (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🎉</p>
                <p style={{ color: '#10b981', fontSize: 14, fontWeight: 600 }}>Todos os clientes em dia!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
