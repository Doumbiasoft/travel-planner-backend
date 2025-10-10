import "reflect-metadata";
import app from "./app";
import { ENV } from "./config/env";
import "colors";

app.listen(ENV.PORT, () => {
  console.log(`\nTravel Planner + MongoDB RESTFull API`.bgGreen.white.bold);

  console.log("📚 API Docs:".bold);
  if (ENV.NODE_ENV === "production") {
    console.log("   Scalar UI:".bold, `⚡️ ${ENV.API_BASE_URL}/docs`.cyan);
    console.log("   Swagger UI:".bold, `⚡️ ${ENV.API_BASE_URL}/swagger`.cyan);
  } else {
    console.log(
      `🚀 Server running in ${ENV.NODE_ENV.green} mode on port ${
        ENV.PORT.toString().cyan
      }`.yellow
    );
    console.log(`⚡️ ${ENV.API_BASE_URL}:${ENV.PORT.toString().cyan}`.red);
    console.log(
      "   Scalar UI:".bold,
      `⚡️ ${ENV.API_BASE_URL}:${ENV.PORT.toString().cyan}/docs`.green
    );
    console.log(
      "   Swagger UI:".bold,
      `⚡️ ${ENV.API_BASE_URL}:${ENV.PORT.toString().cyan}/swagger`.green
    );
  }

  console.log(
    `----------------------------------------------------------------`.red
  );
});
