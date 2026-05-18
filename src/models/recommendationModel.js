import pool from "../config/database.js";

/**
 * Mengambil data mentah asesmen siswa untuk dikirim ke AI.
 */
export const getAssessmentById = async (assessmentId) => {
  const sql = `SELECT * FROM assessments WHERE assessment_id = $1`;
  const result = await pool.query(sql, [assessmentId]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];

  return {
    mathScore: row.math_score,
    physicsScore: row.physics_score,
    chemistryScore: row.chemistry_score,
    biologyScore: row.biology_score,
    historyScore: row.history_score,
    englishScore: row.english_score,
    geographyScore: row.geography_score,
    weeklyStudyHours: row.weekly_self_study_hours,
    absenceDays: row.absence_days,
    scienceAvg: row.science_avg,
    socialAvg: row.social_avg,
    overallScore: row.overall_score,
    partTimeJob: row.part_time_job,
    extracurricular: row.extracurricular,
  };
};

/**
 * Memicu proses prediksi karier menggunakan Mock AI Service.
 * Endpoint: POST /recommendations/predict
 */
export const saveRecommendation = async (assessmentId, aiData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertRecSql = `
      INSERT INTO recommendations (assessment_id, ai_summary, ai_explanation, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING recommendation_id, assessment_id, created_at
    `;

    const summaryText = `Berdasarkan analisis AI, kamu memiliki potensi besar di bidang ${aiData.top_category}, diikuti oleh ${aiData.all_recommendations[1].group} dan ${aiData.all_recommendations[2].group}.`;

    const recResult = await client.query(insertRecSql, [
      assessmentId,
      summaryText,
      aiData.explanation,
    ]);

    const newRecommendation = recResult.rows[0];

    const recommendationId = newRecommendation.recommendation_id;

    const insertCareerSql = `
      INSERT INTO recommendation_careers (recommendation_id, career_id, match_rank, confidence_score)
      VALUES ($1, $2, $3, $4)
    `;

    for (const aiRec of aiData.all_recommendations) {
      const careersQuery = await client.query(
        `SELECT career_id FROM careers WHERE category = $1`,
        [aiRec.group]
      );

      for (let j = 0; j < careersQuery.rows.length; j++) {
        const career = careersQuery.rows[j];

        const globalRank = (aiRec.rank - 1) * 2 + (j + 1);

        await client.query(insertCareerSql, [
          recommendationId,
          career.career_id,
          globalRank,
          aiRec.probability,
        ]);
      }
    }

    await client.query("COMMIT");

    return { recommendation_id: recommendationId, ...newRecommendation };
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
      r.ai_explanation,
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
    ai_explanation: parentData.ai_explanation,
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
