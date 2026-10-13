// Rate limiting that survives restarts: each counted event is a row in the database.
// A limit is "at most `max` events per `windowMs` for one key" within a scope.
//
// Every function is async, so callers stay the same if the database later becomes one
// that answers asynchronously (PostgreSQL). Imports are relative with extensions because
// the scripts in scripts/ run this file with plain Node.
import { and, eq, gt, lte, min, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { rateLimitEvents } from "../../db/schema.ts";

export type RateLimit = { scope: string; max: number; windowMs: number };

/** Failed logins: 5 per 15 minutes per IP address. */
export const LOGIN_LIMIT: RateLimit = { scope: "login", max: 5, windowMs: 15 * 60 * 1000 };

export type RateLimitState = {
  limited: boolean;
  /** Milliseconds until the oldest counted event leaves the window; 0 when not limited. */
  retryAfterMs: number;
};

export async function checkRateLimit(
  db: Db,
  limit: RateLimit,
  key: string,
  now = new Date(),
): Promise<RateLimitState> {
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

export async function recordRateLimitEvent(
  db: Db,
  limit: RateLimit,
  key: string,
  now = new Date(),
): Promise<void> {
  db.insert(rateLimitEvents).values({ scope: limit.scope, key, createdAt: now }).run();
}

/** Forgets the events of one key. */
export async function clearRateLimit(db: Db, limit: RateLimit, key: string): Promise<void> {
  db.delete(rateLimitEvents)
    .where(and(eq(rateLimitEvents.scope, limit.scope), eq(rateLimitEvents.key, key)))
    .run();
}

/** Forgets every event of a scope, for all keys. Returns how many rows went. */
export async function clearRateLimitScope(db: Db, limit: RateLimit): Promise<number> {
  return db.delete(rateLimitEvents).where(eq(rateLimitEvents.scope, limit.scope)).run().changes;
}

/** Housekeeping: removes events older than `before`. Returns how many. */
export async function pruneRateLimitEvents(db: Db, before: Date): Promise<number> {
  return db.delete(rateLimitEvents).where(lte(rateLimitEvents.createdAt, before)).run().changes;
}
