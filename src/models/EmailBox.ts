import mongoose, { Schema, Document, Model } from "mongoose";

export interface EmailBox extends Document {
  _id: string;
  to: [{ name: string; address: string }];
  subject: string;
  content: string;
  attachments?: [
    {
      _id: string;
      filename: string;
      path: string;
      contentType?: string;
    }
  ];
  sent?: boolean;
}

const emailBoxSchema = new Schema(
  {
    to: {
      type: [
        {
          name: { type: String, require: true },
          address: { type: String, require: true },
        },
      ],
      require: true,
    },
    subject: { type: String, require: true },
    content: { type: String, require: true },
    attachments: {
      type: [
        {
          filename: { type: String, require: true },
          path: { type: String, require: true },
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
