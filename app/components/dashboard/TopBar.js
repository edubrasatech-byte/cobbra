'use client';
import { useState, useEffect, useId } from 'react';
import { usePathname } from 'next/navigation';

// ========== MINI SNAKE MASCOT LOGO ==========
function MiniSnake({ size = 40, style = {} }) {
  const gradId = 'miniGradTopbar-' + useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
      <g transform="translate(1.5, 1.5)">
        <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="8" r="5" fill={`url(#${gradId})`} />
        <circle cx="23" cy="7" r="1.2" fill="white" />
        <circle cx="26" cy="7" r="1.2" fill="white" />
        <circle cx="23.2" cy="7.3" r="0.7" fill="#0f172a" />
        <circle cx="26.2" cy="7.3" r="0.7" fill="#0f172a" />
      </g>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function TopBar({ 
  pageTitle, 
  setMobileSidebarOpen, 
  chatbotOpen, 
  setChatbotOpen, 
  user, 
  horizontalPadding,
  copilotInput,
  setCopilotInput,
  handleCopilotSubmit,
  searchResults,
  setSearchResults,
  setSelectedClient,
  setShowCopilotModal
}) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cobbra-theme') || 'dark';
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('cobbra-theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
      window.dispatchEvent(new Event('theme-change'));
    } else {
      document.documentElement.classList.remove('light-theme');
      window.dispatchEvent(new Event('theme-change'));
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000); // 12 seconds interval
    
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refresh-notifications', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-notifications', handleRefresh);
    };
  }, []);

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read_all' })
      });
      fetchNotifications();
    } catch (e) {}
  };

  const clearNotifications = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      fetchNotifications();
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => n.read === 0).length;

  return (
    <header 
      className="h-16 flex items-center justify-between border-b border-theme bg-surface-theme backdrop-blur-md sticky top-0 z-40 px-6 md:px-12"
      style={{ paddingLeft: horizontalPadding, paddingRight: horizontalPadding }}
    >
      
      {/* Left info / Mobile trigger */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden text-primary-theme text-xl p-1.5 bg-surface-theme rounded-xl border border-theme flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          aria-label="Abrir menu"
        >
          ☰
        </button>
        <div className="w-9 h-9 rounded-xl bg-surface-theme border border-theme flex items-center justify-center shadow shadow-emerald-500/10 select-none flex-shrink-0">
          <MiniSnake size={26} />
        </div>
        <h1 className="text-sm md:text-base font-bold text-primary-theme tracking-tight leading-none py-1">{pageTitle}</h1>
      </div>

      {/* 🔍 Catarina AI Engine: Flat Command Bar Widget */}
      <div className="hidden md:block flex-1 max-w-xs lg:max-w-md mx-4 relative flex-shrink">
        <div className="relative group">
          <input 
            placeholder="Pergunte à Catarina..." 
            value={copilotInput}
            onChange={e => {
              setCopilotInput(e.target.value);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleCopilotSubmit(copilotInput);
              }
            }}
            className="w-full py-1.5 text-xs bg-surface-theme hover:bg-surface-theme border border-theme hover:border-emerald-500/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-primary-theme placeholder-slate-500 rounded-lg transition-all duration-200 outline-none"
            style={{ paddingLeft: '34px', paddingRight: '56px' }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <svg className="w-3.5 h-3.5 text-muted-theme group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          
          {/* Keyboard badge shortcut */}
          <span className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-surface-theme border border-theme text-[9px] font-sans font-semibold text-secondary-theme rounded select-none pointer-events-none">
            Ctrl K
          </span>
        </div>

        {/* Quick Search Popover Result */}
        {searchResults && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-11 bg-surface-theme border border-theme rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
            <div className="px-3 py-1.5 bg-surface-theme border-b border-theme text-[10px] font-semibold text-muted-theme tracking-wider">CLIENTES ENCONTRADOS</div>
            {searchResults.map(c => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedClient(c);
                  setSearchResults([]);
                }}
                className="px-4 py-2.5 border-b border-theme hover:bg-emerald-500/5 cursor-pointer flex items-center gap-3 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  {c.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <span className="text-xs text-primary-theme font-medium hover:text-white">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Area - Notifications & Chat Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Mobile AI Command Trigger Icon */}
        <button 
          onClick={() => setShowCopilotModal(true)}
          className="md:hidden w-9 h-9 rounded-full bg-surface-theme border border-theme hover:border-slate-700 flex items-center justify-center cursor-pointer transition-all"
          title="Catarina AI Copilot"
          aria-label="Catarina AI Copilot"
        >
          <svg className="w-4 h-4 text-secondary-theme hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l5.904-.813a2 2 0 001.272-.73L21 14.5a2 2 0 000-2.828l-2.672-2.672a2 2 0 00-2.828 0l-4.956 4.956a2 2 0 00-.73 1.272z" />
          </svg>
        </button>

        {/* Catarina AI Chatbot Toggle Button */}
        {pathname !== '/dashboard/obras' && (
          <button 
            onClick={() => setChatbotOpen(!chatbotOpen)}
            className={`w-9 h-9 rounded-full bg-surface-theme border border-theme hover:border-slate-700 flex items-center justify-center cursor-pointer transition-all relative ${
              chatbotOpen ? 'border-emerald-500/60 ring-1 ring-emerald-500/10' : ''
            }`}
            title="Conversar com a Catarina"
            aria-label="Conversar com a Catarina"
          >
            <svg className={`w-5 h-5 transition-colors ${chatbotOpen ? 'text-[#10B981]' : 'text-secondary-theme hover:text-emerald-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 11a9 9 0 0 1 18 0" />
              <rect x="2" y="11" width="3" height="5" rx="1.5" fill="currentColor" />
              <rect x="19" y="11" width="3" height="5" rx="1.5" fill="currentColor" />
              <path d="M12 5c-3.866 0-7 2.686-7 6 0 1.942 1.077 3.655 2.766 4.708l-.766 2.292 2.766-.922A7.848 7.848 0 0 0 12 17c3.866 0 7-2.686 7-6s-3.134-6-7-6z" />
              <path d="M19 16c0 1-1 2-2 2h-2" />
              <circle cx="10" cy="11" r="1.5" fill="currentColor" />
              <circle cx="14" cy="11" r="1.5" fill="currentColor" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950 animate-pulse" />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full bg-surface-theme border border-theme hover:border-slate-700 flex items-center justify-center cursor-pointer transition-all text-secondary-theme hover:text-emerald-400"
          title={theme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.364 17.636l-.707.707M17.636 17.636l-.707-.707M6.364 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadCount > 0) {
                markAllNotificationsAsRead();
              }
            }}
            className={`w-9 h-9 rounded-full bg-surface-theme border border-theme hover:border-slate-700 flex items-center justify-center cursor-pointer transition-all relative ${
              showNotifications ? 'border-emerald-500/60 ring-1 ring-emerald-500/10' : ''
            }`}
          >
            <svg className={`w-4 h-4 transition-colors ${showNotifications ? 'text-[#10B981]' : 'text-secondary-theme hover:text-emerald-400'}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[8px] font-black text-white flex items-center justify-center border border-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications List Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-surface-theme border border-theme rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
              <div className="px-5 py-3.5 border-b border-theme bg-surface-theme flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-theme">Notificações</span>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="text-[10px] font-bold text-muted-theme hover:text-rose-400 transition-colors">Limpar tudo</button>
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/30">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-theme text-xs">
                    Nenhuma nova notificação
                  </div>
                ) : (
                  notifications.map(notif => {
                    let typeIcon = <svg className="w-4 h-4 text-secondary-theme" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
                    let typeColor = 'text-secondary-theme';
                    if (notif.type === 'payment') { 
                      typeIcon = <svg className="w-4 h-4 text-emerald-450" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; 
                      typeColor = 'text-emerald-400'; 
                    } else if (notif.type === 'warning') { 
                      typeIcon = <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>; 
                      typeColor = 'text-amber-400'; 
                    } else if (notif.type === 'success') { 
                      typeIcon = <svg className="w-4 h-4 text-emerald-450" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>; 
                      typeColor = 'text-emerald-400'; 
                    }

                    return (
                      <div key={notif.id} className="p-4 hover:bg-card-theme flex gap-3 transition-colors">
                        <span className={`text-base flex-shrink-0 ${typeColor}`}>{typeIcon}</span>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-primary-theme truncate">{notif.title}</p>
                          <p className="text-[11px] text-secondary-theme leading-normal">{notif.message}</p>
                          <span className="text-[9px] text-muted-theme font-semibold display-block pt-1">{new Date(notif.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
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
  );
}
