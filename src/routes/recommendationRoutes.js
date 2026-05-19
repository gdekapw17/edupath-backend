import express from "express";
import {
  generatePrediction,
  getRecommendationDetail,
} from "../controllers/recommendationController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { aiPredictionLimiter } from "../middlewares/rateLimiter.js";
import { predictRecommendationSchema } from "../validations/assessmentValidation.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

router.use(authenticateToken);
router.post(
  "/predict",
  aiPredictionLimiter,
  validate(predictRecommendationSchema),
  generatePrediction
);
router.get("/:id", getRecommendationDetail);

export default router;
