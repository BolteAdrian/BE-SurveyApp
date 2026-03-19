import { Pool } from "pg";
import config from "../config";

const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on("connect", () => {
  console.log("Connected to Postgres!");
});

pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// wrapper simplu pentru query
export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;