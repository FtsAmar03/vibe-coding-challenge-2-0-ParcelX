import express from "express";
import Player from "../models/Player.js";

const router = express.Router();

// GET all players
router.get("/", async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add player
router.post("/", async (req, res) => {
  try {
    const { name, age, sport } = req.body;
    if (!name || !age || !sport) {
      return res
        .status(400)
        .json({ error: "Name, age, and sport are required." });
    }

    const player = new Player({
      name,
      age,
      sport,
      academy: "Dumka Sports Academy",
    });

    const saved = await player.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
