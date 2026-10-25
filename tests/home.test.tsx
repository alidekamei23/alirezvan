// Home page building blocks, rendered to HTML. Covers what the phone redesign must keep:
// every name, number and label comes from the project's content files, numbers are shown
// in Persian digits, the hero keeps one h1, and no Bar-restricted wording slips in.
// Layout (what shows at which width) is checked in the browser, not here.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeHero } from "@/components/HomeHero";
import { LicenseStrip } from "@/components/LicenseStrip";
import { PracticeTiles } from "@/components/PracticeTiles";
import { ScrollCue } from "@/components/ScrollCue";
import { lawyer } from "@/content/lawyer";
import { requestNav } from "@/content/navigation";
import { homeCopy } from "@/content/pages";
import { practiceAreas } from "@/content/practice-areas";
import { toPersianDigits } from "@/lib/format";

// CLAUDE.md §2.1: titles, superlatives, promotions and outcome promises.
const RESTRICTED = ["پایه یک", "بهترین", "برترین", "شماره یک", "معروف‌ترین", "تضمین", "۱۰۰٪", "تخفیف", "رایگان"];

const count = (html: string, part: string) => html.split(part).length - 1;

describe("HomeHero", () => {
  const html = renderToStaticMarkup(<HomeHero />);

  it("has exactly one h1, holding the name and the grade from content/lawyer.ts", () => {
    expect(count(html, "<h1")).toBe(1);
    const h1 = html.slice(html.indexOf("<h1"), html.indexOf("</h1>"));
    expect(h1).toContain(lawyer.name);
    expect(h1).toContain(lawyer.grade);
  });

  it("shows the lead from content/pages.ts", () => {
    expect(html).toContain(homeCopy.lead);
  });

  it("links to the consultation request with its label", () => {
    expect(html).toContain(`href="${requestNav.href}"`);
    expect(html).toContain(requestNav.label);
  });

  it("uses the lawyer's photos from content/lawyer.ts", () => {
    expect(html).toContain(encodeURIComponent(lawyer.avatar.src));
    expect(html).toContain(encodeURIComponent(lawyer.photo.src));
  });

  it("contains no restricted wording", () => {
    for (const word of RESTRICTED) expect(html).not.toContain(word);
  });
});

describe("LicenseStrip", () => {
  const html = renderToStaticMarkup(<LicenseStrip />);

  it("lists licensing body, license number and city, in that order", () => {
    const labels = [...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]);
    expect(labels).toEqual(["مرجع صدور پروانه", "شماره پروانه", "محل فعالیت"]);
    expect(html).toContain(lawyer.licensingBody);
    expect(html).toContain(lawyer.city);
  });

  it("shows the license number in Persian digits only", () => {
    expect(html).toContain(toPersianDigits(lawyer.licenseNumber));
    expect(html).not.toContain(lawyer.licenseNumber);
  });

  it("contains no restricted wording", () => {
    for (const word of RESTRICTED) expect(html).not.toContain(word);
  });
});

describe("PracticeTiles", () => {
  const html = renderToStaticMarkup(<PracticeTiles areas={practiceAreas} />);

  it("links to every practice hub, in the order of content/practice-areas.ts", () => {
    const hrefs = [...html.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(practiceAreas.map((area) => area.href));
  });

  it("names each area with its title from the content file", () => {
    for (const area of practiceAreas) expect(html).toContain(area.title);
  });

  it("gives every area a decorative icon", () => {
    expect(count(html, "<svg")).toBe(practiceAreas.length);
    expect(count(html, 'aria-hidden="true"')).toBeGreaterThanOrEqual(practiceAreas.length);
  });
});

describe("ScrollCue", () => {
  it("is a plain in-page link with a visible label", () => {
    const html = renderToStaticMarkup(<ScrollCue href="#tools" label="ابزارهای محاسبه و بیشتر" />);
    expect(html).toContain('href="#tools"');
    expect(html).toContain("ابزارهای محاسبه و بیشتر");
  });
});
