'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Chatbot from '../components/Chatbot';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Visão Geral' },
  { href: '/dashboard/cobrancas', icon: '💰', label: 'Cobranças' },
  { href: '/dashboard/cobranca-diaria', icon: '📅', label: 'Recorrentes' },
  { href: '/dashboard/calendario', icon: '🗓️', label: 'Calendário' },
  { href: '/dashboard/clientes', icon: '👥', label: 'Clientes' },
  { href: '/dashboard/relatorios', icon: '📈', label: 'Relatórios' },
  { href: '/dashboard/lembretes', icon: '🔔', label: 'Lembretes' },
  { href: '/dashboard/configuracoes', icon: '⚙️', label: 'Ajustes' },
  { href: '/dashboard/atualizacoes', icon: '🔄', label: 'Atualizações' },
];

const ADMIN_ITEM = { href: '/dashboard/admin', icon: '🛡️', label: 'Admin' };

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
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

  // Command+K listener to trigger AI Copilot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCopilotModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      return { l: 'Excelente', c: 'text-emerald-400', bg: 'bg-emerald-500/10', s: '⭐⭐⭐⭐⭐' };
    }
    const overdueRatio = c.total_overdue / c.total_charged;
    if (c.total_overdue === 0) {
      return { l: 'Excelente', c: 'text-emerald-400', bg: 'bg-emerald-500/10', s: '⭐⭐⭐⭐⭐' };
    } else if (overdueRatio < limitGood) {
      return { l: 'Bom', c: 'text-teal-400', bg: 'bg-teal-500/10', s: '⭐⭐⭐⭐' };
    } else if (overdueRatio < limitRegular) {
      return { l: 'Regular', c: 'text-amber-400', bg: 'bg-amber-500/10', s: '⭐⭐⭐' };
    } else {
      return { l: 'Alto Risco', c: 'text-rose-400', bg: 'bg-rose-500/10', s: '⭐' };
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

  const pageTitle = navItems.find(i => i.href === pathname)?.label || 'Visão Geral';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070913] text-slate-100 font-sans">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🐍</div>
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm tracking-wider font-semibold">Carregando Cobbra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070913] text-slate-100 font-sans antialiased overflow-x-hidden">
      
      {/* 🖥️ Desktop Collapsible Slim Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#0C0E1A] border-r border-slate-800/40 transition-all duration-300 overflow-hidden flex-shrink-0 z-30 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#059669] flex items-center justify-center text-xl flex-shrink-0 shadow-lg shadow-emerald-500/10">🐍</div>
            {!sidebarCollapsed && <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent tracking-tight">Cobbra</span>}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const isRestricted = user?.plan === 'starter' && 
              (item.href === '/dashboard/cobranca-diaria' || item.href === '/dashboard/relatorios');
            
            const displayIcon = isRestricted ? '🔒' : item.icon;
            const displayLabel = isRestricted ? `${item.label} (Pro)` : item.label;

            return (
              <a 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500' 
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                } ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${isRestricted ? 'opacity-60' : ''}`}
              >
                <span className="text-lg flex-shrink-0">{displayIcon}</span>
                {!sidebarCollapsed && <span className="truncate">{displayLabel}</span>}
                
                {/* Tooltip for collapsed sidebar */}
                {sidebarCollapsed && (
                  <div className="absolute left-20 ml-2 px-2 py-1 bg-slate-900 border border-slate-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {displayLabel}
                  </div>
                )}
              </a>
            );
          })}
        </nav>

        {/* User profile & logout block */}
        <div className="p-4 border-t border-slate-800/40 bg-slate-950/20">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold text-xs shadow-md">
                {user.name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate leading-none mb-1">{user.name}</p>
                <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider scale-90 origin-left">
                  {user.role === 'admin_senior' ? 'Senior' : user.role}
                </span>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 text-xs font-medium transition-all duration-200"
          >
            {sidebarCollapsed ? '🚪' : '🚪 Sair'}
          </button>
        </div>
      </aside>

      {/* 📱 Mobile Drawer Overlay (if hamburger menu is triggered) */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 📱 Mobile Side Navigation Drawer (Fallback to side menu) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0C0E1A] border-r border-slate-800/60 z-50 transform md:hidden transition-transform duration-300 flex flex-col ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#059669] flex items-center justify-center text-lg">🐍</div>
            <span className="font-extrabold text-base text-slate-100">Cobbra</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 text-xl font-light">×</button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const isRestricted = user?.plan === 'starter' && 
              (item.href === '/dashboard/cobranca-diaria' || item.href === '/dashboard/relatorios');
            
            return (
              <a 
                key={item.href} 
                href={item.href} 
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500' 
                    : 'text-slate-400'
                }`}
              >
                <span>{isRestricted ? '🔒' : item.icon}</span>
                <span>{isRestricted ? `${item.label} (Pro)` : item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/40">
          <button onClick={handleLogout} className="w-full py-2.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold">
            🚪 Desconectar
          </button>
        </div>
      </aside>

      {/* 🚀 Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* 🧼 Minimalist Flat Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/20 bg-[#0C0E1A]/80 backdrop-blur-md sticky top-0 z-40">
          
          {/* Left info / Mobile trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-slate-300 text-xl p-1 bg-slate-800/20 rounded border border-slate-800/40 flex items-center justify-center"
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <h1 className="text-base md:text-lg font-bold text-slate-100 tracking-tight hidden sm:block">{pageTitle}</h1>
            <span className="sm:hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#059669] flex items-center justify-center text-base shadow">🐍</span>
          </div>

          {/* 🪄 Catarina AI Engine: Flat Command Bar Widget */}
          <div className="hidden md:block flex-1 max-w-sm md:max-w-md mx-4 relative">
            <div className="relative group">
              <input 
                placeholder="Pergunte à Catarina... (Ctrl+K)" 
                value={copilotInput}
                onChange={e => {
                  setCopilotInput(e.target.value);
                  setSearchTerm(e.target.value); 
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleCopilotSubmit(copilotInput);
                  }
                }}
                className="w-full py-1.5 pl-9 pr-14 text-xs bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 hover:border-emerald-500/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-200 placeholder-slate-500 rounded-lg transition-all duration-200 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 group-hover:text-emerald-400 transition-colors">🪄</span>
              
              {/* Keyboard badge shortcut */}
              <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 border border-slate-800 bg-slate-950 text-[9px] font-mono text-slate-500 rounded pointer-events-none">
                Ctrl K
              </kbd>
            </div>

            {/* Quick Search Popover Result (Stripe style) */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-11 bg-slate-900 border border-slate-800/80 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/40 text-[10px] font-semibold text-slate-500 tracking-wider">CLIENTES ENCONTRADOS</div>
                {searchResults.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => {
                      setSelectedClient(c);
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                    className="px-4 py-2.5 border-b border-slate-800/30 hover:bg-emerald-500/5 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                      {c.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-200 font-medium hover:text-white">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Area - Notifications Bar */}
          <div className="flex items-center gap-2.5">
            {/* Mobile AI Command Trigger Icon */}
            <button 
              onClick={() => setShowCopilotModal(true)}
              className="md:hidden w-9 h-9 rounded-full bg-slate-900 border border-slate-800/60 hover:border-slate-700 flex items-center justify-center text-sm cursor-pointer transition-all active:scale-90"
              aria-label="Perguntar à Catarina"
            >
              🪄
            </button>

            {/* Catarina AI Chatbot Toggle Button */}
            <button 
              onClick={() => setChatbotOpen(!chatbotOpen)}
              className={`w-9 h-9 rounded-full bg-slate-900 border border-slate-800/60 hover:border-slate-700 flex items-center justify-center text-sm cursor-pointer transition-all relative ${
                chatbotOpen ? 'border-emerald-500/60 ring-1 ring-emerald-500/10' : ''
              }`}
              title="Conversar com a Catarina"
              aria-label="Conversar com a Catarina"
            >
              💬
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950 animate-pulse" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-9 h-9 rounded-full bg-slate-900 border border-slate-800/60 hover:border-slate-700 flex items-center justify-center text-sm cursor-pointer transition-all relative ${
                  showNotifications ? 'border-emerald-500/60 ring-1 ring-emerald-500/10' : ''
                }`}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">{unreadCount}</span>
                )}
              </button>

              {/* Stripe-style Notification Center */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 md:w-96 bg-[#0E1220] border border-slate-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[450px]">
                  
                  {/* Header info */}
                  <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/40 flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-200">Notificações</span>
                    <div className="flex gap-3">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">Ler todas</button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearNotifications} className="text-[10px] text-slate-500 hover:text-rose-400">Limpar tudo</button>
                      )}
                    </div>
                  </div>

                  {/* Notification list */}
                  <div className="overflow-y-auto divide-y divide-slate-800/40 flex-1 max-h-[350px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        <span className="text-2xl block mb-2">🐍</span>
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
                            className={`p-4 flex gap-3 text-left transition-colors cursor-pointer ${
                              notif.read === 0 ? 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]' : 'hover:bg-slate-900/40'
                            }`}
                          >
                            <span className="text-base mt-0.5">{emoji}</span>
                            <div className="flex-1">
                              <p className={`text-xs leading-normal ${notif.read === 0 ? 'font-bold text-slate-100' : 'text-slate-300'}`}>{notif.title}</p>
                              {notif.message && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{notif.message}</p>}
                              <span className="text-[9px] text-slate-600 block mt-2">{formatRelativeTime(notif.created_at)}</span>
                            </div>
                            {notif.read === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 self-center" />}
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

        {/* 📋 Main Scrollable Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 📱 Mobile Bottom Navigation Bar (Nubank/Revolut Style) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0C0E1A]/90 backdrop-blur-lg border-t border-slate-800/40 z-40 flex items-center justify-around md:hidden shadow-2xl">
        {[
          { href: '/dashboard', icon: '📊', label: 'Início' },
          { href: '/dashboard/cobrancas', icon: '💰', label: 'Cobranças' },
          { href: '/dashboard/clientes', icon: '👥', label: 'Clientes' },
          { href: '/dashboard/configuracoes', icon: '⚙️', label: 'Ajustes' },
        ].map(item => {
          const isActive = pathname === item.href;
          return (
            <a 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors relative ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-[9px] uppercase tracking-wider">{item.label}</span>
              {isActive && <span className="absolute bottom-0 w-6 h-0.5 bg-emerald-400 rounded-full" />}
            </a>
          );
        })}
      </nav>

      {/* 👤 Stripe-style Global Client Details Modal Drawer */}
      {selectedClient && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center md:items-stretch md:justify-end p-4 md:p-0 backdrop-blur-sm"
          onClick={() => setSelectedClient(null)}
        >
          {/* Drawer / Modal Container */}
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-[#0C0E1A] rounded-2xl md:rounded-none md:rounded-l-3xl p-6 md:p-8 w-full max-w-xl md:h-screen overflow-y-auto border border-slate-800/60 md:border-y-0 md:border-r-0 md:border-l border-slate-800/50 shadow-2xl flex flex-col"
          >
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-800/60 pb-5 mb-5 flex-shrink-0">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg">
                  {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedClient.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedClient.category || 'Geral'} • {selectedClient.phone || 'Sem celular'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedClient.email || 'Sem e-mail'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="w-8 h-8 rounded-full bg-slate-800/40 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-colors">×</button>
            </div>

            {/* Score and Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/30 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Score Pagador</span>
                <span className={`text-xs font-bold ${getPayerScore(selectedClient).c}`}>{getPayerScore(selectedClient).l}</span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/30">
                <span className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Cobrado</span>
                <span className="text-xs font-bold text-slate-200 block">{fmt(selectedClient.total_charged)}</span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/30">
                <span className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Quitado</span>
                <span className="text-xs font-bold text-emerald-400 block">{fmt(selectedClient.total_paid)}</span>
              </div>
              <div className={`rounded-xl p-3 border ${
                selectedClient.total_overdue > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-900/60 border-slate-800/30'
              }`}>
                <span className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Em Aberto</span>
                <span className={`text-xs font-bold block ${selectedClient.total_overdue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{fmt(selectedClient.total_overdue)}</span>
              </div>
            </div>

            {/* Debts list / History */}
            <h4 className="text-sm font-bold text-slate-200 mb-3">Histórico Financeiro</h4>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {loadingCharges ? (
                <p className="text-slate-500 text-xs text-center py-6">Carregando faturas...</p>
              ) : clientCharges.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-6">Nenhuma cobrança registrada.</p>
              ) : (
                clientCharges.map(c => {
                  const interest = calcInterest(c);
                  return (
                    <div key={c.id} className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex justify-between items-center hover:border-slate-800 transition-colors">
                      <div className="min-w-0 pr-4">
                        <p className="text-xs font-bold text-slate-200 truncate">{c.description || 'Cobrança Avulsa'}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Vencimento: {new Date(c.due_date).toLocaleDateString('pt-BR')}
                        </p>
                        {interest > 0 && (
                          <span className="text-[10px] text-amber-500 font-semibold block mt-1">
                            ⚠️ Juros acumulados: {fmt(interest)} (+{c.daily_interest_rate}%/dia)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-100">{fmt(c.amount + interest)}</p>
                        </div>
                        {c.status !== 'paid' && c.status !== 'cancelled' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => payChargeInHeader(c.id, selectedClient.id)} 
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] transition-colors"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => {
                                setRebateCharge(c);
                                setShowRebateModal(true);
                              }} 
                              className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-[10px] transition-colors"
                            >
                              Abater
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer notes */}
            {selectedClient.notes && (
              <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800/50 flex-shrink-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Notas Internas</span>
                <p className="text-[11px] text-slate-400 leading-normal">{selectedClient.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💸 Minimalist Rebate Modal Form */}
      {showRebateModal && rebateCharge && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setShowRebateModal(false);
            setRebateCharge(null);
          }}
        >
          <div onClick={e => e.stopPropagation()} className="bg-[#0C0E1A] rounded-2xl p-6 w-full max-w-sm border border-slate-800/60 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-1">Abatimento de Fatura</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Deduza uma quantia paga avulso da cobrança <strong className="text-slate-300">{rebateCharge.description}</strong>.
            </p>
            <form onSubmit={handleRebateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">Valor do Abatimento (R$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={rebateCharge.amount}
                  value={rebateAmount}
                  onChange={e => setRebateAmount(e.target.value)}
                  placeholder="Ex: 50.00"
                  className="w-full py-2 px-3 text-sm bg-slate-900 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <span className="block text-[10px] text-slate-500 mt-1">
                  Saldo pendente na fatura: {fmt(rebateCharge.amount)}
                </span>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowRebateModal(false);
                    setRebateCharge(null);
                  }} 
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rebateMsg && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-5 py-3 rounded-xl text-xs font-bold z-50 shadow-lg shadow-emerald-500/20">
          {rebateMsg}
        </div>
      )}

      {/* 🪄 Minimalist Copilot AI Drawer/Modal */}
      {showCopilotModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-[50] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm"
          onClick={() => {
            if (!copilotLoading) {
              setShowCopilotModal(false);
              setCopilotResponse(null);
            }
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-[#0C0E1A] rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md border-t md:border border-slate-800/60 shadow-2xl flex flex-col max-h-[90vh] md:max-h-none overflow-y-auto animate-fadeInUp"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800/40 pb-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xl shadow shadow-emerald-500/10">🪄</div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Catarina AI Copilot</h3>
                <p className="text-[10px] text-slate-500">Comandos rápidos em linguagem natural</p>
              </div>
            </div>

            {/* Loading state */}
            {copilotLoading && (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-300 text-xs font-semibold">Catarina está processando seu comando...</p>
                <p className="text-slate-500 text-[10px] mt-1">Validando intenções e estruturando dados 🐍</p>
              </div>
            )}

            {/* Error state */}
            {copilotError && !copilotLoading && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-4 text-left">
                <p className="text-rose-400 text-xs font-medium">❌ {copilotError}</p>
              </div>
            )}

            {/* Success state */}
            {copilotSuccessMsg && !copilotLoading && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-center">
                <p className="text-emerald-400 text-xs font-bold">{copilotSuccessMsg}</p>
              </div>
            )}

            {/* Initial input for mobile or quick typing */}
            {!copilotResponse && !copilotLoading && !copilotSuccessMsg && (
              <div className="space-y-4 pt-2">
                <div className="relative">
                  <input
                    autoFocus
                    placeholder="Ex: Cobre R$ 150 de Carlos Eduardo amanhã..."
                    value={copilotInput}
                    onChange={e => {
                      setCopilotInput(e.target.value);
                      setSearchTerm(e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleCopilotSubmit(copilotInput);
                      }
                    }}
                    className="w-full py-3 pl-4 pr-12 text-xs bg-slate-950 border border-slate-800/80 text-slate-100 placeholder-slate-500 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    onClick={() => handleCopilotSubmit(copilotInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs transition-all"
                  >
                    ➔
                  </button>
                </div>

                {/* Voice / Text Suggestions */}
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Comandos Sugeridos</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Cobre R$ 150 de Carlos Eduardo amanhã',
                      'Configurar recorrente de R$ 90 para Carlos Eduardo',
                      'Ver relatórios de faturamento',
                      'Como está a adimplência hoje?'
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCopilotInput(suggestion);
                          handleCopilotSubmit(suggestion);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:text-emerald-400 text-[10px] text-slate-400 font-semibold text-left transition-colors flex items-center gap-2"
                      >
                        <span className="text-emerald-500 text-xs">✨</span>
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setShowCopilotModal(false)}
                  className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold transition-all mt-4"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Content Form when structured response received */}
            {copilotResponse && !copilotLoading && !copilotSuccessMsg && (
              <div className="space-y-4">
                <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                  {copilotResponse.responseMessage}
                </p>

                {(copilotResponse.intent === 'create_charge' || copilotResponse.intent === 'create_daily_billing') ? (
                  <div className="space-y-3">
                    
                    {/* Client Selection */}
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Cliente Associado</label>
                      <select
                        value={copilotResponse.client_id || ''}
                        onChange={e => setCopilotResponse(prev => ({ ...prev, client_id: e.target.value }))}
                        className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">-- Selecione o Cliente --</option>
                        {allClients.map(cl => (
                          <option key={cl.id} value={cl.id}>{cl.name}</option>
                        ))}
                      </select>
                      {!copilotResponse.client_id && (
                        <span className="text-[10px] text-amber-500 block mt-1">
                          ⚠️ Não consegui mapear o cliente. Selecione na lista!
                        </span>
                      )}
                    </div>

                    {/* Amount & Due Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={copilotResponse.amount || ''}
                          onChange={e => setCopilotResponse(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Due Date (for single charge) */}
                      {copilotResponse.intent === 'create_charge' && (
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Vencimento</label>
                          <input
                            type="date"
                            value={copilotResponse.due_date || ''}
                            onChange={e => setCopilotResponse(prev => ({ ...prev, due_date: e.target.value }))}
                            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Descrição</label>
                      <input
                        type="text"
                        value={copilotResponse.description || ''}
                        onChange={e => setCopilotResponse(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 text-white rounded-lg outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    Nenhuma ação de banco de dados pendente para esta intenção.
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => {
                      setCopilotResponse(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-800"
                  >
                    Voltar
                  </button>
                  
                  {(copilotResponse.intent === 'create_charge' || copilotResponse.intent === 'create_daily_billing') && (
                    <button
                      onClick={executeCopilotAction}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/10"
                    >
                      Confirmar e Lançar 🐍
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating support chatbot */}
      <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}
