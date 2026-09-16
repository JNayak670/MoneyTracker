import React from 'react';
import { Link } from 'react-router-dom';

export default function AppLogo({ 
  to = '/', 
  size = 'md', 
  showSubtitle = true, 
  showBadge = true, 
  badgeText = '₹ INR',
  badgeVariant = 'emerald',
  subtitleText = 'Smart Peer Debt & Expense Circle',
  darkTheme = false,
  disableLink = false,
  className = '' 
}) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const iconBoxSize = isLarge 
    ? 'w-11 h-11 sm:w-12 sm:h-12 text-2xl' 
    : isSmall 
    ? 'w-8 h-8 text-base' 
    : 'w-10 h-10 text-xl';

  const titleSize = isLarge 
    ? 'text-xl sm:text-2xl' 
    : isSmall 
    ? 'text-base' 
    : 'text-lg sm:text-xl';

  const titleColor = darkTheme
    ? 'bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent'
    : 'bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent';

  const subtitleColor = darkTheme
    ? 'text-slate-400'
    : 'text-slate-500';

  const badgeStyles = badgeVariant === 'purple'
    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    : badgeVariant === 'indigo'
    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xs';

  const content = (
    <>
      {/* Unified Gradient Icon Container */}
      <div className={`${iconBoxSize} rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300 flex-shrink-0 border border-white/20`}>
        <span>💸</span>
      </div>

      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`${titleSize} font-black tracking-tight ${titleColor}`}>
            MoneyTracker
          </span>

          {showBadge && (
            <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${badgeStyles}`}>
              {badgeText}
            </span>
          )}
        </div>

        {showSubtitle && (
          <p className={`text-[10px] ${subtitleColor} font-semibold leading-none mt-1 hidden xs:block sm:block`}>
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

