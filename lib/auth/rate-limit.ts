// Rate limiting that survives restarts: each counted event is a row in the database.
// A limit is "at most `max` events per `windowMs` for one key" within a scope.
import { and, eq, gt, lte, min, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { rateLimitEvents } from "@/db/schema";

export type RateLimit = { scope: string; max: number; windowMs: number };

/** Failed logins: 5 per 15 minutes per IP address. */
export const LOGIN_LIMIT: RateLimit = { scope: "login", max: 5, windowMs: 15 * 60 * 1000 };

export type RateLimitState = {
  limited: boolean;
  /** Milliseconds until the oldest counted event leaves the window; 0 when not limited. */
  retryAfterMs: number;
};

export function checkRateLimit(
  db: Db,
  limit: RateLimit,
  key: string,
  now = new Date(),
): RateLimitState {
  const since = new Date(now.getTime() - limit.windowMs);
  const row = db
    .select({ count: sql<number>`count(*)`, oldest: min(rateLimitEvents.createdAt) })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.scope, limit.scope),
        eq(rateLimitEvents.key, key),
        gt(rateLimitEvents.createdAt, since),
      ),
    )
    .get();

  const count = row?.count ?? 0;
  if (count < limit.max || !row?.oldest) return { limited: false, retryAfterMs: 0 };
  return {
    limited: true,
    retryAfterMs: Math.max(0, row.oldest.getTime() + limit.windowMs - now.getTime()),
  };
}

export function recordRateLimitEvent(
  db: Db,
  limit: RateLimit,
  key: string,
  now = new Date(),
): void {
  db.insert(rateLimitEvents).values({ scope: limit.scope, key, createdAt: now }).run();
}

export function clearRateLimit(db: Db, limit: RateLimit, key: string): void {
  db.delete(rateLimitEvents)
    .where(and(eq(rateLimitEvents.scope, limit.scope), eq(rateLimitEvents.key, key)))
    .run();
}

/** Housekeeping: removes events older than `before`. Returns how many. */
export function pruneRateLimitEvents(db: Db, before: Date): number {
  return db.delete(rateLimitEvents).where(lte(rateLimitEvents.createdAt, before)).run().changes;
}
