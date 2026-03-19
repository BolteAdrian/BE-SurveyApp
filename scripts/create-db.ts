import { Pool } from "pg";
import config from "../src/config";

async function createDB() {
  const { host, port, user, password, name } = config.database;

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database: "postgres",//temporary connection to default db to create our app db
  });

  const exists = await pool.query(`SELECT 1 FROM pg_database WHERE datname='${name}'`);
  if (exists.rowCount === 0) {
    await pool.query(`CREATE DATABASE "${name}"`);
    console.log(`Database "${name}" created!`);
  } else {
    console.log(`Database "${name}" already exists.`);
  }

  await pool.end();
}

createDB().catch((err) => {
  console.error("Error creating DB:", err);
  process.exit(1);
});