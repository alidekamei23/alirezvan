// PracticeHub — the full page template for a practice area, driven by one entry of
// content/practice-areas.ts: problem summary, the legal route as steps, the related
// calculators, FAQs (with FAQPage schema), the newest blog posts of the area, links to the
// area's questions in the Q&A section, and the contact band.
// Usage (in app/<slug>/page.tsx): <PracticeHub area={getPracticeArea("check-safte")} />
import { MessageCircleQuestion } from "lucide-react";
import { ContactCta } from "@/components/ContactCta";
import { EmptyState } from "@/components/EmptyState";
import { Grid } from "@/components/Grid";
import { LinkButton } from "@/components/LinkButton";
import { PostCard } from "@/components/PostCard";
import { Faq } from "@/components/Faq";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { Steps } from "@/components/Steps";
import { ToolCard } from "@/components/ToolCard";
import type { PracticeArea } from "@/content/practice-areas";
import { ASK_HREF, questionsCopy } from "@/content/questions";
import { blogHref, getPostsByArea } from "@/lib/blog";
import { questionCategoryHref, toolsForArea } from "@/lib/links";

const POSTS_ON_HUB = 3;

export async function PracticeHub({ area }: { area: PracticeArea }) {
  const posts = await getPostsByArea(area.slug);
  const [lead, ...rest] = area.intro;
  const tools = toolsForArea(area.slug);

  return (
    <>
      <PageHeader title={area.heading} lead={lead} crumbs={[{ label: area.title }]}>
        {rest.map((paragraph) => (
          <p key={paragraph} className="mt-4 text-ink">
            {paragraph}
          </p>
        ))}
      </PageHeader>

      <Section id="route" title="مسیر حقوقی">
        <Steps items={area.steps} />
      </Section>

      {tools.length > 0 && (
        <Section id="tool" tone="muted" title="ابزارهای مرتبط">
          <Grid cols={tools.length % 3 === 1 ? 2 : 3}>
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </Grid>
        </Section>
      )}

      <Section id="faq" tone="surface" title="پرسش‌های پرتکرار">
        <Faq items={area.faqs} schema />
      </Section>

      <Section id="blog" title={`مقاله‌های ${area.title}`}>
        {posts.length === 0 ? (
          <EmptyState
            className="max-w-reading"
            title="هنوز مقاله‌ای در این حوزه منتشر نشده است"
            description="مقاله‌های این حوزه پس از آماده شدن در همین بخش دیده می‌شوند."
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, POSTS_ON_HUB).map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} headingLevel="h3" />
                </li>
              ))}
            </ul>
            {posts.length > POSTS_ON_HUB && (
              <div className="mt-8">
                <LinkButton href={blogHref(area.slug)} variant="secondary">
                  همه مقاله‌های {area.title}
                </LinkButton>
              </div>
            )}
          </>
        )}
      </Section>

      <Section id="questions" tone="surface" title={`پرسش و پاسخ ${area.title}`}>
        <p className="max-w-reading text-ink">{questionsCopy.hubLead}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href={questionCategoryHref(area.slug)} variant="secondary">
            پرسش‌های {area.title}
          </LinkButton>
          <LinkButton href={ASK_HREF} variant="ghost" icon={<MessageCircleQuestion />}>
            {questionsCopy.askButton}
          </LinkButton>
        </div>
      </Section>

      <ContactCta />
    </>
  );
}
