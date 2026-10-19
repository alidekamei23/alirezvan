import { ContactCta } from "@/components/ContactCta";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { PageHeader } from "@/components/PageHeader";
import { RelatedTools } from "@/components/RelatedTools";
import { Section } from "@/components/Section";
import { Table } from "@/components/Table";
import { VekalatCalculator } from "@/components/VekalatCalculator";
import { tools } from "@/content/tools";
import { vekalatCopy, vekalatLegalNotes, vekalatTableNotes } from "@/content/vekalat";
import { pageMetadata } from "@/lib/seo";
import {
  CIVIL_SPLIT,
  FINAL_RATE_TEXT,
  FINAL_THRESHOLD_TEXT,
  financialRows,
} from "@/lib/vekalat/present";
import { REGULATION } from "@/lib/vekalat/vekalat-calc";

const tool = tools["haghol-vekale"];

export const metadata = pageMetadata({
  title: vekalatCopy.metaTitle,
  description: vekalatCopy.metaDescription,
  path: tool.href,
});

export default function Page() {
  return (
    <>
      <PageHeader title={vekalatCopy.heading} lead={vekalatCopy.lead} crumbs={[{ label: tool.title }]}>
        <div className="mt-6 border-s-4 border-primary-line ps-4">
          <p className="font-semibold text-ink">{REGULATION}</p>
          <p className="mt-1 text-sm text-muted">
            به‌همراه ماده ۱۰۳ قانون مالیات‌های مستقیم برای تمبر مالیاتی.
          </p>
        </div>
      </PageHeader>

      <Section>
        <VekalatCalculator />
      </Section>

      <Section id="reference" tone="surface" title="تعرفه‌ها و نکته‌ها">
        <DisclosureGroup>
          <Disclosure title="جدول دعاوی مالی (ماده ۹)">
            <p className="mb-4 max-w-reading text-ink">
              اگر حکم بدوی از حیث بهای خواسته قطعی باشد، حق‌الوکاله {FINAL_RATE_TEXT} است
              (دعاوی تا {FINAL_THRESHOLD_TEXT} در دادگاه صلح قطعی‌اند). اگر قابل تجدیدنظر باشد،
              به‌صورت پلکانی و نسبت به مازاد هر پله حساب می‌شود:
            </p>
            <div className="max-w-reading">
              <Table
                caption="پله‌های حق‌الوکاله دعاوی مالی قابل تجدیدنظر"
                head={["از بهای خواسته (ریال)", "تا (ریال)", "نرخ"]}
                rows={financialRows().map((row) => [
                  <span key="from" className="whitespace-nowrap tabular-nums">
                    {row.from}
                  </span>,
                  <span key="to" className="whitespace-nowrap tabular-nums">
                    {row.to}
                  </span>,
                  row.rate,
                ])}
              />
            </div>
            <ul className="mt-4 flex max-w-reading list-disc flex-col gap-1 ps-5 text-sm text-muted">
              {vekalatTableNotes.map((note) => (
                <li key={note}>{note.replace("{split}", CIVIL_SPLIT)}</li>
              ))}
            </ul>
          </Disclosure>
          <Disclosure title="مبنای قانونی و نکته‌ها">
            <ul className="flex max-w-reading list-disc flex-col gap-2 ps-5 text-ink marker:text-muted">
              {vekalatLegalNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <RelatedTools current="haghol-vekale" />

      <ContactCta />
    </>
  );
}
