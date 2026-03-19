import { defineConfig } from "prisma/config";
import config from "./src/config";

export default defineConfig({
  datasource: {
    url: config.database.url,
  },
});