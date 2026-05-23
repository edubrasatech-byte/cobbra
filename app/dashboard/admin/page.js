'use client';
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  function loadData() {
    let url = '/api/admin/users?limit=50';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    fetch(url).then(r => {
      if (r.status === 403) { setData({ error: 'access_denied' }); setLoading(false); return; }
      return r.json();
    }).then(d => { if (d) setData(d); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { const t = setTimeout(loadData, 500); return () => clearTimeout(t); }, [search]);

  const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const inputS = { padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'Inter,sans-serif' };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}><p style={{ color: '#94a3b8' }}>Carregando painel admin...</p></div>;

  if (data?.error === 'access_denied') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Acesso Restrito</h2>
      <p style={{ color: '#94a3b8' }}>Este painel é exclusivo para administradores senior.</p>
    </div>
  );

  const gs = data?.globalStats || {};

  return (
    <div>
      {msg && <div style={{ position: 'fixed', top: 80, right: 32, background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1001 }}>{msg}</div>}

      {/* Global Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '👥', label: 'Total usuários', value: gs.totalUsers || 0, sub: `${gs.activeUsers || 0} ativos`, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
          { icon: '💰', label: 'Receita total', value: fmt(gs.totalRevenue), sub: 'de todos os usuários', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
          { icon: '📋', label: 'Total cobranças', value: gs.totalCharges || 0, sub: `${gs.totalClients || 0} clientes`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          { icon: '📈', label: 'Novos esta semana', value: gs.newUsersThisWeek || 0, sub: `${gs.newUsersThisMonth || 0} este mês`, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 600, background: s.bg, padding: '3px 8px', borderRadius: 6 }}>{s.sub}</span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>👥 Todos os Usuários</h3>
        <input placeholder="Buscar usuários..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputS, width: 280 }} />
      </div>

      <div style={{ background: '#1e293b', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Usuário', 'E-mail', 'Role', 'Plano', 'Clientes', 'Cobranças', 'Receita', 'Status', 'Cadastro'].map(h => (
                <th key={h} style={{ padding: '14px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map(u => {
              const roleColors = { admin_senior: { c: '#fca5a5', b: 'rgba(239,68,68,0.15)' }, admin: { c: '#fcd34d', b: 'rgba(245,158,11,0.15)' }, user: { c: '#94a3b8', b: 'rgba(255,255,255,0.05)' } };
              const rc = roleColors[u.role] || roleColors.user;
              const statusColors = { active: { c: '#10b981', b: 'rgba(16,185,129,0.15)', l: 'Ativo' }, inactive: { c: '#f59e0b', b: 'rgba(245,158,11,0.15)', l: 'Inativo' }, blocked: { c: '#ef4444', b: 'rgba(239,68,68,0.15)', l: 'Bloqueado' } };
              const sc = statusColors[u.status] || statusColors.active;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11 }}>
                        {u.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{u.name}</p>
                        <p style={{ fontSize: 11, color: '#64748b' }}>{u.business_name || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', color: '#94a3b8', fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: rc.b, color: rc.c, fontWeight: 700, textTransform: 'uppercase' }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(5,150,105,0.15)', color: '#10b981', fontWeight: 600 }}>{u.plan}</span>
                  </td>
                  <td style={{ padding: '14px 12px', color: '#e2e8f0', textAlign: 'center', fontWeight: 600 }}>{u.client_count}</td>
                  <td style={{ padding: '14px 12px', color: '#e2e8f0', textAlign: 'center', fontWeight: 600 }}>{u.charge_count}</td>
                  <td style={{ padding: '14px 12px', color: '#10b981', fontWeight: 700, fontSize: 13 }}>{fmt(u.total_revenue)}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: sc.b, color: sc.c, fontWeight: 600 }}>{sc.l}</span>
                  </td>
                  <td style={{ padding: '14px 12px', color: '#64748b', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!data?.users || data.users.length === 0) && (
          <p style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Nenhum usuário encontrado</p>
        )}
      </div>
    </div>
  );
}
