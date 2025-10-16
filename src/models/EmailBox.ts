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
        name: { type: String, required: true },
        email: { type: String, required: true },
      },
      require: false,
    },
    to: {
      type: [
        {
          name: { type: String, required: true },
          email: { type: String, required: true },
        },
      ],
      require: true,
    },
    cc: {
      type: [
        {
          name: { type: String, required: true },
          email: { type: String, required: true },
        },
      ],
      require: false,
    },
    bcc: {
      type: [
        {
          name: { type: String, required: true },
          email: { type: String, required: true },
        },
      ],
      require: false,
    },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    attachments: {
      type: [
        {
          filename: { type: String, required: true },
          path: { type: String, required: false },
          content: { type: String, required: false },
          contentType: { type: String, required: false },
        },
      ],
      require: false,
    },
    sent: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const EmailBoxModel: Model<EmailBox> = mongoose.model<EmailBox>(
  "EmailBox",
  emailBoxSchema
);

export default EmailBoxModel;
