// Display helpers of the Q&A section shared by public pages, the admin panel and its
// preview. Safe in the browser.
import { questionsCopy } from "@/content/questions";
import { formatJalali, toJalaliString, todayJalali } from "@/lib/jalali";

/** «۲۱ مهر ۱۴۰۵» in Tehran; "" when there is no date. */
export function jalaliDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return formatJalali(toJalaliString(todayJalali(new Date(date))));
}

/** "2026-10-13" for <time dateTime> and structured data. */
export function isoDate(date: Date | string | null | undefined): string | undefined {
  return date ? new Date(date).toISOString() : undefined;
}

export function displayNameOf(name: string): string {
  return name.trim() || questionsCopy.anonymous;
}

export function questionHref(slug: string): string {
  return `/porsesh/${slug}`;
}
