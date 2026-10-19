// Small helpers for the Q&A pages of the admin panel.
import { z } from "zod";
import { QUESTION_STATUSES, type QuestionStatus } from "@/db/schema";
import { QUESTION_CATEGORY_SLUGS } from "@/content/question-categories";

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** The list page's query string, checked; anything odd falls back to the default. */
const schema = z.object({
  status: z.preprocess(first, z.enum(QUESTION_STATUSES).catch("pending")),
  q: z.preprocess(first, z.string().trim().max(100).catch("")),
  dasteh: z.preprocess(first, z.enum(QUESTION_CATEGORY_SLUGS).optional().catch(undefined)),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)),
});

export type AdminQuestionParams = {
  status: QuestionStatus;
  q: string;
  dasteh?: string;
  page: number;
};

export function parseQuestionParams(raw: Record<string, string | string[] | undefined>): AdminQuestionParams {
  return schema.parse({ status: "pending", ...raw });
}

export function adminQuestionsHref(params: Partial<AdminQuestionParams>): string {
  const search = new URLSearchParams();
  if (params.status && params.status !== "pending") search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.dasteh) search.set("dasteh", params.dasteh);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/questions?${query}` : "/admin/questions";
}

export const STATUS_TONES = {
  pending: "warning",
  answered: "info",
  published: "success",
  rejected: "danger",
  archived: "neutral",
} as const;
