import { TextPage } from "@/components/TextPage";
import { privacyCopy } from "@/content/pages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: privacyCopy.heading,
  description: privacyCopy.metaDescription,
  path: "/privacy",
});

export default function PrivacyPage() {
  // TODO: lawyer review. Set reviewed to true once the copy is approved.
  return <TextPage copy={privacyCopy} crumb={privacyCopy.heading} reviewed={false} />;
}
