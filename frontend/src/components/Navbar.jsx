import React from 'react';
import { Bell, Shield } from 'lucide-react';

export default function Navbar({ user }) {
  // Derive initials dynamically from user name or email
  const displayName = user?.name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Security User');
  const displayRole = user?.role || 'MailGuard User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'SU';

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left side: Application Title / Brand Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm tracking-tight">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>MailGuard Console</span>
        </div>
      </div>

      {/* Right Header: Notifications & Dynamic User Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <button
          onClick={() => alert("Threat Notifications: All threat detection filters active. No critical alerts pending.")}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors cursor-pointer"
          title="Threat Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        {/* Dynamic User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs border border-blue-400 shadow-xs">
            {initials}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900">{displayName}</div>
            <div className="text-[10px] font-semibold text-slate-500">{displayRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
