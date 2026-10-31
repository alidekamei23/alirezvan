import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { TrackPanel } from "@/components/questions/TrackPanel";
import { QUESTIONS_HREF, TRACK_HREF, questionsCopy, trackCopy } from "@/content/questions";
import { pageMetadata } from "@/lib/seo";

// A personal tool, not content: kept out of search results, and its links are not followed.
export const metadata = {
  ...pageMetadata({ title: trackCopy.metaTitle, description: trackCopy.metaDescription, path: TRACK_HREF }),
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return (
    <>
      <PageHeader
        title={trackCopy.heading}
        lead={trackCopy.lead}
        crumbs={[{ label: questionsCopy.heading, href: QUESTIONS_HREF }, { label: trackCopy.heading }]}
      />
      <Section width="reading">
        <TrackPanel />
      </Section>
    </>
  );
}
