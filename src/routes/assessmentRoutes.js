import express from "express";
import {
  submitAssessment,
  getAssessment,
} from "../controllers/assessmentController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/", submitAssessment);
router.get("/", getAssessment);

export default router;
