// Runs scripts/hash-password.mjs the way `npm run hash-password` does, feeding the
// password through stdin (the script reads piped input when there is no terminal).
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { parseAuthConfig } from "@/lib/auth/config";

const SCRIPT = path.join(process.cwd(), "scripts", "hash-password.mjs");
const PASSWORD = "a long test password";

function run(stdin: string, args: string[] = []) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { input: stdin, encoding: "utf8" });
}

describe("hash-password script", () => {
  it("prints an env line whose hash matches the password and survives Next.js env loading", () => {
    const result = run(`${PASSWORD}\n${PASSWORD}\n`);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^ADMIN_PASSWORD_HASH=\\\$2[aby]\\\$12\\\$/);
    expect(result.stdout + result.stderr).not.toContain(PASSWORD);

    // Load the printed line with the loader Next.js uses for env files. (It skips
    // .env.local when NODE_ENV is "test", so the file is named .env here.)
    const dir = mkdtempSync(path.join(os.tmpdir(), "alirezvan-env-"));
    try {
      writeFileSync(path.join(dir, ".env"), result.stdout);
      const saved = process.env.ADMIN_PASSWORD_HASH;
      delete process.env.ADMIN_PASSWORD_HASH;
      const { combinedEnv } = nextEnv.loadEnvConfig(dir, true, { info() {}, error() {} }, true);
      const hash = combinedEnv.ADMIN_PASSWORD_HASH!;
      if (saved === undefined) delete process.env.ADMIN_PASSWORD_HASH;
      else process.env.ADMIN_PASSWORD_HASH = saved;

      expect(bcrypt.compareSync(PASSWORD, hash)).toBe(true);
      expect(bcrypt.compareSync("another password", hash)).toBe(false);
      expect(() =>
        parseAuthConfig({
          ADMIN_USERNAME: "modir",
          ADMIN_PASSWORD_HASH: hash,
          SESSION_SECRET: "x".repeat(32),
        }),
      ).not.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);

  it("refuses a password given as an argument", () => {
    const result = run("", [PASSWORD]);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toContain(PASSWORD);
  });

  it("refuses passwords that differ, are too short or are too long", () => {
    for (const input of [
      `${PASSWORD}\nsomething else here\n`,
      "short\nshort\n",
      `${"ر".repeat(40)}\n${"ر".repeat(40)}\n`,
    ]) {
      const result = run(input);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
    }
  });
});
