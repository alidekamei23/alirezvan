// The checks every admin page and action starts with (lib/auth/admin.ts), with the
// request's cookies and headers replaced by test values.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runMigrations } from "@/db/client";
import { sessions } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { TEST_PASSWORD, TEST_USERNAME, testConfig } from "./helpers";

const request = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  headers: new Map<string, string>(),
  setCalls: [] as { name: string; value: string; options: Record<string, unknown> }[],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      request.cookies.has(name) ? { name, value: request.cookies.get(name)! } : undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      request.cookies.set(name, value);
      request.setCalls.push({ name, value, options });
    },
    delete: (name: string) => request.cookies.delete(name),
  }),
  headers: async () => ({ get: (name: string) => request.headers.get(name) ?? null }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

process.env.DATABASE_URL = ":memory:";
process.env.ADMIN_USERNAME = testConfig.username;
process.env.ADMIN_PASSWORD_HASH = testConfig.passwordHash;
process.env.SESSION_SECRET = testConfig.sessionSecret;

const { getDb } = await import("@/lib/db");
const { attemptLogin, logout } = await import("@/lib/auth/login");
const admin = await import("@/lib/auth/admin");

runMigrations(getDb());

async function loginCookie(): Promise<string> {
  const result = await attemptLogin(getDb(), testConfig, {
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    ip: "test",
  });
  if (!result.ok) throw new Error("login failed");
  return result.cookieValue;
}

beforeEach(() => {
  request.cookies.clear();
  request.headers.clear();
  request.setCalls.length = 0;
  delete process.env.TRUSTED_IP_HEADER;
});

describe("admin guard", () => {
  it("refuses a request without a cookie", async () => {
    expect(await admin.getAdminSession()).toBeNull();
    await expect(admin.requireAdminAction()).rejects.toBeInstanceOf(admin.UnauthorizedError);
    await expect(admin.requireAdminPage()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("refuses a forged cookie", async () => {
    request.cookies.set(SESSION_COOKIE, "forged.value");
    await expect(admin.requireAdminAction()).rejects.toBeInstanceOf(admin.UnauthorizedError);
    await expect(admin.requireAdminPage()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("lets a logged-in admin through", async () => {
    request.cookies.set(SESSION_COOKIE, await loginCookie());
    expect((await admin.requireAdminAction()).username).toBe(TEST_USERNAME);
    expect((await admin.requireAdminPage()).username).toBe(TEST_USERNAME);
  });

  it("refuses after logout and after the session is revoked", async () => {
    const first = await loginCookie();
    request.cookies.set(SESSION_COOKIE, first);
    logout(getDb(), testConfig, first);
    await expect(admin.requireAdminAction()).rejects.toBeInstanceOf(admin.UnauthorizedError);

    request.cookies.set(SESSION_COOKIE, await loginCookie());
    getDb().delete(sessions).run();
    await expect(admin.requireAdminAction()).rejects.toBeInstanceOf(admin.UnauthorizedError);
  });

  it("gives an error that says nothing about the reason", async () => {
    const error = await admin.requireAdminAction().catch((e: Error) => e);
    expect((error as Error).message).toBe("Unauthorized");
  });
});

describe("session cookie", () => {
  it("is HttpOnly, SameSite=Lax, site-wide and expires with the session", async () => {
    const expiresAt = new Date("2026-10-20T08:00:00Z");
    await admin.setSessionCookie("value", expiresAt);
    expect(request.setCalls[0]).toMatchObject({
      name: SESSION_COOKIE,
      options: { httpOnly: true, sameSite: "lax", path: "/", expires: expiresAt, secure: false },
    });
  });

  it("is Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await admin.setSessionCookie("value", new Date());
    vi.unstubAllEnvs();
    expect(request.setCalls[0].options.secure).toBe(true);
  });

  it("can be cleared", async () => {
    request.cookies.set(SESSION_COOKIE, "value");
    await admin.clearSessionCookie();
    expect(request.cookies.has(SESSION_COOKIE)).toBe(false);
  });
});

describe("client IP", () => {
  it("ignores forwarding headers unless a trusted header is configured", async () => {
    request.headers.set("x-forwarded-for", "6.6.6.6");
    request.headers.set("x-real-ip", "6.6.6.6");
    expect(await admin.clientIp()).toBe("unknown");
  });

  it("reads the configured header, taking the last address of a list", async () => {
    process.env.TRUSTED_IP_HEADER = "X-Real-IP";
    request.headers.set("x-real-ip", "5.5.5.5");
    expect(await admin.clientIp()).toBe("5.5.5.5");

    process.env.TRUSTED_IP_HEADER = "x-forwarded-for";
    request.headers.set("x-forwarded-for", "6.6.6.6, 5.5.5.5");
    expect(await admin.clientIp()).toBe("5.5.5.5");
  });

  it("falls back when the configured header is absent", async () => {
    process.env.TRUSTED_IP_HEADER = "x-real-ip";
    expect(await admin.clientIp()).toBe("unknown");
  });
});
