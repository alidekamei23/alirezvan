// Small helpers for showing articles in the admin panel.
import { z } from "zod";
import { ARTICLE_SORTS, type ArticleListQuery } from "@/lib/articles/repository";
import { formatJalali, toJalaliString, todayJalali } from "@/lib/jalali";

/** A stored time as a Jalali date in Tehran, e.g. «۲۱ مهر ۱۴۰۵»; "—" when there is none. */
export function formatAdminDate(date: Date | null): string {
  return date ? formatJalali(toJalaliString(todayJalali(date))) : "—";
}

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** The list page's query string, checked; anything odd falls back to the default. */
const listParamsSchema = z.object({
  q: z.preprocess(first, z.string().trim().max(100).catch("")),
  status: z.preprocess(first, z.enum(["draft", "published"]).optional().catch(undefined)),
  sort: z.preprocess(first, z.enum(ARTICLE_SORTS).catch("updated")),
  dir: z.preprocess(first, z.enum(["asc", "desc"]).catch("desc")),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)),
});

export type AdminListParams = Required<Pick<ArticleListQuery, "sort" | "dir" | "page">> & {
  q: string;
  status?: "draft" | "published";
};

export function parseListParams(
  searchParams: Record<string, string | string[] | undefined>,
): AdminListParams {
  return listParamsSchema.parse(searchParams);
}

/** /admin with these filters; defaults are left out of the address. */
export function adminListHref(params: AdminListParams, page = params.page): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.sort !== "updated") query.set("sort", params.sort);
  if (params.dir !== "desc") query.set("dir", params.dir);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/admin?${text}` : "/admin";
}
