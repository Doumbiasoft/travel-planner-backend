import cron from "node-cron";
import { logger } from "../utils/logger";
import { CronExpression } from "./CronExpression";
import {
  handleDeleteEmailsSentCron,
  handleEmailCron,
} from "../services/mailbox.service";

let sendingEmails = false;

export const setupCronJobs = () => {
  cron.schedule(CronExpression.everyFiveSeconds(), async () => {
    if (sendingEmails) {
      logger.warn("Cron skipped: previous job still running");
      return;
    }
    sendingEmails = true;
    try {
      await handleEmailCron();
    } catch (error) {
    } finally {
      sendingEmails = false;
    }
  });

  cron.schedule(CronExpression.everyWeekdayAt9AM(), async () => {
    await handleDeleteEmailsSentCron();
  });
};
