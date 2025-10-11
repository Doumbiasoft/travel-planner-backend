import cron from "node-cron";
import { logger } from "../utils/logger";
import { CronExpression } from "./CronExpression";
//import { sendEmail } from "../services/mailer.service";
// import { ENV } from "../config/env";

export const setupCronJobs = () => {
  cron.schedule(CronExpression.everyFiveSeconds(), () => {
    logger.info("⏱ Runs every 5 seconds");
    // await sendEmail({
    //   from: { name: ENV.MAIL_FROM_NAME, email: ENV.MAIL_FROM },
    //   to: { name: "Mouhamed", email: "doumbiasoft@gmail.com" },
    //   subject: "🎉 Testing My Node API email !",
    //   html: "<h1>Hi Mouhamed,</h1><p>Thanks for your patience 🚀</p>",
    // });
  });

  cron.schedule(CronExpression.everyFiveMinutes(), async () => {
    logger.info("⏰ Runs every 5 minute");
  });
};
