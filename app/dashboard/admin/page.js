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

  // Bulk / Delete States
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Outreach Robot States
  const [outreachStatus, setOutreachStatus] = useState('disconnected');
  const [outreachPhone, setOutreachPhone] = useState(null);
  const [outreachQr, setOutreachQr] = useState(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState(null);
  const [triggerLoading, setTriggerLoading] = useState(false);

  const [currentAdmin, setCurrentAdmin] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadOutreachStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/connect?type=outreach');
      const json = await res.json();
      setOutreachStatus(json.status || 'disconnected');
      setOutreachPhone(json.phone || null);
      setOutreachQr(json.qrCode || null);
      setOutreachError(json.error || null);
    } catch(e) {
      console.error("Erro ao obter status do robô outreach", e);
    }
  };

  const loadCurrentAdmin = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.user) {
        setCurrentAdmin(json.user);
      }
    } catch(e) {
      console.error("Erro ao obter dados do admin logado", e);
    }
  };

  useEffect(() => {
    loadCurrentAdmin();
    loadOutreachStatus();
  }, []);

  useEffect(() => {
    let interval;
    if (outreachStatus === 'scanning') {
      interval = setInterval(() => {
        loadOutreachStatus();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [outreachStatus]);

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

  const handleConnectOutreach = async () => {
    setOutreachLoading(true);
    setOutreachError(null);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'outreach' })
      });
      const json = await res.json();
      if (json.success) {
        setOutreachStatus(json.status || 'scanning');
        setOutreachQr(json.qrCode || null);
        setOutreachError(json.error || null);
      } else {
        setOutreachError(json.error || 'Erro ao inicializar conexão.');
      }
    } catch (e) {
      setOutreachError('Erro de conexão ao iniciar pareamento.');
    } finally {
      setOutreachLoading(false);
    }
  };

  const handleDisconnectOutreach = async () => {
    if (!confirm('Tem certeza que deseja desconectar o número do Robô Catarina Outbound?')) return;
    setOutreachLoading(true);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'outreach' })
      });
      const json = await res.json();
      if (json.success) {
        setOutreachStatus('disconnected');
        setOutreachPhone(null);
        setOutreachQr(null);
        showToast('🔌 Robô Catarina desconectado com sucesso!');
      }
    } catch (e) {
      alert('Erro ao desconectar robô.');
    } finally {
      setOutreachLoading(false);
    }
  };

  const handleTriggerOutreachCron = async () => {
    setTriggerLoading(true);
    try {
      const res = await fetch('/api/cron/leads-outreach?secret=cobbra-secret-cron-key-2026');
      const json = await res.json();
      if (res.ok) {
        if (json.mock) {
          showToast(`🤖 [SIMULAÇÃO] Fila qualificada e cold pitch gerado para ${json.target?.name}!`);
        } else if (json.status === 'sent') {
          showToast(`🚀 Sucesso! Cold pitch disparado para ${json.recipient}!`);
        } else {
          showToast(`✅ ${json.message || 'Cron de prospecção executado!'}`);
        }
        loadData();
      } else {
        alert('Erro no cron: ' + (json.error || 'Erro desconhecido.'));
      }
    } catch (e) {
      alert('Erro de rede ao acionar cron.');
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleDeleteIndividualUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToDelete.id })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`🗑️ Usuário ${userToDelete.name} excluído com sucesso!`);
        setUserToDelete(null);
        setSelectedUserIds(prev => prev.filter(id => id !== userToDelete.id));
        loadData();
      } else {
        alert('Erro: ' + (json.error || 'Falha ao excluir usuário.'));
      }
    } catch (e) {
      alert('Erro de rede ao excluir usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (deleteConfirmText !== 'EXCLUIR') {
      alert('Por favor, digite EXCLUIR para confirmar a ação de segurança.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`🗑️ ${selectedUserIds.length} usuário(s) excluído(s) em lote!`);
        setSelectedUserIds([]);
        setShowBulkDeleteModal(false);
        setDeleteConfirmText('');
        loadData();
      } else {
        alert('Erro: ' + (json.error || 'Falha ao excluir usuários em massa.'));
      }
    } catch (e) {
      alert('Erro de rede ao excluir usuários.');
    } finally {
      setActionLoading(false);
    }
  };

  const isUserSelected = (id) => selectedUserIds.includes(id);

  const handleToggleSelectUser = (id) => {
    if (isUserSelected(id)) {
      setSelectedUserIds(prev => prev.filter(uid => uid !== id));
    } else {
      setSelectedUserIds(prev => [...prev, id]);
    }
  };

  const handleToggleSelectAll = (currentPageUsers) => {
    const currentPageIds = currentPageUsers.map(u => u.id);
    const allSelected = currentPageIds.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedUserIds(prev => {
        const uniqueNewIds = currentPageIds.filter(id => !prev.includes(id));
        return [...prev, ...uniqueNewIds];
      });
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '👥', label: 'Usuários Online', value: gs.onlineUsers, sub: 'ativos nos últimos 10 min', color: '#10b981', bg: 'rgba(16,185,129,0.12)', isOnline: true },
          { icon: '💎', label: 'Assinantes Ativos', value: gs.activeUsers, sub: `de ${gs.totalUsers} cadastrados`, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
          { icon: '📈', label: 'MRR (Recorrência Mensal)', value: fmtCurrency(gs.mrr), sub: 'Receita Mensal Recorrente', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { icon: '🔮', label: 'LTV (Lifetime Value)', value: fmtCurrency(gs.ltv), sub: 'Valor vitalício estimado', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
          { icon: '📉', label: 'Churn Rate (SaaS)', value: `${Number(gs.churnRate || 0).toFixed(1)}%`, sub: 'Taxa de cancelamento ativa', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
          { icon: '💰', label: 'Faturamento Geral', value: fmtCurrency(gs.totalRevenue), sub: 'Pix direto acumulado', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        
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

        {/* 🤖 Robô Catarina Outbound Card */}
        <div style={{ background: '#0c0e1a', borderRadius: 16, border: '1px solid #1e293b', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
          
          {/* Glowing Green Decorative Blur Background if Connected */}
          {outreachStatus === 'connected' && (
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: '#10b981', filter: 'blur(45px)', opacity: 0.15, pointerEvents: 'none' }} />
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                🤖 Robô Catarina Outbound
              </h4>
              <span style={{ 
                fontSize: 9, 
                fontWeight: 800, 
                padding: '3px 8px', 
                borderRadius: 20, 
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: outreachStatus === 'connected' ? 'rgba(16,185,129,0.1)' : outreachStatus === 'scanning' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                color: outreachStatus === 'connected' ? '#34d399' : outreachStatus === 'scanning' ? '#fbbf24' : '#f87171',
                border: outreachStatus === 'connected' ? '1px solid rgba(16,185,129,0.2)' : outreachStatus === 'scanning' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(239,68,68,0.2)'
              }}>
                {outreachStatus === 'connected' ? '🟢 Ativo' : outreachStatus === 'scanning' ? '🟡 Pareando' : '🔴 Off-line'}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>Prospecção e cobranças ativas integradas à VPS</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, minHeight: 160, background: 'rgba(255,255,255,0.01)', border: '1px dashed #1e293b', borderRadius: 12, padding: 16 }}>
            {outreachLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Comunicando com Evolution API...</span>
              </div>
            ) : outreachStatus === 'connected' ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 32 }}>✅</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: 0 }}>Número Pareado e Operacional!</p>
                <p style={{ fontSize: 10, color: '#10b981', fontWeight: 800, margin: 0 }}>
                  📞 {outreachPhone || 'WhatsApp Business'}
                </p>
                <p style={{ fontSize: 10, color: '#64748b', margin: '4px 0 0 0', maxWidth: 220, lineHeight: 1.4 }}>
                  O robô está ativamente varrendo a fila de inadimplência qualificada para disparar cold pitches.
                </p>
              </div>
            ) : outreachStatus === 'scanning' && outreachQr ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
                <div style={{ background: '#ffffff', padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'inline-block' }}>
                  <img src={outreachQr} alt="WhatsApp QR Code" style={{ width: 110, height: 110, display: 'block' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', margin: 0 }}>Escaneie o QR Code</p>
                  <p style={{ fontSize: 9, color: '#94a3b8', margin: '2px 0 0 0', maxWidth: 220, lineHeight: 1.3 }}>
                    Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar um aparelho. Atualiza a cada 5s.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 28, opacity: 0.6 }}>🔌</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', margin: 0 }}>Nenhum número conectado</p>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0, maxWidth: 200, lineHeight: 1.3 }}>
                  Pareie um chip dedicado para a prospecção ativa de inadimplentes no WhatsApp.
                </p>
              </div>
            )}
          </div>

          {outreachError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 10, color: '#f87171', fontWeight: 600 }}>
              ⚠️ {outreachError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            {outreachStatus === 'connected' ? (
              <button 
                onClick={handleDisconnectOutreach}
                disabled={outreachLoading}
                style={{ 
                  flex: 1, 
                  background: 'rgba(239,68,68,0.1)', 
                  border: '1px solid rgba(239,68,68,0.2)', 
                  color: '#f87171', 
                  borderRadius: 8, 
                  padding: '8px 0', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              >
                Desconectar
              </button>
            ) : (
              <button 
                onClick={handleConnectOutreach}
                disabled={outreachLoading}
                style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  border: 'none', 
                  color: '#070913', 
                  borderRadius: 8, 
                  padding: '8px 0', 
                  fontSize: 11, 
                  fontWeight: 800, 
                  cursor: outreachLoading ? 'default' : 'pointer',
                  boxShadow: '0 4px 10px rgba(16,185,129,0.15)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}
              >
                {outreachStatus === 'scanning' ? '🔄 Gerar Novo QR' : '🔗 Conectar Robô'}
              </button>
            )}
            
            <button 
              onClick={handleTriggerOutreachCron}
              disabled={triggerLoading || outreachStatus !== 'connected'}
              style={{ 
                flex: 1.2, 
                background: outreachStatus === 'connected' ? '#1e293b' : '#0c0e1a', 
                border: outreachStatus === 'connected' ? '1px solid #334155' : '1px solid #1e293b', 
                color: outreachStatus === 'connected' ? '#f1f5f9' : '#475569', 
                borderRadius: 8, 
                padding: '8px 0', 
                fontSize: 11, 
                fontWeight: 700, 
                cursor: (triggerLoading || outreachStatus !== 'connected') ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => { if (outreachStatus === 'connected' && !triggerLoading) e.currentTarget.style.background = '#334155'; }}
              onMouseLeave={e => { if (outreachStatus === 'connected' && !triggerLoading) e.currentTarget.style.background = '#1e293b'; }}
            >
              {triggerLoading ? '⏳ Disparando...' : '🚀 Disparar Agora'}
            </button>
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

          {/* Bulk Action Bar */}
          {selectedUserIds.length > 0 && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: 12, 
              padding: '12px 18px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#f87171' }}>
                  {selectedUserIds.length} {selectedUserIds.length === 1 ? 'usuário selecionado' : 'usuários selecionados'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setSelectedUserIds([])}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                >
                  Cancelar Seleção
                </button>
                <button 
                  onClick={() => {
                    setDeleteConfirmText('');
                    setShowBulkDeleteModal(true);
                  }}
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none', color: '#ffffff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}
                >
                  Excluir em Massa
                </button>
              </div>
            </div>
          )}

          {/* Table container */}
          <div style={{ background: '#0c0e1a', borderRadius: 16, border: '1px solid #1e293b', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '12px 16px', width: 40, textAlign: 'left' }}>
                    <input 
                      type="checkbox" 
                      checked={users.length > 0 && users.filter(u => u.id !== currentAdmin?.id).every(u => selectedUserIds.includes(u.id))}
                      onChange={() => handleToggleSelectAll(users.filter(u => u.id !== currentAdmin?.id))}
                      style={{ cursor: 'pointer', accentColor: '#10b981' }}
                    />
                  </th>
                  {['Parceiro / Empresa', 'Acesso', 'Faturamento', 'Status', 'Clientes', 'Lembretes', 'Onboarding', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Nenhum usuário correspondente aos filtros</td>
                  </tr>
                ) : (
                  users.map(u => {
                    const sc = u.status === 'active' ? { c: '#34d399', bg: 'rgba(16,185,129,0.1)', l: 'Ativo' } :
                               u.status === 'blocked' ? { c: '#f87171', bg: 'rgba(239,68,68,0.1)', l: 'Bloqueado' } :
                               { c: '#fbbf24', bg: 'rgba(245,158,11,0.1)', l: 'Inativo' };

                    const planLabel = u.plan === 'cobra_pro' ? 'Cobra Pro 👑' : 
                                      u.plan === 'crescimento' ? 'Crescimento 🐍' : 
                                      u.plan.toUpperCase();

                    const isSelf = u.id === currentAdmin?.id;

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', background: isUserSelected(u.id) ? 'rgba(16,185,129,0.03)' : 'transparent' }} className="table-row-hover">
                        <td style={{ padding: '12px 16px' }}>
                          <input 
                            type="checkbox" 
                            disabled={isSelf}
                            checked={isUserSelected(u.id)}
                            onChange={() => handleToggleSelectUser(u.id)}
                            style={{ cursor: isSelf ? 'not-allowed' : 'pointer', accentColor: '#10b981' }}
                            title={isSelf ? 'Você não pode auto-selecionar ou excluir a si mesmo.' : ''}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 10 }}>
                              {u.name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: '#ffffff', margin: 0, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {u.name}
                                {isSelf && (
                                  <span style={{ fontSize: 9, fontWeight: 800, color: '#070913', background: '#10b981', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Você</span>
                                )}
                              </p>
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
                            <button 
                              disabled={isSelf}
                              onClick={() => setUserToDelete(u)}
                              style={{ 
                                background: isSelf ? '#0c0e1a' : 'rgba(239,68,68,0.1)', 
                                border: isSelf ? '1px solid #1e293b' : '1px solid rgba(239,68,68,0.2)', 
                                color: isSelf ? '#475569' : '#f87171', 
                                fontSize: 10, 
                                padding: '4px 8px', 
                                borderRadius: 6, 
                                fontWeight: 700, 
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s'
                              }}
                              title={isSelf ? 'Você não pode excluir a si mesmo.' : 'Excluir usuário permanentemente'}
                            >
                              🗑️ Excluir
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

      {/* ── INDIVIDUAL DELETE CONFIRMATION MODAL ── */}
      {userToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,9,19,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: '#0c0e1a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, width: '100%', maxWidth: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 40 }}>⚠️</span>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: '12px 0 4px 0' }}>Excluir Usuário?</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Tem certeza que deseja excluir permanentemente o usuário <strong style={{ color: '#ffffff' }}>{userToDelete.name}</strong> ({userToDelete.email})?
              </p>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: 14, fontSize: 11, color: '#f87171', lineHeight: 1.5 }}>
              <strong>Atenção:</strong> Esta ação é irreversível. A exclusão removerá todas as cobranças, clientes, históricos e conexões de WhatsApp associados a este usuário.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setUserToDelete(null)}
                disabled={actionLoading}
                style={{ 
                  flex: 1, padding: '10px 0', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', 
                  color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteIndividualUser}
                disabled={actionLoading}
                style={{ 
                  flex: 1.2, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                  border: 'none', color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: actionLoading ? 'default' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.2)'
                }}
              >
                {actionLoading ? '⏳ Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK DELETE CONFIRMATION MODAL ── */}
      {showBulkDeleteModal && selectedUserIds.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,9,19,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: '#0c0e1a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, width: '100%', maxWidth: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚨</span> Excluir {selectedUserIds.length} Usuários em Lote
              </h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>Esta ação é extremamente perigosa e irreversível</p>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: 14, fontSize: 11, color: '#f87171', lineHeight: 1.5 }}>
              Você está prestes a deletar <strong style={{ color: '#ffffff' }}>{selectedUserIds.length} contas de usuários</strong> simultaneamente. Todos os dados associados (clientes, cobranças, conexões) serão permanentemente expurgados da base de dados.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Digite <strong style={{ color: '#ef4444' }}>EXCLUIR</strong> para confirmar:
              </label>
              <input 
                type="text"
                placeholder="EXCLUIR"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                style={{ 
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1e293b', 
                  background: '#1e293b', color: '#ffffff', fontSize: 12.5, outline: 'none', fontWeight: 700, textAlign: 'center',
                  letterSpacing: '0.1em'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={actionLoading}
                style={{ 
                  flex: 1, padding: '10px 0', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', 
                  color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleBulkDeleteUsers}
                disabled={actionLoading || deleteConfirmText !== 'EXCLUIR'}
                style={{ 
                  flex: 2, padding: '10px 0', borderRadius: 10, 
                  background: deleteConfirmText === 'EXCLUIR' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#1e293b', 
                  border: 'none', color: deleteConfirmText === 'EXCLUIR' ? '#ffffff' : '#64748b', fontSize: 12, fontWeight: 800, 
                  cursor: (actionLoading || deleteConfirmText !== 'EXCLUIR') ? 'default' : 'pointer',
                  boxShadow: deleteConfirmText === 'EXCLUIR' ? '0 4px 14px rgba(239,68,68,0.2)' : 'none'
                }}
              >
                {actionLoading ? '⏳ Expurgando...' : 'Confirmar Exclusão em Massa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
