import { Application } from "express";
import { registerV1Routes } from "./v1";

/**
 * Register all API routes with configurable prefix
 */
export function registerRoutes(
  app: Application,
  apiPrefix: string = "/api"
): void {
  // Register v1 API routes
  registerV1Routes(app, apiPrefix);
}
