import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import pool, { testConnection } from "./config/database.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//--- Security Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to EduPath API!",
  });
});

//--- Global Limiter ---
app.use("/api", generalLimiter);

// --- API Routes ---
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/profiles", profileRoutes);

app.use("/api/v1/assessments", assessmentRoutes);

app.use("/api/v1/recommendations", recommendationRoutes);

app.use("/api/v1/careers", masterRoutes);

// --- Server Initialization ---
const startServer = async () => {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    const shutdown = () => {
      console.log("\nShutting down gracefully...");
      server.close(() => {
        console.log("HTTP server closed.");
        pool.end(() => {
          console.log("Database pool connections closed.");
          process.exit(0);
        });
      });

      setTimeout(() => {
        console.error("Forcing shutdown due to timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch {
    console.error(
      "Failed to start server due to database initialization error."
    );
    process.exit(1);
  }
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
