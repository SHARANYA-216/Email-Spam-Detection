import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle2, Lock, Cpu, BarChart3, SearchCode, History, Sparkles, FileText, AlertTriangle, ChevronRight } from 'lucide-react';
import landingHeroImg from '../assets/landing_hero.jpg';

export default function LandingPage({ onGetStarted, onLoginClick, onSignUpClick }) {
  const [activeNav, setActiveNav] = useState('home');
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xl tracking-tight text-slate-900">
              MailGuard<span className="text-blue-600"></span>
            </div>
          </div>

          {/* Navigation Links */}
<nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-600">

  <button
    onClick={() => {
      setActiveNav('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}
    className={`relative py-1 transition-colors cursor-pointer ${
      activeNav === 'home'
        ? "text-blue-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
        : "hover:text-slate-900"
    }`}
  >
    Home
  </button>

  <button
    onClick={() => {
      setActiveNav('features');
      scrollToSection('features');
    }}
    className={`relative py-1 transition-colors cursor-pointer ${
      activeNav === 'features'
        ? "text-blue-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
        : "hover:text-slate-900"
    }`}
  >
    Features
  </button>

  <button
    onClick={() => {
      setActiveNav('about');
      scrollToSection('about');
    }}
    className={`relative py-1 transition-colors cursor-pointer ${
      activeNav === 'about'
        ? "text-blue-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
        : "hover:text-slate-900"
    }`}
  >
    About Us
  </button>

</nav>

 {/* Right Actions */}
<div className="flex items-center gap-3">
  {/* Login Button */}
  <button
    onClick={onLoginClick || onGetStarted}
    className="px-5 py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-sm flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
  >
    <span>Login</span>
    <ArrowRight className="w-4 h-4" />
  </button>

  {/* Sign Up Button */}
  <button
    onClick={onSignUpClick || onGetStarted}
    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
  >
    <span>Sign Up</span>
    <ArrowRight className="w-4 h-4" />
  </button>
</div>

</div>   {/* CLOSE max-w-7xl wrapper */}
</header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 px-6 lg:px-12">
        {/* Subtle decorative background blobs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold tracking-wide uppercase shadow-xs">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>AUTOMATED EMAIL SECURITY</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Protect Your Inbox <br />
              <span className="text-slate-900">From Spam</span>
            </h1>

            {/* Subheadline */}
            <div className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight">
              Smart. Secure. Simple.
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              MailGuard uses advanced machine learning to detect spam emails with high accuracy and keep your inbox safe and clutter-free.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onSignUpClick || onGetStarted}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-3 transition-all hover:gap-4 active:scale-[0.98] cursor-pointer"
              >
                <span>Register to Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="px-6 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Features</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>89.50% Accuracy Model</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Explainable AI Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>0–100 Threat Scoring</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-gradient-to-b from-blue-50/50 to-slate-50/50 p-2">
              <img
                src={landingHeroImg}
                alt="MailGuard Inbox Security"
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 bg-slate-50/80 border-t border-slate-200/60 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Comprehensive Email Defense Architecture
            </h2>
            <p className="text-slate-600 text-base font-normal">
              Built with production-grade Natural Language Processing, Explainable AI, and multi-factor threat scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card-light p-7 space-y-4 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Automated Spam Detection</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Trained on high-volume real-world threat corpuses with TF-IDF vectorization and optimized SVM algorithms for precision verdicts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-light p-7 space-y-4 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Explainable AI (XAI)</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Transparent reasoning behind every verdict with keyword weight analysis and contextual phrase extraction for security auditing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-light p-7 space-y-4 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Multi-Signal Risk Scoring</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Granular 0–100 threat assessment incorporating urgency cues, lookalike domain indicators, and financial coercion signals.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-light p-7 space-y-4 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <SearchCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Deep Email Analysis</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Analyze single emails via raw text or upload standard .eml and .txt email files for instant breakdown and classification.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card-light p-7 space-y-4 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Email History & Audit Log</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Complete audit trail of scanned emails with detailed inspection modals, search filters, and individual record deletion.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card-light p-7 space-y-4 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Security Insights & Trends</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Interactive charts visualizing 7-day and 30-day threat volumes, categorization breakdown, and risk level distributions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      {/* Think Before You Click Section */}
<section id="about" className="py-20 px-6 lg:px-12 bg-slate-50/80 border-t border-slate-200/60">
  <div className="max-w-7xl mx-auto">

    {/* Section Header */}
    <div className="text-center max-w-3xl mx-auto mb-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
        <Shield className="w-4 h-4" />
        Security Awareness
      </div>

      <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        Think Before You Click
      </h2>

      <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
        Every day, phishing and spam emails attempt to steal passwords,
        banking information, and personal data. MailGuard helps detect
        suspicious emails, but user awareness remains one of the strongest
        defenses against email-based cyber threats.
      </p>
    </div>

    {/* Security Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">

      {/* Suspicious Email Card */}
      <div className="group card-light p-7 rounded-2xl border border-amber-200 bg-white
                      hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100
                        flex items-center justify-center text-amber-600 mb-5
                        group-hover:scale-105 transition-transform">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-4">
          If a suspicious email is detected
        </h3>

        <ul className="space-y-4 text-sm text-slate-600">
          <li className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Do not click unknown links or download unexpected attachments.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Verify the sender’s email address before responding.
            </span>
          </li>
        </ul>
      </div>

      {/* Account Protection Card */}
      <div className="group card-light p-7 rounded-2xl border border-blue-200 bg-white
                      hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100
                        flex items-center justify-center text-blue-600 mb-5
                        group-hover:scale-105 transition-transform">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Protect your account
        </h3>

        <ul className="space-y-4 text-sm text-slate-600">
          <li className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Never share passwords, OTPs, or banking information through email.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Report and delete suspicious emails immediately.
            </span>
          </li>
        </ul>
      </div>

    </div>

    {/* Security Message */}
    <div className="max-w-5xl mx-auto mt-8">
      <div className="rounded-2xl bg-blue-600 px-6 py-5 text-center
                      shadow-lg shadow-blue-600/20">
        <div className="flex items-center justify-center gap-3 text-white">
          <Shield className="w-6 h-6" />
          <p className="text-base sm:text-lg font-extrabold tracking-wide">
            Stay alert. Verify before you trust.
          </p>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>

  </div>
</section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-10 px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">MailGuard</span>
            <span>— Automated Email Spam Detection</span>
          </div>
          <p className="font-medium">
            © 2026 MailGuard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
