// Clears the failed-login counter for every address, so a locked-out admin can log in
// again at once. Run: npm run unlock-login (on the machine that holds the database).
import { LOGIN_LIMIT, clearRateLimitScope } from "../lib/auth/rate-limit.ts";
import { openScriptDatabase } from "./open-db.ts";

const { db, file } = openScriptDatabase();
const removed = await clearRateLimitScope(db, LOGIN_LIMIT);
console.log(`Login unlocked: ${removed} failed attempt(s) forgotten in ${file}`);
