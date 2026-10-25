// Header, rendered to HTML. Guards what its narrow-phone layout must keep: the name and
// grade from content/lawyer.ts, a request link whose accessible name is the full label
// even where only the short one is shown, and the phone number in Persian digits.
// Whether it fits the screen is a layout question, checked in the browser at 320–1280px.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Header } from "@/components/Header";
import { NavDisclosure } from "@/components/NavDisclosure";
import { lawyer } from "@/content/lawyer";
import { practiceNav, practiceNavTitle, requestNav, siteNav } from "@/content/navigation";
import { toPersianDigits } from "@/lib/format";

describe("Header", () => {
  const html = renderToStaticMarkup(<Header />);

  it("links home with the name and the grade from content/lawyer.ts", () => {
    const home = html.slice(html.indexOf('href="/"'), html.indexOf("</a>", html.indexOf('href="/"')));
    expect(home).toContain(lawyer.name);
    expect(home).toContain(lawyer.grade);
  });

  it("names the request link in full, with a short and a full visible label", () => {
    const start = html.indexOf(`href="${requestNav.href}"`);
    const link = html.slice(html.lastIndexOf("<a", start), html.indexOf("</a>", start));
    expect(link).toContain(`aria-label="${requestNav.label}"`);
    expect(link).toContain(">مشاوره<");
    expect(link).toContain(`>${requestNav.label}<`);
  });

  it("shows the office phone in Persian digits", () => {
    expect(html).toContain(toPersianDigits(lawyer.phone.display));
  });

  describe("desktop navigation", () => {
    const nav = html.slice(html.indexOf('<nav aria-label="ناوبری اصلی"'), html.indexOf("</nav>"));

    it("groups the practice areas behind one closed disclosure button", () => {
      const button = /<button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[^>]*>(.*?)<\/button>/.exec(nav);
      expect(button).not.toBeNull();
      expect(button![2]).toContain(practiceNavTitle);
      const panel = new RegExp(`<ul[^>]*id="${button![1]}"[^>]*>`).exec(nav);
      expect(panel?.[0]).toContain("hidden");
    });

    it("keeps every practice hub and site page as a real link in the HTML", () => {
      for (const item of [...practiceNav, ...siteNav]) {
        expect(nav).toContain(`href="${item.href}"`);
        expect(nav).toContain(item.label);
      }
    });
  });
});

describe("NavDisclosure", () => {
  const items = practiceNav;
  const html = renderToStaticMarkup(<NavDisclosure label="عنوان" items={items} />);

  it("is a button that controls a hidden list of the given links", () => {
    const id = /aria-controls="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toMatch(new RegExp(`<ul[^>]*id="${id}"[^>]*hidden`));
    expect([...html.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => m[1])).toEqual(
      items.map((item) => item.href),
    );
  });
});
