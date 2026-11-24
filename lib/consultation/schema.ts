import { z } from "zod";
import { normalizeInput, toLatinDigits } from "@/lib/format";
import { isValidMobile, normalizeMobile } from "@/lib/phone";

export const DESCRIPTION_LIMIT = 3000;
export const NAME_LIMIT = 120;
export const OTHER_TOPIC_LIMIT = 250;

export const topics = [
  { value: "criminal", title: "دعاوی کیفری" },
  { value: "civil", title: "دعاوی مدنی (حقوقی)" },
  { value: "other", title: "سایر" },
] as const;

export const messengers = [
  { value: "bale", label: "بله" },
  { value: "eitaa", label: "ایتا" },
  { value: "whatsapp", label: "واتساپ" },
  { value: "telegram", label: "تلگرام" },
] as const;

const shortText = (limit: number, missing: string) =>
  z.string().max(limit, "متن واردشده بیش از حد طولانی است.")
    .transform(normalizeInput).pipe(z.string().min(1, missing));

export const consultationSchema = z.object({
  name: shortText(NAME_LIMIT, "نام را وارد کنید."),
  mobile: z.string().max(40, "شماره موبایل ایران را وارد کنید.")
    .transform(normalizeMobile)
    .refine(isValidMobile, "شماره موبایل ایران را وارد کنید."),
  messenger: z.union([z.literal(""), z.enum(messengers.map(({ value }) => value))], {
    error: "یکی از پیام‌رسان‌های فهرست را انتخاب کنید.",
  }).transform((value) => value || null),
  topic: z.enum(topics.map(({ value }) => value), { error: "موضوع مشاوره را انتخاب کنید." }),
  otherTopic: z.unknown(),
  description: z.string().max(DESCRIPTION_LIMIT, "شرح موضوع باید حداکثر ۳٬۰۰۰ نویسه باشد.")
    .transform(normalizeInput).pipe(z.string().min(1, "شرح موضوع مشاوره را بنویسید.")),
  source: z.enum(["page", "calculator"]),
}).transform((value, ctx) => {
  if (value.topic !== "other") return { ...value, otherTopic: null };
  const other = shortText(OTHER_TOPIC_LIMIT, "موضوع را در یک جمله بنویسید.")
    .safeParse(typeof value.otherTopic === "string" ? value.otherTopic : "");
  if (other.success) return { ...value, otherTopic: other.data };
  ctx.addIssue({ code: "custom", path: ["otherTopic"], message: other.error.issues[0].message });
  return z.NEVER;
});

export const requestIdSchema = z.uuid();
export const codeSchema = z.string().length(5).transform(toLatinDigits).pipe(z.string().regex(/^\d{5}$/));

export type ConsultationInput = z.output<typeof consultationSchema>;
export type ConsultationDraft = {
  [Field in Exclude<keyof ConsultationInput, "source">]: string;
} & { source: ConsultationInput["source"] };
