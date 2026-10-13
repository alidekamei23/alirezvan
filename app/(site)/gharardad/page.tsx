import { PracticeHub } from "@/components/PracticeHub";
import { getPracticeArea } from "@/content/practice-areas";
import { pageMetadata } from "@/lib/seo";

const area = getPracticeArea("gharardad");

export const metadata = pageMetadata({
  title: area.heading,
  description: area.metaDescription,
  path: area.href,
});

export default function Page() {
  return <PracticeHub area={area} />;
}
