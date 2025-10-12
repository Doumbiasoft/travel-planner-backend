import { JwtPayload } from "jsonwebtoken";

/**
 * Custom JWT Payload interface
 * Defines the structure of the JWT token payload used in the application
 */
export interface CustomJwtPayload extends JwtPayload {
  _id: string;
}

/**
 * Extend Express Request interface to include user property
 * This makes req.user available with proper typing throughout the application
 */
declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload;
    }
  }
}
