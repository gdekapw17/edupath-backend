import { query } from "../config/database.js";

/**
 * Mengambil daftar seluruh karier beserta kategorinya.
 */
export const getAllCareers = async () => {
  const sql = `SELECT career_id, career_name, category FROM careers ORDER BY career_id ASC`;
  const result = await query(sql);
  return result.rows;
};
