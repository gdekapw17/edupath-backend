import { mockPredictCareer } from "../services/aiService.js";
import {
  saveRecommendation,
  getRecommendationById,
} from "../models/recommendationModel.js";

export const generatePrediction = async (req, res) => {
  try {
    const { assessment_id } = req.body;

    if (!assessment_id) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: "The 'assessment_id' field is required.",
        },
      });
    }

    const aiPrediction = await mockPredictCareer(assessment_id);

    const result = await saveRecommendation(assessment_id, aiPrediction);

    return res.status(200).json({
      success: true,
      message: "Prediction generated successfully",
      data: {
        recommendation_id: result.recommendation_id,
        assessment_id: result.assessment_id,
        status: "completed",
        created_at: result.created_at,
      },
    });
  } catch (error) {
    console.error("Error on generatePrediction,", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details: "An unexpected error occurred during prediction.",
      },
    });
  }
};

/**
 * Mengambil detail hasil prediksi karier berdasarkan ID.
 * Endpoint: GET /recommendations/:id
 */
export const getRecommendationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await getRecommendationById(id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
        data: null,
        error: {
          code: "NOT_FOUND",
          details: "No recommendation record matches the provided ID.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recommendation detail retrieved successfully",
      data: recommendation,
    });
  } catch (error) {
    console.error("Error on getRecommendationDetail,", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details:
          "An unexpected error occurred while fetching the recommendation.",
      },
    });
  }
};
