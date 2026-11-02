import User from "../models/User.js";
import Player from "../models/Player.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register the initial Coach
export const registerCoach = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Only one coach for this academy
    const existingCoach = await User.findOne({ role: "coach" });

    if (existingCoach) {
      return res.status(403).json({
        message: "Coach account is already registered",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "coach",
    });

    res.status(201).json({
      message: "Coach registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Coach creates a scout or player login
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, playerId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    if (!["scout", "player"].includes(role)) {
      return res.status(400).json({
        message: "Role must be 'scout' or 'player'",
      });
    }

    if (role === "player") {
      if (!playerId) {
        return res.status(400).json({
          message: "playerId is required for a player login",
        });
      }

      const player = await Player.findById(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const alreadyLinked = await User.findOne({ playerId });
      if (alreadyLinked) {
        return res.status(409).json({
          message: "This player already has a login",
        });
      }
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      playerId: role === "player" ? playerId : null,
    });

    res.status(201).json({
      message: `${role} login created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        playerId: user.playerId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login (coach, scout, player)
export const loginCoach = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        playerId: user.playerId,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
