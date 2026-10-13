// Login, logout and session lookup, without any Next.js imports so they can be tested
// directly. lib/auth/admin.ts connects them to cookies and headers.
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Db } from "@/db/client";
import type { AuthConfig } from "@/lib/auth/config";
import {
  LOGIN_LIMIT,
  checkRateLimit,
  clearRateLimit,
  pruneRateLimitEvents,
  recordRateLimitEvent,
} from "@/lib/auth/rate-limit";
import {
  type Session,
  createSession,
  deleteExpiredSessions,
  deleteSession,
  findSession,
  readSignedToken,
  signToken,
} from "@/lib/auth/session";

export const loginInputSchema = z.object({
  username: z.string().min(1).max(100),
  // bcrypt reads at most 72 bytes; longer input is refused rather than cut silently.
  password: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});

export type LoginResult =
  | { ok: true; cookieValue: string; expiresAt: Date }
  /** `invalid` covers a wrong username, a wrong password and malformed input alike. */
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "rate_limited"; retryAfterMs: number };

function sameText(a: string, b: string): boolean {
  // Hashing first gives equal lengths, which timingSafeEqual needs.
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

/**
 * Checks the credentials and, if they are right, starts a session.
 * `ip` is the rate-limit key; pass the same fixed value when the address is unknown.
 */
export async function attemptLogin(
  db: Db,
  config: AuthConfig,
  input: { username: unknown; password: unknown; ip: string },
  now = new Date(),
): Promise<LoginResult> {
  const limit = checkRateLimit(db, LOGIN_LIMIT, input.ip, now);
  if (limit.limited) {
    return { ok: false, reason: "rate_limited", retryAfterMs: limit.retryAfterMs };
  }

  const parsed = loginInputSchema.safeParse(input);
  // The password is always checked against the real hash, so a wrong username takes as
  // long as a wrong password.
  const passwordOk = await bcrypt.compare(
    parsed.success ? parsed.data.password : "",
    config.passwordHash,
  );
  const usernameOk = parsed.success && sameText(parsed.data.username, config.username);

  if (!parsed.success || !usernameOk || !passwordOk) {
    recordRateLimitEvent(db, LOGIN_LIMIT, input.ip, now);
    return { ok: false, reason: "invalid" };
  }

  clearRateLimit(db, LOGIN_LIMIT, input.ip);
  // A login is a convenient moment to clear out what has expired.
  deleteExpiredSessions(db, now);
  pruneRateLimitEvents(db, new Date(now.getTime() - LOGIN_LIMIT.windowMs));

  const { token, expiresAt } = createSession(db, config.username, now);
  return { ok: true, cookieValue: signToken(token, config.sessionSecret), expiresAt };
}

/** The session behind a cookie value, or null (bad signature, unknown, expired, logged out). */
export function sessionFromCookie(
  db: Db,
  config: AuthConfig,
  cookieValue: string | undefined,
  now = new Date(),
): Session | null {
  const token = readSignedToken(cookieValue, config.sessionSecret);
  if (!token) return null;
  const session = findSession(db, token, now);
  // A session of a former admin username stops working when the username changes.
  if (!session || session.username !== config.username) return null;
  return session;
}

/** Ends the session on the server. The caller also clears the cookie. */
export function logout(db: Db, config: AuthConfig, cookieValue: string | undefined): void {
  const token = readSignedToken(cookieValue, config.sessionSecret);
  if (token) deleteSession(db, token);
}
