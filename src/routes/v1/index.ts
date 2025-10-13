import { Application } from "express";
import { register } from "@reflet/express";
import { setApiPrefix } from "../../config/apiPrefix";
import { AuthController } from "../../controllers/v1/auth.controller";
import { TripController } from "../../controllers/v1/trip.controller";

/**
 * Register all v1 API controllers with dynamic prefix
 */
export function registerV1Routes(app: Application, apiPrefix: string): void {
  // Set the API prefix before register routes
  setApiPrefix(apiPrefix);
  register(app, [AuthController, TripController]);
}
