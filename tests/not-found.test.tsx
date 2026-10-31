// Unknown addresses: a real 404 status from the first request (ensureStatic on every
// dynamic public route), the not-found title, and one site frame on the 404 page.
// The status itself is checked against a production build, not here.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { notFoundCopy } from "@/content/pages";
import { NOT_FOUND_METADATA } from "@/lib/seo";

const dynamicRoutes = {
  "/blog/[slug]": () => import("@/app/(site)/blog/[slug]/page"),
  "/blog/page/[page]": () => import("@/app/(site)/blog/page/[page]/page"),
  "/blog/topic/[area]": () => import("@/app/(site)/blog/topic/[area]/page"),
  "/blog/topic/[area]/page/[page]": () => import("@/app/(site)/blog/topic/[area]/page/[page]/page"),
  "/porsesh/[slug]": () => import("@/app/(site)/porsesh/[slug]/page"),
};

const count = (html: string, part: string) => html.split(part).length - 1;

describe("dynamic public routes", { timeout: 30_000 }, () => {
  for (const [route, load] of Object.entries(dynamicRoutes)) {
    it(`${route} is fully static, so an unknown address is a real 404`, async () => {
      const page = (await load()) as Record<string, unknown>;
      // Without it, Next.js streams the fallback shell with status 200 first.
      expect(page.ensureStatic).toBe("navigation");
      expect(page).not.toHaveProperty("instant");
    });
  }
});

describe("not-found metadata", { timeout: 30_000 }, () => {
  const params = <T,>(value: T) => ({ params: Promise.resolve(value) }) as never;

  it("gives an unknown post, topic or list page the not-found title", async () => {
    const post = await import("@/app/(site)/blog/[slug]/page");
    const list = await import("@/app/(site)/blog/page/[page]/page");
    const topic = await import("@/app/(site)/blog/topic/[area]/page");
    const topicList = await import("@/app/(site)/blog/topic/[area]/page/[page]/page");

    expect(await post.generateMetadata(params({ slug: "no-such-post" }))).toEqual(NOT_FOUND_METADATA);
    expect(await list.generateMetadata(params({ page: "abc" }))).toEqual(NOT_FOUND_METADATA);
    expect(await list.generateMetadata(params({ page: "999" }))).toEqual(NOT_FOUND_METADATA);
    expect(await topic.generateMetadata(params({ area: "no-such-area" }))).toEqual(NOT_FOUND_METADATA);
    expect(
      await topicList.generateMetadata(params({ area: "check-safte", page: "999" })),
    ).toEqual(NOT_FOUND_METADATA);
  });

  it("keeps real titles for pages that exist", async () => {
    const topic = await import("@/app/(site)/blog/topic/[area]/page");
    const metadata = await topic.generateMetadata(params({ area: "check-safte" }));
    expect(metadata).not.toEqual(NOT_FOUND_METADATA);
  });

  it("is the same title the root not-found page uses", async () => {
    const root = await import("@/app/not-found");
    expect(root.metadata).toBe(NOT_FOUND_METADATA);
    expect(NOT_FOUND_METADATA.title).toBe(notFoundCopy.heading);
  });
});

describe("not-found pages", { timeout: 30_000 }, () => {
  it("draws the frame once for an unknown address", async () => {
    const { default: NotFound } = await import("@/app/not-found");
    const html = renderToStaticMarkup(<NotFound />);
    expect(count(html, "<header")).toBe(1);
    expect(count(html, "<footer")).toBe(1);
    expect(count(html, "<h1")).toBe(1);
  });

  it("adds no frame inside the public layout, which already has one", async () => {
    const { default: SiteNotFound } = await import("@/app/(site)/not-found");
    const html = renderToStaticMarkup(<SiteNotFound />);
    expect(count(html, "<header")).toBe(0);
    expect(count(html, "<footer")).toBe(0);
    expect(html).toContain(notFoundCopy.heading);
  });
});
