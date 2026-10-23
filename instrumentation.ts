// Runs once when the Next.js server starts (`next start` or `next dev`).
import { startupWarnings } from "@/lib/auth/startup-check";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  for (const warning of startupWarnings(process.env)) {
    console.warn(`\n[admin] WARNING: ${warning}\n`);
  }
  // The live database sits on a disk the build cannot see (Liara), so pending
  // migrations are applied here, before the first request.
  if (process.env.DATABASE_URL) {
    const { runMigrations } = await import("@/db/client");
    const { getDb } = await import("@/lib/db");
    runMigrations(getDb());
  }
}
