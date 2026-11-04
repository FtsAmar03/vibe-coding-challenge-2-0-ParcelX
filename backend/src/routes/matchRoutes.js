import express from "express";
import Match from "../models/Match.js";
import Session from "../models/Session.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();
// Player: only the matches they played, showing only their own score line
router.get(
  "/mine",
  authMiddleware,
  roleMiddleware("player"),
  async (req, res) => {
    try {
      if (!req.user.playerId) return res.json([]);

      const matches = await Match.find({
        "scores.playerId": req.user.playerId,
      }).sort({ createdAt: -1 });

      const mine = matches.map((m) => {
        const obj = m.toJSON();
        obj.scores = obj.scores.filter(
          (s) => String(s.playerId) === String(req.user.playerId),
        );
        return obj;
      });

      res.json(mine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Everything below is coach only
router.use(authMiddleware, roleMiddleware("coach"));

// GET all matches
router.get("/", async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST record match with Absent Player Refusal rule
router.post("/", async (req, res) => {
  try {
    const { date, sport, opponent, venue, result, scores } = req.body;
    if (!date || !sport || !opponent || !scores || !scores.length) {
      return res.status(400).json({
        error:
          "Date, sport, opponent, and at least one scored player are required.",
      });
    }

    // Check 2: A player absent that day is not on the sheet
    const sameDaySessions = await Session.find({ date });
    for (const session of sameDaySessions) {
      if (session.attendance) {
        for (const sc of scores) {
          const mark = session.attendance.get
            ? session.attendance.get(sc.playerId)
            : session.attendance[sc.playerId];

          if (mark === "Absent") {
            return res.status(400).json({
              error: `Player ${sc.playerName || sc.playerId} is REFUSED. A player absent on session date (${date}) cannot be on the match sheet.`,
              refusedPlayerId: sc.playerId,
            });
          }
        }
      }
    }

    const match = new Match({
      date,
      sport,
      opponent,
      venue: venue || "",
      result: result || "",
      scores,
    });

    const saved = await match.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
