import pool from "../config/database.js";

/**
 * Menyimpan data asesmen baru dan memperbarui status pengguna.
 * Menggunakan Database Transaction (BEGIN ... COMMIT/ROLLBACK) untuk konsistensi data.
 *
 * @param {string} userId - UUID pengguna
 * @param {object} rawData - Objek JSON berisi academic_scores dan behavioral_metrics
 * @returns {object} - Mengembalikan data asesmen yang baru dibuat
 */
export const createAssessment = async (userId, rawData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertAssessmentSql = `
      INSERT INTO assessments (user_id, raw_data, created_at)
      VALUES ($1, $2, NOW())
      RETURNING assessment_id, user_id, created_at
    `;

    const assessmentResult = await client.query(insertAssessmentSql, [
      userId,
      rawData,
    ]);

    const newAssessment = assessmentResult.rows[0];

    const updateUserSql = `
      UPDATE users 
      SET is_assessment_completed = true 
      WHERE user_id = $1
    `;

    await client.query(updateUserSql, [userId]);

    await client.query("COMMIT");

    return newAssessment;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

/**
 * Mengambil riwayat asesmen pengguna.
 *
 * @param {string} userId - UUID pengguna
 * @returns {Array} - Daftar riwayat asesmen
 */
export const getAssessmentHistory = async (userId) => {
  const sql = `
    SELECT assessment_id, created_at
    FROM assessments
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(sql, [userId]);

  return result.rows;
};
