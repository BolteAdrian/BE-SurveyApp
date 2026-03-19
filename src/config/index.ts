import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  defaultLang: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/surveyapp",
  jwtSecret: process.env.JWT_SECRET || "supersecretkey",
  defaultLang: process.env.DEFAULT_LANG || "en",
};

export default config;