import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, LogIn, User, ArrowLeft, AlertCircle, UserPlus } from 'lucide-react';
import { authAPI } from '../services/api';
import landingHeroImg from '../assets/landing_hero.jpg';

export default function LoginPage({ mode = 'login', onLoginSuccess, onBackToLanding, onSwitchMode }) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignup && !fullName)) {
      setError(isSignup ? 'Please enter your full name, email, and password.' : 'Please enter both email and password.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = isSignup
        ? await authAPI.register(email, password, fullName)
        : await authAPI.login(email, password, rememberMe);

      setLoading(false);
      if (isSignup) {
        setSuccess(res?.data?.message || 'Registration successful. Please login.');
        setPassword('');
        if (onSwitchMode) {
          setTimeout(() => onSwitchMode('login'), 1200);
        }
        return;
      }

      if (res.data && res.data.user) {
        onLoginSuccess(res.data.user, res.data.access_token || 'session-token', rememberMe);
      }
    } catch (err) {
      setLoading(false);
      const message = err?.response?.data?.detail || err?.message || 'Something went wrong';

      if (isSignup && message.toLowerCase().includes('already exists')) {
        setError('Email already registered. Please login instead.');
        if (onSwitchMode) onSwitchMode('login');
        return;
      }

      setError(message);
    }
  };

  const handleGuestLogin = () => {
    onLoginSuccess({
      id: 99,
      name: 'Guest Analyst',
      email: 'guest@mailguard.ai',
      role: 'MailGuard User'
    }, 'guest-session-token');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 2-Column Card matching Reference */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Column: Login Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Back Button */}
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            )}

            {/* Logo & Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight leading-none">
                    MailGuard<span className="text-blue-600"></span>
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-400 tracking-normal mt-0.5">
                    Automated Email Spam Detection
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {isSignup ? 'Create Your Account' : 'Welcome Back!'}
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  {isSignup ? 'Register to get started with MailGuard' : 'Login to continue to your account'}
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      required={isSignup}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password Recovery: Please contact your enterprise administrator or use any credentials to test.')}
                  className="text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSignup ? 'Registering...' : 'Logging in...'}
                  </span>
                ) : (
                  <>
                    {isSignup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    <span>{isSignup ? 'Register' : 'Login'}</span>
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Continue as Guest Button */}
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <User className="w-4 h-4 text-blue-600" />
                <span>Continue as Guest</span>
              </button>
            </form>
          </div>

          {/* Bottom Toggle Row */}
          <div className="mt-8 text-center text-xs text-slate-500 font-medium">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => onSwitchMode ? onSwitchMode(isSignup ? 'login' : 'signup') : null}
              className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
            >
              {isSignup ? 'Login' : 'Register'}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Panel */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-blue-50/70 via-slate-50/60 to-blue-100/40 p-12 flex-col items-center justify-center border-l border-slate-100 relative text-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-white bg-white p-2">
              <img
                src={landingHeroImg}
                alt="MailGuard Email Security"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
            <div className="space-y-1 text-slate-600">
              <p className="font-bold text-sm text-slate-800">
                Detect spam. Protect your inbox.
              </p>
              <p className="text-xs font-medium text-slate-500">
                Stay safe, stay productive.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
