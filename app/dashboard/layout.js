'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Chatbot from '../components/Chatbot';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Visão Geral' },
  { href: '/dashboard/cobrancas', icon: '💰', label: 'Cobranças' },
  { href: '/dashboard/cobranca-diaria', icon: '📅', label: 'Cobrança Diária' },
  { href: '/dashboard/calendario', icon: '🗓️', label: 'Calendário' },
  { href: '/dashboard/clientes', icon: '👥', label: 'Clientes' },
  { href: '/dashboard/relatorios', icon: '📈', label: 'Relatórios' },
  { href: '/dashboard/lembretes', icon: '🔔', label: 'Lembretes' },
  { href: '/dashboard/configuracoes', icon: '⚙️', label: 'Configurações' },
  { href: '/dashboard/atualizacoes', icon: '🔄', label: 'Atualizações' },
];

const ADMIN_ITEM = { href: '/dashboard/admin', icon: '🛡️', label: 'Admin' };

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Copilot States
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState(null);
  const [showCopilotModal, setShowCopilotModal] = useState(false);
  const [copilotError, setCopilotError] = useState('');
  const [copilotSuccessMsg, setCopilotSuccessMsg] = useState('');
  const [allClients, setAllClients] = useState([]);

  // Search, profile modal and rebate states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientCharges, setClientCharges] = useState([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [showRebateModal, setShowRebateModal] = useState(false);
  const [rebateCharge, setRebateCharge] = useState(null);
  const [rebateAmount, setRebateAmount] = useState('');
  const [rebateMsg, setRebateMsg] = useState('');

  // Load clients for the Copilot selector
  useEffect(() => {
    if (showCopilotModal) {
      fetch('/api/clientes?limit=200')
        .then(r => r.json())
        .then(data => setAllClients(data.clients || []))
        .catch(() => {});
    }
  }, [showCopilotModal]);

  async function handleCopilotSubmit(commandText) {
    if (!commandText || !commandText.trim()) return;
    setCopilotLoading(true);
    setCopilotError('');
    setCopilotSuccessMsg('');
    setShowCopilotModal(true);
    setCopilotResponse(null);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandText })
      });
      const data = await res.json();
      if (res.ok) {
        setCopilotResponse(data);
        if (data.intent === 'view_stats') {
          router.push('/dashboard/relatorios');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotInput('');
          }, 2000);
        } else if (data.intent === 'view_clients') {
          router.push('/dashboard/clientes');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotInput('');
          }, 2000);
        } else if (data.intent === 'view_calendar') {
          router.push('/dashboard/calendario');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotInput('');
          }, 2000);
        }
      } else {
        setCopilotError(data.error || 'Erro ao processar comando com Copilot');
      }
    } catch (e) {
      setCopilotError('Erro de conexão ao servidor.');
    } finally {
      setCopilotLoading(false);
    }
  }

  async function executeCopilotAction() {
    if (!copilotResponse) return;
    setCopilotLoading(true);
    setCopilotError('');
    
    const { intent, client_id, amount, due_date, description } = copilotResponse;

    if (!client_id) {
      setCopilotError('Por favor, selecione um cliente para lançar a cobrança.');
      setCopilotLoading(false);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setCopilotError('Por favor, insira um valor válido maior que zero.');
      setCopilotLoading(false);
      return;
    }

    try {
      if (intent === 'create_charge') {
        const res = await fetch('/api/cobrancas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            amount: parseFloat(amount),
            due_date,
            description: description || 'Cobrança via AI Copilot',
            recurrence: 'once',
            reminder_channel: 'both',
            payment_method: 'pix',
            daily_interest_rate: 0
          })
        });
        const data = await res.json();
        if (res.ok) {
          setCopilotSuccessMsg('Cobrança lançada com sucesso! 🐍🎉');
          fetchNotifications();
          setCopilotInput('');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotResponse(null);
            if (pathname === '/dashboard' || pathname === '/dashboard/cobrancas') {
              window.location.reload();
            }
          }, 2000);
        } else {
          setCopilotError(data.error || 'Erro ao criar cobrança.');
        }
      } else if (intent === 'create_daily_billing') {
        const res = await fetch('/api/cobranca-diaria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            amount: parseFloat(amount),
            description: description || 'Faturamento Diário via AI Copilot',
            interest_rate: 0,
            status: 'active'
          })
        });
        const data = await res.json();
        if (res.ok) {
          setCopilotSuccessMsg('Faturamento diário configurado com sucesso! 📅🐍');
          fetchNotifications();
          setCopilotInput('');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotResponse(null);
            if (pathname === '/dashboard/cobranca-diaria') {
              window.location.reload();
            }
          }, 2000);
        } else {
          setCopilotError(data.error || 'Erro ao criar faturamento diário.');
        }
      }
    } catch (e) {
      setCopilotError('Erro de conexão ao servidor.');
    } finally {
      setCopilotLoading(false);
    }
  }

  // Search effect
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      fetch(`/api/clientes?search=${encodeURIComponent(searchTerm)}&limit=5`)
        .then(r => r.json())
        .then(data => setSearchResults(data.clients || []))
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  // Load client charges when client is selected
  useEffect(() => {
    if (selectedClient) {
      setLoadingCharges(true);
      fetch(`/api/cobrancas?client_id=${selectedClient.id}`)
        .then(r => r.json())
        .then(data => {
          setClientCharges(data.charges || []);
          setLoadingCharges(false);
        })
        .catch(() => setLoadingCharges(false));
    } else {
      setClientCharges([]);
    }
  }, [selectedClient]);

  const refreshSelectedClientInHeader = async (clientId) => {
    try {
      const res = await fetch(`/api/clientes?limit=100`);
      const data = await res.json();
      const updatedClient = (data.clients || []).find(c => c.id === clientId);
      if (updatedClient) {
        setSelectedClient(updatedClient);
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function payChargeInHeader(chargeId, clientId) {
    await fetch(`/api/cobrancas/${chargeId}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status: 'paid' }) 
    });
    // Reload charges list
    setLoadingCharges(true);
    const r = await fetch(`/api/cobrancas?client_id=${clientId}`);
    const data = await r.json();
    setClientCharges(data.charges || []);
    setLoadingCharges(false);
    
    refreshSelectedClientInHeader(clientId);
    fetchNotifications();
  }

  async function handleRebateSubmit(e) {
    e.preventDefault();
    if (!rebateCharge || !rebateAmount || parseFloat(rebateAmount) <= 0) return;
    
    const res = await fetch(`/api/cobrancas/${rebateCharge.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rebateAmount: parseFloat(rebateAmount) })
    });

    if (res.ok) {
      setShowRebateModal(false);
      setRebateAmount('');
      setRebateCharge(null);
      setRebateMsg('Abatimento de pagamento efetuado! 💸');
      setTimeout(() => setRebateMsg(''), 3000);
      
      // Refresh charges & client totals
      if (selectedClient) {
        setLoadingCharges(true);
        const r = await fetch(`/api/cobrancas?client_id=${selectedClient.id}`);
        const data = await r.json();
        setClientCharges(data.charges || []);
        setLoadingCharges(false);
        refreshSelectedClientInHeader(selectedClient.id);
      }
      fetchNotifications();
    }
  }

  const getPayerScore = c => {
    const limitGood = user?.score_limit_good ?? 0.2;
    const limitRegular = user?.score_limit_regular ?? 0.4;
    
    if (!c.total_charged || c.total_charged === 0) {
      return { l: 'Excelente', c: '#10b981', b: 'rgba(16,185,129,0.15)', s: '⭐⭐⭐⭐⭐' };
    }
    const overdueRatio = c.total_overdue / c.total_charged;
    if (c.total_overdue === 0) {
      return { l: 'Excelente', c: '#10b981', b: 'rgba(16,185,129,0.15)', s: '⭐⭐⭐⭐⭐' };
    } else if (overdueRatio < limitGood) {
      return { l: 'Bom', c: '#6ee7b7', b: 'rgba(110,231,183,0.15)', s: '⭐⭐⭐⭐' };
    } else if (overdueRatio < limitRegular) {
      return { l: 'Regular', c: '#f59e0b', b: 'rgba(245,158,11,0.15)', s: '⭐⭐⭐' };
    } else {
      return { l: 'Alto Risco', c: '#ef4444', b: 'rgba(239,68,68,0.15)', s: '⭐' };
    }
  };

  const calcInterest = c => {
    if (c.status === 'paid' || c.status === 'cancelled') return 0;
    if (!c.daily_interest_rate || c.daily_interest_rate <= 0) return 0;
    const due = new Date(c.due_date);
    const today = new Date();
    if (due >= today) return 0;
    const days = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
    return c.amount * (c.daily_interest_rate / 100) * days;
  };

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    }).catch(() => { router.push('/login'); setLoading(false); });
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function markAsRead(id) {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchNotifications();
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true })
    });
    fetchNotifications();
  }

  async function clearNotifications() {
    await fetch('/api/notifications', { method: 'DELETE' });
    fetchNotifications();
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return '';
    try {
      // Normalize SQLite date string to local/ISO parseable format
      const normalized = dateString.replace(' ', 'T') + 'Z';
      const date = new Date(normalized);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Há ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Ontem';
      return `Há ${diffDays} dias`;
    } catch (e) {
      return dateString;
    }
  }

  const navItems = user?.role === 'admin_senior' || user?.role === 'admin'
    ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  const pageTitle = navItems.find(i => i.href === pathname)?.label || 'Dashboard';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 2s infinite' }}>🐍</div>
          <p style={{ color: '#94a3b8', fontSize: 16 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  const sw = sidebarCollapsed ? 72 : 260;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter',sans-serif" }}>
      {/* Sidebar */}
      <aside 
        className={`dash-sidebar${mobileSidebarOpen ? ' open' : ''}`}
        style={{
          width: sw, minHeight: '100vh', background: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', overflow: 'hidden', flexShrink: 0
        }}
      >
        {/* Logo */}
        <div style={{ padding: sidebarCollapsed ? '20px 12px' : '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🐍</div>
          {!sidebarCollapsed && <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Cobbra</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const isRestricted = user?.plan === 'starter' && 
              (item.href === '/dashboard/cobranca-diaria' || item.href === '/dashboard/relatorios');
            
            const displayIcon = isRestricted ? '🔒' : item.icon;
            const displayLabel = isRestricted ? `${item.label} (Pro)` : item.label;

            return (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: sidebarCollapsed ? '12px' : '12px 16px',
                borderRadius: 10, marginBottom: 4, color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? 'rgba(5,150,105,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #059669' : '3px solid transparent',
                transition: 'all 0.2s', fontSize: 14, fontWeight: isActive ? 600 : 500,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                opacity: isRestricted ? 0.75 : 1
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <span style={{ fontSize: 18 }}>{displayIcon}</span>
                {!sidebarCollapsed && displayLabel}
              </a>
            );
          })}
        </nav>

        {/* User Info */}
        <div style={{ padding: sidebarCollapsed ? '16px 8px' : '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!sidebarCollapsed && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14
              }}>
                {user.name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: user.role === 'admin_senior' ? 'rgba(239,68,68,0.2)' : 'rgba(5,150,105,0.2)',
                  color: user.role === 'admin_senior' ? '#fca5a5' : '#6ee7b7',
                  textTransform: 'uppercase'
                }}>{user.role === 'admin_senior' ? 'Admin Senior' : user.role}</span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)',
            color: '#fca5a5', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            transition: 'all 0.2s', fontFamily: "'Inter',sans-serif"
          }}
            onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.1)'}
          >
            {sidebarCollapsed ? '🚪' : '🚪 Sair'}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="dash-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          style={{ display: 'none' }}
        />
      )}

      {/* Main */}
      <div className="dash-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <header className="dash-topbar" style={{
          padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              style={{
                display: 'none',
                fontSize: 22, background: 'none', border: 'none', color: '#e2e8f0',
                cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                alignItems: 'center', justifyContent: 'center'
              }}
              className="dash-hamburger"
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '8px 10px',
              color: '#94a3b8', cursor: 'pointer', fontSize: 16
            }}>☰</button>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{pageTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="dash-topbar-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <input 
                  placeholder="🪄 AI Assist: Cobre R$ 150 de Ju amanhã..." 
                  value={copilotInput}
                  onChange={e => {
                    setCopilotInput(e.target.value);
                    setSearchTerm(e.target.value); // Sync to trigger normal client search popover
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleCopilotSubmit(copilotInput);
                    }
                  }}
                  style={{
                    padding: '8px 16px 8px 36px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(5,150,105,0.25)', color: '#e2e8f0', fontSize: 13, width: 340,
                    outline: 'none', fontFamily: "'Inter',sans-serif", transition: 'all 0.3s ease',
                    boxShadow: copilotInput ? '0 0 10px rgba(5,150,105,0.15)' : 'none'
                  }} 
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = 'rgba(5,150,105,0.25)'}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#64748b' }}>🪄</span>
              </div>

              {/* Search Results Popover */}
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', left: 0, top: 40, width: 260, background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 1000, overflow: 'hidden'
                }}>
                  {searchResults.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => {
                        setSelectedClient(c);
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                      style={{
                        padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        {c.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer',
                  position: 'relative', border: showNotifications ? '1px solid #059669' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%',
                    background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{unreadCount}</span>
                )}
              </div>

              {showNotifications && (
                <div style={{
                  position: 'absolute', right: 0, top: 46, width: 340, background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 420
                }}>
                  {/* Header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>Notificações</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#059669', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                          Ler todas
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearNotifications} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => e.target.style.color = '#ef4444'}
                          onMouseLeave={e => e.target.style.color = '#94a3b8'}
                        >
                          Limpar tudo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div style={{ overflowY: 'auto', flex: 1, maxHeight: 320 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                        <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🐍</span>
                        Tudo limpo por aqui!
                      </div>
                    ) : (
                      notifications.map(notif => {
                        let emoji = '🔔';
                        if (notif.type === 'success' || notif.type === 'payment') emoji = '💰';
                        else if (notif.type === 'warning') emoji = '⚠️';
                        else if (notif.type === 'reminder') emoji = '💬';

                        return (
                          <div 
                            key={notif.id}
                            onClick={() => notif.read === 0 && markAsRead(notif.id)}
                            style={{
                              padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                              background: notif.read === 0 ? 'rgba(5,150,105,0.05)' : 'transparent',
                              cursor: notif.read === 0 ? 'pointer' : 'default',
                              transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'flex-start'
                            }}
                          >
                            <span style={{ fontSize: 18, marginTop: 2 }}>{emoji}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: notif.read === 0 ? 600 : 500, color: notif.read === 0 ? '#fff' : '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                                {notif.title}
                              </p>
                              {notif.message && (
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                                  {notif.message}
                                </p>
                              )}
                              <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 6 }}>
                                {formatRelativeTime(notif.created_at)}
                              </span>
                            </div>
                            {notif.read === 0 && (
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', marginTop: 6, flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Selected Client Details Modal (Global Profile) */}
      {selectedClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedClient(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 20, padding: 36, width: 700, maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                  {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{selectedClient.name}</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0' }}>
                    {selectedClient.category || 'Sem categoria'} • {selectedClient.phone || 'Sem telefone'} • {selectedClient.email || 'Sem e-mail'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>

            {/* Score and Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ background: 'rgba(5,150,105,0.08)', borderRadius: 12, padding: 14, border: '1px solid rgba(5,150,105,0.15)' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Pontualidade (Score)</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: getPayerScore(selectedClient).c, margin: 0 }}>
                  {getPayerScore(selectedClient).l} {getPayerScore(selectedClient).s}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Total Cobrado</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{fmt(selectedClient.total_charged)}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Total Pago</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#10b981', margin: 0 }}>{fmt(selectedClient.total_paid)}</p>
              </div>
              <div style={{ background: selectedClient.total_overdue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, border: selectedClient.total_overdue > 0 ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 11, color: selectedClient.total_overdue > 0 ? '#ef4444' : '#64748b', marginBottom: 4 }}>Em Aberto</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: selectedClient.total_overdue > 0 ? '#ef4444' : '#94a3b8', margin: 0 }}>{fmt(selectedClient.total_overdue)}</p>
              </div>
            </div>

            {/* Debts list / History */}
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Histórico de Cobranças</h4>
            {loadingCharges ? (
              <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 20 }}>Carregando histórico...</p>
            ) : clientCharges.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhuma cobrança registrada para este cliente.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clientCharges.map(c => {
                  const interest = calcInterest(c);
                  return (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{c.description || 'Cobrança sem descrição'}</p>
                        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>
                          Vencimento: {new Date(c.due_date).toLocaleDateString('pt-BR')}
                        </p>
                        {interest > 0 && (
                          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, display: 'block', marginTop: 4 }}>
                            ⚠️ Juros acumulados: {fmt(interest)} (+{c.daily_interest_rate}%/dia)
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{fmt(c.amount + interest)}</p>
                        </div>
                        {c.status !== 'paid' && c.status !== 'cancelled' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              onClick={() => payChargeInHeader(c.id, selectedClient.id)} 
                              style={{ padding: '6px 10px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}
                            >
                              ✓ Recebido
                            </button>
                            <button 
                              onClick={() => {
                                setRebateCharge(c);
                                setShowRebateModal(true);
                              }} 
                              style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}
                            >
                              Abater
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Footer notes */}
            {selectedClient.notes && (
              <div style={{ marginTop: 24, padding: 14, background: 'rgba(255,255,255,0.01)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Observações internas:</span>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{selectedClient.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rebate Modal Form */}
      {showRebateModal && rebateCharge && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(5px)' }}
          onClick={() => {
            setShowRebateModal(false);
            setRebateCharge(null);
          }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 20, padding: 36, width: 420, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Abater Parte da Cobrança</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Deduza uma quantia paga avulso da cobrança **{rebateCharge.description}**.
            </p>
            <form onSubmit={handleRebateSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Valor do Abatimento (R$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={rebateCharge.amount}
                  value={rebateAmount}
                  onChange={e => setRebateAmount(e.target.value)}
                  placeholder="Ex: 50.00"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'Inter'
                  }}
                  required
                />
                <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  Valor máximo disponível: {fmt(rebateCharge.amount)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => {
                  setShowRebateModal(false);
                  setRebateCharge(null);
                }} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontFamily: 'Inter' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter' }}>
                  Confirmar Abatimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rebateMsg && <div style={{ position: 'fixed', top: 80, right: 32, background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1002, boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>{rebateMsg}</div>}

      {/* Copilot AI Modal */}
      {showCopilotModal && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease' }}
          onClick={() => {
            if (!copilotLoading) {
              setShowCopilotModal(false);
              setCopilotResponse(null);
            }
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              background: 'rgba(30, 41, 59, 0.95)', borderRadius: 24, padding: 32, width: 500, 
              border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🪄</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Dashboard AI Copilot</h3>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Catarina Inteligência de Ação</p>
              </div>
            </div>

            {/* Loading state */}
            {copilotLoading && (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ width: 50, height: 50, border: '4px solid rgba(16,185,129,0.1)', borderTop: '4px solid #10b981', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>Catarina está processando seu comando...</p>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Validando intenções e estruturando dados 🐍</p>
              </div>
            )}

            {/* Error state */}
            {copilotError && !copilotLoading && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ color: '#fca5a5', fontSize: 13, margin: 0, fontWeight: 500 }}>❌ {copilotError}</p>
              </div>
            )}

            {/* Success state */}
            {copilotSuccessMsg && !copilotLoading && (
              <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
                <p style={{ color: '#6ee7b7', fontSize: 14, margin: 0, fontWeight: 700 }}>{copilotSuccessMsg}</p>
              </div>
            )}

            {/* Content Form when structured response received */}
            {copilotResponse && !copilotLoading && !copilotSuccessMsg && (
              <div>
                <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', marginBottom: 20 }}>
                  {copilotResponse.responseMessage}
                </p>

                {(copilotResponse.intent === 'create_charge' || copilotResponse.intent === 'create_daily_billing') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    {/* Client Selection */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Cliente Associado</label>
                      <select
                        value={copilotResponse.client_id || ''}
                        onChange={e => setCopilotResponse(prev => ({ ...prev, client_id: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                          background: '#1e293b', color: '#fff', fontSize: 13, outline: 'none'
                        }}
                      >
                        <option value="">-- Selecione o Cliente --</option>
                        {allClients.map(cl => (
                          <option key={cl.id} value={cl.id}>{cl.name}</option>
                        ))}
                      </select>
                      {!copilotResponse.client_id && (
                        <span style={{ fontSize: 11, color: '#f59e0b', display: 'block', marginTop: 4 }}>
                          ⚠️ Não consegui mapear o cliente automaticamente. Por favor selecione na lista acima!
                        </span>
                      )}
                    </div>

                    {/* Amount */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={copilotResponse.amount || ''}
                          onChange={e => setCopilotResponse(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                            background: '#1e293b', color: '#fff', fontSize: 13, outline: 'none'
                          }}
                        />
                      </div>

                      {/* Due Date (for single charge) */}
                      {copilotResponse.intent === 'create_charge' && (
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Vencimento</label>
                          <input
                            type="date"
                            value={copilotResponse.due_date || ''}
                            onChange={e => setCopilotResponse(prev => ({ ...prev, due_date: e.target.value }))}
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                              background: '#1e293b', color: '#fff', fontSize: 13, outline: 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Descrição / Identificador</label>
                      <input
                        type="text"
                        value={copilotResponse.description || ''}
                        onChange={e => setCopilotResponse(prev => ({ ...prev, description: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                          background: '#1e293b', color: '#fff', fontSize: 13, outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px 0 20px', color: '#94a3b8', fontSize: 13 }}>
                    Nenhuma ação de banco de dados necessária para esta intenção.
                  </div>
                )}

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowCopilotModal(false);
                      setCopilotResponse(null);
                    }}
                    style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontFamily: 'Inter' }}
                  >
                    Fechar
                  </button>
                  
                  {(copilotResponse.intent === 'create_charge' || copilotResponse.intent === 'create_daily_billing') && (
                    <button
                      onClick={executeCopilotAction}
                      style={{ padding: '10px 20px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter' }}
                    >
                      Confirmar e Lançar 🐍
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Custom spinner style */}
            <style jsx global>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
  );
}
