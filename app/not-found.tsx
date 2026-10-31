import { NotFoundContent } from "@/components/NotFoundContent";
import { SiteShell } from "@/components/SiteShell";
import { NOT_FOUND_METADATA } from "@/lib/seo";

export const metadata = NOT_FOUND_METADATA;

// Shown for every unknown address. It sits above the "(site)" layout, so it brings the
// public frame itself. Replaces the framework default page, which is in English and
// turns black when the device is in dark mode. A notFound() inside a public page uses
// app/(site)/not-found.tsx instead, which is already inside that frame.
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
