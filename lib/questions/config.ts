// Settings of the Q&A section from the environment (see .env.example). Server only.
import "server-only";
import type { RateLimit } from "@/lib/auth/rate-limit";
import { signFormToken } from "@/lib/questions/secure";

const HOUR = 60 * 60 * 1000;
const DEV_SALT = "development-only-ip-hash-salt-change-me";

let warned = false;

/**
 * The secret for IP hashes and form tokens. Required in production; in development a
 * fixed placeholder is used (with one warning) so the form works out of the box.
 */
export function questionSecret(): string {
  const salt = process.env.IP_HASH_SALT?.trim();
  if (salt && salt.length >= 32) return salt;
  if (process.env.NODE_ENV === "production") {
    throw new Error("IP_HASH_SALT is missing or shorter than 32 characters (see .env.example)");
  }
  if (!warned) {
    warned = true;
    console.warn("[questions] IP_HASH_SALT is not set; using a development placeholder.");
  }
  return DEV_SALT;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** New questions per IP per hour (QUESTION_LIMIT_PER_HOUR, default 3). */
export function askLimit(): RateLimit {
  return { scope: "question", max: positiveInt(process.env.QUESTION_LIMIT_PER_HOUR, 3), windowMs: HOUR };
}

/** Tracking-code look-ups per IP per 10 minutes, so codes cannot be guessed. */
export const TRACKING_LIMIT: RateLimit = { scope: "tracking", max: 20, windowMs: 10 * 60 * 1000 };

/** Counted views per IP per hour; more than this from one address is not counted. */
export const VIEW_LIMIT: RateLimit = { scope: "question-view", max: 60, windowMs: HOUR };

/** A form token signed now, for a form about to be shown (see secure.ts). */
export function freshFormToken(): string {
  return signFormToken(Date.now(), questionSecret());
}
