import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    url: string;
  };
  jwtSecret: string;
  defaultLang: string;
  frontendURL: string;
  backendURL: string;
  mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
}

const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT) || 5432;
const dbName = process.env.DB_NAME || "surveyapp";

const dbUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
const backendURL = process.env.BACKEND_URL || "http://localhost:4000";


const config: Config = {
  port: Number(process.env.PORT) || 4000,
  frontendURL: frontendURL,
  backendURL: backendURL,
  database: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    name: dbName,
    url: dbUrl,
  },
  jwtSecret: process.env.JWT_SECRET || "supersecretkey",
  defaultLang: process.env.DEFAULT_LANG || "en",
  mail: {
    host: process.env.MAIL_HOST || "smtp.mail.yahoo.com",
    port: Number(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_SECURE === "true", 
    user: process.env.MAIL_USER || "",
    pass: process.env.MAIL_PASS || "",
    from: process.env.MAIL_FROM || `"SurveyApp" <${process.env.MAIL_USER}>`,
  },
};

export default config;
