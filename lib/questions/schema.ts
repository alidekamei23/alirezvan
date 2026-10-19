// Validation of questions, shared by the visitor's form (in the browser, for instant
// messages) and the Server Actions (the real check). Plain text only: the visitor's
// title, body and name are never treated as Markdown or HTML.
// (Relative imports with extensions: scripts run this file with plain Node.)
import { z } from "zod";
import { QUESTION_CATEGORY_SLUGS } from "../../content/question-categories.ts";
import { normalizePersian } from "../format.ts";
import { normalizeSlug } from "../articles/slug.ts";
import { MAX_LINKS, countLinks } from "./core.ts";

export const QUESTION_LIMITS = {
  displayName: 30,
  titleMin: 10,
  titleMax: 150,
  bodyMin: 30,
  bodyMax: 3000,
  answerMax: 30000,
  metaTitle: 120,
  metaDescription: 300,
  note: 2000,
  related: 5,
} as const;

/** Trims, makes ی/ک Persian, collapses runs of spaces and of blank lines. */
function cleanText(value: string): string {
  return normalizePersian(value.normalize("NFC"))
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const text = (min: number, max: number, field: string) =>
  z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(min, `${field} دست‌کم ${toFa(min)} نویسه باشد.`)
        .max(max, `${field} حداکثر ${toFa(max)} نویسه باشد.`),
    );

const toFa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const notSpam = (value: string) => countLinks(value) <= MAX_LINKS;
const SPAM_MESSAGE = "متن پیوندهای زیادی دارد. پیوندها را حذف کنید.";

export const displayNameSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().max(QUESTION_LIMITS.displayName, `نام نمایشی حداکثر ${toFa(QUESTION_LIMITS.displayName)} نویسه باشد.`));

export const categorySchema = z.enum(QUESTION_CATEGORY_SLUGS, {
  error: "دسته‌بندی را انتخاب کنید.",
});

/** What a visitor sends. */
export const askSchema = z.object({
  displayName: displayNameSchema,
  category: categorySchema,
  title: text(QUESTION_LIMITS.titleMin, QUESTION_LIMITS.titleMax, "عنوان").refine(notSpam, SPAM_MESSAGE),
  body: text(QUESTION_LIMITS.bodyMin, QUESTION_LIMITS.bodyMax, "متن سؤال").refine(notSpam, SPAM_MESSAGE),
  accepted: z.literal(true, { error: "برای ثبت سؤال، شرایط را بپذیرید." }),
});
export type AskInput = z.infer<typeof askSchema>;

/** What the admin saves on the review page (and when adding a question by hand). */
export const questionEditSchema = z.object({
  displayName: displayNameSchema,
  category: categorySchema,
  title: text(QUESTION_LIMITS.titleMin, QUESTION_LIMITS.titleMax, "عنوان"),
  body: text(QUESTION_LIMITS.bodyMin, QUESTION_LIMITS.bodyMax, "متن سؤال"),
  /** Markdown; empty while unanswered. */
  answer: z.string().max(QUESTION_LIMITS.answerMax).transform((value) => value.trim()),
  /** "" → made from the title. */
  slug: z.string().max(200).transform((value) => normalizeSlug(value)),
  metaTitle: z.string().transform(cleanText).pipe(z.string().max(QUESTION_LIMITS.metaTitle)),
  metaDescription: z
    .string()
    .transform(cleanText)
    .pipe(z.string().max(QUESTION_LIMITS.metaDescription)),
  isFeatured: z.boolean(),
  adminNote: z.string().max(QUESTION_LIMITS.note).transform((value) => value.trim()),
  relatedArticles: z.array(z.uuid()).max(QUESTION_LIMITS.related),
});
export type QuestionEditInput = z.infer<typeof questionEditSchema>;

/** Field name → first message, for showing errors beside the fields. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    errors[field] ??= issue.message;
  }
  return errors;
}
