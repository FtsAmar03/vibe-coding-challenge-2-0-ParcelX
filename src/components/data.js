// Lawazia Toto Sports Academy - Dumka, Jharkhand
// Data Model adhering strictly to Hackathon Problem Statement

export const initialSessionsData = [
  {
    id: 1001,
    date: new Date().toLocaleDateString("en-CA"), // Today's session
    sport: "Football",
    status: "Closed",
    attendance: [
      { playerId: 1, status: "Present" },
      { playerId: 2, status: "Absent" },
      { playerId: 3, status: "Present" }
    ]
  },
  {
    id: 1002,
    date: "2026-10-31",
    sport: "Football",
    status: "Closed",
    attendance: [
      { playerId: 1, status: "Present" },
      { playerId: 2, status: "Absent" },
      { playerId: 3, status: "Present" }
    ]
  },
  {
    id: 1003,
    date: "2026-10-30",
    sport: "Football",
    status: "Closed",
    attendance: [
      { playerId: 1, status: "Present" },
      { playerId: 2, status: "Present" },
      { playerId: 3, status: "Present" }
    ]
  },
  {
    id: 1004,
    date: "2026-10-29",
    sport: "Football",
    status: "Closed",
    attendance: [
      { playerId: 1, status: "Absent" },
      { playerId: 2, status: "Absent" },
      { playerId: 3, status: "Present" }
    ]
  }
];

export const academyData = {
  // Three core players tested in Check 1, 2, 3, 4
  players: [
    {
      id: 1,
      name: "Rahul Kumar",
      age: 17,
      sport: "Football",
      matches: 2,
      score: 3
    },
    {
      id: 2,
      name: "Aman Das",
      age: 18,
      sport: "Football",
      matches: 1,
      score: 1
    },
    {
      id: 3,
      name: "Rohit Soren",
      age: 16,
      sport: "Football",
      matches: 2,
      score: 4
    }
  ],
  matches: [
    {
      id: 201,
      sport: "Football",
      opponent: "Ranchi Youth FC",
      date: new Date().toLocaleDateString("en-CA"), // Today's match
      time: "04:00 PM",
      venue: "Dumka Stadium",
      status: "Won (3-1)",
      scores: [
        { playerId: 1, playerName: "Rahul Kumar", score: 2, status: "Scored" },
        { playerId: 3, playerName: "Rohit Soren", score: 1, status: "Scored" },
        { playerId: 2, playerName: "Aman Das", score: 0, status: "Refused" } // Absent on match day
      ]
    },
    {
      id: 202,
      sport: "Football",
      opponent: "Jamshedpur Strikers",
      date: "2026-10-24",
      time: "03:30 PM",
      venue: "Tata Sports Ground",
      status: "Won (2-0)",
      scores: [
        { playerId: 1, playerName: "Rahul Kumar", score: 1, status: "Scored" },
        { playerId: 3, playerName: "Rohit Soren", score: 1, status: "Scored" }
      ]
    }
  ]
};

/**
 * Attendance formula: Present sessions divided by sessions held
 */
export function getPlayerAttendanceStats(playerId, sport, sessions = []) {
  const sportSessions = sessions.filter(s => s.sport === sport);
  if (sportSessions.length === 0) {
    return { presentCount: 0, totalHeld: 0, percentage: 0 };
  }

  let presentCount = 0;
  let totalHeld = 0;

  sportSessions.forEach(session => {
    const record = session.attendance?.find(r => r.playerId === playerId);
    if (record) {
      totalHeld++;
      if (record.status === "Present") {
        presentCount++;
      }
    }
  });

  const percentage = totalHeld > 0 ? Math.round((presentCount / totalHeld) * 100) : 0;
  return { presentCount, totalHeld, percentage };
}

/**
 * Ready formula: 75% attendance and at least 2 matches
 */
export function isPlayerReady(player, sessions = []) {
  const { percentage } = getPlayerAttendanceStats(player.id, player.sport, sessions);
  return percentage >= 75 && (player.matches || 0) >= 2;
}
