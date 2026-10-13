// Ends every admin session: each browser must log in again. Use it when a session
// cookie may have leaked. Run: npm run revoke-sessions (on the machine that holds the
// database). A password change does this by itself.
import { deleteAllSessions } from "../lib/auth/session.ts";
import { openScriptDatabase } from "./open-db.ts";

const { db, file } = openScriptDatabase();
const removed = await deleteAllSessions(db);
console.log(`Sessions revoked: ${removed} session(s) ended in ${file}`);
