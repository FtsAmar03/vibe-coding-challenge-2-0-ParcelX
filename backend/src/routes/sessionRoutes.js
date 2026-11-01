import express from "express";
import Session from "../models/Session.js";

const router = express.Router();

// GET all sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST 1. Open session (date, sport)
router.post("/", async (req, res) => {
  try {
    const { date, sport, notes, attendance } = req.body;
    if (!date || !sport) {
      return res.status(400).json({ error: "Date and sport are required to open a session." });
    }

    const session = new Session({
      date,
      sport,
      notes: notes || "",
      status: "open",
      attendance: attendance || {},
    });

    const saved = await session.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT 2. Mark attendance (only allowed when session is open)
router.put("/:id/attendance", async (req, res) => {
  try {
    const { attendance } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.status === "closed") {
      return res.status(400).json({
        error: "Session is closed and locked. Attendance cannot be modified.",
      });
    }

    session.attendance = attendance;
    const updated = await session.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST 3. Close & lock session
router.post("/:id/close", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    session.status = "closed";
    const updated = await session.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
