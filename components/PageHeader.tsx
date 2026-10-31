// PageHeader — the top of every inner page: breadcrumbs, the single h1, an optional lead
// paragraph and optional extra content (notices, actions).
// Usage: <PageHeader title="تماس با دفتر" lead="…" crumbs={[{ label: "تماس" }]} />
// «خانه» is added to the breadcrumbs for you, and the trail is also emitted as
// BreadcrumbList JSON-LD, so a page that uses PageHeader must not add its own.
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

export function PageHeader({
  title,
  lead,
  crumbs,
  children,
}: {
  title: string;
  lead?: string;
  /** Trail after «خانه»; the last item is the current page. */
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  const trail: Crumb[] = [{ label: "خانه", href: "/" }, ...crumbs];
  return (
    <div className="border-b border-line bg-surface pt-3 pb-10 md:pb-12">
      <Container>
        <Breadcrumbs items={trail} />
        <div className="mt-4 max-w-reading">
          <h1 className="text-3xl font-black text-ink">{title}</h1>
          {lead && <p className="mt-4 text-lg text-ink">{lead}</p>}
          {children}
        </div>
      </Container>
      <JsonLd data={breadcrumbSchema(trail.map((crumb) => ({ name: crumb.label, href: crumb.href })))} />
    </div>
  );
}
