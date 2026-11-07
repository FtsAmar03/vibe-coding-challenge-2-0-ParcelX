import React from "react";

export default function Header({ user, onLogout, onMenuToggle }) {
  const role = user ? user.role : "";
  const title =
    role === "coach"
      ? "Head Coach"
      : role === "scout"
        ? "Talent Scout"
        : user
          ? user.name
          : "";

  return (
    <header className="top-header">
      {/* Hamburger button — only visible on mobile */}
      <button
        className="hamburger-btn"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className="header-left-group">
        <div className="brand-section">
          <div className="brand-logo">
            <span>PM</span>
          </div>
          <div className="brand-info">
            <h1>Play Metrics</h1>
            <p>SPORTS ACADEMY DESK</p>
          </div>
        </div>

        <div className="academy-location">
          <span className="location-icon">⌖</span>
          <div>
            <p>ACADEMY LOCATION</p>
            <h4>Dumka, Jharkhand</h4>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="role-badge">
          <span className="online-dot"></span>
          {role.toUpperCase()}
        </div>

        <div className="profile-section">
          <div className="profile-avatar">
            {(user && user.name ? user.name[0] : "U").toUpperCase()}
          </div>
          <div className="profile-info">
            <h4>{title}</h4>
            <p>{user ? user.email : ""}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary logout-btn"
          onClick={onLogout}
          title="Log out"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
