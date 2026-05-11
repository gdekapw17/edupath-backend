import pool from "../config/database.js";

/**
 * Memicu proses prediksi karier menggunakan Mock AI Service.
 * Endpoint: POST /recommendations/predict
 */
export const saveRecommendation = async (assessmentId, aiData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertRecSql = `
      INSERT INTO recommendations (assessment_id, ai_summary, cognitive_profile, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING recommendation_id, assessment_id, created_at
    `;

    const recResult = await client.query(insertRecSql, [
      assessmentId,
      aiData.ai_summary,
      JSON.stringify(aiData.cognitive_profile),
    ]);

    const newRecommendation = recResult.rows[0];

    const recommendationId = newRecommendation.recommendation_id;

    const insertCareerSql = `
      INSERT INTO recommendation_careers (recommendation_id, career_id, match_rank, confidence_score)
      VALUES ($1, $2, $3, $4)
    `;

    for (const match of aiData.career_matches) {
      await client.query(insertCareerSql, [
        recommendationId,
        match.career_id,
        match.match_rank,
        match.confidence_score,
      ]);
    }

    await client.query("COMMIT");

    return newRecommendation;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

/**
 * Mengambil detail rekomendasi berdasarkan ID.
 * Melakukan JOIN antara tabel recommendations, recommendation_careers, dan careers.
 *
 * @param {string} reccomendationId - ID rekomendasi
 * @returns {object|null} - Objek detail rekomendasi atau null jika tidak ditemukan
 */
export const getRecommendationById = async (recommendationId) => {
  const sql = `
   SELECT 
      r.recommendation_id, 
      r.assessment_id, 
      r.ai_summary, 
      r.cognitive_profile, 
      r.created_at,
      rc.career_id, 
      c.career_name, 
      c.category, 
      c.description,
      rc.match_rank, 
      rc.confidence_score,
      (
        SELECT json_agg(
          json_build_object(
            'major_id', m.major_id, 
            'major_name', m.major_name,
            'faculty', m.faculty
          )
        )
        FROM career_majors cm
        JOIN majors m ON cm.major_id = m.major_id
        WHERE cm.career_id = c.career_id
      ) AS related_majors
    FROM recommendations r
    JOIN recommendation_careers rc ON r.recommendation_id = rc.recommendation_id
    JOIN careers c ON rc.career_id = c.career_id
    WHERE r.recommendation_id = $1
    ORDER BY rc.match_rank ASC
  `;

  const result = await pool.query(sql, [recommendationId]);

  const parentData = result.rows[0];

  const formattedResponse = {
    recommendation_id: parentData.recommendation_id,
    assessment_id: parentData.assessment_id,
    ai_summary: parentData.ai_summary,
    cognitive_profile: parentData.cognitive_profile,
    created_at: parentData.created_at,
    career_matches: result.rows.map((row) => ({
      career_id: row.career_id,
      career_name: row.career_name,
      category: row.category,
      description: row.description,
      match_rank: row.match_rank,
      confidence_score: row.confidence_score,
      related_majors: row.related_majors || [],
    })),
  };

  return formattedResponse;
};
