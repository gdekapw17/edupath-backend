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
