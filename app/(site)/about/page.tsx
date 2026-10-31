import { ContactCta } from "@/components/ContactCta";
import { JsonLd } from "@/components/JsonLd";
import { LawyerCard } from "@/components/LawyerCard";
import { PageHeader } from "@/components/PageHeader";
import { PracticeIndex } from "@/components/PracticeIndex";
import { Section } from "@/components/Section";
import { Steps } from "@/components/Steps";
import { lawyer } from "@/content/lawyer";
import { aboutCopy, consultationTypes } from "@/content/pages";
import { practiceAreas } from "@/content/practice-areas";
import { profilePageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "درباره وکیل",
  description: aboutCopy.metaDescription,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title={aboutCopy.heading}
        lead={aboutCopy.intro}
        crumbs={[{ label: "درباره وکیل" }]}
      />

      <Section id="license" title="مشخصات پروانه وکالت">
        <div className="max-w-reading">
          <LawyerCard />
        </div>
      </Section>

      {/* TODO(lawyer): bio and education. The section is hidden until they arrive. */}
      {(lawyer.bio || lawyer.education.length > 0) && (
        <Section id="bio" tone="surface" title="سوابق و تحصیلات">
          <div className="max-w-reading">
            {lawyer.bio && <p>{lawyer.bio}</p>}
            {lawyer.education.length > 0 && (
              <ul className="mt-4 list-disc ps-6">
                {lawyer.education.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}

      <Section id="practice" title="حوزه‌های کاری">
        <PracticeIndex areas={practiceAreas} />
      </Section>

      <Section id="process" tone="surface" title={aboutCopy.processHeading}>
        <Steps items={aboutCopy.process} />
        <h3 className="mt-10 text-xl font-bold text-ink">انواع مشاوره</h3>
        <dl className="mt-3 max-w-reading divide-y divide-line border-y border-line">
          {consultationTypes.map((type) => (
            <div key={type.value} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="font-semibold text-ink">{type.title}</dt>
              <dd className="text-muted">{type.description}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <ContactCta />

      <JsonLd data={profilePageSchema()} />
    </>
  );
}
