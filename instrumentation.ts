// Runs once when the Next.js server starts (`next start` or `next dev`).
import { startupWarnings } from "@/lib/auth/startup-check";

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  for (const warning of startupWarnings(process.env)) {
    console.warn(`\n[admin] WARNING: ${warning}\n`);
  }
}
