import dotenv from "dotenv";
dotenv.config();

import { config } from "drizzle-kit";

export default {
  schema: "./server/schema.ts",  // путь к твоей схеме
  out: "./migrations",
  driver: "pg",
  dialect: "postgresql",   // вот сюда обязательно укажи dialect
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies config;
