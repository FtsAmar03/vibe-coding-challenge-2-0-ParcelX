import React, { useState } from "react";
import { api } from "../api";

export default function Attendance({ players, sessions, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("All");

  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));

  const [sport, setSport] = useState(
    players.length > 0 ? players[0].sport : "Football",
  );

  const sports = [...new Set(players.map((player) => player.sport))];

  const [activeSessionId, setActiveSessionId] = useState(
    sessions.length > 0 ? sessions[0].id : null,
  );

  const activeSession = sessions.find(
    (session) => session.id === activeSessionId,
  );

  // OPEN SESSION
  async function openSession(e) {
    e.preventDefault();

    const existingSession = sessions.find(
      (session) => session.date === date && session.sport === sport,
    );

    if (existingSession) {
      alert("A session for this date and sport already exists.");
      return;
    }

    const sportPlayers = players.filter((player) => player.sport === sport);

    if (sportPlayers.length === 0) {
      alert("No players registered for this sport.");
      return;
    }

    try {
      const created = await api.openSession({ date, sport });
      await reload();
      setActiveSessionId(created._id);
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    }
  }

  // Save the marks (only Present / Absent are stored)
  async function saveMarks(records) {
    const map = {};
    records.forEach((r) => {
      if (r.status) map[r.playerId] = r.status;
    });

    try {
      await api.saveAttendance(activeSessionId, map);
      await reload();
    } catch (err) {
      alert(err.message);
    }
  }

  // MARK ATTENDANCE
  function markAttendance(playerId, status) {
    if (!activeSession || activeSession.status === "Closed") return;
    saveMarks(
      activeSession.attendance.map((record) =>
        record.playerId === playerId ? { ...record, status } : record,
      ),
    );
  }

  // MARK ALL PRESENT
  function markAllPresent() {
    if (!activeSession || activeSession.status === "Closed") return;
    saveMarks(
      activeSession.attendance.map((record) => ({
        ...record,
        status: "Present",
      })),
    );
  }

  // CLOSE SESSION
  async function closeSession() {
    if (!activeSession) return;

    if (activeSession.attendance.some((record) => !record.status)) {
      alert(
        "Please mark every player Present or Absent before closing the session.",
      );
      return;
    }

    try {
      await api.closeSession(activeSession.id);
      await reload();
    } catch (err) {
      alert(err.message);
    }
  }

  // Session stats calculation
  const presentCount = activeSession
    ? activeSession.attendance.filter((r) => r.status === "Present").length
    : 0;
  const absentCount = activeSession
    ? activeSession.attendance.filter((r) => r.status === "Absent").length
    : 0;
  const totalRoster = activeSession ? activeSession.attendance.length : 0;
  const unmarkedCount = totalRoster - (presentCount + absentCount);
  const attendanceRate =
    totalRoster > 0 ? Math.round((presentCount / totalRoster) * 100) : 0;

  const filteredSessions = sessions.filter((s) => {
    if (sessionFilter === "Open") return s.status === "Open";
    if (sessionFilter === "Closed") return s.status === "Closed";
    return true;
  });

  return (
    <main className="attendance-page">
      {/* PAGE HEADER */}
      <div className="page-heading">
        <div>
          <h2>Attendance Management</h2>
          <p>
            Open daily training sessions, mark player turnout, and lock
            finalized rosters.
          </p>
        </div>

        <button className="add-player-btn" onClick={() => setShowForm(true)}>
          <span>+</span> Open New Session
        </button>
      </div>

      {/* QUICK ATTENDANCE OVERVIEW STATS */}
      <div className="players-metric-grid mb-25">
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">TOTAL SESSIONS LOGGED</span>
            <span className="metric-icon">📋</span>
          </div>
          <div className="metric-value">{sessions.length}</div>
          <p className="metric-subtext">
            {sessions.filter((s) => s.status === "Open").length} currently open
            for marking
          </p>
        </div>

        <div className="metric-box accent-box">
          <div className="metric-box-header">
            <span className="metric-label">ACTIVE SESSION TURNOUT</span>
            <span className="metric-icon">⚡</span>
          </div>
          <div className="metric-value lime-text">
            {activeSession ? `${attendanceRate}%` : "—"}
          </div>
          <p className="metric-subtext">
            {activeSession
              ? `${presentCount} Present / ${absentCount} Absent`
              : "Select a session below"}
          </p>
        </div>

        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">PENDING TO MARK</span>
            <span className="metric-icon">⏳</span>
          </div>
          <div className="metric-value">
            {activeSession && activeSession.status === "Open"
              ? unmarkedCount
              : 0}
          </div>
          <p className="metric-subtext">Players awaiting attendance call</p>
        </div>
      </div>

      {/* SESSION FORM MODAL */}
      {showForm && (
        <div
          className="player-modal"
          onClick={(e) => {
            if (e.target.classList.contains("player-modal")) setShowForm(false);
          }}
        >
          <form className="player-form modal-appear" onSubmit={openSession}>
            <div className="modal-header">
              <h2>Open New Training Session</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtitle">
              Generate an attendance register for today's squad training.
            </p>

            <div className="form-group">
              <label>Session Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Select Academy Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                required
              >
                {sports.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Open Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TWO COLUMN WORKSPACE: SESSION LIST & ACTIVE ATTENDANCE SHEET */}
      <div className="attendance-layout-grid">
        {/* SESSION LIST */}
        <section className="session-section">
          <div className="section-title-row">
            <div>
              <h3>Practice Sessions</h3>
              <p className="section-subtext">
                Click any session to view or mark roll call
              </p>
            </div>

            {/* Filter Pills */}
            <div className="status-filter-pills">
              {["All", "Open", "Closed"].map((status) => (
                <button
                  key={status}
                  className={`status-pill-btn ${sessionFilter === status ? "active" : ""}`}
                  onClick={() => setSessionFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="empty-session-box">
              <p className="empty-message">
                {sessions.length === 0
                  ? "No sessions created yet. Click '+ Open New Session' to start."
                  : `No ${sessionFilter.toLowerCase()} sessions found.`}
              </p>
            </div>
          ) : (
            <div className="session-list">
              {filteredSessions.map((session) => {
                const sPresent = session.attendance.filter(
                  (r) => r.status === "Present",
                ).length;
                const sTotal = session.attendance.length;

                return (
                  <button
                    key={session.id}
                    className={`session-item ${
                      activeSessionId === session.id ? "selected" : ""
                    }`}
                    onClick={() => setActiveSessionId(session.id)}
                  >
                    <div className="session-item-left">
                      <div className="session-sport-icon">
                        {session.sport === "Football"
                          ? "⚽"
                          : session.sport === "Cricket"
                            ? "🏏"
                            : "🏑"}
                      </div>
                      <div>
                        <strong>{session.sport} Session</strong>
                        <p className="session-date-text">
                          📅 {session.date} · {sTotal} players
                        </p>
                        {session.status === "Closed" && (
                          <span className="session-rate-summary">
                            Turnout: {sPresent}/{sTotal}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="session-item-right">
                      <span
                        className={
                          session.status === "Closed"
                            ? "closed-tag"
                            : "open-tag"
                        }
                      >
                        {session.status === "Open" ? "● OPEN" : "✓ LOCKED"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ATTENDANCE SHEET */}
        {activeSession ? (
          <section className="attendance-sheet">
            <div className="sheet-heading">
              <div>
                <div className="sheet-badge-row">
                  <span
                    className={`sport-tag sport-tag-${activeSession.sport.toLowerCase()}`}
                  >
                    {activeSession.sport}
                  </span>
                  <span
                    className={
                      activeSession.status === "Closed"
                        ? "closed-tag"
                        : "open-tag"
                    }
                  >
                    {activeSession.status === "Open"
                      ? "● OPEN FOR MARKING"
                      : "✓ CLOSED & ARCHIVED"}
                  </span>
                </div>
                <h3>{activeSession.sport} Practice Register</h3>
                <p>
                  Date: <strong>{activeSession.date}</strong> · Dumka Ground
                </p>
              </div>

              {/* Quick actions for Open session */}
              {activeSession.status === "Open" && (
                <div className="sheet-quick-actions">
                  <button
                    type="button"
                    className="mark-all-btn"
                    onClick={markAllPresent}
                    title="Mark all players as Present"
                  >
                    ✓ Mark All Present
                  </button>
                </div>
              )}
            </div>

            {/* Attendance Progress Bar */}
            <div className="session-turnout-banner">
              <div className="turnout-header">
                <span>
                  Current Turnout: <strong>{attendanceRate}%</strong> (
                  {presentCount} Present, {absentCount} Absent)
                </span>
                <span>
                  {unmarkedCount > 0
                    ? `${unmarkedCount} pending`
                    : "All marked"}
                </span>
              </div>
              <div className="turnout-track">
                <div
                  className="turnout-fill"
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </div>

            <div className="attendance-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>Player Roster</th>
                    <th>Age</th>
                    <th>Roll Call Action</th>
                  </tr>
                </thead>

                <tbody>
                  {activeSession.attendance.map((record) => {
                    const player = players.find(
                      (p) => p.id === record.playerId,
                    );

                    if (!player) return null;

                    return (
                      <tr
                        key={record.playerId}
                        className={
                          record.status
                            ? `row-${record.status.toLowerCase()}`
                            : ""
                        }
                      >
                        <td>
                          <div className="player-identity-cell">
                            <div className="player-avatar-circle small-avatar">
                              {player.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong className="player-full-name">
                                {player.name}
                              </strong>
                              <span className="player-id-sub">
                                Career: {player.attendance}%
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="age-badge">{player.age} yrs</span>
                        </td>

                        <td>
                          <div className="attendance-actions">
                            <button
                              disabled={activeSession.status === "Closed"}
                              className={
                                record.status === "Present"
                                  ? "present-btn selected"
                                  : "present-btn"
                              }
                              onClick={() =>
                                markAttendance(player.id, "Present")
                              }
                            >
                              ✓ Present
                            </button>

                            <button
                              disabled={activeSession.status === "Closed"}
                              className={
                                record.status === "Absent"
                                  ? "absent-btn selected"
                                  : "absent-btn"
                              }
                              onClick={() =>
                                markAttendance(player.id, "Absent")
                              }
                            >
                              ✕ Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {activeSession.status === "Open" && (
              <div className="session-footer-actions">
                <button className="close-session-btn" onClick={closeSession}>
                  🔒 Lock & Finalize Session
                </button>
                <small className="close-help-text">
                  Note: All players must be marked Present or Absent before
                  locking.
                </small>
              </div>
            )}

            {activeSession.status === "Closed" && (
              <div className="locked-banner">
                <span className="locked-icon">✓</span>
                <div>
                  <strong>Session Locked & Recorded</strong>
                  <p>
                    Attendance records have been finalized and linked to athlete
                    profiles.
                  </p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="attendance-sheet empty-select-sheet">
            <div className="empty-select-content">
              <span className="empty-sheet-icon">📋</span>
              <h3>No Session Selected</h3>
              <p>
                Select a session from the list on the left, or open a new
                session.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
