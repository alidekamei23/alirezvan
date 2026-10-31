import { ContactCta } from "@/components/ContactCta";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { ToolIndex } from "@/components/ToolIndex";
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { TOOLS_INDEX_HREF, TOOLS_INDEX_LEAD, toolGroups, toolList } from "@/content/tools";
import { toPersianDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

const TITLE = "ابزارهای محاسبه";

export const metadata = pageMetadata({
  title: "ابزارهای محاسبه حقوقی: خسارت تأخیر، هزینه دادرسی، مهریه، سهم‌الارث و حق‌الوکاله",
  description: `${toPersianDigits(toolList.length)} ماشین‌حساب حقوقی: خسارت تأخیر تأدیه، هزینه دادرسی، دیه، مهریه به نرخ روز، سهم‌الارث، حق‌الوکاله و تمبر وکیل، دستمزد کارشناس رسمی دادگستری و مهلت‌های قانونی.`,
  path: TOOLS_INDEX_HREF,
});

export default function Page() {
  return (
    <>
      <PageHeader
        title={TITLE}
        lead={TOOLS_INDEX_LEAD}
        crumbs={[{ label: TITLE }]}
      >
        <p className="mt-4 border-s-4 border-estimate-line ps-4 text-sm text-muted">
          {ESTIMATE_DISCLAIMER}
        </p>
      </PageHeader>

      <Section>
        <div className="flex flex-col gap-12 md:gap-14">
          {toolGroups.map((group) => (
            <section key={group.id} aria-labelledby={`tools-${group.id}`}>
              <h2 id={`tools-${group.id}`} className="mb-4 text-2xl font-bold text-ink">
                {group.title}
              </h2>
              <ToolIndex tools={toolList.filter((tool) => tool.group === group.id)} />
            </section>
          ))}
        </div>
      </Section>

      <ContactCta />
    </>
  );
}
