import React from 'react';
import { Link } from 'react-router-dom';

export function WalletBrandIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      {/* Peaking emerald cash/card */}
      <rect x="7" y="5" width="16" height="9" rx="2.5" fill="#10B981" />
      <rect x="10" y="8" width="5" height="1.5" rx="0.75" fill="#A7F3D0" />
      {/* Wallet body */}
      <rect x="4" y="9" width="24" height="18" rx="4.5" fill="white" />
      {/* Clasp tab */}
      <rect x="19" y="15" width="8" height="6" rx="3" fill="#6366F1" />
      <circle cx="22.5" cy="18" r="1.5" fill="white" />
    </svg>
  );
}

export default function AppLogo({ 
  to = '/', 
  size = 'md', 
  showSubtitle = true, 
  showBadge = true, 
  badgeText = '₹ INR',
  badgeVariant = 'emerald',
  subtitleText = 'Peer Debt & Expense Tracker',
  darkTheme = false,
  disableLink = false,
  className = '' 
}) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const iconBoxSize = isLarge 
    ? 'w-11 h-11 sm:w-12 sm:h-12' 
    : isSmall 
    ? 'w-8 h-8' 
    : 'w-10 h-10';

  const svgIconSize = isLarge
    ? 'w-7 h-7 sm:w-8 sm:h-8'
    : isSmall
    ? 'w-5 h-5'
    : 'w-6 h-6';

  const titleSize = isLarge 
    ? 'text-xl sm:text-2xl' 
    : isSmall 
    ? 'text-base' 
    : 'text-lg sm:text-xl';

  const badgeStyles = badgeVariant === 'purple'
    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
    : badgeVariant === 'indigo'
    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs'
    : 'bg-[#10B981] text-white font-black border border-emerald-400/40 shadow-xs shadow-emerald-500/20';

  const content = (
    <>
      {/* 3D App Icon Container with Border & Shadow */}
      <div className={`${iconBoxSize} rounded-2xl p-0.5 bg-gradient-to-br from-white/90 via-purple-50 to-indigo-100/60 shadow-md shadow-purple-500/20 group-hover:shadow-lg group-hover:shadow-purple-500/30 border border-slate-200/80 ring-1 ring-purple-500/10 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 flex-shrink-0 flex items-center justify-center overflow-hidden`}>
        <img
          src="/app-icon-128.png"
          srcSet="/app-icon-128.png 1x, /app-icon.png 2x"
          alt="MoneyTracker App Icon"
          className="w-full h-full object-contain rounded-xl"
        />
      </div>

      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`${titleSize} font-black tracking-tight flex items-center`}>
            <span className={darkTheme ? "text-white" : "text-slate-900"}>Money</span>
            <span className={darkTheme ? "text-purple-400" : "text-[#A21CAF]"}>Tracker</span>
          </span>

          {showBadge && (
            <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${badgeStyles}`}>
              {badgeText}
            </span>
          )}
        </div>

        {showSubtitle && (
          <p className={`text-[10px] ${darkTheme ? 'text-slate-400' : 'text-slate-500'} font-semibold leading-none mt-1`}>
            {subtitleText}
          </p>
        )}
      </div>
    </>
  );

  if (disableLink) {
    return (
      <div className={`flex items-center gap-2.5 group flex-shrink-0 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className={`flex items-center gap-2.5 group flex-shrink-0 ${className}`}>
      {content}
    </Link>
  );
}

