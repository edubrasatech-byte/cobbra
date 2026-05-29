'use client';
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modal Edit States
  const [editRole, setEditRole] = useState('user');
  const [editPlan, setEditPlan] = useState('trial');
  const [editStatus, setEditStatus] = useState('active');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/users?page=${page}&limit=12`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (planFilter) url += `&plan=${planFilter}`;

      const res = await fetch(url);
      if (res.status === 403) {
        setData({ error: 'access_denied' });
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Erro ao carregar dados administrativos", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, planFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      loadData();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditPlan(u.plan);
    setEditStatus(u.status);
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: editRole,
          plan: editPlan,
          status: editStatus
        })
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(`🎉 Usuário ${selectedUser.name} atualizado com sucesso!`);
        setSelectedUser(null);
        loadData();
      } else {
        alert('Erro: ' + resData.error);
      }
    } catch (err) {
      alert('Erro de conexão ao salvar alterações.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonateUser = (u) => {
    if (confirm(`Deseja simular o acesso como o usuário "${u.name}"? Isso permitirá que você veja e use a dashboard através dos olhos dele.`)) {
      localStorage.setItem('simulatedUser', JSON.stringify({
        id: u.id,
        name: u.name,
        email: u.email,
        business_name: u.business_name
      }));
      showToast(`🔑 Simulando sessão de ${u.name}... Redirecionando...`);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    }
  };

  const fmtCurrency = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
        <div style={{ width: 36, height: 36, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Carregando estatísticas do SaaS...</p>
      </div>
    );
  }

  if (data?.error === 'access_denied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 500, textAlign: 'center' }}>
        <span style={{ fontSize: 60, marginBottom: 20 }}>🔒</span>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: 8 }}>Painel Restrito</h2>
        <p style={{ color: '#64748b', fontSize: 14, maxWidth: 360, lineHeight: 1.5 }}>
          Seu cargo não possui credenciais suficientes de Administrador Sênior do Cobbra. Contate a diretoria técnica.
        </p>
      </div>
    );
  }

  const gs = data?.globalStats || {};
  const users = data?.users || [];
  const planDist = data?.planDistribution || [];
  const recentRegs = data?.recentRegistrations || [];
  const auditLogs = data?.auditLogs || [];

  // SVG Chart Computations (Plan distribution Pie)
  const totalPlanCount = planDist.reduce((acc, curr) => acc + curr.count, 0) || 1;
  let accumulatedAngle = 0;
  const colorsList = {
    trial: '#38bdf8',
    starter: '#f59e0b',
    pro: '#a855f7',
    crescimento: '#10b981',
    cobra_pro: '#059669',
    enterprise: '#ec4899'
  };

  return (
    <div style={{ color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Dynamic Keyframes for Pulsing indicator & Spinners */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ping {
          0% { transform: scale(1); opacity: 0.9; }
          70%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .ping-dot {
          position: relative;
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
        }
        .ping-dot::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-color: #10b981;
          animation: pulse-ping 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      ` }} />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#070913', padding: '14px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: '0 10px 25px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🐍</span> {toastMsg}
        </div>
      )}

      {/* ── SECTION 1: GLOBAL KPIs ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '👥', label: 'Usuários Online', value: gs.onlineUsers, sub: 'ativos nos últimos 10 min', color: '#10b981', bg: 'rgba(16,185,129,0.12)', isOnline: true },
          { icon: '💎', label: 'Assinantes Ativos', value: gs.activeUsers, sub: `de ${gs.totalUsers} cadastrados`, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
          { icon: '💰', label: 'Faturamento Geral', value: fmtCurrency(gs.totalRevenue), sub: 'Pix direto acumulado', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          { icon: '⚡', label: 'Remessas Enviadas', value: Number((gs.whatsappSent || 0) + (gs.emailSent || 0)).toLocaleString('pt-BR'), sub: `${gs.whatsappSent} Whats · ${gs.emailSent} E-mails`, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#0c0e1a', borderRadius: 16, padding: 20, border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {k.icon}
              </div>
              
              {k.isOnline ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="ping-dot" />
                  <span style={{ fontSize: 10, color: '#34d399', fontWeight: 800, textTransform: 'uppercase' }}>Live</span>
                </div>
              ) : (
                <span style={{ fontSize: 10, color: k.color, fontWeight: 700, background: k.bg, padding: '3px 8px', borderRadius: 6 }}>
                  SaaS KPIs
                </span>
              )}
            </div>
            
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontWeight: 600 }}>{k.label}</p>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '4px 0 0 0', letterSpacing: '-0.5px' }}>{k.value}</h3>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0 0', opacity: 0.8 }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: METRICS & GRAPHS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* SVG Plan Distribution Donut Chart */}
        <div style={{ background: '#0c0e1a', borderRadius: 16, border: '1px solid #1e293b', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: 0 }}>📊 Distribuição de Assinaturas</h4>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>Proporção por tipo de plano ativo no SaaS</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', flexWrap: 'wrap', minHeight: 180 }}>
            {/* SVG circle rendering */}
            <svg width="150" height="150" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
              {planDist.map((item, idx) => {
                const percentage = item.count / totalPlanCount;
                const strokeDasharray = `${percentage * 100} ${100 - (percentage * 100)}`;
                const strokeDashoffset = 100 - accumulatedAngle;
                accumulatedAngle += percentage * 100;
                const strokeColor = colorsList[item.plan] || '#cbd5e1';

                return (
                  <circle
                    key={idx}
                    cx="20"
                    cy="20"
                    r="15.915"
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="4.5"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-width 0.2s' }}
                    onMouseEnter={e => e.currentTarget.setAttribute('stroke-width', '5.5')}
                    onMouseLeave={e => e.currentTarget.setAttribute('stroke-width', '4.5')}
                  />
                );
              })}
              {/* Inner hole */}
              <circle cx="20" cy="20" r="12" fill="#0c0e1a" />
            </svg>

            {/* Chart Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
              {planDist.map((item, idx) => {
                const color = colorsList[item.plan] || '#cbd5e1';
                const percent = ((item.count / totalPlanCount) * 100).toFixed(0);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      <span style={{ color: '#cbd5e1', fontWeight: 600, textTransform: 'capitalize' }}>
                        {item.plan === 'cobra_pro' ? 'Cobra Pro 👑' : item.plan}
                      </span>
                    </div>
                    <span style={{ color: '#ffffff', fontWeight: 800 }}>{item.count} ({percent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SVG Daily Registrations Bar Chart */}
        <div style={{ background: '#0c0e1a', borderRadius: 16, border: '1px solid #1e293b', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: 0 }}>📈 Novos Registros (Últimos 7 dias)</h4>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>Volume de novos empreendedores por dia</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, height: 160, padding: '0 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {recentRegs.length === 0 ? (
              <p style={{ width: '100%', textAlign: 'center', color: '#64748b', fontSize: 12 }}>Nenhum cadastro recente</p>
            ) : (
              recentRegs.map((reg, idx) => {
                const maxCount = Math.max(...recentRegs.map(r => r.count)) || 1;
                const barHeightPercent = (reg.count / maxCount) * 100;
                const dateParts = reg.register_day.split('-');
                const label = `${dateParts[2]}/${dateParts[1]}`;

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981' }}>{reg.count}</span>
                    <div style={{ 
                      width: '100%', 
                      maxWidth: 24, 
                      height: `${barHeightPercent * 0.7}%`, 
                      background: 'linear-gradient(to top, #059669 0%, #10b981 100%)', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'opacity 0.2s',
                      cursor: 'pointer'
                    }} 
                    onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                    onMouseLeave={e => e.currentTarget.style.opacity = 1}
                    title={`${reg.count} cadastros em ${reg.register_day}`}
                    />
                    <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>{label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── SECTION 3: USERS LIST & TIMELINE TIMELINE ROW ── */}
      <div style={{ display: 'flex', gap: 20, flexDirection: 'column', lgDirection: 'row' }}>
        
        {/* Main Users Table Card */}
        <div style={{ flex: 3, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>👥 Todos os Usuários</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input 
                placeholder="Buscar usuário, email ou empresa..." 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }} 
                style={{ 
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #1e293b', 
                  background: '#0c0e1a', color: '#f1f5f9', fontSize: 12, outline: 'none', width: 220 
                }} 
              />
              
              <select 
                value={statusFilter} 
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#0c0e1a', color: '#f1f5f9', fontSize: 12 }}
              >
                <option value="">Todos Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="blocked">Bloqueados</option>
              </select>

              <select 
                value={planFilter} 
                onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#0c0e1a', color: '#f1f5f9', fontSize: 12 }}
              >
                <option value="">Todos Planos</option>
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="crescimento">Crescimento</option>
                <option value="cobra_pro">Cobra Pro</option>
              </select>
            </div>
          </div>

          {/* Table container */}
          <div style={{ background: '#0c0e1a', borderRadius: 16, border: '1px solid #1e293b', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', background: 'rgba(255,255,255,0.01)' }}>
                  {['Parceiro / Empresa', 'Acesso', 'Faturamento', 'Status', 'Clientes', 'Lembretes', 'Onboarding', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Nenhum usuário correspondente aos filtros</td>
                  </tr>
                ) : (
                  users.map(u => {
                    const sc = u.status === 'active' ? { c: '#34d399', bg: 'rgba(16,185,129,0.1)', l: 'Ativo' } :
                               u.status === 'blocked' ? { c: '#f87171', bg: 'rgba(239,68,68,0.1)', l: 'Bloqueado' } :
                               { c: '#fbbf24', bg: 'rgba(245,158,11,0.1)', l: 'Inativo' };

                    const planLabel = u.plan === 'cobra_pro' ? 'Cobra Pro 👑' : 
                                      u.plan === 'crescimento' ? 'Crescimento 🐍' : 
                                      u.plan.toUpperCase();

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 10 }}>
                              {u.name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: '#ffffff', margin: 0, fontSize: 12.5 }}>{u.name}</p>
                              <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{u.business_name || 'Sem Razão Social'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>{planLabel}</span>
                            <span style={{ fontSize: 9, color: '#64748b' }}>{u.email}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 800 }}>
                          {fmtCurrency(u.total_revenue)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: sc.c, background: sc.bg, padding: '3px 8px', borderRadius: 20 }}>
                            {sc.l}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 700, textAlign: 'center' }}>
                          {u.client_count}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, textAlign: 'center' }}>
                          {u.charge_count}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 9, color: u.onboarding_completed ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                            {u.onboarding_completed ? '✓ Completo' : '✗ Pendente'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button 
                              onClick={() => handleOpenEditModal(u)}
                              style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', fontSize: 10, padding: '4px 8px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                            >
                              ⚙️ Configurar
                            </button>
                            <button 
                              onClick={() => handleImpersonateUser(u)}
                              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: 10, padding: '4px 8px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                            >
                              🔑 Simular
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ background: '#0c0e1a', color: '#cbd5e1', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Página {page} de {data.pagination.totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                style={{ background: '#0c0e1a', color: '#cbd5e1', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: page === data.pagination.totalPages ? 'not-allowed' : 'pointer', opacity: page === data.pagination.totalPages ? 0.5 : 1 }}
              >
                Próxima →
              </button>
            </div>
          )}

        </div>

        {/* Audit Log Timeline Widget (Sidebar) */}
        <div style={{ flex: 1.2, minWidth: 260, background: '#0c0e1a', borderRadius: 16, border: '1px solid #1e293b', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: 'fit-content' }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>🎫 Log de Auditoria Geral</h4>
            <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0 0' }}>Timeline de atividades recentes no SaaS</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
            {auditLogs.length === 0 ? (
              <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', margin: '20px 0' }}>Nenhum log registrado</p>
            ) : (
              auditLogs.map((log, idx) => {
                const isSystemAction = log.action.includes('admin') || log.action.includes('ticket');
                const badgeColor = isSystemAction ? '#fbbf24' : '#10b981';
                const badgeBg = isSystemAction ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
                
                return (
                  <div key={idx} style={{ borderBottom: idx < auditLogs.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none', paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: badgeColor, background: badgeBg, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: 9, color: '#64748b' }}>
                        {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>{log.details}</p>
                    <span style={{ fontSize: 8.5, color: '#64748b' }}>Responsável: {log.user_name || 'Visitante/Anônimo'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── SECTION 4: USER CONFIGURATION MODAL ── */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,9,19,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: '#0c0e1a', border: '1px solid #1e293b', borderRadius: 20, width: '100%', maxWidth: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>⚙️ Configurar Assinante</h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>Alterando permissões de {selectedUser.name}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* PLAN OVERRIDE */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Plano de Assinatura</label>
                <select 
                  value={editPlan} 
                  onChange={e => setEditPlan(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#1e293b', color: '#ffffff', fontSize: 12, outline: 'none' }}
                >
                  <option value="trial">Trial (Teste Grátis)</option>
                  <option value="starter">Starter (R$ 9,90/mês)</option>
                  <option value="crescimento">Crescimento (R$ 19,90/mês)</option>
                  <option value="cobra_pro">Cobra Pro (R$ 49,90/mês)</option>
                </select>
              </div>

              {/* ROLE OVERRIDE */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Cargo / Nível de Acesso</label>
                <select 
                  value={editRole} 
                  onChange={e => setEditRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#1e293b', color: '#ffffff', fontSize: 12, outline: 'none' }}
                >
                  <option value="user">Usuário Padrão</option>
                  <option value="admin">Administrador Operacional</option>
                  <option value="admin_senior">Administrador Sênior 👑</option>
                </select>
              </div>

              {/* STATUS OVERRIDE */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status da Conta</label>
                <select 
                  value={editStatus} 
                  onChange={e => setEditStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#1e293b', color: '#ffffff', fontSize: 12, outline: 'none' }}
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="inactive">Inativo (Sem faturas ativas)</option>
                  <option value="blocked">Bloqueado (Bloqueio Total)</option>
                </select>
              </div>

            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button 
                onClick={() => setSelectedUser(null)}
                disabled={actionLoading}
                style={{ 
                  flex: 1, padding: '10px 0', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', 
                  color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveUserChanges}
                disabled={actionLoading}
                style={{ 
                  flex: 2, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  border: 'none', color: '#070913', fontSize: 12, fontWeight: 800, cursor: actionLoading ? 'default' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.2)'
                }}
              >
                {actionLoading ? '⏳ Gravando...' : 'Salvar Alterações'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
