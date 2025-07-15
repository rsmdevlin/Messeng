import dotenv from "dotenv";
dotenv.config();

import { config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",  // исправленный путь к схеме
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies config;
