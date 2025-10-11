import { ClientSession } from "mongoose";
import EmailBoxModel, { EmailBox } from "../models/EmailBox";
import { logger } from "../utils/logger";
import { MailOptions, sendEmail } from "./mailer.service";

const findUnsentEmails = async () => {
  return await EmailBoxModel.find({ sent: false });
};

const deleteEmailsSent = async (session?: ClientSession) => {
  return await EmailBoxModel.deleteMany({ sent: true }, { session });
};

const markAsSent = async (emailId: string, session?: ClientSession) => {
  return await EmailBoxModel.findByIdAndUpdate(
    emailId,
    { sent: true },
    { session }
  );
};

const startTransaction = async () => {
  const session = await EmailBoxModel.db.startSession();
  session.startTransaction();
  return session;
};

const commitTransaction = async (session: ClientSession) => {
  await session.commitTransaction();
  await session.endSession();
};

const abortTransaction = async (session: ClientSession) => {
  await session.abortTransaction();
  await session.endSession();
};

export const saveEmailBox = async (emailBox: EmailBox) => {
  return await EmailBoxModel.create(emailBox);
};

export const saveEmailBoxMany = async (emailBoxes: EmailBox[]) => {
  return await EmailBoxModel.insertMany(emailBoxes);
};

export const handleEmailCron = async () => {
  logger.debug("Checking for unsent emails...");

  const unsentEmails = await findUnsentEmails();

  if (!unsentEmails || unsentEmails.length === 0) {
    logger.debug("No unsent emails found.");
    return;
  }

  try {
    for (const email of unsentEmails) {
      const session = await startTransaction();
      try {
        // Prepare attachments (if any)

        //Prepare Email to be sent
        const data: MailOptions = {
          from: email.from,
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          html: email.content,
          //attachments: [],
        };

        await sendEmail(data);
        // Mark the email as sent
        await markAsSent(email._id.toString(), session);
        // Commit the transaction
        await commitTransaction(session);
        logger.info(`Email sent to ${email.to}`);
      } catch (error: any) {
        // Abort the transaction on error
        await abortTransaction(session);
        logger.error(`Failed to send email to ${email.to}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error("Error while sending emails:", error);
  }
};

export const handleDeleteEmailsSentCron = async () => {
  logger.debug("Checking for sent emails to delete...");
  const session = await startTransaction();
  try {
    await deleteEmailsSent(session);
    // Commit the transaction
    await commitTransaction(session);
    logger.info(`Emails sent deleted successfully`);
  } catch (e: any) {
    await abortTransaction(session);
    logger.error(`Failed to delete Emails sent: ${e.message}`);
  }
};
