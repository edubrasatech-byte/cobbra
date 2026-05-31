'use client';
import { useId } from 'react';

// ========== MINI SNAKE MASCOT LOGO ==========
function MiniSnake({ size = 40, style = {} }) {
  const gradId = 'miniGradSidebar-' + useId().replace(/:/g, '');
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

export default function Sidebar({ user, pathname, sidebarCollapsed, setSidebarCollapsed, handleLogout, NAV_ITEMS, NAV_ICONS }) {
  return (
    <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-surface-theme border-r border-theme transition-all duration-300 overflow-hidden flex-shrink-0 z-30 ${sidebarCollapsed ? 'w-20' : 'w-52'}`}>
      
      {/* Sidebar Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-theme">
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10 select-none cursor-pointer active:scale-95 transition-transform"
          >
            <MiniSnake size={24} />
          </div>
          {!sidebarCollapsed && (
            <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent tracking-tight">
              Cobbra<span className="text-[#10B981] text-xs font-bold">.com.br</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '24px', paddingBottom: '24px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          const isRestricted = user?.plan === 'starter' && 
            (item.href === '/dashboard/cobranca-diaria' || item.href === '/dashboard/relatorios');
          
          const displayLabel = isRestricted ? `${item.label} (Pro)` : item.label;

          return (
            <a 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-3 py-3 rounded-xl text-sm transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/[0.02] text-emerald-400 font-extrabold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              } ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${isRestricted ? 'opacity-60' : ''}`}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#10B981] rounded-full" />}
              <span className="flex-shrink-0">
                {isRestricted ? (
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  NAV_ICONS[item.href] ? NAV_ICONS[item.href](isActive ? 'w-4 h-4 text-emerald-400 filter drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]' : 'w-4 h-4 text-slate-400 group-hover:text-slate-200') : null
                )}
              </span>
              {!sidebarCollapsed && <span className="truncate">{displayLabel}</span>}
            </a>
          );
        })}
      </nav>

      {/* User profile & logout block */}
      <div className="p-4 border-t border-theme bg-base-theme">
        {!sidebarCollapsed && user && (
          <div className="bg-base-theme border border-theme rounded-2xl p-3 mb-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-emerald-500/10">
              {user.name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-primary-theme truncate leading-none mb-1" title={user.name}>{user.name}</p>
              <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider scale-90 origin-left">
                {user.role === 'admin_senior' ? 'Senior' : user.role}
              </span>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 text-xs font-bold transition-all duration-200 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-rose-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!sidebarCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
