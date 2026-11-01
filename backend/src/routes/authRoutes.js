import express from "express";

import { registerCoach, loginCoach } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerCoach);
router.post("/login", loginCoach);

export default router;
