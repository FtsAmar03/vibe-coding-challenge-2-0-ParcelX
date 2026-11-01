import Session from "../models/Session.js";

// 1. Create Practice Session
export const createSession = async (req, res) => {
  try {
    const { date, sport, notes } = req.body;

    if (!date || !sport) {
      return res.status(400).json({
        success: false,
        message: "Date and sport are required",
      });
    }

    const session = await Session.create({
      date,
      sport,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Practice session created successfully",
      session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get All Practice Sessions
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({
      date: -1,
    });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get Single Practice Session
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid session ID",
    });
  }
};
