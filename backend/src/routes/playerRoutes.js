import express from "express";
import {
  createPlayer,
  getAllPlayers,
  getReadyPlayers,
  getMyRow,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} from "../controllers/playerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Specific paths must come before "/:id"
router.get("/ready", roleMiddleware("coach", "scout"), getReadyPlayers);
router.get("/me", roleMiddleware("player"), getMyRow);

router.get("/", roleMiddleware("coach"), getAllPlayers);
router.post("/", roleMiddleware("coach"), createPlayer);
router.get("/:id", roleMiddleware("coach"), getPlayerById);
router.put("/:id", roleMiddleware("coach"), updatePlayer);
router.delete("/:id", roleMiddleware("coach"), deletePlayer);

export default router;
