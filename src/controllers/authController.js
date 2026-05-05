import bcrypt from "bcrypt";
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
            "Semua kolom (email, password, full_name, school_name) wajib diisi.",
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
    console.error("Kesalahan internal pada proses registrasi:", error);
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
