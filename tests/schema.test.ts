import { describe, expect, it } from "vitest";
import { jsonLdString } from "@/components/JsonLd";
import { lawyer } from "@/content/lawyer";
import { toolList, tools } from "@/content/tools";
import {
  LAWYER_ID,
  LICENSING_BODY_ID,
  PRACTICE_ID,
  articleSchema,
  faqPageSchema,
  qaPageSchema,
  siteGraph,
  toolSchema,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

type Node = Record<string, unknown>;

/** Serialises like the page does, then parses back: proves the output is valid JSON. */
const render = (data: Node) => JSON.parse(jsonLdString(data)) as Node;
const graph = (data: Node) => render(data)["@graph"] as Node[];
const byType = (nodes: Node[], type: string) =>
  nodes.find((node) => [node["@type"]].flat().includes(type)) as Node;

describe("site graph", () => {
  const nodes = graph(siteGraph());
  const practice = byType(nodes, "Attorney");
  const person = byType(nodes, "Person");

  it("describes the practice as both a LegalService and an Attorney", () => {
    expect(practice["@type"]).toEqual(["LegalService", "Attorney"]);
    expect(practice["@id"]).toBe(`${SITE_URL}${PRACTICE_ID}`);
    expect(practice.telephone).toBe(lawyer.phone.tel);
    expect(practice.image).toBe(`${SITE_URL}${lawyer.photo.src}`);
    expect(practice.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: lawyer.address,
      addressLocality: lawyer.city,
      addressCountry: "IR",
    });
    expect(practice.areaServed).toMatchObject({ "@type": "City", name: lawyer.city });
  });

  it("uses the name and grade from content/lawyer.ts", () => {
    expect(person.name).toBe(lawyer.name);
    expect(person.jobTitle).toBe(lawyer.grade);
    expect(jsonLdString(siteGraph())).not.toContain("پایه یک");
  });

  it("links the lawyer to the licensing body and the license number", () => {
    const body = byType(nodes, "Organization");
    expect(body.name).toBe(lawyer.licensingBody);
    expect(person.memberOf).toEqual({ "@id": `${SITE_URL}${LICENSING_BODY_ID}` });
    expect(person.hasCredential).toMatchObject({
      identifier: lawyer.licenseNumber,
      recognizedBy: { "@id": `${SITE_URL}${LICENSING_BODY_ID}` },
    });
  });

  it("leaves out facts that content/lawyer.ts does not have", () => {
    for (const key of ["geo", "openingHours", "priceRange"]) {
      expect(practice).not.toHaveProperty(key);
    }
  });
});

describe("tool schema", () => {
  it("describes every calculator as a free WebApplication", () => {
    for (const tool of toolList) {
      const [app] = graph(toolSchema(tool));
      expect(app["@type"]).toBe("WebApplication");
      expect(app.name).toBe(tool.title);
      expect(app.url).toBe(`${SITE_URL}${tool.href}`);
      expect(app.operatingSystem).toBe("All");
      expect(["BusinessApplication", "FinanceApplication"]).toContain(app.applicationCategory);
      expect(app.provider).toEqual({ "@id": `${SITE_URL}${PRACTICE_ID}` });
    }
  });

  it("adds a FAQPage only when the page has questions", () => {
    expect(graph(toolSchema(tools.mohlat))).toHaveLength(1);
    const nodes = graph(toolSchema(tools.mohlat, [{ q: "سؤال؟", a: "پاسخ." }]));
    expect(nodes.map((node) => node["@type"])).toEqual(["WebApplication", "FAQPage"]);
  });
});

describe("article schema", () => {
  const article = render(
    articleSchema({
      title: "عنوان",
      description: "توضیح",
      href: "/blog/sample-post",
      images: ["/images/og.png"],
      publishedAt: "2026-10-01",
      updatedAt: "2026-10-20",
      keywords: ["چک", "سفته"],
      section: "چک و سفته",
    }),
  );

  it("has the required Article properties", () => {
    expect(article["@type"]).toBe("Article");
    expect(article.headline).toBe("عنوان");
    expect(article.datePublished).toBe("2026-10-01");
    expect(article.dateModified).toBe("2026-10-20");
    expect(article.image).toEqual([`${SITE_URL}/images/og.png`]);
  });

  it("credits the lawyer as author and the practice as publisher", () => {
    expect(article.author).toMatchObject({ "@id": `${SITE_URL}${LAWYER_ID}`, name: lawyer.name });
    expect(article.publisher).toMatchObject({ "@id": `${SITE_URL}${PRACTICE_ID}` });
  });
});

describe("Q&A schema", () => {
  const qa = render(
    qaPageSchema({
      title: "سؤال",
      body: "متن </script> سؤال",
      href: "/porsesh/sample",
      askedBy: "کاربر",
      publishedAt: "2026-10-10T00:00:00.000Z",
      answer: "پاسخ",
      answeredAt: "2026-10-11T00:00:00.000Z",
    }),
  );
  const question = qa.mainEntity as Node;

  it("holds the question and the lawyer's accepted answer", () => {
    expect(qa["@type"]).toBe("QAPage");
    expect(question["@type"]).toBe("Question");
    expect(question.answerCount).toBe(1);
    expect(question.acceptedAnswer).toMatchObject({
      "@type": "Answer",
      text: "پاسخ",
      url: `${SITE_URL}/porsesh/sample`,
      author: { "@id": `${SITE_URL}${LAWYER_ID}` },
    });
  });

  it("cannot close the script tag from inside the data", () => {
    const raw = jsonLdString(
      qaPageSchema({
        title: "",
        body: "</script>",
        href: "/x",
        askedBy: "",
        publishedAt: undefined,
        answer: "",
        answeredAt: undefined,
      }),
    );
    expect(raw).not.toContain("</script>");
    expect(question.text).toBe("متن </script> سؤال");
  });
});

describe("FAQ schema", () => {
  it("turns each item into a Question with an accepted Answer", () => {
    const faq = render(faqPageSchema([{ q: "الف؟", a: "ب." }]));
    expect(faq).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "الف؟", acceptedAnswer: { "@type": "Answer", text: "ب." } }],
    });
  });
});
