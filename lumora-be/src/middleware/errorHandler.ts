import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Centralized error handler middleware.
 * Converts all errors into a consistent JSON response format.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${statusCode} - ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}

/**
 * Helper to create a standardized AppError
 */
export function createError(
  message: string,
  statusCode = 500,
  code?: string
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
