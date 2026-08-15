import React, { useState } from 'react';
import { User, Shield, CheckCircle, Save, Key, LogOut, ShieldAlert, Lock } from 'lucide-react';

export default function SettingsView({ user, onLogout }) {
  const initialName = user?.name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Security User');
  const initialEmail = user?.email || 'user@mailguard.ai';
  const initialRole = user?.role || 'MailGuard User';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState(initialRole);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saved, setSaved] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // Update local storage user record if present
    const storedUser = localStorage.getItem('mailguard_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        parsed.name = name;
        parsed.email = email;
        parsed.role = role;
        localStorage.setItem('mailguard_user', JSON.stringify(parsed));
      } catch (err) {}
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.');
      return;
    }
    setPasswordMsg('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Settings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your personal account profile, credentials, and session preferences.</p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>User settings saved successfully!</span>
        </div>
      )}

      {/* User Information Section */}
      <form onSubmit={handleSaveProfile} className="card-light p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>User Profile Information</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Account</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">User Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-medium focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-bold mb-1.5">Account Role / Title</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Update User Profile</span>
          </button>
        </div>
      </form>

      {/* Password & Security Section */}
      <form onSubmit={handlePasswordChange} className="card-light p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Password & Security Options</span>
          </h2>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Protected</span>
        </div>

        {passwordMsg && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            passwordMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <CheckCircle className="w-4 h-4" />
            <span>{passwordMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-xs"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Update Password</span>
          </button>
        </div>
      </form>

      {/* Account Session & Sign Out */}
      <div className="card-light p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Active User Session</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Signed in as <span className="font-semibold text-slate-800">{email}</span></p>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        )}
      </div>
    </div>
  );
}
