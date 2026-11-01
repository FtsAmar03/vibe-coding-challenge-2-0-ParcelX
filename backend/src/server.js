import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import playerRoutes from "./routes/playerRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB Atlas
connectDB();

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    academy: "Dumka Sports Academy",
    desk: "Active",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/matches", matchRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
