// Shared start of the maintenance scripts: loads .env.local the way Next.js does and
// opens the database in DATABASE_URL.
import nextEnv from "@next/env";
import { databasePath, openDatabase, type Db } from "../db/client.ts";

export function openScriptDatabase(): { db: Db; file: string } {
  nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
    info: () => {},
    error: console.error,
  });

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  return { db: openDatabase(url), file: databasePath(url) };
}
