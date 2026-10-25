// Header, rendered to HTML. Guards what its narrow-phone layout must keep: the name and
// grade from content/lawyer.ts, a request link whose accessible name is the full label
// even where only the short one is shown, and the phone number in Persian digits.
// Whether it fits the screen is a layout question, checked in the browser at 320–1280px.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Header } from "@/components/Header";
import { lawyer } from "@/content/lawyer";
import { requestNav } from "@/content/navigation";
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
});
