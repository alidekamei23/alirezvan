// Zod schemas for everything the admin can submit about an article. Every Server Action
// parses its input with these before touching the database.
import { z } from "zod";
// (Relative imports with extensions: scripts run this file with plain Node.)
import { practiceAreas, type PracticeAreaSlug } from "../../content/practice-areas.ts";
import { normalizePersian } from "../format.ts";
import { isReservedSlug, normalizeSlug } from "./slug.ts";

const AREA_SLUGS = practiceAreas.map((area) => area.slug) as [
  PracticeAreaSlug,
  ...PracticeAreaSlug[],
];

export const ARTICLE_LIMITS = {
  title: 150,
  excerpt: 220,
  content: 200_000,
  alt: 200,
  seoTitle: 150,
  seoDescription: 400,
  faqs: 20,
  references: 30,
} as const;

/** Trimmed text with Persian ی/ک and NFC, so the same word is always stored the same way. */
const text = (max: number) =>
  z
    .string()
    .transform((value) => normalizePersian(value.normalize("NFC")).trim())
    .pipe(z.string().max(max, `حداکثر ${max} نویسه`));

/** Only web links: no javascript:, data: or other schemes. */
const httpUrl = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "نشانی باید با https:// یا http:// شروع شود");

/**
 * A cover is an uploaded file (/uploads/<random name>) or one of the images shipped
 * with the site (/images/blog/…). No other path and no external address.
 */
const coverPath = z
  .string()
  .regex(
    /^\/(uploads\/[a-f0-9]{32}\.(webp|jpg|png)|images\/blog\/[A-Za-z0-9][A-Za-z0-9._-]*\.(webp|jpg|jpeg|png))$/,
    "نشانی تصویر معتبر نیست",
  );

export const articleSlugSchema = z
  .string()
  .transform(normalizeSlug)
  .pipe(
    z
      .string()
      .min(1, "نشانی مقاله خالی است")
      .refine((value) => !isReservedSlug(value), "این نشانی برای خود وبلاگ رزرو شده است"),
  );

export const articleInputSchema = z
  .object({
    title: text(ARTICLE_LIMITS.title).pipe(z.string().min(3, "عنوان را بنویسید")),
    /** Empty means "make one from the title". */
    slug: z.union([z.literal(""), articleSlugSchema]).default(""),
    area: z.enum(AREA_SLUGS, "حوزه را انتخاب کنید"),
    excerpt: text(ARTICLE_LIMITS.excerpt).default(""),
    content: z
      .string()
      .max(ARTICLE_LIMITS.content, "متن مقاله بیش از اندازه بلند است")
      .transform((value) => normalizePersian(value.normalize("NFC")))
      .default(""),

    coverImage: coverPath.nullable().default(null),
    coverImageAlt: text(ARTICLE_LIMITS.alt).default(""),
    coverWidth: z.number().int().positive().max(20_000).nullable().default(null),
    coverHeight: z.number().int().positive().max(20_000).nullable().default(null),

    faqs: z
      .array(
        z.object({
          q: text(300).pipe(z.string().min(5, "پرسش کوتاه است")),
          a: text(2000).pipe(z.string().min(5, "پاسخ کوتاه است")),
        }),
      )
      .max(ARTICLE_LIMITS.faqs)
      .default([]),
    references: z
      .array(
        z.object({
          title: text(300).pipe(z.string().min(3, "عنوان منبع کوتاه است")),
          url: httpUrl.optional(),
        }),
      )
      .max(ARTICLE_LIMITS.references)
      .default([]),

    seoTitle: text(ARTICLE_LIMITS.seoTitle).default(""),
    seoDescription: text(ARTICLE_LIMITS.seoDescription).default(""),

    /** Moves the public «آخرین به‌روزرسانی» date to today. */
    contentChanged: z.boolean().default(false),
    /** Required to publish: the lawyer has approved this text. Never shown publicly. */
    lawyerApproved: z.boolean().default(false),
  })
  .refine((value) => (value.coverImage === null) === (value.coverWidth === null), {
    path: ["coverImage"],
    message: "اندازه تصویر مشخص نیست؛ تصویر را دوباره بارگذاری کنید",
  })
  .refine((value) => (value.coverWidth === null) === (value.coverHeight === null), {
    path: ["coverImage"],
    message: "اندازه تصویر مشخص نیست؛ تصویر را دوباره بارگذاری کنید",
  });

export type ArticleInput = z.infer<typeof articleInputSchema>;

export type PublishProblem = { field: keyof ArticleInput; message: string };

/**
 * What a draft may lack but a published article may not. An empty list means the
 * article can go public.
 */
export function publishProblems(article: ArticleInput): PublishProblem[] {
  const problems: PublishProblem[] = [];
  if (article.excerpt.length < 20) {
    problems.push({ field: "excerpt", message: "خلاصه مقاله را بنویسید (دست‌کم ۲۰ نویسه)." });
  }
  if (article.content.trim() === "") {
    problems.push({ field: "content", message: "متن مقاله خالی است." });
  }
  if (article.coverImage === null) {
    problems.push({ field: "coverImage", message: "هر مقاله یک تصویر شاخص لازم دارد." });
  } else if (article.coverImageAlt.length < 3) {
    problems.push({ field: "coverImageAlt", message: "متن جایگزین تصویر شاخص را بنویسید." });
  }
  if (!article.lawyerApproved) {
    problems.push({
      field: "lawyerApproved",
      message: "پیش از انتشار، تأیید وکیل را علامت بزنید.",
    });
  }
  return problems;
}
