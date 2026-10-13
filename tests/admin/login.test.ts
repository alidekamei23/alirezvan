import { describe, expect, it } from "vitest";
import { rateLimitEvents, sessions } from "@/db/schema";
import { attemptLogin, logout, sessionFromCookie } from "@/lib/auth/login";
import { DAY, MINUTE, TEST_PASSWORD, TEST_USERNAME, testConfig, testDb } from "./helpers";

const now = new Date("2026-10-13T08:00:00Z");
const at = (ms: number) => new Date(now.getTime() + ms);
const good = { username: TEST_USERNAME, password: TEST_PASSWORD, ip: "1.1.1.1" };
const wrong = { ...good, password: "wrong password!" };

describe("login", () => {
  it("starts a session for the right username and password", async () => {
    const db = testDb();
    const result = await attemptLogin(db, testConfig, good, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sessionFromCookie(db, testConfig, result.cookieValue, now)?.username).toBe(
      TEST_USERNAME,
    );
  });

  it("creates a new session on each login", async () => {
    const db = testDb();
    const first = await attemptLogin(db, testConfig, good, now);
    const second = await attemptLogin(db, testConfig, good, now);
    expect(first.ok && second.ok && first.cookieValue !== second.cookieValue).toBe(true);
    expect(db.select().from(sessions).all()).toHaveLength(2);
  });

  it("answers the same way for a wrong username, a wrong password and bad input", async () => {
    const db = testDb();
    const cases = [
      { ...good, username: "someone" },
      wrong,
      { ...wrong, username: "someone" },
      { ...good, username: "" },
      { ...good, password: "" },
      { ...good, password: undefined },
      { ...good, username: { $ne: "" } },
      { ...good, password: "x".repeat(500) },
    ];
    for (const [index, input] of cases.entries()) {
      const result = await attemptLogin(db, testConfig, { ...input, ip: `10.0.0.${index}` }, now);
      expect(result).toEqual({ ok: false, reason: "invalid" });
    }
    expect(db.select().from(sessions).all()).toHaveLength(0);
  });

  it("blocks the sixth attempt from one IP within 15 minutes, even with the right password", async () => {
    const db = testDb();
    for (let i = 0; i < 5; i++) {
      expect(await attemptLogin(db, testConfig, wrong, at(i * 1000))).toEqual({
        ok: false,
        reason: "invalid",
      });
    }
    const blocked = await attemptLogin(db, testConfig, good, at(MINUTE));
    expect(blocked).toMatchObject({ ok: false, reason: "rate_limited" });
    expect(db.select().from(sessions).all()).toHaveLength(0);

    // Another address is not affected, and the first one is free again later.
    expect((await attemptLogin(db, testConfig, { ...good, ip: "2.2.2.2" }, at(MINUTE))).ok).toBe(
      true,
    );
    expect((await attemptLogin(db, testConfig, good, at(16 * MINUTE))).ok).toBe(true);
  });

  it("does not count blocked attempts, so the block ends on time", async () => {
    const db = testDb();
    for (let i = 0; i < 5; i++) await attemptLogin(db, testConfig, wrong, now);
    for (let i = 0; i < 10; i++) await attemptLogin(db, testConfig, good, at(MINUTE));
    expect(db.select().from(rateLimitEvents).all()).toHaveLength(5);
  });

  it("forgets earlier failures after a successful login", async () => {
    const db = testDb();
    for (let i = 0; i < 4; i++) await attemptLogin(db, testConfig, wrong, now);
    expect((await attemptLogin(db, testConfig, good, now)).ok).toBe(true);
    expect(db.select().from(rateLimitEvents).all()).toHaveLength(0);
  });
});

describe("session from cookie", () => {
  async function login(db = testDb()) {
    const result = await attemptLogin(db, testConfig, good, now);
    if (!result.ok) throw new Error("login failed");
    return { db, cookie: result.cookieValue };
  }

  it("rejects no cookie, a forged cookie and a cookie signed with another secret", async () => {
    const { db, cookie } = await login();
    const otherSecret = { ...testConfig, sessionSecret: "another-secret-another-secret-123456" };
    expect(sessionFromCookie(db, testConfig, undefined, now)).toBeNull();
    expect(sessionFromCookie(db, testConfig, "forged.value", now)).toBeNull();
    expect(sessionFromCookie(db, otherSecret, cookie, now)).toBeNull();
  });

  it("expires after seven days", async () => {
    const { db, cookie } = await login();
    expect(sessionFromCookie(db, testConfig, cookie, at(7 * DAY - 1))).not.toBeNull();
    expect(sessionFromCookie(db, testConfig, cookie, at(7 * DAY))).toBeNull();
  });

  it("stops working after logout, although the browser still has the cookie", async () => {
    const { db, cookie } = await login();
    logout(db, testConfig, cookie);
    expect(sessionFromCookie(db, testConfig, cookie, now)).toBeNull();
  });

  it("stops working when the session row is removed (revocation)", async () => {
    const { db, cookie } = await login();
    db.delete(sessions).run();
    expect(sessionFromCookie(db, testConfig, cookie, now)).toBeNull();
  });

  it("stops working when the admin username changes", async () => {
    const { db, cookie } = await login();
    expect(sessionFromCookie(db, { ...testConfig, username: "new-name" }, cookie, now)).toBeNull();
  });

  it("ignores a logout with a bad cookie", async () => {
    const { db, cookie } = await login();
    logout(db, testConfig, "forged.value");
    logout(db, testConfig, undefined);
    expect(sessionFromCookie(db, testConfig, cookie, now)).not.toBeNull();
  });
});
