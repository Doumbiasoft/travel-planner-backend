import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/globalErrorHandler.middleware";
import { setupDynamicOpenAPI } from "./utils/openAPIDocsGenerator";
import "reflect-metadata";
import connectDB from "./db/mongodb-config";
import { ENV } from "./config/env";
import { saveEmailBox } from "./services/mailbox.service";
import { EmailBox } from "./models/EmailBox";
import { HttpStatus } from "./types/httpStatus";
import { sendResponse } from "./utils/apiResponseFormat";
import { readTemplateContent } from "./utils/emailTemplateReader";
import { ACCOUNT_ACTIVATION_TEMPLATE } from "./utils/constantEmailTemplatesNames";
import { createAttachment } from "./utils/fileAttachmentHelper";

connectDB();
const app = express();

/** Middlewares */
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);
app.use(compression());
app.use(morgan("dev"));

/** Routes */

app.post("/api/test-email", async (_req, res) => {
  let template: string = await readTemplateContent(ACCOUNT_ACTIVATION_TEMPLATE);

  template = template.replace("%Name%", "Mouhamed");

  const email: Partial<EmailBox> = {
    to: { name: "Mouhamed Doumbia", email: "doumbiasoft@gmail.com" },
    subject: "🎉 Account Activation !",
    content: template,
    attachments: [
      createAttachment(
        "https://drive.google.com/file/d/1BCvYejxBztBgiC7O77Rzg5f7wRyyZK0G/view?usp=sharing",
        "Mouhamed-Resume"
      ),
      createAttachment(
        "https://helios-i.mashable.com/imagery/videos/0239WPrU0dBqySr0dTv8Q0h/hero-image.fill.size_1248x702.v1753118514.jpg",
        "Predator"
      ),
    ],
  };

  await saveEmailBox(email);
  return sendResponse(res, email, "Email Saved!", HttpStatus.CREATED);
});
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
