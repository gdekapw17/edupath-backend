import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/me", getProfile);
router.put("/me", updateProfile);

export default router;
