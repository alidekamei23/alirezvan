"use server";
// The visitor's Server Actions of the Q&A section: sending a question and looking up
// tracking codes. Both are open to everyone, so both are rate limited by a hash of the
// IP address, and their answers reveal nothing internal.
import { checkRateLimit, recordRateLimitEvent } from "@/lib/auth/rate-limit";
import { clientIp } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { toPersianDigits } from "@/lib/format";
import { TRACKING_LIMIT, askLimit, questionSecret } from "@/lib/questions/config";
import { normalizeTrackingCode, type PublicTrackingStatus } from "@/lib/questions/core";
import { createVisitorQuestion, findByTrackingCode } from "@/lib/questions/repository";
import { askSchema, fieldErrors } from "@/lib/questions/schema";
import { checkFormToken, hashIp } from "@/lib/questions/secure";

async function ipKey(): Promise<string> {
  return hashIp(await clientIp(), questionSecret());
}

const minutes = (ms: number) => toPersianDigits(Math.max(1, Math.ceil(ms / 60_000)));

// ------------------------------------------------------------------------- ask

export type AskValues = { displayName: string; category: string; title: string; body: string };

export type AskState =
  | { ok: true; trackingCode: string }
  | { ok: false; message: string | null; fieldErrors: Record<string, string>; values: AskValues }
  | null;

export async function askQuestionAction(_previous: AskState, formData: FormData): Promise<AskState> {
  const values: AskValues = {
    displayName: String(formData.get("displayName") ?? ""),
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  };
  const fail = (message: string | null, errors: Record<string, string> = {}): AskState => ({
    ok: false,
    message,
    fieldErrors: errors,
    values,
  });

  // A hidden field people never see; a bot that fills every field fills it too.
  if (String(formData.get("website") ?? "") !== "") return fail("ثبت سؤال انجام نشد.");

  const secret = questionSecret();
  const token = checkFormToken(formData.get("token"), secret);
  if (token === "too_fast") return fail("چند ثانیه صبر کنید و دوباره بفرستید.");
  if (token !== "ok") return fail("صفحه را تازه کنید و دوباره بفرستید.");

  const parsed = askSchema.safeParse({ ...values, accepted: formData.get("accepted") === "on" });
  if (!parsed.success) return fail("برخی از فیلدها نیاز به اصلاح دارند.", fieldErrors(parsed.error));

  const db = getDb();
  const key = await ipKey();
  const limit = askLimit();
  const state = await checkRateLimit(db, limit, key);
  if (state.limited) {
    return fail(`تعداد سؤال‌های ارسالی از این دستگاه زیاد بوده است. ${minutes(state.retryAfterMs)} دقیقه دیگر دوباره امتحان کنید.`);
  }

  try {
    const { trackingCode } = await createVisitorQuestion(db, parsed.data, { ipHash: key });
    await recordRateLimitEvent(db, limit, key);
    return { ok: true, trackingCode };
  } catch (error) {
    console.error("[questions] store failed:", error);
    return fail("ثبت سؤال انجام نشد. دوباره تلاش کنید.");
  }
}

// ---------------------------------------------------------------------- track

export type TrackedQuestion = {
  code: string;
  found: boolean;
  status?: PublicTrackingStatus;
  title?: string;
  /** Only for a published question. */
  slug?: string;
};

export type TrackState =
  | { ok: true; results: TrackedQuestion[] }
  | { ok: false; message: string }
  | null;

const MAX_CODES = 20;

/**
 * Looks up one or more tracking codes (the "my questions" list sends every code saved in
 * this browser at once). One look-up counts once toward the limit, whatever its size.
 */
export async function trackQuestionsAction(codes: unknown): Promise<TrackState> {
  if (!Array.isArray(codes) || codes.length === 0) return { ok: false, message: "کد پیگیری را وارد کنید." };
  const normalized = codes
    .slice(0, MAX_CODES)
    .map((code) => (typeof code === "string" ? normalizeTrackingCode(code) : null));
  if (codes.length === 1 && normalized[0] === null) {
    return { ok: false, message: "کد پیگیری درست نیست. کد ۱۰ نویسه‌ای را همان‌طور که دریافت کرده‌اید وارد کنید." };
  }

  const db = getDb();
  const key = await ipKey();
  const state = await checkRateLimit(db, TRACKING_LIMIT, key);
  if (state.limited) {
    return { ok: false, message: `پیگیری‌های زیادی انجام شده است. ${minutes(state.retryAfterMs)} دقیقه دیگر دوباره امتحان کنید.` };
  }
  await recordRateLimitEvent(db, TRACKING_LIMIT, key);

  const results: TrackedQuestion[] = [];
  for (const code of normalized) {
    if (!code) continue;
    const found = await findByTrackingCode(db, code);
    results.push(
      found
        ? { code, found: true, status: found.status, title: found.title, ...(found.slug && { slug: found.slug }) }
        : { code, found: false },
    );
  }
  return { ok: true, results };
}
