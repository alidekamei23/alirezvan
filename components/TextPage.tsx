// TextPage — the template for a plain text page (privacy, disclaimer): page header, a
// draft notice while the copy is unreviewed, and titled sections in the reading column.
// Usage: <TextPage copy={privacyCopy} crumb="حریم خصوصی" reviewed={false} />
import { DraftNotice } from "@/components/DraftNotice";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import type { TextSection } from "@/content/pages";

export function TextPage({
  copy,
  crumb,
  reviewed,
}: {
  copy: { heading: string; lead: string; sections: TextSection[] };
  crumb: string;
  /** false shows the draft notice; set true once the lawyer has approved the copy. */
  reviewed: boolean;
}) {
  return (
    <>
      <PageHeader title={copy.heading} lead={copy.lead} crumbs={[{ label: crumb }]}>
        {!reviewed && <DraftNotice className="mt-6" />}
      </PageHeader>
      <Section>
        <div className="flex max-w-reading flex-col gap-8">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-ink">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-ink">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
