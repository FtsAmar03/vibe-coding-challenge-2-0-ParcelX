import Player from "../models/Player.js";
import { getPlayerStats } from "../utils/readiness.js";

// Coach: create player
export const createPlayer = async (req, res) => {
  try {
    const { name, age, sport, position } = req.body;

    if (!name || !age || !sport) {
      return res
        .status(400)
        .json({ message: "Name, age and sport are required" });
    }

    const player = await Player.create({ name, age, sport, position });
    res
      .status(201)
      .json({ success: true, message: "Player added successfully", player });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Coach: all players with attendance + ready status
export const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });
    const data = await getPlayerStats(players);
    res.json({ success: true, count: data.length, players: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Coach + Scout: only Ready players
export const getReadyPlayers = async (req, res) => {
  try {
    const players = await Player.find({ status: "active" });
    const data = (await getPlayerStats(players)).filter((p) => p.ready);
    res.json({ success: true, count: data.length, players: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Player: only their own row
export const getMyRow = async (req, res) => {
  try {
    if (!req.user.playerId) {
      return res
        .status(404)
        .json({ message: "No player profile linked to this account" });
    }

    const player = await Player.findById(req.user.playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const [data] = await getPlayerStats([player], { withHistory: true });
    res.json({ success: true, player: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Coach: single player with history
export const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    const [data] = await getPlayerStats([player], { withHistory: true });
    res.json({ success: true, player: data });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid player ID" });
  }
};

// Coach: update (whitelisted fields only)
export const updatePlayer = async (req, res) => {
  try {
    const allowed = ["name", "age", "sport", "position", "status"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const player = await Player.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json({ success: true, message: "Player updated successfully", player });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Coach: delete
export const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json({ success: true, message: "Player deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid player ID" });
  }
};
