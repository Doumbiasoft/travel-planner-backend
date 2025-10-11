import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { HttpStatus } from "../types/httpStatus";
import { sendError } from "../utils/apiResponseFormat";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: string | jwt.JwtPayload;
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token) return sendError(res, "No token", HttpStatus.UNAUTHORIZED);
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return sendError(res, "Invalid token", HttpStatus.UNAUTHORIZED);
  }
};
export default authMiddleware;
