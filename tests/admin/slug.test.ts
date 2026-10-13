import { describe, expect, it } from "vitest";
import {
  SLUG_MAX_LENGTH,
  isValidSlug,
  nextFreeSlug,
  normalizeSlug,
  slugFromTitle,
} from "@/lib/articles/slug";

describe("normalizeSlug", () => {
  it("joins Persian words with hyphens", () => {
    expect(normalizeSlug("چک برگشتی چیست؟")).toBe("چک-برگشتی-چیست");
    expect(normalizeSlug("مقاله-نمونه")).toBe("مقاله-نمونه");
  });

  it("turns half-spaces, underscores and repeated separators into one hyphen", () => {
    expect(normalizeSlug("می‌شود")).toBe("می-شود");
    expect(normalizeSlug("  مطالبه __ طلب -- ۱  ")).toBe("مطالبه-طلب-1");
  });

  it("uses Persian ی and ک and Latin digits", () => {
    expect(normalizeSlug("كيفري ۱۴۰۵ ٣")).toBe("کیفری-1405-3");
  });

  it("lower-cases Latin text", () => {
    expect(normalizeSlug("Check & Safte 2026")).toBe("check-safte-2026");
  });

  it("gives the same slug for composed and decomposed Unicode", () => {
    expect(normalizeSlug("café")).toBe(normalizeSlug("café"));
    expect(normalizeSlug("آب")).toBe(normalizeSlug("آب"));
  });

  it("removes what cannot be in a URL path", () => {
    expect(normalizeSlug("a/b?c#d%e")).toBe("a-b-c-d-e");
    expect(normalizeSlug("../../etc/passwd")).toBe("etc-passwd");
    expect(normalizeSlug("<script>")).toBe("script");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(normalizeSlug("")).toBe("");
    expect(normalizeSlug(" ؟!… — ")).toBe("");
  });

  it("cuts long slugs at a word boundary", () => {
    const slug = normalizeSlug("واژه ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.endsWith("واژه")).toBe(true);
  });

  it("is stable: normalising twice changes nothing", () => {
    for (const input of ["چک برگشتی چیست؟", "Check & Safte", "واژه ".repeat(40)]) {
      const once = normalizeSlug(input);
      expect(normalizeSlug(once)).toBe(once);
    }
  });
});

describe("isValidSlug", () => {
  it("accepts clean slugs and rejects the rest", () => {
    expect(isValidSlug("چک-برگشتی")).toBe(true);
    expect(isValidSlug("check-safte-2")).toBe(true);
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("چک برگشتی")).toBe(false);
    expect(isValidSlug("Check")).toBe(false);
    expect(isValidSlug("page")).toBe(false);
    expect(isValidSlug("topic")).toBe(false);
  });
});

describe("slugFromTitle", () => {
  it("makes a readable slug from the title", () => {
    expect(slugFromTitle("مطالبه وجه چک", "abc123")).toBe("مطالبه-وجه-چک");
  });

  it("falls back when the title gives nothing or a reserved word", () => {
    expect(slugFromTitle("؟؟؟", "abc123")).toBe("مقاله-abc123");
    expect(slugFromTitle("Page", "abc123")).toBe("مقاله-abc123");
  });
});

describe("nextFreeSlug", () => {
  it("keeps a free slug", async () => {
    expect(await nextFreeSlug("چک", () => false)).toBe("چک");
  });

  it("adds the first free number", async () => {
    const taken = new Set(["چک", "چک-2", "چک-3"]);
    expect(await nextFreeSlug("چک", (slug) => taken.has(slug))).toBe("چک-4");
  });

  it("stays within the length limit", async () => {
    const base = "a".repeat(SLUG_MAX_LENGTH);
    const slug = await nextFreeSlug(base, (candidate) => candidate === base);
    expect(slug).toHaveLength(SLUG_MAX_LENGTH);
    expect(slug.endsWith("-2")).toBe(true);
  });
});
