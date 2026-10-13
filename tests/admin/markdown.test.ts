// ArticleBody: what Markdown turns into, and what must never get through.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The real contact box pulls in links and site content; a marker is enough here.
vi.mock("@/components/ContactBox", () => ({
  ContactBox: () => createElement("aside", { "data-contact-box": "" }),
}));

const { ArticleBody, CONTACT_BOX_MARKER, articleUrl } = await import("@/components/ArticleBody");

const BOX = '<aside data-contact-box=""></aside>';
const render = (content: string) => renderToStaticMarkup(createElement(ArticleBody, { content }));

describe("Markdown features", () => {
  it("renders headings, emphasis, lists, quotes and tables inside the prose wrapper", () => {
    const html = render(
      "## بخش\n\nمتن با **تأکید** و [پیوند](/blog).\n\n- یک\n- دو\n\n1. گام\n\n> نقل‌قول\n\n| الف | ب |\n| --- | --- |\n| ۱ | ۲ |",
    );
    expect(html).toMatch(/^<div class="prose-fa">/);
    expect(html).toContain("<h2>بخش</h2>");
    expect(html).toContain("<strong>تأکید</strong>");
    expect(html).toContain('<a href="/blog">پیوند</a>');
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<table>");
    expect(html).toContain("overflow-x-auto");
  });

  it("opens external links in a new tab without handing over the opener", () => {
    expect(render("[قانون](https://rc.majlis.ir/fa/law)")).toContain(
      '<a href="https://rc.majlis.ir/fa/law" target="_blank" rel="noopener noreferrer">',
    );
  });

  it("renders an uploaded image with its alt text and reserved size", () => {
    const html = render(`![نمونه چک](/uploads/${"ab".repeat(16)}.webp#1200x750)`);
    expect(html).toContain(`src="/uploads/${"ab".repeat(16)}.webp"`);
    expect(html).toContain('alt="نمونه چک"');
    expect(html).toContain('width="1200"');
    expect(html).toContain('height="750"');
    expect(html).toContain('loading="lazy"');
  });

  it("keeps footnotes working", () => {
    const html = render("متن[^1]\n\n[^1]: پانویس");
    expect(html).toContain("footnote");
    expect(html).toContain("پانویس");
  });
});

describe("contact box placement", () => {
  const sections = (n: number) =>
    Array.from({ length: n }, (_, i) => `## بخش ${i + 1}\n\nمتن ${i + 1}`).join("\n\n");
  const count = (html: string) => html.split(BOX).length - 1;

  it("goes before the third section", () => {
    const html = render(sections(4));
    expect(count(html)).toBe(1);
    expect(html.indexOf(BOX)).toBeGreaterThan(html.indexOf("متن 2"));
    expect(html.indexOf(BOX)).toBeLessThan(html.indexOf("بخش 3"));
  });

  it("goes at the end when there are exactly two sections", () => {
    const html = render(sections(2));
    expect(count(html)).toBe(1);
    expect(html.indexOf(BOX)).toBeGreaterThan(html.indexOf("متن 2"));
  });

  it("stays before the footnotes", () => {
    const html = render(`${sections(2)}[^1]\n\n[^1]: پانویس`);
    expect(html.indexOf(BOX)).toBeLessThan(html.indexOf("<section"));
  });

  it("is left out when there are fewer than two sections", () => {
    expect(count(render(sections(1)))).toBe(0);
    expect(count(render("فقط یک پاراگراف"))).toBe(0);
  });

  it("follows a marker line instead, and uses only the first marker", () => {
    const html = render(
      `مقدمه\n\n${CONTACT_BOX_MARKER}\n\n${sections(4)}\n\n${CONTACT_BOX_MARKER}`,
    );
    expect(count(html)).toBe(1);
    expect(html.indexOf(BOX)).toBeLessThan(html.indexOf("بخش 1"));
    expect(html).not.toContain(CONTACT_BOX_MARKER);
  });

  it("does not treat the marker inside a sentence as a marker", () => {
    const html = render(`متن ${CONTACT_BOX_MARKER} ادامه`);
    expect(count(html)).toBe(0);
    expect(html).toContain(CONTACT_BOX_MARKER);
  });
});

describe("content safety", () => {
  // None of these may produce a tag, an attribute or a URL that a browser would run.
  const payloads = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert(1)>",
    "<iframe src=\"javascript:alert(1)\"></iframe>",
    "<a href=\"javascript:alert(1)\">x</a>",
    "<div style=\"background:url(javascript:alert(1))\">x</div>",
    "<body onload=alert(1)>",
    "<math><mi xlink:href=\"data:x,<script>alert(1)</script>\">",
    "<details open ontoggle=alert(1)>",
    "<form action=\"javascript:alert(1)\"><input type=submit>",
    "<object data=\"javascript:alert(1)\">",
    "<style>*{background:url('javascript:alert(1)')}</style>",
    "[x](javascript:alert(1))",
    "[x](JaVaScRiPt:alert(1))",
    "[x](java\tscript:alert(1))",
    "[x](&#106;avascript:alert(1))",
    "[x](vbscript:msgbox(1))",
    "[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)",
    "[x](file:///etc/passwd)",
    "<javascript:alert(1)>",
    "![x](javascript:alert(1))",
    "![x](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+)",
    "![x](https://evil.example/track.gif)",
    "![x](//evil.example/track.gif)",
    "![x](/uploads/../../etc/passwd)",
    '![x](/uploads/a.webp" onerror="alert(1))',
    "[x]: javascript:alert(1)\n\n[x]",
    "{alert(1)}",
    "<ContactBox />",
    "export const meta = {}",
    "import fs from 'fs'",
  ];

  it.each(payloads)("neutralises %s", (payload) => {
    const html = render(`## بخش\n\n${payload}\n\nپایان`);
    // No tag other than the ones Markdown itself produces.
    expect(html).not.toMatch(
      /<(script|iframe|svg|math|object|embed|style|form|input|body|details|link|meta|base)\b/i,
    );
    // No event-handler or style attribute.
    expect(html).not.toMatch(/<[^>]+\s(on\w+|style|srcdoc|formaction)\s*=/i);
    // No URL attribute with a dangerous or foreign target.
    for (const [, , value] of html.matchAll(/\s(href|src|action|data)="([^"]*)"/g)) {
      expect(value).toMatch(/^(https?:\/\/rc\.|\/(?!\/)|#)/);
      expect(value).not.toContain("..");
    }
    expect(html).toContain("پایان");
  });

  it("shows typed HTML and MDX as text instead of running it", () => {
    expect(render("<ContactBox />")).not.toContain("data-contact-box");
    expect(render("<b>x</b> {1+1}")).toContain("{1+1}");
    expect(render("<b>x</b>")).not.toContain("<b>");
  });

  it("allows web, mail and phone links and local paths, and nothing else", () => {
    for (const ok of ["https://a.ir/x", "http://a.ir", "mailto:a@b.ir", "tel:+982100000000", "/blog", "#top"]) {
      expect(articleUrl(ok, "href")).toBe(ok);
    }
    for (const bad of ["javascript:alert(1)", " javascript:alert(1)", "data:text/html,x", "//evil.example", "ftp://a", "blog"]) {
      expect(articleUrl(bad, "href")).toBe("");
    }
  });

  it("allows only this site's images", () => {
    expect(articleUrl("/uploads/abc.webp#10x10", "src")).toBe("/uploads/abc.webp#10x10");
    expect(articleUrl("/images/blog/sample-1.webp", "src")).toBe("/images/blog/sample-1.webp");
    for (const bad of [
      "https://evil.example/a.png",
      "//evil.example/a.png",
      "data:image/png;base64,AAAA",
      "/uploads/../.env.local",
      "/admin/api/upload",
      "/uploads/a.webp?x=1",
    ]) {
      expect(articleUrl(bad, "src")).toBe("");
    }
  });
});
