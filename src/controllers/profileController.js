import { getUserById, updateUserProfile } from "../models/userModel.js";
import redisClient from "../config/redis.js";

/**
 * Mengambil data profil pengguna yang sedang login.
 * Menggunakan userId yang disematkan oleh authMiddleware ke dalam req.user.
 *
 * @param {object} req - Objek request Express
 * @param {object} res - Objek response Express
 */
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const cacheKey = `profile:${userId}`;

    const cachedProfile = await redisClient.get(cacheKey);

    if (cachedProfile) {
      return res.status(200).json({
        success: true,
        message: "Profile retrieved successfully (from cache)",
        data: JSON.parse(cachedProfile),
        error: null,
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
        error: {
          code: "USER_NOT_FOUND",
          details: "User profile not found in the system.",
        },
      });
    }

    const profileData = {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      school_name: user.school_name,
      is_assessment_completed: user.is_assessment_completed,
    };

    await redisClient.set(cacheKey, JSON.stringify(profileData), {
      EX: 7200,
    });

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        school_name: user.school_name,
        is_assessment_completed: user.is_assessment_completed,
      },
      error: null,
    });
  } catch (error) {
    console.error("Error on getProfile,", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details: "an error occurred while retrieving the profile.",
      },
    });
  }
};

/**
 * Memperbarui informasi profil pengguna.
 * Menerima full_name dan school_name dari body request.
 *
 * @param {object} req - Objek request Express
 * @param {object} res - Objek response Express
 */
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const { full_name: fullName, school_name: schoolName } = req.body;

    if (!fullName || !schoolName) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: "The 'full_name' and 'school_name' fields cannot be empty.",
        },
      });
    }

    const updatedUser = await updateUserProfile(userId, {
      fullName,
      schoolName,
    });

    const cacheKey = `profile:${userId}`;
    await redisClient.del(cacheKey);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user_id: updatedUser.user_id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        school_name: updatedUser.school_name,
        updated_at: new Date().toISOString(),
      },
      error: null,
    });
  } catch (error) {
    console.error("Error on updateProfile,", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details: "An error occurred while updating the profile.",
      },
    });
  }
};
