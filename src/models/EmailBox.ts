import mongoose, { Schema, Document, Model } from "mongoose";

interface EmailAddress {
  name: string;
  email: string;
}
interface Attachment {
  filename: string;
  path?: string; // file path on disk
  content?: Buffer | string; // inline file content
  contentType?: string; // optional MIME type
}

export interface EmailBox extends Document {
  _id: string;
  from?: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  subject: string;
  content: string;
  attachments?: Attachment[];
  sent?: boolean;
}

const emailBoxSchema = new Schema(
  {
    from: {
      type: {
        name: { type: String, require: true },
        email: { type: String, require: true },
      },
      require: false,
    },
    to: {
      type: [
        {
          name: { type: String, require: true },
          email: { type: String, require: true },
        },
      ],
      require: true,
    },
    cc: {
      type: [
        {
          name: { type: String, require: true },
          email: { type: String, require: true },
        },
      ],
      require: false,
    },
    bcc: {
      type: [
        {
          name: { type: String, require: true },
          email: { type: String, require: true },
        },
      ],
      require: false,
    },
    subject: { type: String, require: true },
    content: { type: String, require: true },
    attachments: {
      type: [
        {
          filename: { type: String, require: true },
          path: { type: String, require: false },
          content: { type: String, require: false },
          contentType: { type: String, require: false },
        },
      ],
      require: false,
    },
    sent: { type: Boolean, require: true, default: false },
  },
  { timestamps: true }
);

const EmailBoxModel: Model<EmailBox> = mongoose.model<EmailBox>(
  "EmailBox",
  emailBoxSchema
);

export default EmailBoxModel;
