/**
 * schema.org JSON-LD for search engines. Pure builders; <JsonLd> renders them and makes
 * relative URLs and `@id`s absolute.
 *
 * The practice, the lawyer and the licensing body are described once, site-wide
 * (siteGraph), with fixed `@id`s. Page schemas point to them by `@id` instead of repeating
 * them, so search engines join everything into one entity.
 *
 * Every fact comes from content/lawyer.ts. Fields that are not known there are left out,
 * never guessed: no `geo` (coordinates are not known yet), no `openingHours` (the owner
 * chose not to publish working hours) and no `priceRange`.
 */
import { lawyer } from "@/content/lawyer";
import { practiceAreas } from "@/content/practice-areas";
import type { Tool, ToolGroup } from "@/content/tools";

const CONTEXT = "https://schema.org";

export const PRACTICE_ID = "/#practice";
export const LAWYER_ID = "/#lawyer";
export const LICENSING_BODY_ID = "/#licensing-body";
export const WEBSITE_ID = "/#website";

export type JsonLdData = Record<string, unknown>;

/** Short references to the site-wide entities, for use inside page schemas. */
export const practiceRef = { "@id": PRACTICE_ID };
export const lawyerRef = {
  "@type": "Person",
  "@id": LAWYER_ID,
  name: lawyer.name,
  url: "/about",
};
const logo = { "@type": "ImageObject", url: "/icon.png", width: 512, height: 512 };

/** The practice (LegalService + Attorney), the lawyer and the licensing body. */
export function siteGraph(): JsonLdData {
  const licensingBody = {
    "@type": "Organization",
    "@id": LICENSING_BODY_ID,
    name: lawyer.licensingBody,
    logo: { "@type": "ImageObject", url: lawyer.licensingBodyLogo.src },
    ...(lawyer.licenseLookupUrl && { url: lawyer.licenseLookupUrl }),
  };

  const person = {
    "@type": "Person",
    "@id": LAWYER_ID,
    name: lawyer.name,
    jobTitle: lawyer.grade,
    url: "/about",
    image: lawyer.photo.src,
    telephone: lawyer.phone.tel,
    worksFor: practiceRef,
    memberOf: { "@id": LICENSING_BODY_ID },
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      name: lawyer.grade,
      identifier: lawyer.licenseNumber,
      recognizedBy: { "@id": LICENSING_BODY_ID },
    },
    knowsAbout: practiceAreas.map((area) => area.title),
  };

  const practice = {
    "@type": ["LegalService", "Attorney"],
    "@id": PRACTICE_ID,
    name: `${lawyer.name}، ${lawyer.grade}`,
    url: "/",
    image: lawyer.photo.src,
    logo,
    telephone: lawyer.phone.tel,
    address: {
      "@type": "PostalAddress",
      streetAddress: lawyer.address,
      addressLocality: lawyer.city,
      addressCountry: "IR",
    },
    areaServed: {
      "@type": "City",
      name: lawyer.city,
      containedInPlace: { "@type": "Country", name: "ایران" },
    },
    knowsAbout: practiceAreas.map((area) => area.title),
    founder: { "@id": LAWYER_ID },
    employee: { "@id": LAWYER_ID },
    ...(lawyer.googleMapsUrl && { hasMap: lawyer.googleMapsUrl }),
  };

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: "/",
    name: lawyer.name,
    inLanguage: "fa-IR",
    publisher: practiceRef,
  };

  return { "@context": CONTEXT, "@graph": [practice, person, licensingBody, website] };
}

export type FaqEntry = { q: string; a: string };

function faqNode(items: readonly FaqEntry[]): JsonLdData {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function faqPageSchema(items: readonly FaqEntry[]): JsonLdData {
  return { "@context": CONTEXT, ...faqNode(items) };
}

// Tools that turn amounts of money into amounts of money; the rest are legal utilities.
const FINANCE_GROUPS: ReadonlySet<ToolGroup> = new Set<ToolGroup>(["debt", "fees", "family"]);

/** A calculator page: WebApplication, plus FAQPage when the page has questions. */
export function toolSchema(tool: Tool, faq: readonly FaqEntry[] = []): JsonLdData {
  const app = {
    "@type": "WebApplication",
    "@id": `${tool.href}#app`,
    name: tool.title,
    description: tool.summary,
    url: tool.href,
    applicationCategory: FINANCE_GROUPS.has(tool.group) ? "FinanceApplication" : "BusinessApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript",
    inLanguage: "fa-IR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "IRR" },
    provider: practiceRef,
    isPartOf: { "@id": WEBSITE_ID },
  };
  return { "@context": CONTEXT, "@graph": faq.length > 0 ? [app, faqNode(faq)] : [app] };
}

/** A blog post, written by the lawyer and published by the practice. */
export function articleSchema(post: {
  title: string;
  description: string;
  href: string;
  images: string[];
  publishedAt: string;
  updatedAt: string;
  keywords: string[];
  section: string;
}): JsonLdData {
  return {
    "@context": CONTEXT,
    "@type": "Article",
    "@id": `${post.href}#article`,
    headline: post.title,
    description: post.description,
    image: post.images,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "fa-IR",
    keywords: post.keywords.join("، "),
    articleSection: post.section,
    author: lawyerRef,
    publisher: { ...practiceRef, name: `${lawyer.name}، ${lawyer.grade}`, logo },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": post.href },
  };
}

/** A published question with the lawyer's answer. */
export function qaPageSchema(question: {
  title: string;
  body: string;
  href: string;
  askedBy: string;
  publishedAt: string | undefined;
  answer: string;
  answeredAt: string | undefined;
}): JsonLdData {
  return {
    "@context": CONTEXT,
    "@type": "QAPage",
    "@id": `${question.href}#qa`,
    inLanguage: "fa-IR",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "Question",
      name: question.title,
      text: question.body,
      answerCount: 1,
      datePublished: question.publishedAt,
      author: { "@type": "Person", name: question.askedBy },
      acceptedAnswer: {
        "@type": "Answer",
        text: question.answer,
        datePublished: question.answeredAt,
        url: question.href,
        author: { ...lawyerRef, jobTitle: lawyer.grade },
      },
    },
  };
}
