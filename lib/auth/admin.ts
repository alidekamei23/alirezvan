// The admin check. This is the security boundary: every admin page and every Server
// Action starts with requireAdminPage() (no session → to the login page), and every
// Route Handler with requireAdminAction() (no session → an error the handler turns into
// 401). proxy.ts is only an early redirect.
import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getAuthConfig } from "@/lib/auth/config";
import { sessionFromCookie } from "@/lib/auth/login";
import { SESSION_COOKIE, type Session } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const ADMIN_LOGIN_PATH = "/admin/login";

/** Thrown by requireAdminAction(). Carries nothing about why the check failed. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** The current admin session, or null. Reads the cookie and the database every request. */
export const getAdminSession = cache(async (): Promise<Session | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  // The check compares the expiry with the current time, so it belongs to the request
  // itself and must never be part of anything Next.js renders ahead of time.
  await connection();
  return sessionFromCookie(getDb(), getAuthConfig(), value);
});

/** For pages and Server Actions: sends a visitor without a session to the login page. */
export async function requireAdminPage(): Promise<Session> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}

/** For Route Handlers: throws without a session. */
export async function requireAdminAction(): Promise<Session> {
  const session = await getAdminSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function setSessionCookie(value: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The visitor's IP address, for rate limiting. Next.js does not expose the socket
 * address, so it can only come from a header set by the reverse proxy in front of
 * `next start`. Set TRUSTED_IP_HEADER (e.g. "x-real-ip") to that header's name; anyone
 * can forge these headers when no proxy overwrites them, so without the setting every
 * request shares one key and the limit applies to all visitors together.
 */
export async function clientIp(): Promise<string> {
  const header = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (!header) return "unknown";
  const value = (await headers()).get(header);
  // "x-forwarded-for" may list several addresses; the proxy appends the real one last.
  const ip = value?.split(",").at(-1)?.trim();
  return ip || "unknown";
}
