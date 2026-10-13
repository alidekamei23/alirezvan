/**
 * Blog pagination. The first page holds one more item than the others, because its
 * first post is shown large and the rest fill a three-column grid.
 */
export const FIRST_PAGE_SIZE = 10;
export const PAGE_SIZE = 9;

/** Number of pages for `total` items. An empty list still has one (empty) page. */
export function pageCount(total: number): number {
  if (total <= FIRST_PAGE_SIZE) return 1;
  return 1 + Math.ceil((total - FIRST_PAGE_SIZE) / PAGE_SIZE);
}

/** The items shown on `page` (1-based). Out-of-range pages give an empty list. */
export function pageSlice<T>(items: T[], page: number): T[] {
  if (!Number.isInteger(page) || page < 1) return [];
  if (page === 1) return items.slice(0, FIRST_PAGE_SIZE);
  const start = FIRST_PAGE_SIZE + (page - 2) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

export type PageItem = number | "gap";

/**
 * Page numbers to show: first, last, the current page and one neighbour on each side,
 * with "gap" where numbers are skipped. A gap that would hide a single number shows
 * that number instead.
 */
export function pageItems(current: number, total: number): PageItem[] {
  const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const page of pages) {
    if (page - previous === 2) items.push(previous + 1);
    else if (page - previous > 2) items.push("gap");
    items.push(page);
    previous = page;
  }
  return items;
}

/** Parses a page number from a URL segment. Returns null unless it is a whole number ≥ 2. */
export function parsePageParam(value: string): number | null {
  if (!/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page >= 2 ? page : null;
}
