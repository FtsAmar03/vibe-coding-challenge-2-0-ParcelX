import React, { useState, useEffect, useCallback, useRef } from "react";

import Header from "./header";
import Sidebar from "./sidebar";
import Body from "./body";
import Footer from "./footer";
import Players from "./player";
import Attendance from "./Attendance";
import Login from "./Login";
import {
  api,
  getToken,
  getUser,
  clearSession,
  adaptPlayer,
  adaptSession,
  adaptMatch,
  historyToSessions,
  fillSession,
} from "../api";

const VALID_COACH_PAGES = ["dashboard", "players", "attendance", "matches", "ready"];

function getInitialPage(role) {
  try {
    const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "").toLowerCase() : "";
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("activePage")) || "";
    const target = hash || saved;

    if (role === "scout") return "ready";
    if (role === "player") return "dashboard";
    if (role === "coach") {
      return VALID_COACH_PAGES.includes(target) ? target : "dashboard";
    }
    return target || "dashboard";
  } catch (e) {
    return role === "scout" ? "ready" : "dashboard";
  }
}

function App() {
  const [user, setUser] = useState(() => (getToken() ? getUser() : null));
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const role = user ? user.role : null;

  const [activePage, setActivePage] = useState(() => getInitialPage(role));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const prevRoleRef = useRef(role);

  const logout = useCallback(() => {
    clearSession();
    try {
      localStorage.removeItem("activePage");
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    } catch (e) {}
    setUser(null);
    setPlayers([]);
    setSessions([]);
    setMatches([]);
    setLoaded(false);
    setError("");
  }, []);

  // Sync activePage to localStorage and browser URL hash
  useEffect(() => {
    if (activePage) {
      try {
        localStorage.setItem("activePage", activePage);
        if (window.location.hash !== `#${activePage}`) {
          window.location.hash = activePage;
        }
      } catch (e) {}
    }
  }, [activePage]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash && hash !== activePage) {
        if (role === "coach" && VALID_COACH_PAGES.includes(hash)) {
          setActivePage(hash);
        } else if (role === "scout" && hash === "ready") {
          setActivePage("ready");
        } else if (role === "player" && hash === "dashboard") {
          setActivePage("dashboard");
        }
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [activePage, role]);

  // Only reset landing page when role actually changes (e.g. login or switch role)
  useEffect(() => {
    if (prevRoleRef.current !== role) {
      prevRoleRef.current = role;
      const defaultPage = role === "scout" ? "ready" : "dashboard";
      setActivePage(defaultPage);
      try {
        localStorage.setItem("activePage", defaultPage);
        window.location.hash = defaultPage;
      } catch (e) {}
    }
  }, [role]);

  // Load data from the backend, depending on who is logged in
  const loadData = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      if (user.role === "coach") {
        const [p, s, m] = await Promise.all([
          api.getPlayers(),
          api.getSessions(),
          api.getMatches(),
        ]);
        setPlayers(p.players.map(adaptPlayer));
        setSessions(s.map(adaptSession));
        setMatches(m.map(adaptMatch));
      } else if (user.role === "scout") {
        const r = await api.getReadyPlayers();
        setPlayers(r.players.map(adaptPlayer));
      } else {
        const [r, mm] = await Promise.all([api.getMyRow(), api.getMyMatches()]);
        setPlayers([adaptPlayer(r.player)]);
        setSessions(historyToSessions(r.player));
        setMatches(mm.map(adaptMatch));
      }
      setLoaded(true);
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [user, logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const filledSessions = sessions.map((s) => fillSession(s, players));

  const sidebarStats = {
    totalPlayers: players.length,
    readyPlayers: players.filter((p) => p.isReady).length,
    openSessions: sessions.filter((s) => s.status === "Open").length,
  };

  function renderPage() {
    if (error) {
      return (
        <main className="dashboard">
          <p style={{ color: "#c0392b" }}>Could not load data: {error}</p>
          <button className="btn-secondary" onClick={loadData}>
            Try again
          </button>
        </main>
      );
    }

    if (!loaded) {
      return <div className="page-loading">Loading...</div>;
    }

    if (activePage === "players") {
      return (
        <Players
          players={players}
          setPlayers={setPlayers}
          sessions={filledSessions}
          onNavigateToAttendance={() => setActivePage("attendance")}
          reload={loadData}
        />
      );
    }

    if (activePage === "attendance") {
      return (
        <Attendance
          players={players}
          sessions={filledSessions}
          reload={loadData}
        />
      );
    }

    return (
      <Body
        currentRole={role}
        data={{ players, matches, sessions: filledSessions }}
        matches={matches}
        setMatches={setMatches}
        activePage={activePage}
        setActivePage={setActivePage}
        setPlayers={setPlayers}
        setSessions={setSessions}
        selectedPlayerId={players[0] ? players[0].id : null}
        setSelectedPlayerId={() => {}}
        reload={loadData}
      />
    );
  }

  // Close sidebar when a page is selected on mobile
  const handleSetActivePage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <Header user={user} onLogout={logout} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Dark overlay behind sidebar on mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="app-layout">
        <Sidebar
          activePage={activePage}
          setActivePage={handleSetActivePage}
          stats={sidebarStats}
          currentRole={role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="page-content">{renderPage()}</div>
      </div>

      <Footer />
    </div>
  );
}

export default App;
