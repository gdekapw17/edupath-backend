import express from "express";
import {
  submitAssessment,
  getAssessment,
  getAssessmentDetail,
} from "../controllers/assessmentController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createAssessmentSchema } from "../validations/assessmentValidation.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/", validate(createAssessmentSchema), submitAssessment);
router.get("/", getAssessment);
router.get("/:id", getAssessmentDetail);

export default router;
