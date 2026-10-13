// Article slugs: the part of the URL after /blog/. Persian or Latin words joined by
// hyphens. The same normalisation runs on generated and hand-typed slugs.
// (Relative imports with extensions: scripts run this file with plain Node.)
import { normalizePersian, toLatinDigits } from "../format.ts";

/** Route segments under /blog that a slug must not shadow. */
export const RESERVED_SLUGS = ["page", "topic"];

export const SLUG_MAX_LENGTH = 80;

/**
 * Cleans a slug: NFC, Persian ی/ک, Latin digits, lower-case Latin letters; spaces,
 * half-spaces (ZWNJ), underscores and every other separator or symbol become one
 * hyphen. Returns "" when nothing usable is left.
 */
export function normalizeSlug(input: string): string {
  const cleaned = toLatinDigits(normalizePersian(input.normalize("NFC")))
    .toLowerCase()
    // Anything that is not a letter, a combining mark or a digit separates words.
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  if (cleaned.length <= SLUG_MAX_LENGTH) return cleaned;
  // Cut at a word boundary when there is one in the second half.
  const cut = cleaned.slice(0, SLUG_MAX_LENGTH);
  const lastHyphen = cut.lastIndexOf("-");
  return (lastHyphen > SLUG_MAX_LENGTH / 2 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

/** True for a slug that normalizeSlug would leave unchanged and that is not reserved. */
export function isValidSlug(slug: string): boolean {
  return slug !== "" && slug === normalizeSlug(slug) && !isReservedSlug(slug);
}

/**
 * A readable slug from a title. When the title leaves nothing (only symbols) or gives a
 * reserved word, falls back to "مقاله-<suffix>".
 */
export function slugFromTitle(title: string, fallbackSuffix: string): string {
  const slug = normalizeSlug(title);
  if (slug === "" || isReservedSlug(slug)) {
    return normalizeSlug(`مقاله-${fallbackSuffix}`);
  }
  return slug;
}

/**
 * The first free slug among "base", "base-2", "base-3", … `isTaken` answers for one
 * candidate. This only picks a likely-free slug; the database's unique index decides.
 */
export async function nextFreeSlug(
  base: string,
  isTaken: (candidate: string) => boolean | Promise<boolean>,
): Promise<string> {
  if (!(await isTaken(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("No free slug found");
}
