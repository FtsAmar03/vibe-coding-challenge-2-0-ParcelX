import React, { useState } from "react";
import { api } from "../api";

// Won / Drawn / Lost is worked out from the two scores
function outcomeFromScore(home, away) {
  const h = Number(home) || 0;
  const a = Number(away) || 0;
  if (h > a) return "Won";
  if (h < a) return "Lost";
  return "Drawn";
}

export default function Body({
  currentRole = "coach",
  data = {},
  activePage = "dashboard",
  setActivePage,
  setPlayers,
  setSessions,
  matches: propMatches,
  setMatches,
  selectedPlayerId = 1,
  setSelectedPlayerId,
  reload,
}) {
  const players = data.players || [];
  const sessions = data.sessions || [];
  const matches = propMatches || data.matches || [];

  // Categorize players by Readiness (Check 3: ≥75% Attendance & ≥2 Matches)
  const readyPlayers = players.filter(
    (p) => p.attendance >= 75 && (p.matches || 0) >= 2,
  );
  const developingPlayers = players.filter(
    (p) => !(p.attendance >= 75 && (p.matches || 0) >= 2),
  );

  const totalMatchesCount = players.reduce(
    (sum, p) => sum + (p.matches || 0),
    0,
  );

  // Today's date calculations
  const currentDateObj = new Date();
  const todayDateStr = currentDateObj.toLocaleDateString("en-CA");
  const formattedCurrentDate = currentDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Today's session metrics (Check 1)
  const todaySession =
    sessions.find((s) => s.date === todayDateStr) || sessions[0];
  const presentTodayCount = todaySession
    ? todaySession.attendance.filter((r) => r.status === "Present").length
    : 0;
  const absentTodayCount = todaySession
    ? todaySession.attendance.filter((r) => r.status === "Absent").length
    : 0;
  const scheduledTodayCount = todaySession
    ? todaySession.attendance.length
    : players.length;
  const activeTurnoutRate =
    scheduledTodayCount > 0
      ? Math.round((presentTodayCount / scheduledTodayCount) * 100)
      : 0;

  // Selected squad drafting state for matches
  const [selectedSquad, setSelectedSquad] = useState([]);
  function togglePlayerSquad(id) {
    setSelectedSquad((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  }

  // Modals state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showRecordMatch, setShowRecordMatch] = useState(false);

  // Quick Add Player state
  const [quickPlayerName, setQuickPlayerName] = useState("");
  const [quickPlayerAge, setQuickPlayerAge] = useState("");
  const [quickPlayerSport, setQuickPlayerSport] = useState("Football");

  // Record Match Form State (Check 2)
  const [matchDate, setMatchDate] = useState(todayDateStr);
  const [matchSport, setMatchSport] = useState("Football");
  const [matchOpponent, setMatchOpponent] = useState("");
  const [matchVenue, setMatchVenue] = useState("Dumka Stadium");
  const [matchScoreHome, setMatchScoreHome] = useState("0");
  const [matchScoreOpponent, setMatchScoreOpponent] = useState("0");
  const [playerScoresInput, setPlayerScoresInput] = useState({});

  // Find practice session for selected match date & sport (Check 2 Gate)
  const targetSessionForMatch = sessions.find(
    (s) => s.date === matchDate && s.sport === matchSport,
  );

  // Handlers for Quick Add Player
  async function handleQuickAddPlayer(e) {
    e.preventDefault();
    if (!quickPlayerName.trim()) return;

    try {
      await api.addPlayer({
        name: quickPlayerName.trim(),
        age: Number(quickPlayerAge) || 17,
        sport: quickPlayerSport,
      });
      await reload();
    } catch (err) {
      alert(err.message);
      return;
    }

    setQuickPlayerName("");
    setQuickPlayerAge("");
    setShowQuickAdd(false);
  }

  // Handler for Record Match (Check 2: Refuse absent player from scoring sheet)
  async function handleRecordMatchSubmit(e) {
    e.preventDefault();
    if (!matchOpponent.trim()) return;

    // Only players who are not absent that day go on the sheet
    const scores = players
      .filter((p) => p.sport === matchSport)
      .filter((p) => {
        const rec = targetSessionForMatch?.attendance?.find(
          (a) => a.playerId === p.id,
        );
        if (rec && rec.status === "Absent") return false;
        return (rec && rec.status === "Present") || !targetSessionForMatch;
      })
      .map((p) => ({
        playerId: p.id,
        playerName: p.name,
        score: Number(playerScoresInput[p.id]) || 0,
      }));

    if (scores.length === 0) {
      alert("No eligible players for this match sheet.");
      return;
    }

    try {
      await api.recordMatch({
        date: matchDate,
        sport: matchSport,
        opponent: matchOpponent.trim(),
        venue: matchVenue,
        result: `${outcomeFromScore(matchScoreHome, matchScoreOpponent)} (${matchScoreHome}-${matchScoreOpponent})`,
        scores,
      });
      await reload();
    } catch (err) {
      alert(err.message);
      return;
    }

    setMatchOpponent("");
    setShowRecordMatch(false);
  }

  // SVG Chart Calculations for Donut Chart
  const circleRadius = 45;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset =
    circumference - (activeTurnoutRate / 100) * circumference;

  // =========================================================================
  // VIEW A: PLAYER ROLE (Check 4: "Player: Sees only their own row")
  // =========================================================================
  if (currentRole === "player") {
    const myPlayer =
      players.find((p) => p.id === selectedPlayerId) || players[0];
    if (!myPlayer)
      return <div className="page-loading">Loading athlete profile...</div>;

    // Check my player's roll call today
    const myTodayRecord = todaySession?.attendance?.find(
      (r) => r.playerId === myPlayer.id,
    );
    const myRollStatus = myTodayRecord ? myTodayRecord.status : "Unmarked";

    // Filter sessions to only show this player's personal logs
    const mySessions = sessions
      .filter((s) => s.sport === myPlayer.sport)
      .map((s) => {
        const myRecord = s.attendance?.find((a) => a.playerId === myPlayer.id);
        return {
          id: s.id,
          date: s.date,
          sport: s.sport,
          status: s.status,
          myStatus: myRecord ? myRecord.status : "Unmarked",
        };
      });

    // Filter matches to only show matches involving this player
    const myMatches = matches.filter((m) => m.sport === myPlayer.sport);

    return (
      <main className="dashboard player-portal-view">
        {/* Verification Alert for Check 4 */}
        <div className="check-info-banner player-view-banner">
          <div className="check-badge">CHECK 4: ATHLETE PRIVACY ACTIVE</div>
          <div className="check-text">
            <strong>Logged in as {myPlayer.name}:</strong> Per hackathon
            requirements, an athlete login sees{" "}
            <strong>ONLY their own row</strong> and personal attendance/match
            history. Data of other athletes is strictly restricted.
          </div>
        </div>

        {/* Athlete Welcome Card */}
        <div className="player-hero-card card">
          <div className="player-hero-top">
            <div className="player-identity-large">
              <div className="player-avatar-large">
                {myPlayer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="live-academy-badge">
                  ● LAWAIZA TOTO ATHLETE DESK
                </span>
                <h2>{myPlayer.name}</h2>
                <p>
                  Age: {myPlayer.age} · Sport: {myPlayer.sport} · Dumka Academy
                  ID #{myPlayer.id.toString().slice(-4)}
                </p>
              </div>
            </div>

            <div className="player-qualification-badge-box">
              {myPlayer.isReady ? (
                <div className="ready-status-banner-ready">
                  <span className="status-star">★</span>
                  <div>
                    <strong>MATCH READY FOR SCOUTING</strong>
                    <small>Meets ≥75% Attendance & ≥2 Matches Benchmark</small>
                  </div>
                </div>
              ) : (
                <div className="ready-status-banner-training">
                  <span className="status-star">⏳</span>
                  <div>
                    <strong>IN DEVELOPMENT ROSTER</strong>
                    <small>
                      Requires {75 - myPlayer.attendance}% higher attendance to
                      qualify
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CHECK 4: THE ATHLETE'S OWN ROW TABLE */}
        <div className="section-title-row mt-25">
          <div>
            <h3>My Academy Athlete Row (Check 4)</h3>
            <p>
              Your official status on the Lawazia Toto Academy master roster.
            </p>
          </div>
        </div>

        <div className="player-table-wrapper card">
          <table className="player-table">
            <thead>
              <tr>
                <th>Athlete Name</th>
                <th>Age</th>
                <th>Sport</th>
                <th>Today's Roll Call (Check 1)</th>
                <th>Attendance Formula (Check 3)</th>
                <th>Matches Played</th>
                <th>Trial Readiness</th>
              </tr>
            </thead>
            <tbody>
              <tr
                className={
                  myRollStatus === "Absent" ? "row-absent-highlight" : ""
                }
              >
                <td>
                  <div className="player-identity-cell">
                    <div className="player-avatar-circle">
                      {myPlayer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong className="player-full-name">
                        {myPlayer.name}
                      </strong>
                      <span className="player-id-sub">Verified Athlete</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="age-badge">{myPlayer.age} yrs</span>
                </td>
                <td>
                  <span
                    className={`sport-tag sport-tag-${myPlayer.sport.toLowerCase()}`}
                  >
                    {myPlayer.sport}
                  </span>
                </td>
                <td>
                  {myRollStatus === "Present" ? (
                    <span className="roll-call-badge roll-present">
                      ✓ Present Today
                    </span>
                  ) : myRollStatus === "Absent" ? (
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
                        className={`attendance-progress-fill ${myPlayer.attendance >= 75 ? "fill-high" : "fill-mid"}`}
                        style={{
                          width: `${Math.min(myPlayer.attendance || 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="attendance-ratio-box">
                      <strong className="attendance-value-text">
                        {myPlayer.attendance}%
                      </strong>
                      <span className="attendance-ratio-sub">
                        ({myPlayer.presentSessions || 0}/
                        {myPlayer.totalSessions || 0} sessions held)
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="matches-count-badge">
                    ⚽ {myPlayer.matches || 0} matches
                  </span>
                </td>
                <td>
                  {myPlayer.isReady ? (
                    <span className="readiness-pill ready-pill">
                      ★ Match Ready
                    </span>
                  ) : (
                    <span className="readiness-pill training-pill">
                      In Training
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Personal Session History & Match Sheet Status */}
        <div className="dashboard-grid two-column-grid mt-25">
          {/* Personal Practice History */}
          <div className="card">
            <div className="kpi-header">
              <div>
                <h3>My Practice Session Logs</h3>
                <p>Attendance records across all scheduled sessions</p>
              </div>
              <span className="kpi-icon">📋</span>
            </div>

            <div className="personal-log-list mt-15">
              {mySessions.map((s) => (
                <div className="personal-log-item" key={s.id}>
                  <div className="log-date-col">
                    <strong>📅 {s.date}</strong>
                    <small>
                      {s.sport} Practice ({s.status})
                    </small>
                  </div>
                  <div>
                    {s.myStatus === "Present" ? (
                      <span className="roll-call-badge roll-present">
                        ✓ Present
                      </span>
                    ) : (
                      <span className="roll-call-badge roll-absent">
                        ✕ Absent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Match Sheet Participation */}
          <div className="card">
            <div className="kpi-header">
              <div>
                <h3>My Matchday Squad Status</h3>
                <p>Check 2 Match Sheet Roll Call & Refusal History</p>
              </div>
              <span className="kpi-icon">⚽</span>
            </div>

            <div className="personal-log-list mt-15">
              {myMatches.map((m) => {
                const myScoreObj = m.scores?.find(
                  (s) => s.playerId === myPlayer.id,
                );

                return (
                  <div className="personal-match-item" key={m.id}>
                    <div className="log-date-col">
                      <strong>vs {m.opponent}</strong>
                      <small>
                        📅 {m.date} · {m.status}
                      </small>
                    </div>

                    <div>
                      {myScoreObj?.status === "Refused" ? (
                        <span className="refused-badge">
                          ⛔ Refused (Absent in practice)
                        </span>
                      ) : myScoreObj?.status === "Scored" ? (
                        <span className="scored-badge">
                          ⚽ Scored {myScoreObj.score}{" "}
                          {myScoreObj.score === 1 ? "Goal" : "Goals"}
                        </span>
                      ) : (
                        <span className="roster-badge">Squad Member</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW B: SCOUT ROLE (Check 4: "Scout: Sees only Ready players")
  // =========================================================================
  if (currentRole === "scout" || activePage === "ready") {
    // If Scout role, ONLY ready players are visible (Check 4). Developing players are hidden!
    const isStrictScoutRole = currentRole === "scout";

    return (
      <main className="dashboard ready-page-view">
        {/* Check 4 Scout Verification Banner */}
        <div className="check-info-banner scout-view-banner">
          <div className="check-badge">CHECK 4: SCOUT FILTER ACTIVE</div>
          <div className="check-text">
            <strong>Talent Scout Portal:</strong> Per hackathon requirements,
            the scout sees <strong>ONLY the Ready players</strong>. Athletes
            under 75% attendance or with less than 2 matches are automatically
            filtered out.
          </div>
        </div>

        <div className="page-heading">
          <div>
            <h2>Qualified Match-Ready Talent</h2>
            <p>
              Athletes meeting both academy benchmark rules: ≥75% Practice
              Attendance & ≥2 Verified Competitive Matches.
            </p>
          </div>

          <div className="readiness-filter-summary">
            <span className="readiness-badge-large">
              ★ {readyPlayers.length} Match-Ready Athletes
            </span>
          </div>
        </div>

        {/* Readiness Benchmark Threshold Card */}
        <div className="readiness-benchmark-card">
          <div className="benchmark-icon">🎯</div>
          <div className="benchmark-info">
            <h4>Check 3 Qualification Benchmark Formula</h4>
            <p>
              Selection threshold:{" "}
              <strong>
                Attendance = (Present sessions ÷ Sessions held) ≥ 75%
              </strong>
              , and <strong>Matches played ≥ 2</strong>.
            </p>
          </div>
          <div className="benchmark-stat">
            <span className="benchmark-percent">{readyPlayers.length}</span>
            <small>READY FOR TRIALS</small>
          </div>
        </div>

        {/* Qualified Candidates Grid (Scout sees only this!) */}
        <div className="section-header-compact mt-25">
          <h3>Scout Roster · Ready Athletes ({readyPlayers.length})</h3>
        </div>

        <div className="dashboard-grid">
          {readyPlayers.map((player) => {
            const isDrafted = selectedSquad.includes(player.id);

            return (
              <div className="card ready-athlete-card" key={player.id}>
                <div className="card-top-row">
                  <span
                    className={`sport-tag sport-tag-${player.sport.toLowerCase()}`}
                  >
                    {player.sport}
                  </span>
                  <span className="readiness-pill ready-pill">
                    <span className="pill-dot"></span> QUALIFIED FOR TRIAL
                  </span>
                </div>

                <div className="athlete-card-header">
                  <div className="player-avatar-circle">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="athlete-name">{player.name}</h3>
                    <p className="athlete-sub">
                      Age: {player.age} · ID #{player.id.toString().slice(-4)}
                    </p>
                  </div>
                </div>

                <div className="athlete-stats-row">
                  <div className="athlete-stat-col">
                    <small>Attendance</small>
                    <strong className="lime-highlight">
                      {player.attendance}%
                    </strong>
                    <span className="mini-ratio">
                      ({player.presentSessions}/{player.totalSessions})
                    </span>
                  </div>
                  <div className="athlete-stat-col">
                    <small>Matches</small>
                    <strong>{player.matches}</strong>
                    <span className="mini-ratio">Played</span>
                  </div>
                  <div className="athlete-stat-col">
                    <small>Goals / Pts</small>
                    <strong>{player.score || 0}</strong>
                    <span className="mini-ratio">Scored</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`squad-select-btn ${isDrafted ? "drafted" : ""}`}
                  onClick={() => togglePlayerSquad(player.id)}
                >
                  {isDrafted
                    ? "✓ Selected for Trial Invite"
                    : "+ Scout for Tournament Trial"}
                </button>
              </div>
            );
          })}
        </div>

        {/* For Coach only: Show developing players below. Scout is STRICTLY forbidden from seeing developing players! */}
        {!isStrictScoutRole && developingPlayers.length > 0 && (
          <>
            <div className="section-header-compact mt-35">
              <h3>
                In Development · Below 75% Attendance or &lt;2 Matches (
                {developingPlayers.length})
              </h3>
            </div>

            <div className="dashboard-grid">
              {developingPlayers.map((player) => (
                <div className="card developing-athlete-card" key={player.id}>
                  <div className="card-top-row">
                    <span
                      className={`sport-tag sport-tag-${player.sport.toLowerCase()}`}
                    >
                      {player.sport}
                    </span>
                    <span className="readiness-pill training-pill">
                      <span className="pill-dot"></span> NOT READY (CHECK 3)
                    </span>
                  </div>

                  <div className="athlete-card-header">
                    <div className="player-avatar-circle muted-avatar">
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="athlete-name">{player.name}</h3>
                      <p className="athlete-sub">
                        Age: {player.age} · ID #{player.id.toString().slice(-4)}
                      </p>
                    </div>
                  </div>

                  <div className="athlete-gap-box">
                    <small className="gap-title">
                      Qualification Shortfall:
                    </small>
                    <ul className="gap-list">
                      {player.attendance < 75 && (
                        <li>
                          Attendance is {player.attendance}% (Needs at least 75%
                          to qualify)
                        </li>
                      )}
                      {(player.matches || 0) < 2 && (
                        <li>
                          Has {player.matches || 0} match (Needs at least 2
                          matches to qualify)
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="athlete-stats-row">
                    <div className="athlete-stat-col">
                      <small>Attendance</small>
                      <strong className="text-secondary">
                        {player.attendance}%
                      </strong>
                      <span className="mini-ratio">
                        ({player.presentSessions}/{player.totalSessions})
                      </span>
                    </div>
                    <div className="athlete-stat-col">
                      <small>Matches</small>
                      <strong>{player.matches || 0}</strong>
                    </div>
                    <div className="athlete-stat-col">
                      <small>Score</small>
                      <strong>{player.score || 0}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    );
  }

  // =========================================================================
  // VIEW C: MATCHES VIEW (Check 2: "A match the same day scores the two who were present. The absent player is refused.")
  // =========================================================================
  if (activePage === "matches") {
    return (
      <main className="dashboard matches-page-view">
        {/* Check 2 Info Banner */}
        <div className="check-info-banner match-check-banner">
          <div className="check-badge">CHECK 2 ENFORCED</div>
          <div className="check-text">
            <strong>Matchday Attendance Rule:</strong> A match on the same day
            scores the players who were present in practice.{" "}
            <strong>
              A player absent from practice that day is refused from the match
              sheet.
            </strong>
          </div>
        </div>

        <div className="page-heading">
          <div>
            <h2>Match Schedule & Verified Sheets</h2>
            <p>
              Lawazia Toto Academy competitive fixtures, scores, and practice
              attendance verification.
            </p>
          </div>

          <button
            className="add-player-btn"
            onClick={() => setShowRecordMatch(true)}
          >
            <span>+</span> Record New Match
          </button>
        </div>

        {/* Fixtures & Results List */}
        <div className="matches-grid">
          {matches.map((m) => (
            <div className="card match-fixture-card" key={m.id}>
              <div className="match-card-top">
                <span
                  className={`sport-tag sport-tag-${m.sport.toLowerCase()}`}
                >
                  {m.sport}
                </span>
                <span
                  className={
                    m.status.includes("Won")
                      ? "match-status-won"
                      : "match-status-upcoming"
                  }
                >
                  {m.status}
                </span>
              </div>

              <div className="match-teams-row">
                <div className="team-box home-team">
                  <div className="team-badge">LT</div>
                  <strong>Lawazia Toto</strong>
                  <small>Dumka Academy</small>
                </div>

                <div className="vs-badge">VS</div>

                <div className="team-box away-team">
                  <div className="team-badge opponent-badge">OPP</div>
                  <strong>{m.opponent}</strong>
                  <small>Inter-District</small>
                </div>
              </div>

              <div className="match-meta-box">
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span>
                    {m.date} at {m.time}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{m.venue}</span>
                </div>
              </div>

              {/* CHECK 2: OFFICIAL MATCHDAY SCORING SHEET */}
              {m.scores && m.scores.length > 0 && (
                <div className="match-scoresheet-box">
                  <div className="scoresheet-title">
                    <span>📋 Official Match Sheet (Check 2 Verified)</span>
                  </div>

                  <div className="scoresheet-players">
                    {m.scores.map((s) => (
                      <div
                        key={s.playerId}
                        className={`scoresheet-row ${s.status === "Refused" ? "refused-row" : "scored-row"}`}
                      >
                        <div className="scoresheet-player-name">
                          <strong>{s.playerName}</strong>
                          {s.status === "Refused" && (
                            <small className="refusal-reason">
                              Absent from practice on match day
                            </small>
                          )}
                        </div>

                        <div>
                          {s.status === "Refused" ? (
                            <span className="refused-badge">
                              ⛔ REFUSED FROM SHEET
                            </span>
                          ) : (
                            <span className="scored-badge">
                              ⚽ {s.score} {s.score === 1 ? "Goal" : "Goals"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Record Match Modal */}
        {showRecordMatch && renderRecordMatchModal()}
      </main>
    );
  }

  // =========================================================================
  // VIEW D: COACH DASHBOARD VIEW (Default)
  // =========================================================================
  return (
    <main className="dashboard coach-dashboard">
      {/* =================================================================
          1. WELCOME SECTION
          ================================================================= */}
      <div className="coach-welcome-banner mt-25">
        <div className="welcome-text-block">
          <div className="welcome-badge-row">
            <span className="live-academy-badge">● DUMKA ACADEMY DESK</span>
            <span className="current-date-badge">
              📅 {formattedCurrentDate}
            </span>
          </div>
          <h1>Good morning, Coach!</h1>
          <p>
            Here is your daily athletic summary, squad attendance turnout, and
            match readiness overview.
          </p>
        </div>

        {/* 5. QUICK ACTION BUTTONS */}
        <div className="dashboard-quick-actions">
          <button
            className="quick-btn primary-lime-btn"
            onClick={() => setShowQuickAdd(true)}
            title="Register a new player"
          >
            <span className="btn-icon">+</span> Add Player
          </button>

          <button
            className="quick-btn navy-action-btn"
            onClick={() => setActivePage && setActivePage("attendance")}
            title="Open or mark today's roll call"
          >
            <span className="btn-icon">📋</span> Mark Attendance
          </button>

          <button
            className="quick-btn outline-action-btn"
            onClick={() => setShowRecordMatch(true)}
            title="Record match outcome with Check 2 gate"
          >
            <span className="btn-icon">⚽</span> Record Match
          </button>
        </div>
      </div>

      {/* =================================================================
          2. FOUR STATISTICS CARDS
          ================================================================= */}
      <div className="dashboard-grid four-stats-grid">
        {/* Stat 1: Total Players */}
        <div
          className="card kpi-card"
          onClick={() => setActivePage && setActivePage("players")}
        >
          <div className="kpi-header">
            <h3>TOTAL PLAYERS</h3>
            <span className="kpi-icon">👥</span>
          </div>
          <div className="kpi-value-row">
            <h1>{players.length}</h1>
            <span className="kpi-trend-tag positive">Check 1 Squad</span>
          </div>
          <p>Athletes registered in the academy.</p>
        </div>

        {/* Stat 2: Present Today */}
        <div
          className="card kpi-card accent-border-card"
          onClick={() => setActivePage && setActivePage("attendance")}
        >
          <div className="kpi-header">
            <h3>PRESENT TODAY</h3>
            <span className="kpi-icon">✓</span>
          </div>
          <div className="kpi-value-row">
            <h1 className="emerald-text">{presentTodayCount}</h1>
            <span className="kpi-status-tag">
              {todaySession ? todaySession.status.toUpperCase() : "LOCKED"}
            </span>
          </div>
          <p>
            <strong>{presentTodayCount} Present</strong>,{" "}
            <strong>{absentTodayCount} Absent</strong> on the latest session.
          </p>
        </div>

        {/* Stat 3: Total Matches */}
        <div
          className="card kpi-card"
          onClick={() => setActivePage && setActivePage("matches")}
        >
          <div className="kpi-header">
            <h3>TOTAL MATCHES</h3>
            <span className="kpi-icon">⚽</span>
          </div>
          <div className="kpi-value-row">
            <h1>{totalMatchesCount}</h1>
            <span className="kpi-trend-tag">Active Season</span>
          </div>
          <p>
            Verified competition fixtures across{" "}
            <strong>all tournament squads</strong>.
          </p>
        </div>

        {/* Stat 4: Ready Players */}
        <div
          className="card kpi-card highlight-card"
          onClick={() => setActivePage && setActivePage("ready")}
        >
          <div className="kpi-header">
            <h3>READY PLAYERS</h3>
            <span className="kpi-icon">★</span>
          </div>
          <div className="kpi-value-row">
            <h1 className="lime-text">{readyPlayers.length}</h1>
            <span className="kpi-badge-lime">QUALIFIED</span>
          </div>
          <p>
            Athletes meeting <strong>≥75% Attendance & ≥2 Matches</strong>.
          </p>
        </div>
      </div>

      {/* =================================================================
          3. ATTENDANCE OVERVIEW SECTION (WITH CLEAN PROGRESS CHART)
          ================================================================= */}
      <div className="attendance-overview-card card">
        <div className="overview-card-header">
          <div>
            <h3>Squad Attendance Overview</h3>
            <p>
              Daily practice attendance breakdown and progress toward tournament
              threshold.
            </p>
          </div>

          <div className="overview-header-actions">
            <span className="session-date-pill">
              Session: {todaySession ? todaySession.date : todayDateStr}
            </span>
            {setActivePage && (
              <button
                className="secondary-link-btn"
                onClick={() => setActivePage("attendance")}
              >
                Go to Attendance Sheet →
              </button>
            )}
          </div>
        </div>

        <div className="attendance-overview-content">
          {/* Circular Donut Progress Chart */}
          <div className="chart-wrapper-box">
            <div className="donut-chart-container">
              <svg
                className="circular-chart-svg"
                viewBox="0 0 120 120"
                width="130"
                height="130"
              >
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  fill="none"
                  stroke="#E8EEEC"
                  strokeWidth="11"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  fill="none"
                  stroke="#159B85"
                  strokeWidth="11"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  className="progress-ring-fill"
                />
              </svg>

              <div className="chart-center-content">
                <span className="chart-pct-val">{activeTurnoutRate}%</span>
                <small className="chart-subtext">Turnout</small>
              </div>
            </div>

            <div className="chart-legend-box">
              <div className="legend-item">
                <span className="legend-dot dot-present"></span>
                <span>
                  Present: <strong>{presentTodayCount} athletes</strong>
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-absent"></span>
                <span>
                  Absent: <strong>{absentTodayCount} athletes</strong>
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-threshold"></span>
                <span>
                  Ready Benchmark: <strong>75%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Turnout Stats & Sport Breakdown */}
          <div className="overview-metrics-grid">
            <div className="metric-pill-item">
              <span className="pill-metric-label">ATTENDANCE RATE</span>
              <span className="pill-metric-value">{activeTurnoutRate}%</span>
              <small className="pill-metric-sub">
                {activeTurnoutRate >= 75
                  ? "✓ Above qualification mark"
                  : `${presentTodayCount} of ${scheduledTodayCount} players present`}
              </small>
            </div>

            <div className="metric-pill-item">
              <span className="pill-metric-label">PRESENT PLAYERS</span>
              <span className="pill-metric-value emerald-text">
                {presentTodayCount}
              </span>
              <small className="pill-metric-sub">
                Marked present in the latest session
              </small>
            </div>

            <div className="metric-pill-item">
              <span className="pill-metric-label">ABSENT PLAYERS</span>
              <span className="pill-metric-value coral-text">
                {absentTodayCount}
              </span>
              <small className="pill-metric-sub">
                Marked absent in the latest session
              </small>
            </div>
          </div>

          {/* Sport Discipline Turnout Bars */}
          <div className="discipline-turnout-bars">
            <span className="discipline-title">
              Turnout by Sport Discipline
            </span>

            <div className="discipline-bar-row">
              <div className="discipline-bar-labels">
                <span>⚽ Football Squad</span>
                <strong>{activeTurnoutRate}%</strong>
              </div>
              <div className="discipline-track">
                <div
                  className="discipline-fill fill-football"
                  style={{ width: `${activeTurnoutRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================
          4. RECENT ACTIVITY SECTION
          ================================================================= */}
      <div className="section-title-row mt-35">
        <div>
          <h2>Recent Academy Activity</h2>
          <p>
            Real-time logs of newly registered players, daily roll calls, and
            match results.
          </p>
        </div>
      </div>

      <div className="recent-activity-grid">
        {/* Activity 1: Recently Added Players */}
        <div className="card activity-card">
          <div className="activity-card-header">
            <div>
              <h3>Recently Added Players</h3>
              <p>Registered talent</p>
            </div>
            <span className="activity-icon-badge">👥</span>
          </div>

          <div className="activity-list">
            {players
              .slice(-3)
              .reverse()
              .map((p) => (
                <div className="activity-item" key={p.id}>
                  <div className="activity-avatar">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="activity-info">
                    <strong>{p.name}</strong>
                    <small>
                      Age {p.age} · {p.sport}
                    </small>
                  </div>
                  <span
                    className={`sport-tag sport-tag-${p.sport.toLowerCase()}`}
                  >
                    {p.sport}
                  </span>
                </div>
              ))}
          </div>

          <div className="activity-card-footer">
            <button
              className="activity-action-link"
              onClick={() => setActivePage && setActivePage("players")}
            >
              View Roster Directory ({players.length}) →
            </button>
          </div>
        </div>

        {/* Activity 2: Recent Attendance Sessions */}
        <div className="card activity-card">
          <div className="activity-card-header">
            <div>
              <h3>Recent Attendance Sessions</h3>
              <p>Daily pitch check-ins</p>
            </div>
            <span className="activity-icon-badge">📋</span>
          </div>

          <div className="activity-list">
            {sessions.slice(0, 3).map((s) => {
              const pCount = s.attendance.filter(
                (r) => r.status === "Present",
              ).length;
              const tCount = s.attendance.length;

              return (
                <div className="activity-item" key={s.id}>
                  <div className="activity-session-icon">⚽</div>
                  <div className="activity-info">
                    <strong>{s.sport} Practice</strong>
                    <small>
                      📅 {s.date} · {pCount}/{tCount} Present
                    </small>
                  </div>
                  <span
                    className={
                      s.status === "Closed" ? "closed-tag" : "open-tag"
                    }
                  >
                    {s.status === "Closed" ? "LOCKED" : "OPEN"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="activity-card-footer">
            <button
              className="activity-action-link"
              onClick={() => setActivePage && setActivePage("attendance")}
            >
              Open Daily Register →
            </button>
          </div>
        </div>

        {/* Activity 3: Latest Match Results */}
        <div className="card activity-card">
          <div className="activity-card-header">
            <div>
              <h3>Latest Match Results</h3>
              <p>Inter-district competitive play</p>
            </div>
            <span className="activity-icon-badge">🏆</span>
          </div>

          <div className="activity-list">
            {matches.slice(0, 2).map((m) => (
              <div className="activity-item match-activity-item" key={m.id}>
                <div className="match-icon-circle">⚽</div>
                <div className="activity-info">
                  <strong>vs {m.opponent}</strong>
                  <small>
                    📍 {m.venue} · {m.date}
                  </small>
                </div>
                <span
                  className={
                    m.status.includes("Won")
                      ? "match-status-won"
                      : "match-status-upcoming"
                  }
                >
                  {m.status}
                </span>
              </div>
            ))}
          </div>

          <div className="activity-card-footer">
            <button
              className="activity-action-link"
              onClick={() => setActivePage && setActivePage("matches")}
            >
              View Full Match Schedule →
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================
          6. READY PLAYERS PREVIEW
          ================================================================= */}
      <div className="section-title-row mt-35">
        <div>
          <h2>Ready Players Preview (Check 3 Verified)</h2>
          <p>
            Athletes meeting both selection criteria: ≥75% Attendance and ≥2
            Competitive Matches.
          </p>
        </div>

        {setActivePage && (
          <button
            className="secondary-link-btn primary-lime-link"
            onClick={() => setActivePage("ready")}
          >
            ★ View Full Lineup & Scouting Board ({readyPlayers.length}) →
          </button>
        )}
      </div>

      <div className="ready-preview-card card">
        <div className="player-table-wrapper">
          <table className="player-table">
            <thead>
              <tr>
                <th>Athlete Name</th>
                <th>Sport</th>
                <th>Attendance Rate (Present / Held)</th>
                <th>Matches Played</th>
                <th>Ready Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {readyPlayers.map((player) => (
                <tr key={player.id}>
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
                          Age: {player.age} · ID #
                          {player.id.toString().slice(-4)}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`sport-tag sport-tag-${player.sport.toLowerCase()}`}
                    >
                      {player.sport}
                    </span>
                  </td>

                  <td>
                    <div className="attendance-cell">
                      <div className="attendance-progress-track">
                        <div
                          className="attendance-progress-fill fill-high"
                          style={{
                            width: `${Math.min(player.attendance || 0, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="attendance-ratio-box">
                        <strong className="attendance-value-text">
                          {player.attendance}%
                        </strong>
                        <span className="attendance-ratio-sub">
                          ({player.presentSessions || 0}/
                          {player.totalSessions || 0} sessions)
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="matches-count-badge">
                      ⚽ {player.matches}{" "}
                      {player.matches === 1 ? "match" : "matches"}
                    </span>
                  </td>

                  <td>
                    <span className="readiness-pill ready-pill">
                      <span className="pill-dot"></span> ★ Match Ready
                    </span>
                  </td>

                  <td className="text-right">
                    <button
                      className="draft-action-btn"
                      onClick={() => setActivePage && setActivePage("ready")}
                    >
                      Draft Squad
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Add Player Modal */}
      {showQuickAdd && (
        <div
          className="player-modal"
          onClick={(e) => {
            if (e.target.classList.contains("player-modal"))
              setShowQuickAdd(false);
          }}
        >
          <form
            onSubmit={handleQuickAddPlayer}
            className="player-form modal-appear"
          >
            <div className="modal-header">
              <h2>Quick Register Athlete</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowQuickAdd(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtitle">
              Enroll an athlete directly to the academy roster.
            </p>

            <div className="form-group">
              <label>Player Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Hansda"
                value={quickPlayerName}
                onChange={(e) => setQuickPlayerName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  min="6"
                  max="45"
                  placeholder="e.g. 17"
                  value={quickPlayerAge}
                  onChange={(e) => setQuickPlayerAge(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Primary Sport</label>
                <select
                  value={quickPlayerSport}
                  onChange={(e) => setQuickPlayerSport(e.target.value)}
                >
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Basketball">Basketball</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowQuickAdd(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add to Academy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Match Modal */}
      {showRecordMatch && renderRecordMatchModal()}
    </main>
  );

  // =========================================================================
  // HELPER: RENDER RECORD MATCH MODAL (WITH CHECK 2 REFUSAL GATE)
  // =========================================================================
  function renderRecordMatchModal() {
    const sportPlayers = players.filter((p) => p.sport === matchSport);

    return (
      <div
        className="player-modal"
        onClick={(e) => {
          if (e.target.classList.contains("player-modal"))
            setShowRecordMatch(false);
        }}
      >
        <form
          onSubmit={handleRecordMatchSubmit}
          className="player-form modal-appear match-record-form"
        >
          <div className="modal-header">
            <h2>Record Match & Player Scores</h2>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowRecordMatch(false)}
            >
              ✕
            </button>
          </div>
          <p className="modal-subtitle">
            Log inter-district match results. <strong>Check 2 enforced:</strong>{" "}
            players absent from practice on this match day are automatically
            refused from the scoring sheet.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Match Date</label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Sport</label>
              <select
                value={matchSport}
                onChange={(e) => setMatchSport(e.target.value)}
              >
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Hockey">Hockey</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Opponent Team</label>
              <input
                type="text"
                placeholder="e.g. Ranchi Youth FC"
                value={matchOpponent}
                onChange={(e) => setMatchOpponent(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Match Outcome (automatic)</label>
              <input
                type="text"
                value={outcomeFromScore(matchScoreHome, matchScoreOpponent)}
                readOnly
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Lawazia Toto Goals</label>
              <input
                type="number"
                min="0"
                value={matchScoreHome}
                onChange={(e) => setMatchScoreHome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Opponent Goals</label>
              <input
                type="number"
                min="0"
                value={matchScoreOpponent}
                onChange={(e) => setMatchScoreOpponent(e.target.value)}
                required
              />
            </div>
          </div>

          {/* CHECK 2 GATE: MATCHDAY SQUAD PRACTICE ATTENDANCE CHECK */}
          <div className="match-roster-gate-section">
            <div className="gate-header">
              <h4>📋 Match Sheet Roll Call Gate (Check 2)</h4>
              <span className="gate-session-info">
                {targetSessionForMatch
                  ? `Practice on ${matchDate}: ${targetSessionForMatch.status}`
                  : `No practice session logged for ${matchDate}`}
              </span>
            </div>

            <div className="gate-players-list">
              {sportPlayers.map((p) => {
                const attRecord = targetSessionForMatch?.attendance?.find(
                  (a) => a.playerId === p.id,
                );
                const isAbsent = attRecord && attRecord.status === "Absent";
                const isPresent = attRecord && attRecord.status === "Present";

                return (
                  <div
                    key={p.id}
                    className={`gate-player-card ${isAbsent ? "gate-card-refused" : "gate-card-eligible"}`}
                  >
                    <div className="gate-player-left">
                      <strong>{p.name}</strong>
                      <span className="player-id-sub">Age: {p.age}</span>

                      {isAbsent ? (
                        <span className="gate-refusal-tag">
                          ⛔ REFUSED: Absent from practice on match day
                        </span>
                      ) : isPresent ? (
                        <span className="gate-eligible-tag">
                          ✓ Present in practice — Eligible to play
                        </span>
                      ) : (
                        <span className="gate-unmarked-tag">
                          Practice not recorded
                        </span>
                      )}
                    </div>

                    <div className="gate-player-right">
                      {isAbsent ? (
                        <span className="disabled-score-notice">
                          Not on sheet
                        </span>
                      ) : (
                        <div className="score-input-wrap">
                          <label>Goals / Score:</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={
                              playerScoresInput[p.id] !== undefined
                                ? playerScoresInput[p.id]
                                : 0
                            }
                            onChange={(e) =>
                              setPlayerScoresInput({
                                ...playerScoresInput,
                                [p.id]: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowRecordMatch(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Match & Verified Scores
            </button>
          </div>
        </form>
      </div>
    );
  }
}
