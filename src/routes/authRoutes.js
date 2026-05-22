import express from "express";
import {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/refresh", refreshTokenUser);
router.post("/logout", logoutUser);

export default router;
