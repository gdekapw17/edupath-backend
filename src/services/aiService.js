/**
 * Layanan integrasi AI untuk aplikasi Edupath.
 * Mengirimkan data akademik dan kebiasaan siswa ke layanan Machine Learning (FastAPI)
 * untuk mendapatkan prediksi kelompok karier yang paling sesuai.
 *
 * @param {Object} studentData - Objek yang berisi data profil dan metrik akademik siswa.
 * @returns {Promise<object>} - Hasil kategori karier dan probabilitasnya.
 */
export const predictCareer = async (studentData) => {
  try {
    const payload = {
      math_score: studentData.mathScore || 0,
      physics_score: studentData.physicsScore || 0,
      chemistry_score: studentData.chemistryScore || 0,
      biology_score: studentData.biologyScore || 0,
      history_score: studentData.historyScore || 0,
      english_score: studentData.englishScore || 0,
      geography_score: studentData.geographyScore || 0,
      weekly_self_study_hours: studentData.weeklyStudyHours || 0,
      absence_days: studentData.absenceDays || 0,
      science_avg: studentData.scienceAvg || 0,
      social_avg: studentData.socialAvg || 0,
      overall_score: studentData.overallScore || 0,
      pt: studentData.partTimeJob ? 1 : 0,
      ec: studentData.extracurricular ? 1 : 0,
    };

    const mlApiUrl =
      process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/predict";

    const mlResponse = await fetch(mlApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!mlResponse.ok) {
      throw new Error(
        `Failed to connect to ML Service. Status: ${mlResponse.status}`
      );
    }

    const mlData = await mlResponse.json();

    return {
      top_category: mlData.top_group,
      confidence_score: mlData.confidence,
      all_recommendations: mlData.recommendations,
    };
  } catch (error) {
    console.error("AI Service Integration Error,", error.message);
    throw error;
  }
};
