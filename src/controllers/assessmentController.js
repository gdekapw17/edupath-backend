import {
  createAssessment,
  getAssessmentHistory,
} from "../models/assessmentModel.js";

/**
 * Helper function: Memvalidasi rentang nilai akademik (0 - 100).
 * Mengembalikan nama mata pelajaran pertama yang nilainya tidak valid,
 * atau null jika semuanya lolos validasi.
 */
const validateScores = (scores) => {
  for (const category in scores) {
    for (const subject in scores[category]) {
      const value = scores[category][subject];

      if (typeof value !== "number" || value < 0 || value > 100) {
        return subject;
      }
    }
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
    const { academic_scores, behavioral_metrics } = req.body;

    if (!academic_scores || !behavioral_metrics) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details:
            "The 'academic_scores' and 'behavioral_metrics' fields are required.",
        },
      });
    }

    const invalidSubject = validateScores(academic_scores);

    if (invalidSubject) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "OUT_OF_RANGE",
          details: `Academic scores must be between 0 and 100. Invalid value found in '${invalidSubject}'.`,
        },
      });
    }

    const rawData = { academic_scores, behavioral_metrics };

    const newAssessment = await createAssessment(userId, rawData);

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
