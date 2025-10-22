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
let checkingPrices = false;

export const setupCronJobs = () => {
  cron.schedule(CronExpression.everyFiveSeconds(), async () => {
    if (sendingEmails) {
      logger.warn("Send Email skipped: previous job still running");
      return;
    }
    sendingEmails = true;
    try {
      await handleEmailCron();
    } catch (error: any) {
      logger.error("Send Email cron job failed:", error.message);
    } finally {
      sendingEmails = false;
    }
  });

  cron.schedule(CronExpression.everyWeekdayAt9AM(), async () => {
    if (deletingEmails) {
      logger.warn("Delete Old Email skipped: previous job still running");
      return;
    }
    deletingEmails = true;
    try {
      await handleDeleteEmailsSentCron();
    } catch (error: any) {
      logger.error("Delete Old Email cron job failed:", error.message);
    } finally {
      deletingEmails = false;
    }
  });
  cron.schedule(CronExpression.everySixHours(), async () => {
    if (checkingPrices) {
      logger.warn("Price checker skipped: previous job still running");
      return;
    }
    checkingPrices = true;
    try {
      await checkPricesForAllTrips();
    } catch (error: any) {
      logger.error("Price checker cron job failed:", error.message);
    } finally {
      checkingPrices = false;
    }
  });
};
