import { TextPage } from "@/components/TextPage";
import { disclaimerCopy } from "@/content/pages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: disclaimerCopy.heading,
  description: disclaimerCopy.metaDescription,
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return <TextPage copy={disclaimerCopy} crumb={disclaimerCopy.heading} />;
}
