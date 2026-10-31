// Writes review/site-copy.md: every piece of public copy that waits for the lawyer's review
// (the lines marked "TODO: lawyer review" across the site), grouped by page, plus what only
// the lawyer can supply. Generated from the content files, so it never drifts from the
// site. Approved blog posts are not included. Run: npm run review:copy
import { mkdirSync, writeFileSync } from "node:fs";
import { diyehClosingNote, diyehCopy, diyehLegalNotes } from "../content/diyeh.ts";
import { ersCopy, ersLegalNotes, ersRules } from "../content/ers.ts";
import { hazineCopy, hazineLegalNotes } from "../content/hazine.ts";
import { karshenasiCopy, karshenasiLegalNotes } from "../content/karshenasi.ts";
import { ESTIMATE_DISCLAIMER, SITE_DISCLAIMER } from "../content/legal.ts";
import { mahriehCopy, mahriehLegalNotes } from "../content/mahrieh.ts";
import { holidaySourceNotes, mohlatCopy, mohlatLimits, mohlatRules } from "../content/mohlat.ts";
import {
  aboutCopy,
  blogCopy,
  consultationTypes,
  contactCopy,
  disclaimerCopy,
  homeCopy,
  privacyCopy,
  requestCopy,
} from "../content/pages.ts";
import { practiceAreas } from "../content/practice-areas.ts";
import { questionCategories } from "../content/question-categories.ts";
import { askCopy, questionsCopy } from "../content/questions.ts";
import { tadiehCopy, tadiehLegalNotes } from "../content/tadieh.ts";
import { TOOLS_INDEX_LEAD, toolList, tools, type ToolSlug } from "../content/tools.ts";
import { vekalatCopy, vekalatLegalNotes, vekalatTableNotes } from "../content/vekalat.ts";
import { toPersianDigits } from "../lib/format.ts";

const out: string[] = [];
const add = (...lines: string[]) => out.push(...lines, "");
/** One text to review, with room for the lawyer's answer. */
const item = (label: string, ...paragraphs: string[]) =>
  add(`**${label}:**`, "", ...paragraphs.map((p) => `> ${p}`), "", "نظر:");
/** A list reviewed as a whole: each entry numbered, one answer line each. */
const list = (entries: string[]) =>
  entries.forEach((entry, i) => add(`${toPersianDigits(i + 1)}. ${entry}`, "", "   نظر:"));

let section = 0;
const heading = (title: string) => {
  section += 1;
  add("---", "", `## ${toPersianDigits(section)}. ${title}`);
};

// --- Introduction ---

add(
  "# متن‌های پیش‌نویس سایت برای بازبینی حقوقی",
  "",
  "جناب آقای رضوان، این فایل همه متن‌های عمومی سایت را دارد که هنوز بازبینی حقوقی نشده‌اند: صفحه اصلی، چهار صفحه حوزه کاری، هشت ماشین‌حساب، بخش پرسش و پاسخ و صفحه‌های ثابت. مقاله‌های وبلاگ که پیش‌تر تأیید فرموده‌اید در این فایل نیستند.",
);
add(
  "لطفاً زیر هر مورد یکی از این سه را بنویسید:",
  "",
  "- **تأیید**",
  "- **اصلاح:** متن درست",
  "- **حذف**",
);
add(
  "متن‌های صفحه‌های حوزه کاری عمداً بدون ذکر مهلت، مبلغ و شماره ماده نوشته شده‌اند. متن ماشین‌حساب‌ها به مواد قانونی و تعرفه‌ها استناد می‌کند؛ لطفاً درستی استنادها را هم بررسی بفرمایید. اگر عبارتی از نظر مقررات تبلیغ وکلا مناسب نیست، علامت بزنید.",
);
add(
  "تا همه موارد این فایل تأیید نشده، سایت برای موتورهای جست‌وجو بسته می‌ماند.",
);

// --- What only the lawyer can supply ---

heading("اطلاعات و تصمیم‌هایی که از شما لازم است");
add(
  "### اطلاعات",
  "",
  "1. **نشانی اینترنتی صفحه استعلام پروانه در سامانه کانون.** طبق ضوابط کانون، سایت باید به صفحه رسمی استعلام پروانه لینک بدهد. این لینک در پایین همه صفحه‌ها، کارت معرفی وکیل و نوار پروانه صفحه اصلی نشان داده می‌شود و تا دریافت آن پنهان است.",
  "2. **معرفی کوتاه (سوابق کاری) و تحصیلات.** بخش «سوابق و تحصیلات» صفحه «درباره» تا دریافت آن پنهان است.",
  "3. **موقعیت دفتر روی نقشه** (لینک نشان یا Google Maps). صفحه «تماس» تا آن زمان نقشه ندارد.",
  "4. **نام کاربری بله.** تا آن زمان دکمه بله نمایش داده نمی‌شود.",
  "5. **هزینه انواع مشاوره**، اگر باید در سایت نوشته شود.",
);

add(
  "### ماشین‌حساب‌های مرتبط با هر حوزه",
  "",
  "در صفحه هر حوزه این ماشین‌حساب‌ها معرفی می‌شوند و صفحه هر ماشین‌حساب به حوزه‌های خودش لینک می‌دهد. لطفاً اگر ابزاری به حوزه‌ای مربوط نیست یا ابزاری جا افتاده، بفرمایید.",
);
const toolTitles = (slugs: readonly ToolSlug[]) => slugs.map((slug) => tools[slug].title).join("، ");
add(...practiceAreas.map((area) => `- **${area.title}:** ${toolTitles(area.relatedTools)}`));
add("نظر:");

add(
  "### دسته‌های بخش پرسش و پاسخ",
  "",
  "پرسش‌کننده یکی از این دسته‌ها را انتخاب می‌کند. دسته‌هایی که هم‌نام حوزه‌های کاری‌اند به صفحه همان حوزه و ابزارهایش لینک می‌دهند؛ بقیه به ابزارهای نوشته‌شده جلویشان.",
);
add(
  ...questionCategories.map((category) => {
    const area = practiceAreas.find((candidate) => candidate.slug === category.slug);
    const linked = area
      ? `صفحه حوزه و ابزارهای آن`
      : "tools" in category
        ? toolTitles(category.tools)
        : "بدون ابزار";
    return `- **${category.title}** ← ${linked}`;
  }),
);
add("نظر (دسته‌ای اضافه یا حذف شود؟):");

// --- Copy shown across the site ---

heading("متن‌های عمومی");
item("جمله معرفی در صفحه اصلی", homeCopy.lead);
item("سلب مسئولیت پایین همه صفحه‌ها", SITE_DISCLAIMER);
item("اعلان زیر نتیجه ماشین‌حساب‌ها (عبارت ثابت ضوابط)", ESTIMATE_DISCLAIMER);
item("مقدمه صفحه «ابزارهای محاسبه»", TOOLS_INDEX_LEAD);
item("مقدمه صفحه «وبلاگ»", blogCopy.lead);
add("### توضیح کوتاه هر ماشین‌حساب (در فهرست ابزارها)");
for (const tool of toolList) item(tool.title, tool.summary);

// --- Practice hubs ---

for (const area of practiceAreas) {
  heading(`حوزه «${area.title}»`);
  add(`**عنوان صفحه:** ${area.heading}`, "", "نظر:");
  add(`**توضیح کوتاه در فهرست حوزه‌ها:** ${area.summary}`, "", "نظر:");
  add(`**توضیح برای موتور جست‌وجو:** ${area.metaDescription}`, "", "نظر:");
  add("### مقدمه", "", ...area.intro.map((p) => `> ${p}`), "", "نظر:");
  add("### مسیر حقوقی");
  area.steps.forEach((step, i) => item(`گام ${toPersianDigits(i + 1)}: ${step.title}`, step.text));
  add("### پرسش‌های پرتکرار");
  area.faqs.forEach((faq, i) => item(`پرسش ${toPersianDigits(i + 1)}: ${faq.q}`, faq.a));
}

// --- Calculators ---

type Calculator = {
  title: string;
  copy: { heading: string; metaTitle: string; metaDescription: string; lead: string };
  /** Other visible lines worth a legal read: formulas, hints, captions. */
  extra?: [label: string, text: string][];
  rules?: { heading: string; groups: { title: string; items: string[] }[] };
  notes: { heading: string; entries: string[] }[];
};

const calculators: Calculator[] = [
  {
    title: tools["khesarat-takhir"].title,
    copy: tadiehCopy,
    extra: [
      ["فرمول", tadiehCopy.formula.join(" — ")],
      ["توضیح فرمول", tadiehCopy.formulaNote],
    ],
    notes: [{ heading: "نکته‌های حقوقی", entries: tadiehLegalNotes }],
  },
  {
    title: tools["hazine-dadresi"].title,
    copy: hazineCopy,
    notes: [{ heading: "نکته‌های حقوقی", entries: hazineLegalNotes }],
  },
  {
    title: tools.mahrieh.title,
    copy: mahriehCopy,
    extra: [
      ["فرمول", mahriehCopy.formula],
      ["توضیح فرمول", mahriehCopy.formulaNote],
    ],
    notes: [{ heading: "مبنای قانونی و نکته‌ها", entries: mahriehLegalNotes }],
  },
  {
    title: tools["dastmozd-karshenasi"].title,
    copy: karshenasiCopy,
    extra: [
      ["توضیح منبع عددها", karshenasiCopy.sourceNote],
      ["توضیح نرخ پله‌ها", karshenasiCopy.tierNote],
    ],
    notes: [{ heading: "مبنای قانونی و نکته‌ها", entries: karshenasiLegalNotes }],
  },
  {
    title: tools["sahm-ol-ers"].title,
    copy: ersCopy,
    extra: [
      ["راهنمای ورود برادر و خواهر", ersCopy.hajibHint],
      ["راهنمای عمو، عمه، دایی و خاله", ersCopy.uncleHint],
    ],
    rules: { heading: "قواعد اصلی تقسیم", groups: ersRules },
    notes: [{ heading: "نکته‌های حقوقی و محدودیت‌ها", entries: ersLegalNotes }],
  },
  {
    title: tools["haghol-vekale"].title,
    copy: vekalatCopy,
    notes: [
      {
        heading: "توضیح زیر جدول تعرفه",
        // {split} is filled in on the page with the stage percentages of Article 21.
        entries: vekalatTableNotes.map((note) => note.replace("{split}", "[درصد هر مرحله از جدول]")),
      },
      { heading: "مبنای قانونی و نکته‌ها", entries: vekalatLegalNotes },
    ],
  },
  {
    title: tools.mohlat.title,
    copy: mohlatCopy,
    extra: [["راهنمای مهلت دلخواه", mohlatCopy.customHint]],
    rules: { heading: "قواعد محاسبه مهلت", groups: mohlatRules },
    notes: [
      { heading: "منبع تعطیلات رسمی", entries: holidaySourceNotes },
      { heading: "محدودیت‌ها", entries: mohlatLimits },
    ],
  },
  {
    title: tools.diyeh.title,
    copy: diyehCopy,
    extra: [
      ["گزینه قتل در ماه حرام", diyehCopy.haram],
      ["گزینه جنایت بر میت", diyehCopy.deceased],
      ["گزینه قاعده ثلث", `${diyehCopy.apply560} — ${diyehCopy.apply560Hint}`],
      ["سهم عاقله و مرتکب", `${diyehCopy.aqelehShare} / ${diyehCopy.offenderShare}`],
    ],
    notes: [
      {
        heading: "نکات قانونی",
        entries: [...diyehLegalNotes.map((note) => `**${note.title}:** ${note.text}`), diyehClosingNote],
      },
    ],
  },
];

for (const calculator of calculators) {
  heading(`ماشین‌حساب «${calculator.title}»`);
  add(`**عنوان صفحه:** ${calculator.copy.heading}`, "", "نظر:");
  item("عنوان در نتایج جست‌وجو", calculator.copy.metaTitle);
  item("توضیح در نتایج جست‌وجو", calculator.copy.metaDescription);
  item("مقدمه", calculator.copy.lead);
  for (const [label, text] of calculator.extra ?? []) item(label, text);
  if (calculator.rules) {
    add(`### ${calculator.rules.heading}`);
    for (const group of calculator.rules.groups) {
      add(`**${group.title}**`);
      list(group.items);
    }
  }
  for (const notes of calculator.notes) {
    add(`### ${notes.heading}`);
    list(notes.entries);
  }
}

// --- Q&A ---

heading("بخش پرسش و پاسخ");
item("مقدمه صفحه پرسش و پاسخ", questionsCopy.lead);
item("توضیح زیر هر پاسخ", questionsCopy.disclaimer);
item("مقدمه بخش پرسش و پاسخ در صفحه هر حوزه", questionsCopy.hubLead);
item("مقدمه فرم پرسیدن", askCopy.lead);
item("هشدار حریم خصوصی در فرم پرسیدن", askCopy.privacyWarning);
item("رضایت‌نامه فرم پرسیدن", askCopy.consent);

// --- Fixed pages ---

heading("صفحه «درباره وکیل»");
add(`**عنوان صفحه:** ${aboutCopy.heading}`, "", "نظر:");
item("مقدمه", aboutCopy.intro);
add(`### ${aboutCopy.processHeading}`);
aboutCopy.process.forEach((step, i) => item(`گام ${toPersianDigits(i + 1)}: ${step.title}`, step.text));
add("### انواع مشاوره");
add(...consultationTypes.map((type) => `- ${type.title}: ${type.description}`));
add("نظر (مدت‌ها درست است؟):");

heading("صفحه «تماس»");
add(`**عنوان صفحه:** ${contactCopy.heading}`, "", "نظر:");
item("مقدمه", contactCopy.intro);

heading("صفحه «درخواست مشاوره»");
item("مقدمه", requestCopy.lead);
add(`**${requestCopy.prepareHeading}:**`, "", ...requestCopy.prepare.map((entry) => `- ${entry}`));
add(`> ${requestCopy.note}`, "", "نظر:");

for (const copy of [privacyCopy, disclaimerCopy]) {
  heading(`صفحه «${copy.heading}»`);
  item("مقدمه", copy.lead);
  for (const part of copy.sections) item(part.heading, ...part.paragraphs);
}

mkdirSync(new URL("../review/", import.meta.url), { recursive: true });
writeFileSync(new URL("../review/site-copy.md", import.meta.url), out.join("\n"));
console.log(`review/site-copy.md written (${out.length} lines, ${section} sections)`);
