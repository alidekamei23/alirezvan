import { afterEach, describe, expect, it, vi } from "vitest";
import { TRACK_HREF } from "@/content/questions";
import { blogHref } from "@/lib/blog";

// lib/seo.ts reads the environment when it loads, so each case loads it afresh.
async function load(env: { indexing?: string; siteUrl?: string }) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_ALLOW_INDEXING", env.indexing ?? "");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", env.siteUrl ?? "https://example.ir/");
  const seo = await import("@/lib/seo");
  const robots = await import("@/app/robots");
  return { seo, robots };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots", () => {
  it("shuts out every crawler unless indexing is turned on", async () => {
    const { robots } = await load({});
    expect(robots.default()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("allows the site but keeps private paths out on the real domain", async () => {
    const { robots } = await load({ indexing: "true" });
    const result = robots.default();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(["/admin", "/admin/", "/api/"]);
    expect(result.sitemap).toBe("https://example.ir/sitemap.xml");
  });

  it("leaves noindex pages crawlable, so search engines can read their noindex", async () => {
    const { robots } = await load({ indexing: "true" });
    for (const path of [TRACK_HREF, "/design-system"]) {
      expect(robots.DISALLOWED_PATHS.some((d) => path.startsWith(d))).toBe(false);
    }
  });

  // Imports two whole pages; under a full parallel run that can pass five seconds.
  it("marks those pages noindex, nofollow instead", { timeout: 30_000 }, async () => {
    const pages = [
      await import("@/app/(site)/porsesh/peygiri/page"),
      await import("@/app/(site)/design-system/page"),
    ];
    for (const page of pages) {
      expect(page.metadata.robots).toEqual({ index: false, follow: false });
    }
  });

  it("does not block public sections", async () => {
    const { robots } = await load({ indexing: "true" });
    for (const path of ["/blog", "/porsesh", "/tools", "/check-safte"]) {
      expect(robots.DISALLOWED_PATHS.some((d) => path.startsWith(d))).toBe(false);
    }
  });
});

describe("seo helpers", () => {
  it("drops a trailing slash from the site URL", async () => {
    const { seo } = await load({ siteUrl: "https://example.ir/" });
    expect(seo.SITE_URL).toBe("https://example.ir");
    expect(seo.absoluteUrl("/blog")).toBe("https://example.ir/blog");
  });

  it("reads indexing as on only for the exact value true", async () => {
    expect((await load({ indexing: "true" })).seo.ALLOW_INDEXING).toBe(true);
    expect((await load({ indexing: "1" })).seo.ALLOW_INDEXING).toBe(false);
    expect((await load({})).seo.ALLOW_INDEXING).toBe(false);
  });

  it("sets the canonical URL and Open Graph URL to the page's own path", async () => {
    const { seo } = await load({});
    const meta = seo.pageMetadata({ title: "عنوان", description: "توضیح", path: "/tools" });
    expect(meta.alternates?.canonical).toBe("/tools");
    expect(meta.openGraph?.url).toBe("/tools");
    expect(meta.title).toBe("عنوان");
  });

  it("gives paginated lists a self-referencing canonical", async () => {
    const { seo } = await load({});
    const page2 = seo.pageMetadata({ title: "وبلاگ، صفحه ۲", description: "", path: blogHref(null, 2) });
    expect(page2.alternates?.canonical).toBe("/blog/page/2");
    const topic3 = seo.pageMetadata({
      title: "وبلاگ، صفحه ۳",
      description: "",
      path: blogHref("check-safte", 3),
    });
    expect(topic3.alternates?.canonical).toBe("/blog/topic/check-safte/page/3");
  });

  it("never builds a page-1 URL", () => {
    expect(blogHref(null, 1)).toBe("/blog");
    expect(blogHref("check-safte", 1)).toBe("/blog/topic/check-safte");
  });
});
