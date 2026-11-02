// RelatedTools — the end of a calculator page: the latest posts of the practice hubs that
// use this calculator (left out when there are none), then a band with links to those hubs
// and every other calculator, the closest first (lib/links.ts).
// Usage: <RelatedTools current="mahrieh" />
import { Grid } from "@/components/Grid";
import { LinkButton } from "@/components/LinkButton";
import { PostCard } from "@/components/PostCard";
import { Section } from "@/components/Section";
import { ToolCard } from "@/components/ToolCard";
import { blogCopy } from "@/content/pages";
import { TOOLS_INDEX_HREF, type ToolSlug } from "@/content/tools";
import { getAllPosts } from "@/lib/blog";
import { areasForTool, relatedToolsFor } from "@/lib/links";

const POSTS_ON_TOOL = 3;

export async function RelatedTools({ current }: { current: ToolSlug }) {
  const areas = areasForTool(current);
  const others = relatedToolsFor(current);
  const areaSlugs = new Set<string>(areas.map((area) => area.slug));
  // Newest first, as getAllPosts returns them.
  const posts = (await getAllPosts()).filter((post) => areaSlugs.has(post.area)).slice(0, POSTS_ON_TOOL);
  return (
    <>
      {posts.length > 0 && (
        <Section id="posts" title={blogCopy.relatedHeading}>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </Section>
      )}
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
    </>
  );
}
