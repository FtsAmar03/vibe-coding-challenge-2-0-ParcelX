import Session from "../models/Session.js";
import Match from "../models/Match.js";

export const READY_ATTENDANCE = 0.75; // 75%
export const READY_MATCHES = 2;

// Takes Player documents, returns plain objects with attendance + ready info.
export const getPlayerStats = async (players, { withHistory = false } = {}) => {
  const [sessions, matches] = await Promise.all([
    Session.find().lean(),
    Match.find().lean(),
  ]);

  return players.map((player) => {
    const id = String(player._id);

    // Sessions for this player's sport
    const mine = sessions.filter(
      (s) => s.sport.toLowerCase() === player.sport.toLowerCase(),
    );

    // "Sessions held" = closed (locked) sessions
    const held = mine.filter((s) => s.status === "closed");
    const present = held.filter((s) => s.attendance?.[id] === "Present").length;

    const matchesPlayed = matches.filter((m) =>
      m.scores.some((sc) => String(sc.playerId) === id),
    ).length;

    const goals = matches.reduce((sum, m) => {
      const sc = m.scores.find((x) => String(x.playerId) === id);
      return sum + (sc ? sc.score || 0 : 0);
    }, 0);

    const ratio = held.length ? present / held.length : 0;
    const ready =
      held.length > 0 &&
      ratio >= READY_ATTENDANCE &&
      matchesPlayed >= READY_MATCHES;

    const result = {
      ...player.toJSON(),
      sessionsHeld: held.length,
      sessionsPresent: present,
      attendancePercent: Math.round(ratio * 10000) / 100,
      matchesPlayed,
      goals,
      ready,
    };

    if (withHistory) {
      result.attendanceHistory = mine
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((s) => ({
          sessionId: s._id,
          date: s.date,
          sessionStatus: s.status,
          mark: s.attendance?.[id] || "Not marked",
        }));
    }

    return result;
  });
};
