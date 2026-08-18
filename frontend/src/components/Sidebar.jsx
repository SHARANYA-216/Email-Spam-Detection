import React from 'react';
import {
  LayoutDashboard,
  SearchCode,
  History,
  Settings,
  Shield,
  LogOut,
  Mail
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Email', icon: SearchCode },
    { id: 'history', label: 'Email History', icon: History },
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'settings', label: 'User Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 z-30 shrink-0 shadow-xs">
      <div>
        {/* Logo Section */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
              MAILGUARD<span className="text-blue-600"></span>
            </h1>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Email Spam Detection 
            </span>
          </div>
        </div>

        {/* Sidebar Nav Header */}
        <div className="px-5 pt-6 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Security Suite
        </div>

        {/* Menu Items */}
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Card */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="font-bold text-slate-700">Threat Engine</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">v1.2.0</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">SVM + TF-IDF Vectorizer</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
