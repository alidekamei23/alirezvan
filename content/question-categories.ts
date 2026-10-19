// Categories of the Q&A section (/porsesh). Separate from the four practice areas, since
// visitors ask about more than those. To add or rename one, edit this list: the slug is
// stored with each question and appears in addresses, so never change an existing slug
// (rename only its title). Order here is the order on the site.
// TODO: lawyer review (which categories to offer)

export type QuestionCategory = { slug: string; title: string };

export const questionCategories = [
  { slug: "check-safte", title: "چک و سفته" },
  { slug: "melki-ejare", title: "ملکی و اجاره" },
  { slug: "motalebe", title: "مطالبه طلب" },
  { slug: "gharardad", title: "قرارداد" },
  { slug: "khanevade", title: "خانواده و مهریه" },
  { slug: "ers", title: "ارث و وصیت" },
  { slug: "kar", title: "کار و بیمه" },
  { slug: "keyfari", title: "کیفری" },
  { slug: "sayer", title: "سایر" },
] as const satisfies readonly QuestionCategory[];

export type QuestionCategorySlug = (typeof questionCategories)[number]["slug"];

export const QUESTION_CATEGORY_SLUGS = questionCategories.map((category) => category.slug) as [
  QuestionCategorySlug,
  ...QuestionCategorySlug[],
];

export function questionCategoryTitle(slug: string): string {
  return questionCategories.find((category) => category.slug === slug)?.title ?? "سایر";
}

export function isQuestionCategory(value: string): value is QuestionCategorySlug {
  return (QUESTION_CATEGORY_SLUGS as string[]).includes(value);
}
