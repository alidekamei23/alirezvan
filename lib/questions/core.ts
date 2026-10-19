// The small, pure pieces of the Q&A section: tracking-code format, search text, the
// status rules and the link check. No database, no Next.js and no Node-only modules, so
// the browser (form validation), tests and scripts can all use them. Hashing and signing
// live in secure.ts (server only).
// (Relative imports with extensions: scripts run this file with plain Node.)
import type { QuestionStatus } from "../../db/schema.ts";
import { normalizePersian, toLatinDigits } from "../format.ts";

// ---------------------------------------------------------------- tracking codes

/** No 0/O, 1/I/L: letters and digits that cannot be mistaken for each other. */
export const TRACKING_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const TRACKING_LENGTH = 10;

/**
 * What the visitor typed → the code, or null. Accepts Persian digits, lower case, spaces
 * and hyphens («k7qm3-xh9tb»).
 */
export function normalizeTrackingCode(input: string): string | null {
  const code = toLatinDigits(input).toUpperCase().replace(/[\s\-_]/g, "");
  if (code.length !== TRACKING_LENGTH) return null;
  for (const char of code) if (!TRACKING_ALPHABET.includes(char)) return null;
  return code;
}

/** "K7QM3XH9TB" → "K7QM3-XH9TB", easier to read and copy. */
export function formatTrackingCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

// ------------------------------------------------------------------------ search

/**
 * The form both the stored search text and the visitor's query take: Persian ی/ک, Latin
 * digits, no diacritics or tatweel, half-spaces and punctuation as spaces, lower case.
 * So «سفته‌ها» finds «سفته ها», «۱۰ روز» finds «10 روز» and «كيفري» finds «کیفری».
 */
export function normalizeForSearch(text: string): string {
  return toLatinDigits(normalizePersian(text.normalize("NFC")))
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[‌‍]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLowerCase()
    .trim();
}

export function buildSearchText(parts: { title: string; body: string; answer: string }): string {
  return normalizeForSearch(`${parts.title} ${parts.body} ${parts.answer}`);
}

/** Words of a query, for an AND search. At most 6 words, each at least 2 letters. */
export function searchWords(query: string): string[] {
  return normalizeForSearch(query)
    .split(" ")
    .filter((word) => word.length >= 2)
    .slice(0, 6);
}

// ------------------------------------------------------------------- status rules

export type QuestionAction =
  | "save"
  | "publish"
  | "unpublish"
  | "reject"
  | "archive"
  | "restore"
  | "delete";

/** Which actions each status allows. Anything else is refused on the server. */
const ALLOWED: Record<QuestionStatus, QuestionAction[]> = {
  pending: ["save", "publish", "reject", "archive", "delete"],
  answered: ["save", "publish", "reject", "archive", "delete"],
  published: ["save", "unpublish", "archive", "delete"],
  rejected: ["save", "restore", "archive", "delete"],
  archived: ["restore", "delete"],
};

export function allowedActions(status: QuestionStatus): QuestionAction[] {
  return ALLOWED[status];
}

export function canApply(status: QuestionStatus, action: QuestionAction): boolean {
  return ALLOWED[status].includes(action);
}

/**
 * The status after an action, given whether the question has an answer. "delete" leaves
 * the status as it is (the row is only marked deleted).
 */
export function nextStatus(
  status: QuestionStatus,
  action: QuestionAction,
  hasAnswer: boolean,
): QuestionStatus {
  switch (action) {
    case "save":
      // Saving with an answer makes it «پاسخ داده‌شده» (a draft answer); a published
      // question stays published, and a rejected one stays rejected.
      if (status === "pending" || status === "answered") return hasAnswer ? "answered" : "pending";
      return status;
    case "publish":
      return "published";
    case "unpublish":
      return "answered";
    case "reject":
      return "rejected";
    case "archive":
      return "archived";
    case "restore":
      return hasAnswer ? "answered" : "pending";
    case "delete":
      return status;
  }
}

export const STATUS_LABELS: Record<QuestionStatus, string> = {
  pending: "در انتظار بررسی",
  answered: "پاسخ‌داده، منتشرنشده",
  published: "منتشرشده",
  rejected: "ردشده",
  archived: "بایگانی‌شده",
};

/** What a visitor sees for their tracking code. Never the internal reason. */
export type PublicTrackingStatus = "waiting" | "published" | "closed";

export function trackingStatus(status: QuestionStatus): PublicTrackingStatus {
  if (status === "published") return "published";
  if (status === "pending" || status === "answered") return "waiting";
  return "closed";
}

// ----------------------------------------------------------------------- links

/** Links in a text: http(s), www. and bare domains such as example.com/… */
export function countLinks(text: string): number {
  const pattern = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|ir|net|org|info|xyz|me|io|co)\b/gi;
  return text.match(pattern)?.length ?? 0;
}

/** More links than this and the question is refused as spam. */
export const MAX_LINKS = 2;

/** Markdown → plain text, for meta descriptions and structured data. */
export function markdownToPlain(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_`~|]/g, "")
    .replace(/\[contact-box\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The first `max` characters, cut at a word boundary, with «…» when cut. */
export function excerpt(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trim()}…`;
}
