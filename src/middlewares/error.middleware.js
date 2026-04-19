import { ApiError } from "../utils/ApiErrors.js";

/*
    ERROR RESPONSE CONTRACT: {
        success: boolean,
        statusCode: number,
        message: string,
        errors: array,
        data: null
    }
*/

const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, "Route not found: " + req.originalUrl));
};

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";
  const errors = Array.isArray(err?.errors) ? err.errors : [];

  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `Invalid ${err.path}`,
      errors: [err.message],
      data: null,
    });
  }

  if (err?.code === 11000){
    const duplicateField = Object.keys(err?.keyPattern || {})[0] || "resource";
        return res.status(409).json({
        success: false,
        statusCode: 409,
        message: `${duplicateField} already exists.`,
        errors: [err.message],
        data: null
    });
  }

  if (err?.name === "ValidationError"){
    const validationErrors = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
    success: false,
    statusCode: 400,
    message: "Validation failed",
    errors: validationErrors,
    data: null,
  });
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    data: null,
  });
};

export { notFoundHandler, errorHandler };
