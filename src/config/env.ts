import dotenv from "dotenv";
import { TrigonometryExpressionOperator } from "mongoose";
dotenv.config();

interface Env {
  NODE_ENV: string;
  PORT: number;
  API_BASE_URL: string;
  CLIENT_URL: string;
  MONGO_URI: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_TLS: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  MAIL_FROM: string;
  MAIL_FROM_NAME: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  AMADEUS_KEY: string;
  AMADEUS_SECRET: string;
  AMADEUS_MODE: string;
  CONTACT_NAME: string;
  AMADEUS_PROD_KEY: string;
  AMADEUS_PROD_SECRET: string;
  CONTACT_EMAIl: string;
}

export const ENV: Env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  PORT: Number(process.env.PORT) || 3001,
  MONGO_URI: process.env.MONGO_URI || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 0,
  SMTP_TLS: Boolean(process.env.SMTP_TLS),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  AMADEUS_KEY: process.env.AMADEUS_KEY || "",
  AMADEUS_SECRET: process.env.AMADEUS_SECRET || "",
  AMADEUS_PROD_KEY: process.env.AMADEUS_PROD_KEY || "",
  AMADEUS_PROD_SECRET: process.env.AMADEUS_PROD_SECRET || "",
  AMADEUS_MODE: process.env.AMADEUS_MODE || "test",
  CONTACT_NAME: process.env.CONTACT_NAME || "Mouhamed Doumbia",
  CONTACT_EMAIl: process.env.CONTACT_EMAIl || "doumbiasoft@gmail.com",
};
