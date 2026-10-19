// Server-only crypto of the Q&A section: new tracking codes and their hashes, the IP
// hash for spam limits, and the signed timestamp that proves how long a form was open.
// (Relative imports with extensions: scripts run this file with plain Node.)
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { TRACKING_ALPHABET, TRACKING_LENGTH } from "./core.ts";

/** A new random tracking code, e.g. "K7QM3XH9TB" (about 50 bits). */
export function newTrackingCode(): string {
  let code = "";
  for (let i = 0; i < TRACKING_LENGTH; i++) {
    code += TRACKING_ALPHABET[randomInt(TRACKING_ALPHABET.length)];
  }
  return code;
}

/** Only this hash is stored, so a leaked database does not reveal the codes. */
export function hashTrackingCode(code: string): string {
  return createHash("sha256").update(`tracking:${code}`).digest("hex");
}

/** HMAC of the IP address with a secret salt: stable for spam limits, not reversible. */
export function hashIp(ip: string, salt: string): string {
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

/** A form must stay open at least this long before it can be sent. */
export const MIN_FILL_MS = 3000;
/** A form older than this is stale (the page was left open for a day). */
export const MAX_FILL_MS = 24 * 60 * 60 * 1000;

/**
 * A signed timestamp for the form, made on the server when the form is shown, so a bot
 * cannot fake how long the form was open.
 */
export function signFormToken(issuedAt: number, secret: string): string {
  const mac = createHmac("sha256", secret).update(`form:${issuedAt}`).digest("base64url");
  return `${issuedAt}.${mac}`;
}

export type FormTokenCheck = "ok" | "invalid" | "too_fast" | "expired";

export function checkFormToken(token: unknown, secret: string, now = Date.now()): FormTokenCheck {
  if (typeof token !== "string") return "invalid";
  const [issued, mac] = token.split(".");
  const issuedAt = Number(issued);
  if (!Number.isSafeInteger(issuedAt) || !mac) return "invalid";
  const expected = signFormToken(issuedAt, secret).split(".")[1];
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "invalid";
  const age = now - issuedAt;
  if (age < MIN_FILL_MS) return "too_fast";
  if (age > MAX_FILL_MS) return "expired";
  return "ok";
}
