// PracticeHub — the full page template for a practice area, driven by one entry of
// content/practice-areas.ts: problem summary, the legal route as steps, the related
// calculator, FAQs (with FAQPage schema), guides, and the contact band.
// Usage (in app/<slug>/page.tsx): <PracticeHub area={getPracticeArea("check-safte")} />
import { ContactCta } from "@/components/ContactCta";
import { DraftNotice } from "@/components/DraftNotice";
import { EmptyState } from "@/components/EmptyState";
import { Faq } from "@/components/Faq";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { Steps } from "@/components/Steps";
import { ToolCard } from "@/components/ToolCard";
import type { PracticeArea } from "@/content/practice-areas";
import { tools } from "@/content/tools";

export function PracticeHub({ area }: { area: PracticeArea }) {
  const [lead, ...rest] = area.intro;
  const tool = area.relatedTool ? tools[area.relatedTool] : null;

  return (
    <>
      <PageHeader title={area.heading} lead={lead} crumbs={[{ label: area.title }]}>
        {rest.map((paragraph) => (
          <p key={paragraph} className="mt-4 text-ink">
            {paragraph}
          </p>
        ))}
        {!area.reviewed && <DraftNotice className="mt-6" />}
      </PageHeader>

      <Section id="route" title="مسیر حقوقی">
        <Steps items={area.steps} />
      </Section>

      {tool && (
        <Section id="tool" tone="muted" title="ابزار مرتبط">
          <div className="max-w-reading">
            <ToolCard tool={tool} />
          </div>
        </Section>
      )}

      <Section id="faq" tone="surface" title="پرسش‌های پرتکرار">
        <Faq items={area.faqs} schema />
      </Section>

      <Section id="guides" title={`راهنماهای ${area.title}`}>
        {/* Replaced by the guides list in session 7. */}
        <EmptyState
          className="max-w-reading"
          title="راهنماهای این حوزه در حال آماده‌سازی است"
          description="راهنماها پس از بازبینی حقوقی در همین بخش منتشر می‌شود."
        />
      </Section>

      <ContactCta />
    </>
  );
}
