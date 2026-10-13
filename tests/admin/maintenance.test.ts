// The startup warning and the two recovery scripts, run as `npm run …` runs them,
// against a throwaway database file.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { openDatabase, runMigrations } from "@/db/client";
import { rateLimitEvents, sessions } from "@/db/schema";
import { LOGIN_LIMIT, checkRateLimit, recordRateLimitEvent } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { startupWarnings } from "@/lib/auth/startup-check";

describe("startup warning", () => {
  it("warns in production when TRUSTED_IP_HEADER is missing or blank", () => {
    for (const TRUSTED_IP_HEADER of [undefined, "", "  "]) {
      const warnings = startupWarnings({ NODE_ENV: "production", TRUSTED_IP_HEADER });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("TRUSTED_IP_HEADER");
      expect(warnings[0]).toContain("unlock-login");
    }
  });

  it("is quiet in production with the header set, and in development", () => {
    expect(startupWarnings({ NODE_ENV: "production", TRUSTED_IP_HEADER: "x-real-ip" })).toEqual([]);
    expect(startupWarnings({ NODE_ENV: "development" })).toEqual([]);
  });
});

describe("recovery scripts", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "alirezvan-scripts-"));
  const url = `file:${path.join(dir, "test.db")}`;
  const db = openDatabase(url);
  runMigrations(db);

  afterAll(() => {
    db.$client.close();
    rmSync(dir, { recursive: true, force: true });
  });

  function runScript(name: string) {
    return spawnSync(
      process.execPath,
      ["--experimental-strip-types", "--no-warnings", path.join("scripts", name)],
      { encoding: "utf8", env: { ...process.env, DATABASE_URL: url } },
    );
  }

  it("unlock-login clears the login counter and nothing else", async () => {
    for (let i = 0; i < 5; i++) await recordRateLimitEvent(db, LOGIN_LIMIT, "unknown");
    await recordRateLimitEvent(db, { ...LOGIN_LIMIT, scope: "otp" }, "09120000000");
    await createSession(db, { username: "modir", fingerprint: "f".repeat(16) });
    expect((await checkRateLimit(db, LOGIN_LIMIT, "unknown")).limited).toBe(true);

    const result = runScript("unlock-login.ts");
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("5 failed attempt(s)");

    expect((await checkRateLimit(db, LOGIN_LIMIT, "unknown")).limited).toBe(false);
    expect(db.select().from(rateLimitEvents).all()).toHaveLength(1);
    expect(db.select().from(sessions).all()).toHaveLength(1);
  }, 30_000);

  it("revoke-sessions ends every session", async () => {
    await createSession(db, { username: "modir", fingerprint: "f".repeat(16) });
    expect(db.select().from(sessions).all()).toHaveLength(2);

    const result = runScript("revoke-sessions.ts");
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("2 session(s)");
    expect(db.select().from(sessions).all()).toHaveLength(0);
  }, 30_000);
});
