// All talking to the backend happens here.
const BASE = process.env.API_URL || "http://localhost:5000/api";

// ---------- login storage ----------
export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const saveSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ---------- one function for every request ----------
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || data.error || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  signup: (body) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  getSetupStatus: () => request("/auth/status"),

  // reads
  getPlayers: () => request("/players"),
  getReadyPlayers: () => request("/players/ready"),
  getMyRow: () => request("/players/me"),
  getSessions: () => request("/sessions"),
  getMatches: () => request("/matches"),
  getMyMatches: () => request("/matches/mine"),

  // writes (used in the next step)
  addPlayer: (body) =>
    request("/players", { method: "POST", body: JSON.stringify(body) }),
  deletePlayer: (id) => request(`/players/${id}`, { method: "DELETE" }),
  openSession: (body) =>
    request("/sessions", { method: "POST", body: JSON.stringify(body) }),
  saveAttendance: (id, attendance) =>
    request(`/sessions/${id}/attendance`, {
      method: "PUT",
      body: JSON.stringify({ attendance }),
    }),
  closeSession: (id) => request(`/sessions/${id}/close`, { method: "POST" }),
  recordMatch: (body) =>
    request("/matches", { method: "POST", body: JSON.stringify(body) }),
};

// ---------- convert backend data into the shape your screens already use ----------
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const adaptPlayer = (p) => ({
  ...p,
  id: p._id,
  attendance: p.attendancePercent ?? 0,
  presentSessions: p.sessionsPresent ?? 0,
  totalSessions: p.sessionsHeld ?? 0,
  matches: p.matchesPlayed ?? 0,
  score: p.goals ?? 0,
  isReady: !!p.ready,
});

export const adaptSession = (s) => ({
  id: s._id,
  date: s.date,
  sport: s.sport,
  status: cap(s.status),
  notes: s.notes,
  attendance: Object.entries(s.attendance || {}).map(([playerId, status]) => ({
    playerId,
    status,
  })),
});

export const adaptMatch = (m) => ({
  id: m._id,
  date: m.date,
  sport: m.sport,
  opponent: m.opponent,
  venue: m.venue || "Dumka Stadium",
  time: m.time || "",
  status: m.result || "Played",
  scores: (m.scores || []).map((s) => ({
    playerId: String(s.playerId),
    playerName: s.playerName,
    score: s.score,
    status: "Scored",
  })),
});

// Player login: build the practice log from the /me response
export const historyToSessions = (me) =>
  (me.attendanceHistory || []).map((h) => ({
    id: h.sessionId,
    date: h.date,
    sport: me.sport,
    status: cap(h.sessionStatus),
    attendance: [
      {
        playerId: me._id,
        status: h.mark === "Not marked" ? "" : h.mark,
      },
    ],
  }));

// Open sessions show every player of that sport, unmarked ones as ""
export const fillSession = (session, players) => {
  if (session.status !== "Open") return session;
  const have = new Set(session.attendance.map((r) => r.playerId));
  const missing = players
    .filter(
      (p) =>
        p.sport.toLowerCase() === session.sport.toLowerCase() &&
        !have.has(p.id),
    )
    .map((p) => ({ playerId: p.id, status: "" }));
  return { ...session, attendance: [...session.attendance, ...missing] };
};
