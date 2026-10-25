import { MapPin, Phone } from "lucide-react";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Grid } from "@/components/Grid";
import { HomeHero } from "@/components/HomeHero";
import { LawyerCard } from "@/components/LawyerCard";
import { LinkButton } from "@/components/LinkButton";
import { Ltr } from "@/components/Ltr";
import { LicenseStrip } from "@/components/LicenseStrip";
import { PostCard } from "@/components/PostCard";
import { PracticeIndex } from "@/components/PracticeIndex";
import { PracticeTiles } from "@/components/PracticeTiles";
import { ScrollCue } from "@/components/ScrollCue";
import { Section } from "@/components/Section";
import { ToolCard } from "@/components/ToolCard";
import { lawyer } from "@/content/lawyer";
import { blogCopy } from "@/content/pages";
import { practiceAreas } from "@/content/practice-areas";
import { TOOLS_INDEX_HREF, homeTools } from "@/content/tools";
import { pageMetadata } from "@/lib/seo";
import { blogHref, getAllPosts } from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";

export const metadata = {
  ...pageMetadata({
    title: `${lawyer.name} | ${lawyer.grade}`,
    description:
      "وب‌سایت علی رضوان، عضو کانون وکلای دادگستری مرکز، در تهران؛ چک و سفته، ملکی و اجاره، مطالبه و طلب، قرارداد.",
    path: "/",
  }),
  // The root layout appends the lawyer's name to titles; Home already contains it.
  title: { absolute: `${lawyer.name} | ${lawyer.grade}` },
};

export default async function Home() {
  const latestPosts = (await getAllPosts()).slice(0, 3);

  return (
    <>
      <HomeHero />
      <LicenseStrip />

      {/* Phones: tiles and a cue to the rest of the page, kept close to the first screen. */}
      <Section id="practice" title="حوزه‌های کاری" className="max-md:pt-8 max-md:pb-4">
        <div className="md:hidden">
          <PracticeTiles areas={practiceAreas} />
          <ScrollCue href="#tools" label="ابزارهای محاسبه و بیشتر" className="mt-8" />
        </div>
        <div className="max-md:hidden">
          <PracticeIndex areas={practiceAreas} />
        </div>
      </Section>

      <Section
        id="tools"
        tone="muted"
        title="ابزارهای محاسبه"
        lead="نتیجه این ابزارها تخمینی است و مشاوره حقوقی محسوب نمی‌شود."
      >
        <Grid cols={3}>
          {homeTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </Grid>
        <div className="mt-6">
          <LinkButton href={TOOLS_INDEX_HREF} variant="secondary">
            همه ابزارهای محاسبه
          </LinkButton>
        </div>
      </Section>

      <Section id="blog" title="تازه‌ترین مقاله‌های وبلاگ">
        {latestPosts.length === 0 ? (
          <EmptyState title={blogCopy.emptyTitle} description={blogCopy.emptyText} />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} headingLevel="h3" />
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <LinkButton href={blogHref()} variant="secondary">
                همه مقاله‌ها
              </LinkButton>
            </div>
          </>
        )}
      </Section>

      <Section id="office" tone="surface" title="دفتر وکالت" className="border-t border-line">
        <Grid cols={2}>
          <LawyerCard />
          <Card padding="lg">
            <address className="flex flex-col gap-3 not-italic">
              <p className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-muted" />
                <span>
                  {lawyer.city}، {lawyer.address}
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Phone aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-muted" />
                <Ltr>{toPersianDigits(lawyer.phone.display)}</Ltr>
              </p>
            </address>
            <div className="mt-5">
              <LinkButton href="/contact" variant="secondary">
                نشانی و راه‌های تماس
              </LinkButton>
            </div>
          </Card>
        </Grid>
      </Section>
    </>
  );
}
