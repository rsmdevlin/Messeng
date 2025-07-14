import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema.ts', // укажи здесь файл со схемой таблиц (описан на TypeScript)
  out: './drizzle', // куда будут сохраняться миграции
  driver: 'pg',  // драйвер Postgres
  dbCredentials: {
    connectionString: process.env.DATABASE_URL, // укажи переменную окружения с твоей БД
  },
});
