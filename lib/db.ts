// The app's one database connection. Server only: import it from Server Components,
// Server Actions and Route Handlers, never from a Client Component.
import "server-only";
import { openDatabase, type Db } from "@/db/client";

// `next dev` reloads modules on every edit; keeping the connection on globalThis stops
// it from opening the file again each time.
const holder = globalThis as typeof globalThis & { __alirezvanDb?: Db };

export function getDb(): Db {
  if (!holder.__alirezvanDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
    holder.__alirezvanDb = openDatabase(url);
  }
  return holder.__alirezvanDb;
}

export type { Db };
