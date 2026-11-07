
import React from "react";

const allMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "players", label: "Players", icon: "👥" },
  { id: "attendance", label: "Attendance", icon: "📋" },
  { id: "matches", label: "Matches", icon: "⚽" },
  { id: "ready", label: "Ready Players", icon: "★" }
];

export default function Sidebar({ activePage, setActivePage, stats = {}, currentRole = "coach", isOpen, onClose }) {
  let menuItems = allMenuItems;

  if (currentRole === "scout") {
    menuItems = [
      { id: "ready", label: "Scout Ready Lineup", icon: "★" }
    ];
  } else if (currentRole === "player") {
    menuItems = [
      { id: "dashboard", label: "My Profile & Row", icon: "👤" }
    ];
  }

  return (
    <aside className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
      {/* Close button — only visible on mobile */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
        ✕
      </button>

      {/* Academy label */}
      <div className="sidebar-heading">
        <p>{currentRole === "scout" ? "SCOUT PORTAL" : currentRole === "player" ? "ATHLETE PORTAL" : "MAIN MENU"}</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          let badge = null;
          if (item.id === "players" && stats.totalPlayers) {
            badge = stats.totalPlayers;
          } else if (item.id === "ready" && stats.readyPlayers !== undefined) {
            badge = stats.readyPlayers;
          } else if (item.id === "attendance" && stats.openSessions) {
            badge = `${stats.openSessions} Open`;
          }

          return (
            <button
              key={item.id}
              className={`sidebar-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span className="sidebar-label">{item.label}</span>

              {badge !== null && (
                <span className={`sidebar-badge ${item.id === "ready" ? "ready-badge" : ""}`}>
                  {badge}
                </span>
              )}

              {activePage === item.id && (
                <span className="active-indicator"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Academy Information Card */}
      <div className="sidebar-academy">
        <div className="academy-icon">
          ⚽
        </div>

        <div>
          <h4>Lawazia Toto</h4>
          <p>Dumka Academy · JH</p>
        </div>
      </div>

      {/* Bottom info */}
      <div className="sidebar-bottom">
        <div className="sidebar-system-status">
          <span className="status-ping"></span>
          <span>System Live · Hackathon Desk</span>
        </div>

        <p className="sidebar-version">
          LAWAIZA TOTO DESK · V1.0
        </p>
      </div>
    </aside>
  );
}
