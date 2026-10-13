import { describe, expect, it } from "vitest";
import { sessions } from "@/db/schema";
import {
  SESSION_TTL_MS,
  createSession,
  deleteAllSessions,
  deleteExpiredSessions,
  deleteSession,
  findSession,
  readSignedToken,
  signToken,
} from "@/lib/auth/session";
import { DAY, MINUTE, testDb } from "./helpers";

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

describe("sessions", () => {
  it("creates a session that lasts seven days", () => {
    const db = testDb();
    const { token, expiresAt } = createSession(db, "modir", now);
    expect(expiresAt.getTime() - now.getTime()).toBe(SESSION_TTL_MS);
    expect(SESSION_TTL_MS).toBe(7 * DAY);
    expect(findSession(db, token, later(7 * DAY - MINUTE))?.username).toBe("modir");
  });

  it("gives every login its own token and never stores the token itself", () => {
    const db = testDb();
    const first = createSession(db, "modir", now);
    const second = createSession(db, "modir", now);
    expect(first.token).not.toBe(second.token);
    const ids = db
      .select()
      .from(sessions)
      .all()
      .map((row) => row.id);
    expect(ids).toHaveLength(2);
    expect(ids).not.toContain(first.token);
  });

  it("does not accept an expired session and deletes it", () => {
    const db = testDb();
    const { token } = createSession(db, "modir", now);
    expect(findSession(db, token, later(7 * DAY))).toBeNull();
    expect(db.select().from(sessions).all()).toHaveLength(0);
  });

  it("does not accept an unknown token", () => {
    expect(findSession(testDb(), "nope", now)).toBeNull();
  });

  it("ends a session when its row is deleted (logout or revocation)", () => {
    const db = testDb();
    const kept = createSession(db, "modir", now);
    const ended = createSession(db, "modir", now);
    deleteSession(db, ended.token);
    expect(findSession(db, ended.token, now)).toBeNull();
    expect(findSession(db, kept.token, now)).not.toBeNull();

    expect(deleteAllSessions(db)).toBe(1);
    expect(findSession(db, kept.token, now)).toBeNull();
  });

  it("cleans up expired sessions only", () => {
    const db = testDb();
    createSession(db, "modir", now);
    const fresh = createSession(db, "modir", later(DAY));
    expect(deleteExpiredSessions(db, later(7 * DAY))).toBe(1);
    expect(findSession(db, fresh.token, later(7 * DAY))).not.toBeNull();
  });
});
