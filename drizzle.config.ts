import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations-folder",
  schema: "./shared-backend/src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
