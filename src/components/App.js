
import React, { useState, useEffect } from "react";

import Header from "./header";
import Sidebar from "./sidebar";
import Body from "./body";
import Footer from "./footer";
import Players from "./player";
import { academyData, initialSessionsData, getPlayerAttendanceStats, isPlayerReady } from "./data";
import Attendance from "./Attendance";

function App() {
  const [sessions, setSessions] = useState(initialSessionsData);
  const [matches, setMatches] = useState(academyData.matches);
  const [role, setRole] = useState("coach");
  const [activePage, setActivePage] = useState("dashboard");
  const [players, setPlayers] = useState(academyData.players);
  const [selectedPlayerId, setSelectedPlayerId] = useState(1);

  // Automatically adjust active page when role switches to Scout or Player
  useEffect(() => {
    if (role === "scout") {
      setActivePage("ready");
    } else if (role === "player") {
      setActivePage("dashboard");
    }
  }, [role]);

  // Compute live mathematical attendance on players based on sessions
  const dynamicPlayers = players.map(p => {
    const stats = getPlayerAttendanceStats(p.id, p.sport, sessions);
    const ready = stats.percentage >= 75 && (p.matches || 0) >= 2;
    return {
      ...p,
      attendance: stats.percentage,
      presentSessions: stats.presentCount,
      totalSessions: stats.totalHeld,
      isReady: ready
    };
  });

  // Compute live badges for Sidebar
  const readyPlayersCount = dynamicPlayers.filter(p => p.isReady).length;
  const openSessionsCount = sessions.filter(s => s.status === "Open").length;

  const sidebarStats = {
    totalPlayers: dynamicPlayers.length,
    readyPlayers: readyPlayersCount,
    openSessions: openSessionsCount
  };

  return (
    <div className="app-container">
      <Header
        currentRole={role}
        setRole={setRole}
        selectedPlayerId={selectedPlayerId}
        setSelectedPlayerId={setSelectedPlayerId}
        players={dynamicPlayers}
      />

      <div className="app-layout">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          stats={sidebarStats}
          currentRole={role}
        />

        <div className="page-content">
          {activePage === "players" ? (
            <Players
              players={dynamicPlayers}
              setPlayers={setPlayers}
              sessions={sessions}
              onNavigateToAttendance={() => setActivePage("attendance")}
            />
          ) : activePage === "attendance" ? (
            <Attendance
              players={dynamicPlayers}
              sessions={sessions}
              setSessions={setSessions}
              setPlayers={setPlayers}
            />
          ) : (
            <Body
              currentRole={role}
              data={{ players: dynamicPlayers, matches, sessions }}
              matches={matches}
              setMatches={setMatches}
              activePage={activePage}
              setActivePage={setActivePage}
              setPlayers={setPlayers}
              setSessions={setSessions}
              selectedPlayerId={selectedPlayerId}
              setSelectedPlayerId={setSelectedPlayerId}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default App;

