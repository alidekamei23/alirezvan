// Writes review/hubs.md: every piece of draft copy on Home, the four practice hubs,
// About and Contact, for the lawyer to mark up. Generated from the content files, so it
// never drifts from the site. Run: npm run review:hubs
import { mkdirSync, writeFileSync } from "node:fs";
import { ESTIMATE_DISCLAIMER, SITE_DISCLAIMER } from "../content/legal.ts";
import { aboutCopy, consultationTypes, contactCopy, homeCopy } from "../content/pages.ts";
import { practiceAreas } from "../content/practice-areas.ts";
import { toolList } from "../content/tools.ts";
import { toPersianDigits } from "../lib/format.ts";

const out: string[] = [];
const add = (...lines: string[]) => out.push(...lines, "");

add(
  "# متن‌های پیش‌نویس سایت برای بازبینی حقوقی",
  "",
  "جناب آقای رضوان، این فایل همه متن‌هایی را دارد که در صفحه اصلی، چهار صفحه حوزه کاری، «درباره» و «تماس» نمایش داده می‌شود. هیچ‌کدام بازبینی حقوقی نشده است.",
);
add(
  "لطفاً زیر هر مورد یکی از این سه را بنویسید:",
  "",
  "- **تأیید**",
  "- **اصلاح:** متن درست",
  "- **حذف**",
);
add(
  "در نگارش این پیش‌نویس‌ها عمداً از ذکر مهلت، مبلغ و شماره ماده قانونی خودداری شده است. اگر جایی ذکر آن‌ها لازم است، اضافه بفرمایید. همچنین اگر عبارتی از نظر مقررات تبلیغ وکلا مناسب نیست، علامت بزنید.",
);

add("---", "", "## ۱. متن‌های عمومی");
add("**جمله معرفی در صفحه اصلی:**", "", `> ${homeCopy.lead}`, "", "نظر:");
add("**سلب مسئولیت پایین همه صفحه‌ها:**", "", `> ${SITE_DISCLAIMER}`, "", "نظر:");
add(
  "**اعلان زیر نتیجه ماشین‌حساب‌ها (متن ثابت):**",
  "",
  `> ${ESTIMATE_DISCLAIMER}`,
  "",
  "نظر:",
);
for (const tool of toolList) {
  add(`**توضیح ابزار «${tool.title}»:**`, "", `> ${tool.summary}`, "", "نظر:");
}

practiceAreas.forEach((area, index) => {
  add("---", "", `## ${toPersianDigits(index + 2)}. حوزه «${area.title}»`);
  add(`**عنوان صفحه:** ${area.heading}`, "", "نظر:");
  add(`**توضیح کوتاه در فهرست حوزه‌ها:** ${area.summary}`, "", "نظر:");
  add(`**توضیح برای موتور جست‌وجو:** ${area.metaDescription}`, "", "نظر:");
  add("### مقدمه");
  for (const paragraph of area.intro) add(`> ${paragraph}`);
  add("نظر:");
  add("### مسیر حقوقی");
  area.steps.forEach((step, i) => {
    add(`**گام ${toPersianDigits(i + 1)}: ${step.title}**`, "", `> ${step.text}`, "", "نظر:");
  });
  add("### پرسش‌های پرتکرار");
  area.faqs.forEach((faq, i) => {
    add(`**پرسش ${toPersianDigits(i + 1)}: ${faq.q}**`, "", `> ${faq.a}`, "", "نظر:");
  });
});

const next = practiceAreas.length + 2;
add("---", "", `## ${toPersianDigits(next)}. صفحه «درباره وکیل»`);
add(`**عنوان صفحه:** ${aboutCopy.heading}`, "", "نظر:");
add("**مقدمه:**", "", `> ${aboutCopy.intro}`, "", "نظر:");
add(`### ${aboutCopy.processHeading}`);
aboutCopy.process.forEach((step, i) => {
  add(`**گام ${toPersianDigits(i + 1)}: ${step.title}**`, "", `> ${step.text}`, "", "نظر:");
});
add("### انواع مشاوره");
add(...consultationTypes.map((type) => `- ${type.title}: ${type.description}`));
add("نظر (مدت‌ها درست است؟ هزینه هر نوع مشاوره در سایت نوشته شود؟):");

add("---", "", `## ${toPersianDigits(next + 1)}. صفحه «تماس»`);
add(`**عنوان صفحه:** ${contactCopy.heading}`, "", "نظر:");
add("**مقدمه:**", "", `> ${contactCopy.intro}`, "", "نظر:");

add("---", "", `## ${toPersianDigits(next + 2)}. اطلاعاتی که هنوز دریافت نشده است`);
add(
  "- مرجع صدور پروانه، شماره پروانه و نشانی صفحه استعلام پروانه",
  "- معرفی کوتاه (سوابق کاری) و تحصیلات",
  "- نشانی دقیق دفتر، ساعات کاری و موقعیت روی نقشه",
  "- تلفن دفتر، تلفن همراه، شماره واتس‌اپ و نام کاربری بله",
  "- نرخ تبدیل ودیعه به اجاره برای ماشین‌حساب اجاره",
  "- هزینه انواع مشاوره، در صورتی که باید در سایت نمایش داده شود",
);

mkdirSync(new URL("../review/", import.meta.url), { recursive: true });
writeFileSync(new URL("../review/hubs.md", import.meta.url), out.join("\n"));
console.log(`review/hubs.md written (${out.length} lines)`);
