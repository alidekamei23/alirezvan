// Database-backed sessions. The browser holds a random token in a signed cookie; the
// database holds the token's hash and the expiry. Deleting the row ends the session at
// once, whatever the browser still has.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { eq, lte } from "drizzle-orm";
import type { Db } from "@/db/client";
import { sessions } from "@/db/schema";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type Session = { username: string; expiresAt: Date };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function signature(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("base64url");
}

/** Cookie value for a token: "<token>.<signature>". */
export function signToken(token: string, secret: string): string {
  return `${token}.${signature(token, secret)}`;
}

/** The token from a cookie value, or null if the signature is missing or wrong. */
export function readSignedToken(value: string | undefined, secret: string): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const token = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(signature(token, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return token;
}

/** Starts a new session and returns its token (to be signed and put in the cookie). */
export function createSession(
  db: Db,
  username: string,
  now = new Date(),
): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  db.insert(sessions).values({ id: hashToken(token), username, createdAt: now, expiresAt }).run();
  return { token, expiresAt };
}

/** The live session for a token, or null. An expired session is deleted on sight. */
export function findSession(db: Db, token: string, now = new Date()): Session | null {
  const id = hashToken(token);
  const row = db.select().from(sessions).where(eq(sessions.id, id)).get();
  if (!row) return null;
  if (row.expiresAt.getTime() <= now.getTime()) {
    db.delete(sessions).where(eq(sessions.id, id)).run();
    return null;
  }
  return { username: row.username, expiresAt: row.expiresAt };
}

export function deleteSession(db: Db, token: string): void {
  db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
}

/** Housekeeping: removes sessions that have run out. Returns how many. */
export function deleteExpiredSessions(db: Db, now = new Date()): number {
  return db.delete(sessions).where(lte(sessions.expiresAt, now)).run().changes;
}

/** Logs every browser out (use after changing the admin password). */
export function deleteAllSessions(db: Db): number {
  return db.delete(sessions).run().changes;
}
