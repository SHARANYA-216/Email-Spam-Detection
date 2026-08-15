import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AnalyzeView from './components/AnalyzeView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [user, setUser] = useState(null);
  const [publicView, setPublicView] = useState('landing'); // 'landing' | 'login' | 'signup'
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  // Restore authenticated session
  useEffect(() => {
    const storedUser = localStorage.getItem('mailguard_user') || sessionStorage.getItem('mailguard_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('mailguard_user');
        sessionStorage.removeItem('mailguard_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData, token, rememberMe = true) => {
    setUser(userData);
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    storage.setItem('mailguard_user', JSON.stringify(userData));
    storage.setItem('mailguard_token', token);
    otherStorage.removeItem('mailguard_user');
    otherStorage.removeItem('mailguard_token');
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mailguard_user');
    localStorage.removeItem('mailguard_token');
    sessionStorage.removeItem('mailguard_user');
    sessionStorage.removeItem('mailguard_token');
    setPublicView('landing');
  };

  const handleViewHistoryDetail = (id) => {
    setSelectedHistoryId(id);
    setCurrentTab('history');
  };

  // Unauthenticated Public Flow
  if (!user) {
    if (publicView === 'login' || publicView === 'signup') {
      return (
        <LoginPage
          mode={publicView}
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setPublicView('landing')}
          onSwitchMode={(nextMode) => setPublicView(nextMode)}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => setPublicView('signup')}
        onLoginClick={() => setPublicView('login')}
        onSignUpClick={() => setPublicView('signup')}
      />
    );
  }

  // Authenticated Console Flow
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={handleLogout}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar user={user} />

        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onAnalyzeClick={() => setCurrentTab('analyze')}
              onViewDetail={handleViewHistoryDetail}
            />
          )}

          {currentTab === 'analyze' && (
            <AnalyzeView />
          )}

          {currentTab === 'history' && (
            <HistoryView
              initialSelectedId={selectedHistoryId}
              onClearSelectedId={() => setSelectedHistoryId(null)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView user={user} onLogout={handleLogout} />
          )}
        </main>
      </div>
    </div>
  );
}
