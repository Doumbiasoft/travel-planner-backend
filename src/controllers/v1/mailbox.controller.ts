import { Request, Response } from "express";
import { sendResponse, sendError } from "../../utils/apiResponseFormat";
import { Router, Post, Use, Req, Res } from "@reflet/express";
import { HttpStatus } from "../../types/httpStatus";
import { validateBody } from "../../middlewares/validation.middleware";
import { logRequest } from "../../middlewares/logging.middleware";
import { endpointMetadata } from "../../middlewares/endpointMetadata.middleware";
import { buildRoute } from "../../config/apiPrefix";
import authMiddleware from "../../middlewares/auth.middleware";
import { saveEmailBox } from "../../services/mailbox.service";
import { readEmailTemplateContent } from "../../utils/emailTemplateReader";
import { findUserById } from "../../services/user.service";
import { CONTACT_US_EMAIL_TEMPLATE } from "../../utils/constantEmailTemplatesNames";
import { ENV } from "../../config/env";
import { createAttachments } from "../../utils/fileAttachmentHelper";

@Router(buildRoute("v1/mailbox"))
class MailboxController {
  @Post()
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Create an email message",
      description: "Allow a user to send an email",
    }),
    validateBody({
      rules: [
        {
          field: "subject",
          required: true,
          type: "string",
        },
        {
          field: "content",
          required: true,
          type: "string",
        },
        {
          field: "filePaths",
          required: false,
          type: "array",
        },
      ],
    }),
    logRequest()
  )
  async createEmail(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }

    const { subject, content, filePaths } = req.body;

    try {
      if (!subject || !content)
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      let attachments: any = [];
      if (filePaths && !Array.isArray(filePaths)) {
        return sendError(
          res,
          "filePaths must be an array of file path",
          HttpStatus.BAD_REQUEST
        );
      }
      if (filePaths && filePaths.length > 0) {
        attachments = createAttachments(filePaths);
      }

      const user = await findUserById(req.user?._id!);
      if (!user) return sendError(res, "Not found", HttpStatus.NOT_FOUND);

      let template: any = await readEmailTemplateContent(
        CONTACT_US_EMAIL_TEMPLATE
      );
      template = template
        .replace("%firstName%", `${user.firstName}`)
        .replace("%lastName%", `${user.lastName}`)
        .replace("%email%", `${user.email}`)
        .replace("%Message%", `${content}`)
        .replace(
          "%Link%",
          `mailto:${user.email}?subject=Re: ${subject}&body=Dear ${
            user.firstName.split(" ")[0]
          },`
        );

      await saveEmailBox({
        to: { name: ENV.CONTACT_EMAIl, email: ENV.CONTACT_EMAIl },
        subject,
        content: template,
        attachments: attachments,
      });
      return sendResponse(
        res,
        { ok: true },
        "Email sent successfully",
        HttpStatus.CREATED
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }
}

export { MailboxController };
