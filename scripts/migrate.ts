// Applies pending migrations from db/migrations to the database in DATABASE_URL.
// Run: npm run db:migrate (reads .env.local the same way Next.js does).
import nextEnv from "@next/env";
import { databasePath, openDatabase, runMigrations } from "../db/client.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
  info: () => {},
  error: console.error,
});

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

runMigrations(openDatabase(url));
console.log(`Migrations applied: ${databasePath(url)}`);
