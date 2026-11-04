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

// Public sign up for coach, scout and player
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, age, sport } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    if (!["coach", "scout", "player"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Only one coach and one scout can sign up
    if (role === "coach" || role === "scout") {
      const existingRole = await User.findOne({ role });
      if (existingRole) {
        return res.status(403).json({
          message: `${role === "coach" ? "Coach" : "Scout"} account is already registered`,
        });
      }
    }

    // A player must already be on the roster the coach built
    let playerId = null;
    if (role === "player") {
      if (!age || !sport) {
        return res.status(400).json({
          message: "Age and sport are required for a player sign up",
        });
      }

      const linkedIds = await User.find({
        role: "player",
        playerId: { $ne: null },
      }).distinct("playerId");

      const player = await Player.findOne({
        name: new RegExp(`^${escapeRegex(name.trim())}$`, "i"),
        sport: new RegExp(`^${escapeRegex(String(sport).trim())}$`, "i"),
        age: Number(age),
        _id: { $nin: linkedIds },
      });

      if (!player) {
        return res.status(404).json({
          message:
            "No matching player found. Ask your coach to add you first, and use the same name, age and sport. If you already signed up, just log in.",
        });
      }

      playerId = player._id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      role,
      playerId,
    });

    res.status(201).json({
      message: "Account created successfully",
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
