import mongoose, { Schema, Document, Model } from "mongoose";
import { ValidationPatterns } from "../middlewares/validation.middleware";

export interface User extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  oauthProvider: string;
  oauthUid: string;
  oauthPicture: string;
  isOauth: boolean;
  passwordResetToken: string;
  activationToken: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type Users = User[];

const emailValidators = [
  {
    // Validator 1: Check if the email is valid.
    validator: function (email: string) {
      return ValidationPatterns.EMAIL.test(email);
    },
    message: (props: any) =>
      `${props.path}:(${props.value}) is not a valid email address.`,
  },
  {
    validator: async function (email: string) {
      // Query the database to see if another user exists with the same email
      const user = await mongoose.models.User.findOne({
        email,
      });
      // Return true if no other user is found, indicating a unique email
      return !user;
    },
    message: (props: any) =>
      `${props.value} is already in use. Please choose a different email.`,
  },
];

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: [3, "The firstName length should not be less than 3"],
      maxLength: [50, "The firstName length should not be over 50"],
    },
    lastName: {
      type: String,
      required: true,
      minLength: [3, "The lastName length should not be less than 3"],
      maxLength: [50, "The lastName length should not be over 50"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      validate: emailValidators,
    },
    password: {
      type: String,
      required: true,
      default: "",
    },
    oauthProvider: {
      type: String,
      required: false,
      default: "",
    },
    oauthUid: {
      type: String,
      required: false,
      index: true,
      default: "",
    },
    oauthPicture: {
      type: String,
      required: false,
      default: "",
    },
    isOauth: {
      type: Boolean,
      required: false,
      default: false,
    },
    passwordResetToken: {
      type: String,
      required: false,
      default: "",
    },
    activationToken: {
      type: String,
      required: false,
      default: "",
    },
    isActive: {
      type: Boolean,
      required: false,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

const UserModel: Model<User> = mongoose.model<User>("User", userSchema);

export default UserModel;
