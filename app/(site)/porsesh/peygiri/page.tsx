import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { TrackPanel } from "@/components/questions/TrackPanel";
import { QUESTIONS_HREF, TRACK_HREF, questionsCopy, trackCopy } from "@/content/questions";
import { ALLOW_INDEXING, pageMetadata } from "@/lib/seo";

// A personal tool, not content: kept out of search results. (Links are followed only where
// the deployment may be indexed at all; elsewhere the root layout's nofollow stands.)
export const metadata = {
  ...pageMetadata({ title: trackCopy.metaTitle, description: trackCopy.metaDescription, path: TRACK_HREF }),
  robots: { index: false, follow: ALLOW_INDEXING },
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
