import rateLimit from "express-rate-limit";

/**
 * Limiter khusus untuk endpoint AI /predict.
 * Aturan: Maksimal 10 request per 15 menit dari 1 IP yang sama.
 */
export const aiPredictionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Terlalu banyak permintaan prediksi.",
    data: null,
    error: {
      code: "TOO_MANY_REQUESTS",
      details:
        "The system has detected too many requests from your IP. Please try again after 15 minute",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter umum untuk endpoint lainnya.
 * Aturan: Maksimal 100 request per 15 menit per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests to the server. Please try again later.",
  },
});
