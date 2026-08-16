import React, { useEffect, useState } from "react";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import AnalyzeView from "./components/AnalyzeView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import GmailInboxView from "./components/GmailInboxView";

export default function App() {
  const [user, setUser] = useState(null);

  const [publicView, setPublicView] = useState("landing");

  const [currentTab, setCurrentTab] = useState("dashboard");

  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const [gmailEmailToAnalyze, setGmailEmailToAnalyze] =
    useState(null);

  // =========================================================
  // RESTORE LOGIN + HANDLE GMAIL OAUTH CALLBACK
  // =========================================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("mailguard_user") ||
      sessionStorage.getItem("mailguard_user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid stored user:", error);

        localStorage.removeItem("mailguard_user");
        sessionStorage.removeItem("mailguard_user");
      }
    }

    // -------------------------------------------------------
    // CHECK GMAIL OAUTH CALLBACK
    // -------------------------------------------------------

    const params = new URLSearchParams(
      window.location.search
    );

    const gmailStatus = params.get("gmail");

    if (gmailStatus === "connected") {
      console.log(
        "Gmail connected successfully."
      );

      // IMPORTANT:
      // Open Gmail Inbox instead of Dashboard
      setCurrentTab("gmail");

      // Remove ?gmail=connected from URL
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);

  // =========================================================
  // LOGIN SUCCESS
  // =========================================================

  const handleLoginSuccess = (
    userData,
    token,
    rememberMe = true
  ) => {
    setUser(userData);

    const storage = rememberMe
      ? localStorage
      : sessionStorage;

    const otherStorage = rememberMe
      ? sessionStorage
      : localStorage;

    storage.setItem(
      "mailguard_user",
      JSON.stringify(userData)
    );

    storage.setItem(
      "mailguard_token",
      token
    );

    otherStorage.removeItem(
      "mailguard_user"
    );

    otherStorage.removeItem(
      "mailguard_token"
    );

    setCurrentTab("dashboard");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    setUser(null);

    localStorage.removeItem(
      "mailguard_user"
    );

    localStorage.removeItem(
      "mailguard_token"
    );

    sessionStorage.removeItem(
      "mailguard_user"
    );

    sessionStorage.removeItem(
      "mailguard_token"
    );

    setCurrentTab("dashboard");

    setGmailEmailToAnalyze(null);

    setPublicView("landing");
  };

  // =========================================================
  // HISTORY DETAIL
  // =========================================================

  const handleViewHistoryDetail = (id) => {
    setSelectedHistoryId(id);
    setCurrentTab("history");
  };

  // =========================================================
  // GMAIL EMAIL -> ANALYZE
  // =========================================================

  const handleAnalyzeGmailEmail = (email) => {
    if (!email) {
      console.error(
        "No Gmail email received."
      );
      return;
    }

    console.log(
      "Gmail email received:",
      email
    );

    setGmailEmailToAnalyze({
      id: email.id || null,
      sender: email.sender || "",
      subject: email.subject || "",
      body: email.body || "",
      to: email.to || "",
      date: email.date || "",
    });

    // Go to Analyze page
    setCurrentTab("analyze");
  };

  // =========================================================
  // CLEAR GMAIL EMAIL
  // =========================================================

  const handleClearGmailAnalyzeEmail = () => {
    setGmailEmailToAnalyze(null);
  };

  // =========================================================
  // TAB CHANGE
  // =========================================================

  const handleTabChange = (tab) => {
    console.log(
      "Changing tab to:",
      tab
    );

    /*
     * Do NOT clear Gmail email when opening Gmail.
     */

    if (
      tab !== "analyze" &&
      tab !== "gmail"
    ) {
      setGmailEmailToAnalyze(null);
    }

    setCurrentTab(tab);
  };

  // =========================================================
  // PUBLIC FLOW
  // =========================================================

  if (!user) {
    if (
      publicView === "login" ||
      publicView === "signup"
    ) {
      return (
        <LoginPage
          mode={publicView}
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() =>
            setPublicView("landing")
          }
          onSwitchMode={(nextMode) =>
            setPublicView(nextMode)
          }
        />
      );
    }

    return (
      <LandingPage
        onGetStarted={() =>
          setPublicView("signup")
        }
        onLoginClick={() =>
          setPublicView("login")
        }
        onSignUpClick={() =>
          setPublicView("signup")
        }
      />
    );
  }

  // =========================================================
  // AUTHENTICATED APPLICATION
  // =========================================================

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        onLogout={handleLogout}
      />

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        <Navbar user={user} />

        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {currentTab === "dashboard" && (
            <DashboardView
              onAnalyzeClick={() => {
                setGmailEmailToAnalyze(null);
                setCurrentTab("analyze");
              }}
              onViewDetail={
                handleViewHistoryDetail
              }
            />
          )}

          {/* =================================================
              ANALYZE
          ================================================= */}

          {currentTab === "analyze" && (
            <AnalyzeView
              gmailEmail={
                gmailEmailToAnalyze
              }
              onClearGmailEmail={
                handleClearGmailAnalyzeEmail
              }
            />
          )}

          {/* =================================================
              HISTORY
          ================================================= */}

          {currentTab === "history" && (
            <HistoryView
              initialSelectedId={
                selectedHistoryId
              }
              onClearSelectedId={() =>
                setSelectedHistoryId(null)
              }
            />
          )}

          {/* =================================================
              SETTINGS
          ================================================= */}

          {currentTab === "settings" && (
            <SettingsView
              user={user}
              onLogout={handleLogout}
            />
          )}

          {/* =================================================
              GMAIL INBOX
          ================================================= */}

          {currentTab === "gmail" && (
            <GmailInboxView
              onAnalyzeEmail={
                handleAnalyzeGmailEmail
              }
            />
          )}

        </main>
      </div>
    </div>
  );
}