import express from "express";
import {
  generatePrediction,
  getRecommendationDetail,
} from "../controllers/recommendationController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/predict", generatePrediction);
router.get("/:id", getRecommendationDetail);

export default router;
