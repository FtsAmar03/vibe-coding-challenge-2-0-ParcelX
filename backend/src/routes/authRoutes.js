import express from "express";

import {
  registerCoach,
  loginCoach,
  createUser,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", registerCoach);
router.post("/login", loginCoach);

// Coach creates scout / player logins
router.post("/users", authMiddleware, roleMiddleware("coach"), createUser);

export default router;
