import { describe, expect, it } from "vitest";
import { sessions } from "@/db/schema";
import {
  SESSION_TTL_MS,
  createSession,
  credentialFingerprint,
  deleteAllSessions,
  deleteExpiredSessions,
  deleteSession,
  findSession,
  readSignedToken,
  signToken,
} from "@/lib/auth/session";
import { DAY, MINUTE, testDb } from "./helpers";

const OWNER = { username: "modir", fingerprint: "f".repeat(16) };
const SECRET = "s".repeat(40);
const now = new Date("2026-10-13T08:00:00Z");
const later = (ms: number) => new Date(now.getTime() + ms);

describe("signed cookie value", () => {
  it("round-trips a token", () => {
    expect(readSignedToken(signToken("abc", SECRET), SECRET)).toBe("abc");
  });

  it("rejects a missing, unsigned, altered or foreign-signed value", () => {
    const value = signToken("abc", SECRET);
    expect(readSignedToken(undefined, SECRET)).toBeNull();
    expect(readSignedToken("", SECRET)).toBeNull();
    expect(readSignedToken("abc", SECRET)).toBeNull();
    expect(readSignedToken("abc.", SECRET)).toBeNull();
    expect(readSignedToken(value.replace("abc", "abd"), SECRET)).toBeNull();
    expect(readSignedToken(`${value}x`, SECRET)).toBeNull();
    expect(readSignedToken(signToken("abc", "other-secret"), SECRET)).toBeNull();
  });
});

describe("credential fingerprint", () => {
  it("is short, stable and different for different hashes", () => {
    const a = credentialFingerprint("$2b$12$" + "a".repeat(53));
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(credentialFingerprint("$2b$12$" + "a".repeat(53))).toBe(a);
    expect(credentialFingerprint("$2b$12$" + "b".repeat(53))).not.toBe(a);
  });
});

describe("sessions", () => {
  it("creates a session that lasts seven days", async () => {
    const db = testDb();
    const { token, expiresAt } = await createSession(db, OWNER, now);
    expect(expiresAt.getTime() - now.getTime()).toBe(SESSION_TTL_MS);
    expect(SESSION_TTL_MS).toBe(7 * DAY);
    expect(await findSession(db, token, later(7 * DAY - MINUTE))).toMatchObject(OWNER);
  });

  it("gives every login its own token and never stores the token itself", async () => {
    const db = testDb();
    const first = await createSession(db, OWNER, now);
    const second = await createSession(db, OWNER, now);
    expect(first.token).not.toBe(second.token);
    const ids = db
      .select()
      .from(sessions)
      .all()
      .map((row) => row.id);
    expect(ids).toHaveLength(2);
    expect(ids).not.toContain(first.token);
  });

  it("does not accept an expired session and deletes it", async () => {
    const db = testDb();
    const { token } = await createSession(db, OWNER, now);
    expect(await findSession(db, token, later(7 * DAY))).toBeNull();
    expect(db.select().from(sessions).all()).toHaveLength(0);
  });

  it("does not accept an unknown token", async () => {
    expect(await findSession(testDb(), "nope", now)).toBeNull();
  });

  it("ends a session when its row is deleted (logout or revocation)", async () => {
    const db = testDb();
    const kept = await createSession(db, OWNER, now);
    const ended = await createSession(db, OWNER, now);
    await deleteSession(db, ended.token);
    expect(await findSession(db, ended.token, now)).toBeNull();
    expect(await findSession(db, kept.token, now)).not.toBeNull();

    expect(await deleteAllSessions(db)).toBe(1);
    expect(await findSession(db, kept.token, now)).toBeNull();
  });

  it("cleans up expired sessions only", async () => {
    const db = testDb();
    await createSession(db, OWNER, now);
    const fresh = await createSession(db, OWNER, later(DAY));
    expect(await deleteExpiredSessions(db, later(7 * DAY))).toBe(1);
    expect(await findSession(db, fresh.token, later(7 * DAY))).not.toBeNull();
  });
});
