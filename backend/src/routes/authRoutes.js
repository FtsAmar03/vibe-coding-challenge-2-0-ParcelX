import express from "express";

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
    // Any number of coaches and scouts can sign up, so nothing is ever "claimed"
    res.json({ coachRegistered: false, scoutRegistered: false });
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
