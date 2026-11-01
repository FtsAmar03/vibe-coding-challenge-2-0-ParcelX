import Player from "../models/Player.js";

// 1. Create Player
export const createPlayer = async (req, res) => {
  try {
    const { name, age, sport, position, academy, phone } = req.body;

    if (!name || !age || !sport) {
      return res.status(400).json({
        message: "Name, age and sport are required",
      });
    }

    const player = await Player.create({
      name,
      age,
      sport,
      position,
      academy,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "Player added successfully",
      player,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get All Players
export const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: players.length,
      players,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get Single Player
export const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.status(200).json({
      success: true,
      player,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update Player
export const updatePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Player updated successfully",
      player,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Delete Player
export const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Player deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
