import jwt from "jsonwebtoken";

/**
 * Middleware untuk memverifikasi Token JWT pada rute privat.
 * Mengecek keberadaan header Authorization, memvalidasi token,
 * membedakan antara token kadaluwarsa dan tidak valid,
 * serta menyematkan data payload (userId) ke dalam objek request.
 *
 * @param {object} req - Objek request Express
 * @param {object} res - Objek response Express
 * @param {function} next - Fungsi untuk melanjutkan ke middleware/controller berikutnya
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
      data: null,
      error: {
        code: "UNAUTHORIZED",
        details: "Access token is missing.",
      },
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
          data: null,
          error: {
            code: "TOKEN_EXPIRED",
            details: "Access token has expired. Please refresh the token.",
          },
        });
      }

      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
        data: null,
        error: {
          code: "INVALID_TOKEN",
          details: "Access token is invalid.",
        },
      });
    }

    req.user = decodedUser;
    next();
  });
};
