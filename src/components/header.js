
import React, { useState } from "react";

export default function Header({ currentRole = "coach", setRole, selectedPlayerId, setSelectedPlayerId, players = [] }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: "Check 1: Session logged with 2 present, 1 absent.", time: "10m ago" },
    { id: 2, text: "Check 2: Absent player refused from match sheet.", time: "30m ago" },
    { id: 3, text: "Check 3 & 4: Ready players filtered for Scout & Personal Player view active.", time: "1h ago" }
  ];

  const loggedInPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  return (
    <header className="top-header">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo">
          <span>LT</span>
        </div>

        <div className="brand-info">
          <h1>Lawazia Toto</h1>
          <p>SPORTS ACADEMY DESK</p>
        </div>
      </div>

      {/* Academy Location */}
      <div className="academy-location">
        <span className="location-icon">⌖</span>
        <div>
          <p>ACADEMY LOCATION</p>
          <h4>Dumka, Jharkhand</h4>
        </div>
      </div>

      {/* Right Section */}
      <div className="header-actions">
        {/* Interactive Role Switcher */}
        {setRole ? (
          <div className="role-switch-container">
            <span className="role-label-tag">ROLE:</span>
            <select
              className="role-selector-select"
              value={currentRole}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Switch User Role"
            >
              <option value="coach">COACH</option>
              <option value="scout">SCOUT (Ready Only)</option>
              <option value="player">PLAYER (Own Row Only)</option>
            </select>
          </div>
        ) : (
          <div className="role-badge">
            <span className="online-dot"></span>
            {currentRole.toUpperCase()}
          </div>
        )}

        {/* Player Identity Switcher (When in Player Role) */}
        {currentRole === "player" && players.length > 0 && setSelectedPlayerId && (
          <div className="role-switch-container player-identity-switch">
            <span className="role-label-tag">LOGIN AS:</span>
            <select
              className="role-selector-select"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
              aria-label="Select Logged In Player"
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications */}
        <div className="notification-wrapper">
          <button
            className="notification-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            <span className="notification-dot"></span>
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h4>Academy Alerts</h4>
                <span className="notification-badge-count">{notifications.length}</span>
              </div>
              <ul className="notification-list">
                {notifications.map((n) => (
                  <li key={n.id} className="notification-item">
                    <p>{n.text}</p>
                    <small>{n.time}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="profile-section">
          <div className="profile-avatar">
            {currentRole === "player"
              ? (loggedInPlayer ? loggedInPlayer.name[0].toUpperCase() : "P")
              : (currentRole ? currentRole[0].toUpperCase() : "C")}
          </div>

          <div className="profile-info">
            <h4>
              {currentRole === "coach"
                ? "Head Coach"
                : currentRole === "scout"
                ? "Talent Scout"
                : currentRole === "player"
                ? (loggedInPlayer ? loggedInPlayer.name : "Student Athlete")
                : "Academy Manager"}
            </h4>
            <p>{currentRole === "player" ? "Lawazia Toto Athlete" : "Dumka Sports Desk"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
