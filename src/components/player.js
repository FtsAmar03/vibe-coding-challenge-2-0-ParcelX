
import React, { useState } from "react";

export default function Players({ players, setPlayers, sessions = [], onNavigateToAttendance }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("All");
  const [playerToDelete, setPlayerToDelete] = useState(null);

  const [newPlayer, setNewPlayer] = useState({
    name: "",
    age: "",
    sport: "Football"
  });

  const sports = ["Football", "Cricket", "Hockey", "Basketball"];

  // Find latest session for roll call checking (Check 1)
  const latestSession = sessions[0];

  function handleSubmit(e) {
    e.preventDefault();

    const player = {
      id: Date.now(),
      ...newPlayer,
      age: Number(newPlayer.age),
      attendance: 0,
      matches: 0,
      score: 0
    };

    setPlayers(prev => [...prev, player]);

    setNewPlayer({
      name: "",
      age: "",
      sport: "Football"
    });

    setShowForm(false);
  }

  function confirmDelete() {
    if (playerToDelete) {
      setPlayers(prev => prev.filter(player => player.id !== playerToDelete.id));
      setPlayerToDelete(null);
    }
  }

  const filteredPlayers = players.filter(player => {
    const matchesName = player.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesSport =
      sportFilter === "All" ||
      player.sport === sportFilter;

    return matchesName && matchesSport;
  });

  // Calculate overview metrics
  const readyCount = players.filter(p => p.attendance >= 75 && p.matches >= 2).length;
  const avgAttendance = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + (p.attendance || 0), 0) / players.length)
    : 0;

  function getInitials(name) {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <main className="players-page">
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <h2>Players Management</h2>
          <p>Register, track performance criteria, and manage academy athletes.</p>
        </div>

        <button
          className="add-player-btn"
          onClick={() => setShowForm(true)}
        >
          <span>+</span> Add New Player
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="players-metric-grid">
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">TOTAL REGISTERED</span>
            <span className="metric-icon">👥</span>
          </div>
          <div className="metric-value">{players.length}</div>
          <p className="metric-subtext">Across {new Set(players.map(p => p.sport)).size} sports disciplines</p>
        </div>

        <div className="metric-box accent-box">
          <div className="metric-box-header">
            <span className="metric-label">MATCH READY</span>
            <span className="metric-icon">★</span>
          </div>
          <div className="metric-value lime-text">{readyCount}</div>
          <p className="metric-subtext">≥75% Attendance & ≥2 Matches</p>
        </div>

        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">AVG SQUAD ATTENDANCE</span>
            <span className="metric-icon">📈</span>
          </div>
          <div className="metric-value">{avgAttendance}%</div>
          <p className="metric-subtext">Based on completed training logs</p>
        </div>
      </div>

      {/* Add Player Modal */}
      {showForm && (
        <div className="player-modal" onClick={(e) => {
          if (e.target.classList.contains("player-modal")) setShowForm(false);
        }}>
          <form onSubmit={handleSubmit} className="player-form modal-appear">
            <div className="modal-header">
              <h2>Register New Player</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtitle">Add a student-athlete to Lawazia Toto Academy desk.</p>

            <div className="form-group">
              <label>Player Full Name</label>
              <input
                type="text"
                placeholder="e.g. Samir Murmu"
                value={newPlayer.name}
                onChange={e =>
                  setNewPlayer({
                    ...newPlayer,
                    name: e.target.value
                  })
                }
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age (Years)</label>
                <input
                  type="number"
                  min="6"
                  max="45"
                  placeholder="e.g. 17"
                  value={newPlayer.age}
                  onChange={e =>
                    setNewPlayer({
                      ...newPlayer,
                      age: e.target.value
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Primary Sport</label>
                <select
                  value={newPlayer.sport}
                  onChange={e =>
                    setNewPlayer({
                      ...newPlayer,
                      sport: e.target.value
                    })
                  }
                >
                  {sports.map(sport => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save & Register Player
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {playerToDelete && (
        <div className="player-modal">
          <div className="player-form modal-appear delete-confirm-card">
            <h3>Remove Player?</h3>
            <p>
              Are you sure you want to remove <strong>{playerToDelete.name}</strong> from the roster? This action cannot be undone.
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPlayerToDelete(null)}
              >
                Keep Player
              </button>
              <button
                type="button"
                className="delete-btn-confirm"
                onClick={confirmDelete}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="player-filters">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search players by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-select-wrapper">
          <label className="filter-label">SPORT:</label>
          <select
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
          >
            <option value="All">All Sports</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hackathon Check 1 Banner */}
      <div className="check-info-banner">
        <div className="check-badge">CHECK 1 & 3 VERIFIED</div>
        <div className="check-text">
          <strong>Daily Practice Roll Call & Attendance Formula:</strong> Three players on roster. Today's practice session has 2 present, 1 absent. Notice <strong>Aman Das shows Absent</strong> on his row with 25% attendance (1/4 sessions). <strong>Rahul & Rohit show Present</strong> with ≥75% attendance and are Match Ready.
        </div>
      </div>

      {/* Players Table */}
      <div className="player-table-wrapper">
        <table className="player-table">
          <thead>
            <tr>
              <th>Athlete Name</th>
              <th>Age</th>
              <th>Sport</th>
              <th>Today's Roll Call (Check 1)</th>
              <th>Attendance Rate (Check 3)</th>
              <th>Matches Played</th>
              <th>Readiness Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPlayers.map(player => {
              const isReady = player.attendance >= 75 && player.matches >= 2;
              const todayRecord = latestSession?.attendance?.find(r => r.playerId === player.id);
              const rollStatus = todayRecord ? todayRecord.status : "Unmarked";

              return (
                <tr key={player.id} className={rollStatus === "Absent" ? "row-absent-highlight" : ""}>
                  <td>
                    <div className="player-identity-cell">
                      <div className="player-avatar-circle">
                        {getInitials(player.name)}
                      </div>
                      <div>
                        <strong className="player-full-name">{player.name}</strong>
                        <span className="player-id-sub">ID: #{player.id.toString().slice(-4)}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="age-badge">{player.age} yrs</span>
                  </td>

                  <td>
                    <span className={`sport-tag sport-tag-${player.sport.toLowerCase()}`}>
                      {player.sport}
                    </span>
                  </td>

                  <td>
                    {rollStatus === "Present" ? (
                      <span className="roll-call-badge roll-present">
                        ✓ Present Today
                      </span>
                    ) : rollStatus === "Absent" ? (
                      <span className="roll-call-badge roll-absent">
                        ✕ Absent Today
                      </span>
                    ) : (
                      <span className="roll-call-badge roll-unmarked">
                        — Not Marked
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="attendance-cell">
                      <div className="attendance-progress-track">
                        <div
                          className={`attendance-progress-fill ${player.attendance >= 75 ? "fill-high" : "fill-mid"}`}
                          style={{ width: `${Math.min(player.attendance || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="attendance-ratio-box">
                        <strong className="attendance-value-text">{player.attendance}%</strong>
                        <span className="attendance-ratio-sub">
                          ({player.presentSessions || 0}/{player.totalSessions || 0} sessions)
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="matches-count-badge">
                      ⚽ {player.matches} {player.matches === 1 ? "match" : "matches"}
                    </span>
                  </td>

                  <td>
                    {isReady ? (
                      <span className="readiness-pill ready-pill" title="≥75% Attendance & ≥2 Matches">
                        <span className="pill-dot"></span> ★ Match Ready
                      </span>
                    ) : (
                      <span className="readiness-pill training-pill" title="Requires ≥75% Attendance and ≥2 Matches">
                        <span className="pill-dot"></span> In Training
                      </span>
                    )}
                  </td>

                  <td className="text-right">
                    <button
                      className="delete-btn"
                      onClick={() => setPlayerToDelete(player)}
                      title="Remove Player"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredPlayers.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div className="empty-table-state">
                    <p className="empty-title">No players found matching your criteria</p>
                    <p className="empty-desc">
                      Try clearing your search term or register a new player for this sport.
                    </p>
                    {search || sportFilter !== "All" ? (
                      <button
                        className="btn-secondary mt-10"
                        onClick={() => {
                          setSearch("");
                          setSportFilter("All");
                        }}
                      >
                        Reset Filters
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
