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

// CORS — allow all frontend domains (localhost, Vercel production & preview URLs)
app.use(
  cors({
    origin: true, // Dynamically allows the requesting origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Log incoming requests for easy debugging in Vercel runtime logs
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// ── Root & Health check — NO DB needed, always works ──────────────────────
const healthHandler = (req, res) => {
  res.json({
    status: "ok",
    message: "Dumka Sports Academy API is running live",
    academy: "Dumka Sports Academy",
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV || "not set",
    },
    timestamp: new Date().toISOString(),
  });
};

app.get("/", healthHandler);
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

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
const coachHandler = (req, res) => {
  res.json({ message: "Welcome to Coach Dashboard" });
};
app.get("/api/coach-dashboard", authMiddleware, roleMiddleware("coach"), coachHandler);
app.get("/coach-dashboard", authMiddleware, roleMiddleware("coach"), coachHandler);

// Mount Routes (support both /api/* and root paths /*)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/players", playerRoutes);
app.use("/players", playerRoutes);

app.use("/api/sessions", sessionRoutes);
app.use("/sessions", sessionRoutes);

app.use("/api/matches", matchRoutes);
app.use("/matches", matchRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    requestedPath: req.url,
    availableRoutes: [
      "/api/health",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/status",
      "/api/players",
      "/api/sessions",
      "/api/matches",
    ],
  });
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
