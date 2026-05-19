import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from "../models/userModel.js";

/**
 * Mendaftarkan pengguna baru (Register).
 * Menerima payload dari request body, mengenkripsi password, dan menyimpan data ke database.
 *
 * @param {object} req - Objek request Express yang berisi req.body
 * @param {object} res - Objek response Express
 */
export const registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      full_name: fullName,
      school_name: schoolName,
    } = req.body;

    if (!email || !password || !fullName || !schoolName) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details:
            "All fields (email, password, full_name, school_name) must be filled in.",
        },
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Registration failed",
        data: null,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          details: "The email provided is already registered in the system.",
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      email,
      passwordHash,
      fullName,
      schoolName,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user_id: newUser.user_id,
        email: newUser.email,
        full_name: newUser.full_name,
        school_name: newUser.school_name,
        created_at: newUser.created_at,
      },
      error: null,
    });
  } catch (error) {
    console.error("Internal error in the registration process,", error);
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
 * Mengautentikasi pengguna dan menerbitkan Token JWT (Login).
 * Menerima email dan password, memverifikasi hash, dan mengembalikan token.
 *
 * @param {object} req - Objek request Express yang berisi req.body
 * @param {object} res - Objek response Express
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: "Email and password are required.",
        },
      });
    }

    const user = await findUserByEmail(email);
    // console.log(user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        data: null,
        error: {
          code: "INVALID_CREDENTIALS",
          details: "Invalid email or password.",
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        data: null,
        error: {
          code: "INVALID_CREDENTIALS",
          details: "Invalid email or password.",
        },
      });
    }

    const expiresInSecond = 86400;

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: expiresInSecond }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        access_token: token,
        expires_in: expiresInSecond,
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("Internal error in the login process,", error);
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
