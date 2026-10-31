// RelatedTools — the band at the end of a calculator page: links to the practice hubs that
// use this calculator, then every other calculator, the closest first (lib/links.ts).
// Usage: <RelatedTools current="mahrieh" />
import { Grid } from "@/components/Grid";
import { LinkButton } from "@/components/LinkButton";
import { Section } from "@/components/Section";
import { ToolCard } from "@/components/ToolCard";
import { TOOLS_INDEX_HREF, type ToolSlug } from "@/content/tools";
import { areasForTool, relatedToolsFor } from "@/lib/links";

export function RelatedTools({ current }: { current: ToolSlug }) {
  const areas = areasForTool(current);
  const others = relatedToolsFor(current);
  return (
    <Section id="related" tone="muted" title="ابزارهای مرتبط">
      {areas.length > 0 && (
        <nav aria-label="حوزه‌های کاری مرتبط" className="mb-8">
          <p className="mb-3 font-semibold text-ink">حوزه‌های کاری مرتبط با این ابزار</p>
          <ul className="flex flex-wrap gap-3">
            {areas.map((area) => (
              <li key={area.slug}>
                <LinkButton href={area.href} variant="secondary" size="sm">
                  {area.title}
                </LinkButton>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {/* Three across leaves a lone card when one is left over; two across avoids it. */}
      <Grid cols={others.length % 3 === 1 ? 2 : 3}>
        {others.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </Grid>
      <div className="mt-6">
        <LinkButton href={TOOLS_INDEX_HREF} variant="ghost">
          همه ابزارهای محاسبه
        </LinkButton>
      </div>
    </Section>
  );
}
