// Used only by `npm run db:generate`, which compares db/schema.ts with the migrations
// already written and adds a new one. It never touches a database; `npm run db:migrate`
// (scripts/migrate.ts) applies migrations.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./db/migrations",
});
