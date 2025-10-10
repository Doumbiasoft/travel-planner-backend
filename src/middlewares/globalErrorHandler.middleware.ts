import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/apiResponseFormat";
import { logger } from "../utils/logger";
import { HttpStatus } from "../types/httpStatus";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`🔥 ❌ ${req.method} ${req.url} - ${err.message}`, {
    stack: err.stack,
  });
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }
  return sendError(
    res,
    "Unexpected server error",
    HttpStatus.INTERNAL_SERVER_ERROR
  );
};
