import { predictCareer } from "../services/aiService.js";
import {
  saveRecommendation,
  getRecommendationById,
  getAssessmentById,
  getRecommendationByAssessmentId,
} from "../models/recommendationModel.js";
import redisClient from "../config/redis.js";
import { v4 as uuidv4 } from "uuid";

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

    const existingRec = await getRecommendationByAssessmentId(assessment_id);

    if (existingRec) {
      return res.status(200).json({
        success: true,
        message: "Prediction already exists for this assessment",
        data: {
          recommendation_id: existingRec.recommendation_id,
        },
      });
    }

    const studentData = await getAssessmentById(assessment_id);

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Assessment data not found",
        data: null,
        error: {
          code: "NOT_FOUND",
          details: "No assessment record matches the provided ID.",
        },
      });
    }

    const aiPrediction = await predictCareer(studentData);

    const recommendationId = uuidv4();

    const result = await saveRecommendation(
      recommendationId,
      assessment_id,
      aiPrediction
    );

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

    const cacheKey = `recommendation:${id}`;

    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log(`[REDIS] Cache Hit for key:${cacheKey}`);

      return res.status(200).json({
        success: true,
        message: "Recommendation details retrieved successfully (from cache)",
        data: JSON.parse(cachedData),
      });
    }

    console.log(
      `[REDIS] Cache Miss for key: ${cacheKey}. Fetching from Database...`
    );

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

    await redisClient.setEx(cacheKey, 86400, JSON.stringify(recommendation));

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
