// Opens the SQLite database. Used by the app (through lib/db.ts), by scripts and by
// tests, so it has no Next.js imports and uses relative paths.
import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema.ts";

/** `$client` is the underlying better-sqlite3 connection (for close and backup). */
export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

/**
 * "file:./data/alirezvan.db" or a plain path → absolute file path. ":memory:" is kept
 * as it is (tests).
 */
export function databasePath(url: string): string {
  const value = url.startsWith("file:") ? url.slice("file:".length) : url;
  if (value === ":memory:") return value;
  if (value.trim() === "") throw new Error("DATABASE_URL is empty");
  return path.resolve(process.cwd(), value);
}

export function openDatabase(url: string): Db {
  const file = databasePath(url);
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = new Database(file);
  // WAL lets readers work while a write is in progress; it stays set in the file.
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  // SQLite ignores foreign keys unless each connection asks for them.
  sqlite.pragma("foreign_keys = ON");
  // Wait up to 5 s for another writer instead of failing at once.
  sqlite.pragma("busy_timeout = 5000");

  return drizzle(sqlite, { schema });
}

/** Applies every migration in db/migrations that has not run yet. */
export function runMigrations(db: Db, migrationsFolder = MIGRATIONS_DIR): void {
  migrate(db, { migrationsFolder });
}

/** True for SQLite's "this value must be unique" error, e.g. a taken slug. */
export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  // Drizzle wraps the driver's error; the code is on the cause.
  for (let depth = 0; depth < 5 && current instanceof Error; depth++) {
    const code = (current as { code?: unknown }).code;
    if (code === "SQLITE_CONSTRAINT_UNIQUE" || code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return true;
    }
    current = current.cause;
  }
  return false;
}
