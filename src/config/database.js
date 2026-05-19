import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err.message);
  process.exit(-1);
});

export const testConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW() AS current_time");
    console.log("Database Connected Successfully at:", res.rows[0].current_time);
  } catch (error) {
    console.error("Database Connection Failed:", error.message);
    process.exit(-1);
  }
};

export const query = (text, params) => pool.query(text, params);
export default pool;
