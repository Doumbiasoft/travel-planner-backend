import cron from "node-cron";
import { logger } from "../utils/logger";
import { CronExpression } from "./CronExpression";
import {
  handleDeleteEmailsSentCron,
  handleEmailCron,
} from "../services/mailbox.service";
import { checkPricesForAllTrips } from "../services/priceChecker.service";

let sendingEmails = false;
let deletingEmails = false;

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
    deletingEmails = true;
    try {
      await handleDeleteEmailsSentCron();
    } catch (error) {
    } finally {
      deletingEmails = false;
    }
  });
  cron.schedule(CronExpression.everySixHours(), async () => {
    try {
      await checkPricesForAllTrips();
    } catch (error: any) {
      logger.error("Price checker cron job failed:", error.message);
    }
  });
};
