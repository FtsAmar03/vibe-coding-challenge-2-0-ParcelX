import express from "express";
import User from "../models/User.js";

import {
  registerCoach,
  signup,
  loginCoach,
  createUser,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Tells the frontend whether the coach account already exists
router.get("/status", async (req, res) => {
  try {
    const [coach, scout] = await Promise.all([
      User.exists({ role: "coach" }),
      User.exists({ role: "scout" }),
    ]);
    res.json({ coachRegistered: !!coach, scoutRegistered: !!scout });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/register", registerCoach);
router.post("/signup", signup);
router.post("/login", loginCoach);

// Coach creates scout / player logins
router.post("/users", authMiddleware, roleMiddleware("coach"), createUser);

export default router;
