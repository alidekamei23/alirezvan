import { describe, expect, it } from "vitest";
import { parseAuthConfig } from "@/lib/auth/config";
import { testConfig } from "./helpers";

const env = {
  ADMIN_USERNAME: "modir",
  ADMIN_PASSWORD_HASH: testConfig.passwordHash,
  SESSION_SECRET: "x".repeat(32),
};

describe("auth config", () => {
  it("reads a complete configuration", () => {
    expect(parseAuthConfig(env)).toEqual({
      username: "modir",
      passwordHash: testConfig.passwordHash,
      sessionSecret: "x".repeat(32),
    });
  });

  it("refuses a missing username, a short secret and a plaintext password", () => {
    expect(() => parseAuthConfig({ ...env, ADMIN_USERNAME: undefined })).toThrow();
    expect(() => parseAuthConfig({ ...env, ADMIN_USERNAME: "  " })).toThrow(/ADMIN_USERNAME/);
    expect(() => parseAuthConfig({ ...env, SESSION_SECRET: "short" })).toThrow(/SESSION_SECRET/);
    expect(() => parseAuthConfig({ ...env, ADMIN_PASSWORD_HASH: "my-password" })).toThrow(
      /ADMIN_PASSWORD_HASH/,
    );
  });

  it("refuses a hash that lost its $ signs to env expansion", () => {
    const mangled = testConfig.passwordHash.replace(/\$2b\$04\$/, "");
    expect(() => parseAuthConfig({ ...env, ADMIN_PASSWORD_HASH: mangled })).toThrow(
      /hash-password/,
    );
  });

  it("never puts a value in the error message", () => {
    const secret = "short-secret-value";
    try {
      parseAuthConfig({ ...env, SESSION_SECRET: secret, ADMIN_PASSWORD_HASH: "plain-pass" });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain(secret);
      expect(String(error)).not.toContain("plain-pass");
    }
  });
});
