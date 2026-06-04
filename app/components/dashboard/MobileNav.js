'use client';
import { useId } from 'react';

// ========== MINI SNAKE MASCOT LOGO ==========
function MiniSnake({ size = 40, style = {} }) {
  const gradId = 'miniGradMobile-' + useId().replace(/:/g, '');
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

export default function MobileNav({ user, pathname, mobileSidebarOpen, setMobileSidebarOpen, handleLogout, NAV_ITEMS, NAV_ICONS }) {
  return (
    <>
      {/* 📱 Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 📱 Mobile Side Navigation Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-modal-theme backdrop-blur-lg border-r border-theme z-50 transform md:hidden transition-transform duration-300 flex flex-col ${
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-input-theme border border-theme flex items-center justify-center flex-shrink-0 shadow shadow-emerald-500/5 select-none">
              <MiniSnake size={26} />
            </div>
            <span className="font-extrabold text-base text-primary-theme">Cobbra<span className="text-[#10B981] text-[10px] font-bold">.ai</span></span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="text-secondary-theme text-xl font-light">×</button>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto" style={{ paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px" }}>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            const isRestricted = user?.plan === "starter" && 
              (item.href === "/dashboard/cobranca-diaria" || item.href === "/dashboard/relatorios");
            const displayLabel = isRestricted ? `${item.label} (Pro)` : item.label;

            return (
              <a 
                key={item.href} 
                href={item.href} 
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 py-3 rounded-xl text-sm transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-gradient-to-r from-emerald-500/10 to-emerald-500/[0.02] text-emerald-400 font-bold" 
                    : "text-secondary-theme hover:bg-card-hover-theme hover:text-primary-theme"
                }`}
                style={{ paddingLeft: "16px", paddingRight: "16px" }}
              >
                {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#10B981] rounded-full" />}
                <span className="flex-shrink-0">
                  {isRestricted ? (
                    <svg className="w-4 h-4 text-muted-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    NAV_ICONS[item.href] ? NAV_ICONS[item.href](isActive ? "w-4 h-4 text-emerald-400" : "w-4 h-4 text-secondary-theme") : null
                  )}
                </span>
                <span>{displayLabel}</span>
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-theme bg-base-theme">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-rose-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Desconectar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
