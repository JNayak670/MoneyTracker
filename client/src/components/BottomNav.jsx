import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, Receipt, BarChart3 } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutGrid },
    { name: 'Friends', path: '/friends', icon: Users },
    { name: 'Activity', path: '/transactions', icon: Receipt },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 py-2 flex justify-around items-center shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center transition-all ${
              active
                ? 'bg-indigo-100/90 text-indigo-700 px-4 py-1.5 rounded-2xl shadow-xs'
                : 'text-slate-500 hover:text-slate-900 px-3 py-1.5'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-indigo-700 stroke-[2.5]' : 'text-slate-500'}`} />
            <span className={`text-[10px] mt-0.5 ${active ? 'font-black text-indigo-900' : 'font-semibold text-slate-500'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
