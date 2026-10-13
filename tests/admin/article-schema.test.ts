import { describe, expect, it } from "vitest";
import { ARTICLE_LIMITS, articleInputSchema, publishProblems } from "@/lib/articles/schema";

const minimal = { title: "عنوان مقاله", area: "check-safte" };
const cover = {
  coverImage: `/uploads/${"a1".repeat(16)}.webp`,
  coverImageAlt: "متن جایگزین",
  coverWidth: 1200,
  coverHeight: 750,
};
const complete = {
  ...minimal,
  ...cover,
  excerpt: "خلاصه‌ای کوتاه از مقاله برای کارت‌ها و نتیجه جست‌وجو.",
  content: "## بخش نخست\n\nمتن.",
  lawyerApproved: true,
};

function issuePaths(input: unknown): string[] {
  const result = articleInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("articleInputSchema", () => {
  it("accepts a draft with only a title and an area, and fills defaults", () => {
    const article = articleInputSchema.parse(minimal);
    expect(article).toMatchObject({
      slug: "",
      excerpt: "",
      content: "",
      coverImage: null,
      faqs: [],
      references: [],
      contentChanged: false,
      lawyerApproved: false,
    });
  });

  it("normalises text: trims, Persian ی/ک, NFC", () => {
    const article = articleInputSchema.parse({ ...minimal, title: "  كيفيت café  " });
    expect(article.title).toBe("کیفیت café");
  });

  it("normalises a typed slug and accepts Persian and Latin", () => {
    expect(articleInputSchema.parse({ ...minimal, slug: " چک برگشتی " }).slug).toBe("چک-برگشتی");
    expect(articleInputSchema.parse({ ...minimal, slug: "Bounced_Check" }).slug).toBe(
      "bounced-check",
    );
  });

  it("rejects a reserved slug and one with nothing usable in it", () => {
    expect(issuePaths({ ...minimal, slug: "page" })).toContain("slug");
    expect(issuePaths({ ...minimal, slug: "topic" })).toContain("slug");
    expect(issuePaths({ ...minimal, slug: "؟؟؟" })).toContain("slug");
  });

  it("rejects a missing title, an unknown area and wrong types", () => {
    expect(issuePaths({ area: "check-safte" })).toContain("title");
    expect(issuePaths({ ...minimal, title: "  " })).toContain("title");
    expect(issuePaths({ ...minimal, area: "keyfari" })).toContain("area");
    expect(issuePaths({ ...minimal, content: 5 })).toContain("content");
    expect(issuePaths({ ...minimal, lawyerApproved: "yes" })).toContain("lawyerApproved");
    expect(issuePaths(null)).toHaveLength(1);
  });

  it("enforces length limits", () => {
    expect(issuePaths({ ...minimal, title: "ع".repeat(ARTICLE_LIMITS.title + 1) })).toContain(
      "title",
    );
    expect(issuePaths({ ...minimal, excerpt: "خ".repeat(ARTICLE_LIMITS.excerpt + 1) })).toContain(
      "excerpt",
    );
    expect(issuePaths({ ...minimal, content: "م".repeat(ARTICLE_LIMITS.content + 1) })).toContain(
      "content",
    );
  });

  it("accepts only uploaded or bundled cover paths", () => {
    expect(articleInputSchema.safeParse({ ...minimal, ...cover }).success).toBe(true);
    expect(
      articleInputSchema.safeParse({
        ...minimal,
        ...cover,
        coverImage: "/images/blog/sample-1.webp",
      }).success,
    ).toBe(true);

    for (const coverImage of [
      "https://example.com/a.webp",
      "//example.com/a.webp",
      "/uploads/../../.env.local",
      "/uploads/short.webp",
      `/uploads/${"a1".repeat(16)}.svg`,
      `/uploads/${"a1".repeat(16)}.webp?x=1`,
      "/images/blog/../og.png",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
    ]) {
      expect(issuePaths({ ...minimal, ...cover, coverImage })).toContain("coverImage");
    }
  });

  it("wants cover dimensions exactly when there is a cover", () => {
    expect(issuePaths({ ...minimal, coverImage: cover.coverImage })).toContain("coverImage");
    expect(issuePaths({ ...minimal, coverWidth: 100, coverHeight: 100 })).toContain("coverImage");
    expect(issuePaths({ ...minimal, ...cover, coverHeight: null })).toContain("coverImage");
  });

  it("accepts only http and https reference links", () => {
    const withUrl = (url: string) => ({ ...minimal, references: [{ title: "قانون نمونه", url }] });
    expect(articleInputSchema.safeParse(withUrl("https://rc.majlis.ir/fa/law/show/1")).success).toBe(
      true,
    );
    expect(
      articleInputSchema.safeParse({ ...minimal, references: [{ title: "قانون نمونه" }] }).success,
    ).toBe(true);
    for (const url of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "/relative",
      "not a url",
    ]) {
      expect(issuePaths(withUrl(url))).toContain("references.0.url");
    }
  });

  it("validates FAQ entries", () => {
    expect(issuePaths({ ...minimal, faqs: [{ q: "؟", a: "پاسخ نمونه" }] })).toContain("faqs.0.q");
    expect(issuePaths({ ...minimal, faqs: [{ q: "پرسش نمونه؟" }] })).toContain("faqs.0.a");
  });

  it("drops fields it does not know", () => {
    const article = articleInputSchema.parse({ ...minimal, id: "x", status: "published" });
    expect(article).not.toHaveProperty("id");
    expect(article).not.toHaveProperty("status");
  });
});

describe("publishProblems", () => {
  it("finds nothing wrong with a complete article", () => {
    expect(publishProblems(articleInputSchema.parse(complete))).toEqual([]);
  });

  it("lists everything a bare draft lacks", () => {
    const fields = publishProblems(articleInputSchema.parse(minimal)).map((p) => p.field);
    expect(fields).toEqual(["excerpt", "content", "coverImage", "lawyerApproved"]);
  });

  it("requires the lawyer's approval tick", () => {
    const article = articleInputSchema.parse({ ...complete, lawyerApproved: false });
    expect(publishProblems(article).map((p) => p.field)).toEqual(["lawyerApproved"]);
  });

  it("requires alt text for the cover", () => {
    const article = articleInputSchema.parse({ ...complete, coverImageAlt: "" });
    expect(publishProblems(article).map((p) => p.field)).toEqual(["coverImageAlt"]);
  });
});
