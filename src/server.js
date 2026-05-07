import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pool, { testConnection } from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to EduPath API!",
  });
});

// --- API Routes ---
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/profiles", profileRoutes);

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

startServer();
