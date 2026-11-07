import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import playerRoutes from "./routes/playerRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { roleMiddleware } from "./middleware/roleMiddleware.js";

const app = express();

// CORS — allow your Vercel frontend domain + localhost for dev
const allowedOrigins = [
  "http://localhost:1234",
  "http://localhost:3000",
  "https://vibe-coding-challenge-2-0-parcel-x-five.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// ── Health check — NO DB needed, always works ─────────────────────────────
// Visit /api/health on Vercel to verify the function is running
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    academy: "Dumka Sports Academy",
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV || "not set",
    },
    timestamp: new Date().toISOString(),
  });
});

// ── DB connection middleware — runs before all API routes ─────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB middleware error:", err.message);
    res.status(500).json({
      message: "Database connection failed",
      detail: err.message,           // shows exact MongoDB error in response
    });
  }
});

// Coach dashboard route
app.get(
  "/api/coach-dashboard",
  authMiddleware,
  roleMiddleware("coach"),
  (req, res) => {
    res.json({ message: "Welcome to Coach Dashboard" });
  }
);

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/matches", matchRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── LOCAL DEV: start the server normally ─────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// ── VERCEL: export the Express app as the serverless handler ─────────────
export default app;
