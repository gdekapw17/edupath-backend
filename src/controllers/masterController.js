import { getAllCareers } from "../models/masterModel.js";

/**
 * Mengambil data karir yang tersedia.
 */
export const getCareers = async (req, res) => {
  try {
    const careers = await getAllCareers();

    return res.status(200).json({
      success: true,
      message: "Career catalog retrieved successfully",
      data: careers,
    });
  } catch (error) {
    console.error("Error on getCareers,", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "SERVER_ERROR",
        details: "An unexpected error occurred while fetching master data.",
      },
    });
  }
};
