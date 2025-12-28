import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/main/api/infra/db/migrations",
  schema: "./src/main/api/infra/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data.db",
  },
});
