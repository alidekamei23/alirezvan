// Counts one view of a published question. The page sends this once per visit (see
// components/questions/ViewCounter.tsx); bots and very busy addresses are not counted.
// It changes only a counter, never content, and answers 204 either way.
import { clientIp } from "@/lib/auth/admin";
import { isSameOrigin } from "@/lib/auth/origin";
import { checkRateLimit, pruneRateLimitEvents, recordRateLimitEvent } from "@/lib/auth/rate-limit";
import { getDb } from "@/lib/db";
import { VIEW_LIMIT, questionSecret } from "@/lib/questions/config";
import { countView } from "@/lib/questions/public";
import { hashIp } from "@/lib/questions/secure";

/** The longest limit window is an hour; older events are only clutter. */
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

const BOTS = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|headless|lighthouse/i;

export async function POST(request: Request): Promise<Response> {
  const done = new Response(null, { status: 204 });
  if (!isSameOrigin(request.headers)) return done;
  if (BOTS.test(request.headers.get("user-agent") ?? "")) return done;

  const slug = (await request.text().catch(() => "")).trim().slice(0, 200);
  if (!slug) return done;

  const db = getDb();
  const key = hashIp(await clientIp(), questionSecret());
  if ((await checkRateLimit(db, VIEW_LIMIT, key)).limited) return done;
  if (await countView(db, slug)) await recordRateLimitEvent(db, VIEW_LIMIT, key);
  // Views add a row each, so about one request in a hundred also clears out old rows of
  // every limit (views, questions, tracking, logins).
  if (Math.random() < 0.01) await pruneRateLimitEvents(db, new Date(Date.now() - PRUNE_AFTER_MS));
  return done;
}
