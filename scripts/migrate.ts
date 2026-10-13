// Applies pending migrations from db/migrations to the database in DATABASE_URL.
// Run: npm run db:migrate (reads .env.local the same way Next.js does).
import { runMigrations } from "../db/client.ts";
import { openScriptDatabase } from "./open-db.ts";

const { db, file } = openScriptDatabase();
runMigrations(db);
console.log(`Migrations applied: ${file}`);
