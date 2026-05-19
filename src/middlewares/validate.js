import { ZodError } from "zod";

export const validate = (schema) => async (req, res, next) => {
  try {
    const validData = await schema.parseAsync(req.body);

    req.body = validData;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorDetails = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Input validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: errorDetails,
        },
      });
    }

    console.error("[Validate Middleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during validation",
    });
  }
};
