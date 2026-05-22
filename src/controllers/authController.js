import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  findUserByEmail,
  createUser,
  getUserById,
} from "../models/userModel.js";
import {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
} from "../models/tokenModel.js";

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

    const userId = uuidv4();

    const newUser = await createUser({
      userId,
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

    const accessExpiresInSeconds = 900;
    const refreshExpiresInDays = 7;

    const accessToken = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: accessExpiresInSeconds }
    );

    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: `${refreshExpiresInDays}d` }
    );

    const tokenId = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

    await saveRefreshToken(tokenId, user.user_id, refreshToken, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: refreshExpiresInDays * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        access_token: accessToken,
        expires_in: accessExpiresInSeconds,
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

/**
 * Memperbarui Access Token menggunakan Refresh Token.
 * Memvalidasi token dari cookie, memeriksa masa aktif di database, dan menerbitkan access token baru.
 *
 * @param {object} req - Objek request Express yang berisi req.cookies
 * @param {object} res - Objek response Express
 */
export const refreshTokenUser = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        data: null,
        error: {
          code: "MISSING_REFRESH_TOKEN",
          details: "No refresh token provided in cookies.",
        },
      });
    }

    const currentToken = cookies.refreshToken;

    const dbToken = await findRefreshToken(currentToken);
    if (!dbToken) {
      return res.status(403).json({
        success: false,
        message: "Authentication failed",
        data: null,
        error: {
          code: "INVALID_REFRESH_TOKEN",
          details: "The provided refresh token is invalid or has been revoked.",
        },
      });
    }

    if (new Date() > new Date(dbToken.expires_at)) {
      await deleteRefreshToken(currentToken);
      return res.status(403).json({
        success: false,
        message: "Authentication failed",
        data: null,
        error: {
          code: "EXPIRED_REFRESH_TOKEN",
          details: "The refresh token has expired. Please login again.",
        },
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(currentToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(403).json({
        success: false,
        message: "Authentication failed",
        data: null,
        error: {
          code: "TOKEN_VERIFICATION_FAILED",
          details: "Failed to verify the refresh token signature.",
        },
      });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Authentication failed",
        data: null,
        error: {
          code: "USER_NOT_FOUND",
          details: "User associated with this token does not exist.",
        },
      });
    }

    const accessExpiresInSeconds = 900;
    const newAccessToken = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: accessExpiresInSeconds }
    );

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        access_token: newAccessToken,
        expires_in: accessExpiresInSeconds,
      },
      error: null,
    });
  } catch (error) {
    console.error("Internal error in the token refresh process,", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        details: error.message,
      },
    });
  }
};

/**
 * Menghapus Refresh Token dari database (Logout).
 * Membersihkan catatan token aktif di pangkalan data dan menghapus cookie pada client-side.
 *
 * @param {object} req - Objek request Express yang berisi req.cookies
 * @param {object} res - Objek response Express
 */
export const logoutUser = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      return res.status(204).json({
        success: true,
        message: "No session to terminate",
        data: null,
        error: null,
      });
    }

    const currentToken = cookies.refreshToken;

    await deleteRefreshToken(currentToken);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
      data: null,
      error: null,
    });
  } catch (error) {
    console.error("Internal error in the logout process,", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        details: error.message,
      },
    });
  }
};
