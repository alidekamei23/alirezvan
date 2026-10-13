import { describe, expect, it } from "vitest";
import {
  LOGIN_LIMIT,
  checkRateLimit,
  clearRateLimit,
  pruneRateLimitEvents,
  recordRateLimitEvent,
} from "@/lib/auth/rate-limit";
import { MINUTE, testDb } from "./helpers";

const now = new Date("2026-10-13T08:00:00Z");
const at = (minutes: number) => new Date(now.getTime() + minutes * MINUTE);

describe("rate limit", () => {
  it("is 5 failed logins per 15 minutes", () => {
    expect(LOGIN_LIMIT).toEqual({ scope: "login", max: 5, windowMs: 15 * MINUTE });
  });

  it("limits after the fifth event and says how long to wait", () => {
    const db = testDb();
    for (let i = 0; i < 4; i++) recordRateLimitEvent(db, LOGIN_LIMIT, "1.1.1.1", at(i));
    expect(checkRateLimit(db, LOGIN_LIMIT, "1.1.1.1", at(4)).limited).toBe(false);
    recordRateLimitEvent(db, LOGIN_LIMIT, "1.1.1.1", at(4));
    expect(checkRateLimit(db, LOGIN_LIMIT, "1.1.1.1", at(5))).toEqual({
      limited: true,
      retryAfterMs: 10 * MINUTE,
    });
  });

  it("frees up as events leave the window", () => {
    const db = testDb();
    for (let i = 0; i < 5; i++) recordRateLimitEvent(db, LOGIN_LIMIT, "1.1.1.1", at(i));
    expect(checkRateLimit(db, LOGIN_LIMIT, "1.1.1.1", at(14)).limited).toBe(true);
    expect(checkRateLimit(db, LOGIN_LIMIT, "1.1.1.1", at(15)).limited).toBe(false);
  });

  it("counts each key and each scope on its own", () => {
    const db = testDb();
    const other = { ...LOGIN_LIMIT, scope: "otp" };
    for (let i = 0; i < 5; i++) recordRateLimitEvent(db, LOGIN_LIMIT, "1.1.1.1", now);
    expect(checkRateLimit(db, LOGIN_LIMIT, "2.2.2.2", now).limited).toBe(false);
    expect(checkRateLimit(db, other, "1.1.1.1", now).limited).toBe(false);
  });

  it("can be cleared for one key and pruned by age", () => {
    const db = testDb();
    for (let i = 0; i < 5; i++) recordRateLimitEvent(db, LOGIN_LIMIT, "1.1.1.1", now);
    recordRateLimitEvent(db, LOGIN_LIMIT, "2.2.2.2", now);
    clearRateLimit(db, LOGIN_LIMIT, "1.1.1.1");
    expect(checkRateLimit(db, LOGIN_LIMIT, "1.1.1.1", now).limited).toBe(false);
    expect(pruneRateLimitEvents(db, at(1))).toBe(1);
  });
});
