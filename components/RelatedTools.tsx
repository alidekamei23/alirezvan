// RelatedTools — the band at the end of a calculator page that links to the other
// calculators. Usage: <RelatedTools current="mahrieh" />
import { Grid } from "@/components/Grid";
import { LinkButton } from "@/components/LinkButton";
import { Section } from "@/components/Section";
import { ToolCard } from "@/components/ToolCard";
import { TOOLS_INDEX_HREF, toolList, type ToolSlug } from "@/content/tools";

export function RelatedTools({ current }: { current: ToolSlug }) {
  const others = toolList.filter((tool) => tool.slug !== current);
  return (
    <Section id="related" tone="muted" title="ابزارهای مرتبط">
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
