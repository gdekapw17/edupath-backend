import pool from "../config/database.js";

/**
 * Menyimpan data asesmen baru dan memperbarui status pengguna.
 * Menggunakan Database Transaction (BEGIN ... COMMIT/ROLLBACK) untuk konsistensi data.
 *
 * @param {string} userId - UUID pengguna
 * @param {object} rawData - Objek JSON berisi academic_scores dan behavioral_metrics
 * @returns {object} - Mengembalikan data asesmen yang baru dibuat
 */
export const createAssessment = async (userId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertAssessmentSql = `
    INSERT INTO assessments (
        assessment_id, user_id, math_score, physics_score, chemistry_score, biology_score, 
        history_score, english_score, geography_score, 
        weekly_self_study_hours, absence_days, 
        science_avg, social_avg, overall_score, 
        part_time_job, extracurricular, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING assessment_id, user_id, created_at
    `;

    const values = [
      data.assessment_id,
      userId,
      data.math_score,
      data.physics_score,
      data.chemistry_score,
      data.biology_score,
      data.history_score,
      data.english_score,
      data.geography_score,
      data.weekly_self_study_hours,
      data.absence_days,
      data.science_avg,
      data.social_avg,
      data.overall_score,
      data.part_time_job,
      data.extracurricular,
    ];

    const assessmentResult = await client.query(insertAssessmentSql, values);

    const newAssessment = assessmentResult.rows[0];

    const updateUserSql = `
      UPDATE users 
      SET is_assessment_completed = true 
      WHERE user_id = $1
    `;

    await client.query(updateUserSql, [userId]);

    await client.query("COMMIT");

    const cacheKey = `assessments_history:${userId}`;
    await redisClient.del(cacheKey);

    return newAssessment;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

/**
 * Mengambil detail asesmen lengkap berdasarkan ID.
 */
export const getAssessmentDetailById = async (assessmentId, userId) => {
  const sql = `
    SELECT *
    FROM assessments
    WHERE assessment_id = $1 AND user_id = $2
  `;
  const result = await pool.query(sql, [assessmentId, userId]);
  return result.rows[0];
};

/**
 * Mengambil riwayat asesmen pengguna beserta hasil rekomendasi karir utamanya.
 */
export const getAssessmentHistoryByUserId = async (userId) => {
  const sql = `
    SELECT 
        a.assessment_id,
        a.created_at,
        r.recommendation_id,
        c.career_name AS top_career,
        rc.confidence_score
    FROM assessments a
    LEFT JOIN recommendations r 
        ON a.assessment_id = r.assessment_id
    LEFT JOIN recommendation_careers rc 
        ON r.recommendation_id = rc.recommendation_id AND rc.match_rank = 1
    LEFT JOIN careers c 
        ON rc.career_id = c.career_id
    WHERE a.user_id = $1
    ORDER BY a.created_at DESC
  `;

  const result = await pool.query(sql, [userId]);
  return result.rows;
};
