// PracticeHub — the full page template for a practice area, driven by one entry of
// content/practice-areas.ts: problem summary, the legal route as steps, the related
// calculator, FAQs (with FAQPage schema), the newest blog posts of the area, and the
// contact band.
// Usage (in app/<slug>/page.tsx): <PracticeHub area={getPracticeArea("check-safte")} />
import { ContactCta } from "@/components/ContactCta";
import { DraftNotice } from "@/components/DraftNotice";
import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/LinkButton";
import { PostCard } from "@/components/PostCard";
import { Faq } from "@/components/Faq";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { Steps } from "@/components/Steps";
import { ToolCard } from "@/components/ToolCard";
import type { PracticeArea } from "@/content/practice-areas";
import { tools } from "@/content/tools";
import { blogHref, getPostsByArea } from "@/lib/blog";

const POSTS_ON_HUB = 3;

export async function PracticeHub({ area }: { area: PracticeArea }) {
  const posts = await getPostsByArea(area.slug);
  const [lead, ...rest] = area.intro;
  const tool = area.relatedTool ? tools[area.relatedTool] : null;

  return (
    <>
      <PageHeader title={area.heading} lead={lead} crumbs={[{ label: area.title }]}>
        {rest.map((paragraph) => (
          <p key={paragraph} className="mt-4 text-ink">
            {paragraph}
          </p>
        ))}
        {!area.reviewed && <DraftNotice className="mt-6" />}
      </PageHeader>

      <Section id="route" title="مسیر حقوقی">
        <Steps items={area.steps} />
      </Section>

      {tool && (
        <Section id="tool" tone="muted" title="ابزار مرتبط">
          <div className="max-w-reading">
            <ToolCard tool={tool} />
          </div>
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

      <ContactCta />
    </>
  );
}
