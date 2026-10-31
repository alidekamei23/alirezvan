import { NotFoundContent } from "@/components/NotFoundContent";

// Shown when a public page calls notFound() (an unknown post, question or list page). It
// renders inside the "(site)" layout, which already draws the header and footer, so it
// adds only the content; app/not-found.tsx adds the frame for addresses with no route.
export default function SiteNotFound() {
  return <NotFoundContent />;
}
