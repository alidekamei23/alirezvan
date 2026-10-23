// Blog posts: the files in content/blog, the frontmatter rules, the disclaimer split,
// links to posts that are not published yet, and related posts.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ContactBox", () => ({
  ContactBox: () => createElement("aside", { "data-contact-box": "" }),
}));

const { parsePost, splitDisclaimer, isPublished } = await import("@/lib/blog");
const { ArticleBody } = await import("@/components/ArticleBody");
const { gregorianISOToJalali } = await import("@/lib/jalali");

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const files = readdirSync(BLOG_DIR).filter((name) => name.endsWith(".md"));
const posts = files.map((file) => parsePost(readFileSync(path.join(BLOG_DIR, file), "utf8"), file));

const frontmatter = (fields: Record<string, string>) =>
  [
    "---",
    'title: "عنوان آزمایشی مقاله"',
    'description: "توضیح کوتاه برای آزمودن خواندن فرانت‌متر مقاله."',
    'slug: "test-post"',
    'keyword: "کلیدواژه"',
    'category: "چک"',
    'cluster: "خوشه"',
    'type: "cluster"',
    'publishedAt: "2026-10-23"',
    'updatedAt: "2026-10-23"',
    'status: "approved"',
    ...Object.entries(fields).map(([key, value]) => `${key}: ${value}`),
    "---",
    "",
  ].join("\n");

describe("content/blog", () => {
  it("has posts, and every one is valid and named after its slug", () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) expect(`${post.slug}.md`).toBe(files[posts.indexOf(post)]);
  });

  it("has no two posts with the same slug or keyword", () => {
    const slugs = posts.map((post) => post.slug);
    const keywords = posts.map((post) => post.keyword);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("keeps internal editorial notes out of every post", () => {
    for (const post of posts) {
      const text = `${post.body}\n${post.disclaimer}`;
      for (const phrase of [
        "آماده‌ی بازبینی",
        "یادداشت برای وکیل",
        "برنامه‌ریزی‌شده",
        "keyword-map",
        "جدول سئو",
      ]) {
        expect(text, `${post.slug}: ${phrase}`).not.toContain(phrase);
      }
      expect(post.body, `${post.slug} must not have an H1`).not.toMatch(/^# /m);
    }
  });

  it("gives every published post a disclaimer, a cover and a 1200×630 share image", () => {
    for (const post of posts.filter(isPublished)) {
      expect(post.disclaimer, post.slug).toMatch(/مشاوره‌ی حقوقی محسوب نمی‌شود/);
      expect(post.cover.isDefault, post.slug).toBe(false);
      expect(post.ogImage, post.slug).toMatchObject({ width: 1200, height: 630 });
    }
  });
});

describe("parsePost", () => {
  it("derives the practice area from the category and the Jalali date", () => {
    const post = parsePost(frontmatter({}) + "متن", "test-post.md");
    expect(post.area).toBe("check-safte");
    expect(post.updatedJalali).toBe("1405-08-01");
    expect(post.cover.isDefault).toBe(true);
    expect(post.seoTitle).toBe("");
  });

  it("rejects a Persian slug, an unknown status and a file named differently", () => {
    expect(() => parsePost(frontmatter({}).replace("test-post", "مقاله-آزمایشی") + "متن", "x.md")).toThrow();
    expect(() => parsePost(frontmatter({}).replace('"approved"', '"published"') + "متن", "test-post.md")).toThrow();
    expect(() => parsePost(frontmatter({}) + "متن", "other.md")).toThrow(/file name/);
  });
});

describe("splitDisclaimer", () => {
  it("splits off a bold «سلب مسئولیت» paragraph", () => {
    const { body, disclaimer } = splitDisclaimer(
      "## بخش\n\nمتن.\n\n**سلب مسئولیت:** این نوشته مشاوره‌ی حقوقی محسوب نمی‌شود.\n",
    );
    expect(body).toBe("## بخش\n\nمتن.");
    expect(disclaimer).toMatch(/^\*\*سلب مسئولیت/);
  });

  it("takes the rule line before an italic disclaimer with it", () => {
    const { body, disclaimer } = splitDisclaimer(
      "متن.\n\n---\n\n*این نوشته مشاوره‌ی حقوقی محسوب نمی‌شود.*",
    );
    expect(body).toBe("متن.");
    expect(disclaimer).toBe("*این نوشته مشاوره‌ی حقوقی محسوب نمی‌شود.*");
  });

  it("leaves a text without a disclaimer whole", () => {
    expect(splitDisclaimer("متن.\n\n---\n\nپایان.")).toEqual({
      body: "متن.\n\n---\n\nپایان.",
      disclaimer: "",
    });
  });
});

describe("links to other posts", () => {
  const render = (content: string, slugs: string[]) =>
    renderToStaticMarkup(createElement(ArticleBody, { content, linkableSlugs: new Set(slugs) }));

  it("keeps links to published posts and turns the rest into plain text", () => {
    const html = render("[الف](/blog/live-post) و [ب](/blog/future-post) و [ج](/tools)", [
      "live-post",
    ]);
    expect(html).toContain('<a href="/blog/live-post">الف</a>');
    expect(html).not.toContain("future-post");
    expect(html).toContain(" ب ");
    expect(html).toContain('<a href="/tools">ج</a>');
  });

  it("never touches list pages", () => {
    const html = render("[همه](/blog) [موضوع](/blog/topic/check-safte)", []);
    expect(html).toContain('href="/blog"');
    expect(html).toContain('href="/blog/topic/check-safte"');
  });
});

describe("gregorianISOToJalali", () => {
  it("converts and rejects impossible dates", () => {
    expect(gregorianISOToJalali("2026-10-13")).toBe("1405-07-21");
    expect(gregorianISOToJalali("2026-03-21")).toBe("1405-01-01");
    expect(gregorianISOToJalali("2026-02-30")).toBeNull();
    expect(gregorianISOToJalali("not-a-date")).toBeNull();
  });
});
