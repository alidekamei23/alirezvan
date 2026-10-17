// RelatedTools — the band at the end of a calculator page that links to the other
// calculators. Usage: <RelatedTools current="mahrieh" />
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { ToolCard } from "@/components/ToolCard";
import { toolList, type ToolSlug } from "@/content/tools";

export function RelatedTools({ current }: { current: ToolSlug }) {
  const others = toolList.filter((tool) => tool.slug !== current);
  return (
    <Section id="related" tone="muted" title="ابزارهای مرتبط">
      <Grid cols={2}>
        {others.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </Grid>
    </Section>
  );
}
