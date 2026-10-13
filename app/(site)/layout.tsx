import { SiteShell } from "@/components/SiteShell";

// Every public page. The route group "(site)" does not appear in URLs; it only keeps the
// public header, footer and contact bar away from /admin.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
