import {
  createAssessment,
  getAssessmentHistory,
  getAssessmentDetailById,
} from "../models/assessmentModel.js";

/**
 * Helper function: Memvalidasi rentang nilai akademik (0 - 100).
 * Mengembalikan nama mata pelajaran pertama yang nilainya tidak valid,
 * atau null jika semuanya lolos validasi.
 */
const validateMetrics = (data) => {
  const scoreFields = [
    "math_score",
    "physics_score",
    "chemistry_score",
    "biology_score",
    "history_score",
    "english_score",
    "geography_score",
  ];

  for (const field of scoreFields) {
    const value = data[field];
    if (typeof value !== "number" || value < 0 || value > 100) {
      return `The value of ${field} must be a number between 0 and 100.`;
    }
  }

  if (
    typeof data.weekly_self_study_hours !== "number" ||
    data.weekly_self_study_hours < 0
  ) {
    return "Self-study hours must be a positive number.";
  }
  if (typeof data.absence_days !== "number" || data.absence_days < 0) {
    return "The number of days absent must be a positive number.";
  }

  if (
    typeof data.part_time_job !== "boolean" ||
    typeof data.extracurricular !== "boolean"
  ) {
    return "Part_time_job and extracurricular status must be true or false.";
  }

  return null;
};

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

    if (math_score === undefined || weekly_self_study_hours === undefined) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details:
            "Make sure all 14 metric fields (math_score to extracurricular) are sent in the request.",
        },
      });
    }

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

    const validationError = validateMetrics(inputData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: validationError,
        },
      });
    }

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
