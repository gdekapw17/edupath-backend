import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { query } from "./config/database.js";

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

// Tes koneksi basis data sederhana sebelum server sepenuhnya berjalan
query("SELECT NOW() AS current_time_db")
  .then((result) => {
    console.log(`Database Time: ${result.rows[0].current_time_db}`);

    app.listen(PORT, () => {
      console.log(`The server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database. Server is stopped.", err);
  });
