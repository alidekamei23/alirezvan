import { ContactCta } from "@/components/ContactCta";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { MohlatCalculator } from "@/components/MohlatCalculator";
import { PageHeader } from "@/components/PageHeader";
import { RelatedTools } from "@/components/RelatedTools";
import { Section } from "@/components/Section";
import { Table } from "@/components/Table";
import {
  holidaySourceNotes,
  mohlatCopy,
  mohlatLimits,
  mohlatRules,
} from "@/content/mohlat";
import { TOOLS_INDEX_HREF, tools } from "@/content/tools";
import { toPersianDigits } from "@/lib/format";
import { COMPLETE_YEARS, HOLIDAYS, MONTHS, WEEKDAYS } from "@/lib/mohlat/mohlat-calc";
import { parseKey, weekdayOf } from "@/lib/mohlat/present";
import { pageMetadata } from "@/lib/seo";

const tool = tools.mohlat;

export const metadata = pageMetadata({
  title: mohlatCopy.metaTitle,
  description: mohlatCopy.metaDescription,
  path: tool.href,
});

const holidayRows = Object.entries(HOLIDAYS).map(([key, reason]) => {
  const date = parseKey(key);
  return [
    <span key="date" className="whitespace-nowrap tabular-nums">
      {toPersianDigits(`${date.d} ${MONTHS[date.m - 1]} ${date.y}`)}
    </span>,
    WEEKDAYS[weekdayOf(date)],
    reason,
  ];
});

export default function Page() {
  return (
    <>
      <PageHeader
        title={mohlatCopy.heading}
        lead={mohlatCopy.lead}
        crumbs={[{ label: "ابزارهای محاسبه", href: TOOLS_INDEX_HREF }, { label: tool.title }]}
      >
        <div className="mt-6 border-s-4 border-primary-line ps-4">
          <p className="font-semibold text-ink">
            بر پایه مواد ۴۴۳ تا ۴۴۶ قانون آیین دادرسی مدنی
          </p>
          <p className="mt-1 text-sm text-muted">
            تعطیلات رسمی سال‌های{" "}
            {toPersianDigits(COMPLETE_YEARS.join(" و "))} کامل وارد شده است.
          </p>
        </div>
      </PageHeader>

      <Section>
        <MohlatCalculator />
      </Section>

      <Section id="reference" tone="surface" title="قواعد و تعطیلات">
        <DisclosureGroup>
          <Disclosure title="قواعد محاسبه مهلت">
            <div className="flex max-w-reading flex-col gap-6">
              {mohlatRules.map((rule) => (
                <div key={rule.title}>
                  <h3 className="font-bold text-ink">{rule.title}</h3>
                  <ul className="mt-2 flex list-disc flex-col gap-1.5 ps-5 text-ink marker:text-muted">
                    {rule.items.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Disclosure>
          <Disclosure title="تعطیلات رسمی واردشده">
            <ul className="mb-4 flex max-w-reading list-disc flex-col gap-1.5 ps-5 text-sm text-muted">
              {holidaySourceNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <div className="max-w-reading">
              <Table
                caption="تعطیلات رسمی غیر از جمعه‌ها"
                head={["تاریخ", "روز هفته", "مناسبت"]}
                rows={holidayRows}
              />
            </div>
          </Disclosure>
          <Disclosure title="محدودیت‌ها">
            <ul className="flex max-w-reading list-disc flex-col gap-2 ps-5 text-ink marker:text-muted">
              {mohlatLimits.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <RelatedTools current="mohlat" />

      <ContactCta />
    </>
  );
}
