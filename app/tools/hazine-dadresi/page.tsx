import { Badge } from "@/components/Badge";
import { ContactCta } from "@/components/ContactCta";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { HazineCalculator } from "@/components/HazineCalculator";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { Table } from "@/components/Table";
import { ToolCard } from "@/components/ToolCard";
import { hazineCopy, hazineLegalNotes } from "@/content/hazine";
import { tools } from "@/content/tools";
import { FIXED_FEES, STAGES, fixedFeeLabel, type Stage } from "@/lib/hazine/hazine-calc";
import { CATEGORY_LABELS, TARIFF_SOURCE_NOTE, type FixedFee } from "@/lib/hazine/hazine-tariff";
import { TARIFF_YEAR_LABEL } from "@/lib/hazine/present";
import { pageMetadata } from "@/lib/seo";

const tool = tools["hazine-dadresi"];

export const metadata = pageMetadata({
  title: hazineCopy.metaTitle,
  description: hazineCopy.metaDescription,
  path: tool.href,
});

const categories = Object.keys(CATEGORY_LABELS) as FixedFee["category"][];

export default function Page() {
  return (
    <>
      <PageHeader
        title={hazineCopy.heading}
        lead={hazineCopy.lead}
        crumbs={[{ label: tool.title }]}
      >
        <div className="mt-6 border-s-4 border-primary-line ps-4">
          {(Object.keys(STAGES) as Stage[]).map((stage) => (
            <p key={stage} className="font-semibold text-ink">
              {STAGES[stage].title}: {STAGES[stage].rateLabel}
            </p>
          ))}
          <p className="mt-1 text-sm text-muted">
            نرخ دعاوی مالی بر پایه تعرفه سال {TARIFF_YEAR_LABEL}.
          </p>
        </div>
      </PageHeader>

      <Section>
        <HazineCalculator />
      </Section>

      <Section id="reference" tone="surface" title="تعرفه‌ها و نکته‌ها">
        <DisclosureGroup>
          <Disclosure title={`تعرفه‌های ثابت سال ${TARIFF_YEAR_LABEL}`}>
            <div className="flex flex-col gap-6 tabular-nums">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="mb-2 font-bold text-ink">{CATEGORY_LABELS[category]}</h3>
                  <Table
                    caption={`تعرفه‌های ثابت: ${CATEGORY_LABELS[category]}`}
                    head={["عنوان", "مبلغ (ریال)"]}
                    rows={FIXED_FEES.filter((fee) => fee.category === category).map((fee) => [
                      <span key="title" className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {fee.title}
                        {!fee.verified && <Badge tone="warning">تأیید نشده</Badge>}
                      </span>,
                      <span key="amount" className="whitespace-nowrap">
                        {fixedFeeLabel(fee)}
                      </span>,
                    ])}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-reading text-sm text-muted">{TARIFF_SOURCE_NOTE}</p>
          </Disclosure>
          <Disclosure title="نکته‌های حقوقی">
            <ul className="flex max-w-reading list-disc flex-col gap-2 ps-5 text-ink marker:text-muted">
              {hazineLegalNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <Section id="related" tone="muted" title="ابزار مرتبط">
        <div className="max-w-reading">
          <ToolCard tool={tools["khesarat-takhir"]} />
        </div>
      </Section>

      <ContactCta />
    </>
  );
}
