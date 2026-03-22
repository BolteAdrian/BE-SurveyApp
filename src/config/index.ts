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
}

const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT) || 5432;
const dbName = process.env.DB_NAME || "surveyapp";

const dbUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
const config: Config = {
  port: Number(process.env.PORT) || 4000,
  frontendURL: frontendURL,
  database: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    name: dbName,
    url: dbUrl,
  },
  jwtSecret: process.env.JWT_SECRET || "supersecretkey",
  defaultLang: process.env.DEFAULT_LANG || "en",};

export default config;