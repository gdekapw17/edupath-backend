import express from "express";
import { generatePrediction } from "../controllers/recommendationController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/predict", generatePrediction);

export default router;
