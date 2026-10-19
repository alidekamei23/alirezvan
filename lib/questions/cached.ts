// The public Q&A reads, cached. Every change in the admin panel calls
// updateTag(QUESTIONS_TAG), so a published, edited or withdrawn question shows (or
// disappears) on the next request. Only published content passes through here; drafts
// never enter the cache (see public.ts).
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import {
  getQuestionPage,
  listPublishedForSitemap,
  listPublishedQuestions,
} from "@/lib/questions/public";

export const QUESTIONS_TAG = "questions";

export async function cachedQuestionList(params: { q: string; category?: string; page: number }) {
  "use cache";
  cacheTag(QUESTIONS_TAG);
  cacheLife("days");
  return listPublishedQuestions(getDb(), params);
}

export async function cachedQuestionPage(slug: string) {
  "use cache";
  cacheTag(QUESTIONS_TAG);
  cacheLife("days");
  return getQuestionPage(getDb(), slug);
}

export async function cachedQuestionSitemap() {
  "use cache";
  cacheTag(QUESTIONS_TAG);
  cacheLife("days");
  return listPublishedForSitemap(getDb());
}
