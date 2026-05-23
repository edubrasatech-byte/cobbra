'use client';
import { useState, useEffect } from 'react';

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  const [user, setUser] = useState(null);

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

  const cardS = { background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div>
      {/* Tabs and Reload */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          🔄 Recarregar
        </button>
      </div>

      {/* Revenue */}
      {activeTab === 'revenue' && data && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {['7', '30', '90', '365'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter',
                background: period === p ? '#059669' : 'rgba(255,255,255,0.05)', color: period === p ? '#fff' : '#94a3b8', fontSize: 13
              }}>{p === '7' ? '7 dias' : p === '30' ? '30 dias' : p === '90' ? '3 meses' : '1 ano'}</button>
            ))}
          </div>
          <div style={{ ...cardS, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Receita diária</h3>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{fmt(data.total)}</span>
            </div>
            {data.daily && data.daily.length > 0 ? (
              <>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 150, padding: '0 4px' }}>
                  {data.daily.map((d, i) => {
                    const max = Math.max(...data.daily.map(x => x.total), 1);
                    const isSelected = selectedBarIndex === i;
                    return (
                      <div key={i}
                        onClick={() => setSelectedBarIndex(i)}
                        style={{
                          flex: 1,
                          height: `${(d.total / max) * 100}%`,
                          minHeight: 4,
                          background: isSelected ? 'linear-gradient(to top, #10b981, #34d399)' : 'linear-gradient(to top, #059669, #34d399)',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          opacity: isSelected ? 1 : 0.65,
                          cursor: 'pointer',
                          transform: isSelected ? 'scaleY(1.05)' : 'scaleY(1)',
                          transformOrigin: 'bottom',
                          boxShadow: isSelected ? '0 0 8px rgba(16,185,129,0.4)' : 'none'
                        }}
                        title={`${new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR')}: ${fmt(d.total)}`}
                      />
                    );
                  })}
                </div>
                {/* Interactive date readout */}
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 10,
                  background: selectedBar ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedBar ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
                }}>
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
                  <span style={{ fontSize: 10, color: '#64748b' }}>{new Date(data.daily[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{new Date(data.daily[data.daily.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </>
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Sem dados para o período</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Inadimplência por mês</h3>
            {data.overdueByMonth?.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{m.month}</span>
                <div>
                  <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14 }}>{fmt(m.total)}</span>
                  <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>({m.count} cobranças)</span>
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
                  {c.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>{c.name}</p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>{c.count} cobranças vencidas</p>
                </div>
                <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 14 }}>{fmt(c.total)}</span>
              </div>
            ))}
            {(!data.overdueByClient || data.overdueByClient.length === 0) && <p style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>Nenhum devedor! 🎉</p>}
          </div>
        </div>
      )}

      {/* Clients */}
      {activeTab === 'clients' && data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>🏆 Melhores pagadores</h3>
            {data.topPayers?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 16, width: 24 }}>{i + 1}º</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>{c.name}</p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>Taxa: {c.payment_rate || 0}%</p>
                </div>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{fmt(c.total_paid)}</span>
              </div>
            ))}
          </div>
          <div style={cardS}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>⚠️ Maiores devedores</h3>
            {data.topDebtors?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 16, width: 24 }}>{i + 1}º</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>{c.name}</p>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontWeight: 600 }}>{c.health_score}</span>
                </div>
                <span style={{ color: '#fca5a5', fontWeight: 700 }}>{fmt(c.total_overdue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders */}
      {activeTab === 'reminders' && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
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

      {!data && <p style={{ color: '#64748b', textAlign: 'center', padding: 60 }}>Carregando relatórios...</p>}
    </div>
  );
}
