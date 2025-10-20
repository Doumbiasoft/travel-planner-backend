import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/globalErrorHandler.middleware";
import { setupDynamicOpenAPI } from "./utils/openAPIDocsGenerator";
import "reflect-metadata";
import connectDB from "./db/mongodb-config";
import { registerRoutes } from "./routes";
import { ENV } from "./config/env";

connectDB();
const app = express();

/** Middlewares */
app.use(express.json());
app.use(cookieParser());
app.use(
  cors(/*{
    origin: ENV.CLIENT_URL,
    credentials: true,
  }*/)
);
app.use(compression());
app.use(morgan("dev"));

/** Routes */
registerRoutes(app, "/api");

/** Initialize OpenAPI Documentation with @reflet */
async function setupApp() {
  // Setup OpenAPI endpoints with fully dynamic controller discovery
  await setupDynamicOpenAPI(app, {
    specPath: "/api-docs",
    docsPath: "/docs", // Scalar UI (modern, clean)
    swaggerPath: "/swagger", // Swagger UI (traditional, feature-rich)
    enableSwagger: true, // Enable Swagger UI
    enableScalar: true, // Enable Scalar UI
  });

  // Global error handler (⚡ must be last)
  app.use(errorHandler);
  return app;
}

// Initialize the app
setupApp().catch(console.error);

export default app;
