// Internal links between hubs, calculators, blog posts and Q&A (lib/links.ts), and what
// every calculator page sends in its first HTML: metadata, schema, hub links and the
// legal notes.
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { practiceAreas } from "@/content/practice-areas";
import { questionCategories } from "@/content/question-categories";
import { toolList, tools, type ToolSlug } from "@/content/tools";
import {
  areaForQuestionCategory,
  areasForTool,
  questionCategoryHref,
  relatedToolsFor,
  toolsForArea,
  toolsForQuestionCategory,
} from "@/lib/links";

describe("hub and calculator links", () => {
  it("gives every practice hub at least one calculator, each listed once", () => {
    for (const area of practiceAreas) {
      const slugs = toolsForArea(area.slug).map((tool) => tool.slug);
      expect(slugs.length).toBeGreaterThan(0);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("links each calculator back to exactly the hubs that list it", () => {
    for (const tool of toolList) {
      for (const area of practiceAreas) {
        const listed = toolsForArea(area.slug).some((entry) => entry.slug === tool.slug);
        const linked = areasForTool(tool.slug).some((entry) => entry.slug === area.slug);
        expect(linked).toBe(listed);
      }
    }
  });

  it("lists every other calculator as related, the ones sharing a hub first", () => {
    const related = relatedToolsFor("khesarat-takhir").map((tool) => tool.slug);
    expect(related).toHaveLength(toolList.length - 1);
    expect(related).not.toContain("khesarat-takhir");
    expect(related.slice(0, 2).sort()).toEqual(["hazine-dadresi", "mohlat"]);
  });

  it("keeps the site order for calculators that share nothing", () => {
    const related = relatedToolsFor("diyeh");
    const order = toolList.filter((tool) => tool.slug !== "diyeh").map((tool) => tool.slug);
    expect(related.map((tool) => tool.slug)).toEqual(order);
  });
});

describe("Q&A links", () => {
  it("joins the four area categories to their hubs and calculators", () => {
    for (const area of practiceAreas) {
      expect(areaForQuestionCategory(area.slug)?.slug).toBe(area.slug);
      expect(toolsForQuestionCategory(area.slug)).toEqual(toolsForArea(area.slug));
    }
  });

  it("gives the other categories their own calculators, or none", () => {
    expect(areaForQuestionCategory("khanevade")).toBeNull();
    expect(toolsForQuestionCategory("khanevade").map((tool) => tool.slug)).toEqual(["mahrieh"]);
    expect(toolsForQuestionCategory("ers").map((tool) => tool.slug)).toEqual(["sahm-ol-ers"]);
    expect(toolsForQuestionCategory("keyfari").map((tool) => tool.slug)).toEqual(["diyeh", "mohlat"]);
    expect(toolsForQuestionCategory("sayer")).toEqual([]);
    expect(toolsForQuestionCategory("unknown")).toEqual([]);
  });

  it("only names calculators that exist", () => {
    for (const category of questionCategories) {
      for (const tool of toolsForQuestionCategory(category.slug)) {
        expect(tools[tool.slug]).toBeDefined();
      }
    }
  });

  it("builds the filtered list address", () => {
    expect(questionCategoryHref("motalebe")).toBe("/porsesh?dasteh=motalebe");
  });
});

describe("practice hubs", () => {
  // The first import pulls in the blog loader; under a full parallel run it alone can take
  // longer than one test's time limit, so it is loaded once, outside the tests.
  let PracticeHub: (typeof import("@/components/PracticeHub"))["PracticeHub"];
  beforeAll(async () => {
    ({ PracticeHub } = await import("@/components/PracticeHub"));
  }, 30_000);

  for (const area of practiceAreas) {
    it(`links ${area.slug} to its calculators and its questions`, async () => {
      const html = renderToStaticMarkup(await PracticeHub({ area }));
      for (const tool of toolsForArea(area.slug)) {
        expect(html).toContain(`href="${tool.href}"`);
      }
      expect(html).toContain(`href="${questionCategoryHref(area.slug)}"`);
      expect(html).toContain('href="/porsesh/bepors"');
    });
  }
});

// CLAUDE.md §2.1 and the house style for calculator copy.
const RESTRICTED = ["رایگان", "بهترین", "برترین", "فوری", "تضمین", "۱۰۰٪", "تخفیف", "شماره یک", "دقیق دیه", "محاسبه دقیق"];

const pages: Record<ToolSlug, () => Promise<{ default: () => React.ReactNode; metadata: { title?: unknown; description?: unknown } }>> = {
  "khesarat-takhir": () => import("@/app/(site)/tools/khesarat-takhir/page"),
  "hazine-dadresi": () => import("@/app/(site)/tools/hazine-dadresi/page"),
  mahrieh: () => import("@/app/(site)/tools/mahrieh/page"),
  "dastmozd-karshenasi": () => import("@/app/(site)/tools/dastmozd-karshenasi/page"),
  "sahm-ol-ers": () => import("@/app/(site)/tools/sahm-ol-ers/page"),
  "haghol-vekale": () => import("@/app/(site)/tools/haghol-vekale/page"),
  mohlat: () => import("@/app/(site)/tools/mohlat/page"),
  diyeh: () => import("@/app/(site)/tools/diyeh/page"),
};

// Each test imports and renders a whole page; the first imports are slow under a full run.
describe("calculator pages", { timeout: 30_000 }, () => {
  it("has a page module for every calculator", () => {
    expect(Object.keys(pages).sort()).toEqual(toolList.map((tool) => tool.slug).sort());
  });

  it("gives every calculator its own title and description, without restricted words", async () => {
    const seen = { titles: new Set<string>(), descriptions: new Set<string>() };
    for (const tool of toolList) {
      const { metadata } = await pages[tool.slug]();
      const title = String(metadata.title);
      const description = String(metadata.description);
      expect(title).toContain("ماشین‌حساب");
      expect(title).not.toContain("|"); // the root layout adds «| علی رضوان»
      expect(description.length).toBeGreaterThan(80);
      for (const word of RESTRICTED) {
        expect(title).not.toContain(word);
        expect(description).not.toContain(word);
      }
      seen.titles.add(title);
      seen.descriptions.add(description);
    }
    expect(seen.titles.size).toBe(toolList.length);
    expect(seen.descriptions.size).toBe(toolList.length);
  });

  for (const tool of toolList) {
    it(`renders ${tool.slug} with its schema, hub links and legal notes in the HTML`, async () => {
      const Page = (await pages[tool.slug]()).default;
      const html = renderToStaticMarkup(<Page />);

      const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
        (match) => JSON.parse(match[1]) as { "@type"?: string; "@graph"?: { "@type": string; url?: string }[] },
      );
      const app = schemas.flatMap((schema) => schema["@graph"] ?? []).find((node) => node["@type"] === "WebApplication");
      expect(app?.url).toMatch(new RegExp(`${tool.href}$`));
      expect(schemas.some((schema) => schema["@type"] === "BreadcrumbList")).toBe(true);

      // Legal notes and reference tables sit in <details>, so crawlers get them unopened.
      expect(html).toContain("<details");
      for (const area of areasForTool(tool.slug)) {
        expect(html).toContain(`href="${area.href}"`);
      }
      for (const other of relatedToolsFor(tool.slug)) {
        expect(html).toContain(`href="${other.href}"`);
      }
    });
  }
});
