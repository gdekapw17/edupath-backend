import {
  createAssessment,
  getAssessmentHistory,
  getAssessmentDetailById,
} from "../models/assessmentModel.js";

/**
 * Menyimpan data asesmen akademik dan perilaku siswa.
 * Endpoint: POST /assessments
 */
export const submitAssessment = async (req, res) => {
  try {
    const { userId } = req.user;

    const {
      math_score,
      physics_score,
      chemistry_score,
      biology_score,
      history_score,
      english_score,
      geography_score,
      weekly_self_study_hours,
      absence_days,
      part_time_job,
      extracurricular,
    } = req.body;

    const inputData = {
      math_score,
      physics_score,
      chemistry_score,
      biology_score,
      history_score,
      english_score,
      geography_score,
      weekly_self_study_hours,
      absence_days,
      part_time_job,
      extracurricular,
    };

    const science_avg = Number(
      ((physics_score + chemistry_score + biology_score) / 3).toFixed(2)
    );

    const social_avg = Number(
      ((history_score + geography_score) / 2).toFixed(2)
    );

    const overall_score = Number(
      (
        (math_score +
          physics_score +
          chemistry_score +
          biology_score +
          history_score +
          english_score +
          geography_score) /
        7
      ).toFixed(2)
    );

    const finalAssessmentData = {
      ...inputData,
      science_avg,
      social_avg,
      overall_score,
    };

    const newAssessment = await createAssessment(userId, finalAssessmentData);

    return res.status(201).json({
      success: true,
      message: "Assessment data submitted successfully",
      data: {
        assessment_id: newAssessment.assessment_id,
        user_id: newAssessment.user_id,
        created_at: newAssessment.created_at,
      },
    });
  } catch (error) {
    console.error("Error on submitAssessment,", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details: "An unexpected error occurred on the server.",
      },
    });
  }
};

/**
 * Mengambil riwayat asesmen pengguna.
 * Endpoint: GET /assessments
 */
export const getAssessment = async (req, res) => {
  try {
    const { userId } = req.user;

    const history = await getAssessmentHistory(userId);

    const formattedHistory = history.map((item) => ({
      assessment_id: item.assessment_id,
      created_at: item.created_at,
      status: "processed",
    }));

    return res.status(200).json({
      success: true,
      message: "Assessment history retrieved successfully",
      data: formattedHistory,
    });
  } catch (error) {
    console.error("Error on getAssessments,", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details: "An unexpected error occurred on the server.",
      },
    });
  }
};

/**
 * Mengambil detail data asesmen spesifik untuk keperluan visualisasi Frontend.
 * Endpoint: GET /assessments/:id
 */
export const getAssessmentDetail = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const detail = await getAssessmentDetailById(id, userId);

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Assessment detail not found",
        data: null,
        error: {
          code: "NOT_FOUND",
          details: "No assessment record matches the provided ID for this user.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment detail retrieved successfully",
      data: detail,
    });
  } catch (error) {
    console.error("Error on getAssessmentDetail,", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details: "An unexpected error occurred.",
      },
    });
  }
};
