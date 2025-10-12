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
import { readEmailTemplateContent } from "./utils/emailTemplateReader";
import { ACCOUNT_ACTIVATION_TEMPLATE } from "./utils/constantEmailTemplatesNames";
import { createAttachment } from "./utils/fileAttachmentHelper";

connectDB();
const app = express();

/** Middlewares */
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(compression());
app.use(morgan("dev"));

/** Routes */

app.post("/api/test-email", async (_req, res) => {
  let template: any = await readEmailTemplateContent(
    ACCOUNT_ACTIVATION_TEMPLATE
  );

  template = template.replaceAll("%Name%", "Mouhamed");

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
      createAttachment(
        "https://fikia-dev.s3.eu-north-1.amazonaws.com/0e6b2880-28d0-4b3e-93c8-d08c1c777992-IMG_4841.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2UC26QRHEXWVQRYL%2F20251011%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20251011T224226Z&X-Amz-Expires=604800&X-Amz-Signature=fa8fb4f5631707b3e6716f7622d08b9afbff03983ddb10d3e4b09ce712414607&X-Amz-SignedHeaders=host",
        "Chat Image"
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
