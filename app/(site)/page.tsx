import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import { BaleButton } from "@/components/BaleButton";
import { CallButton } from "@/components/CallButton";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Grid } from "@/components/Grid";
import { LawyerCard } from "@/components/LawyerCard";
import { LinkButton } from "@/components/LinkButton";
import { Ltr } from "@/components/Ltr";
import { LicenseStrip } from "@/components/LicenseStrip";
import { PostCard } from "@/components/PostCard";
import { PracticeIndex } from "@/components/PracticeIndex";
import { Section } from "@/components/Section";
import { ToolCard } from "@/components/ToolCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { lawyer } from "@/content/lawyer";
import { requestNav } from "@/content/navigation";
import { blogCopy, homeCopy } from "@/content/pages";
import { practiceAreas } from "@/content/practice-areas";
import { toolList } from "@/content/tools";
import { pageMetadata } from "@/lib/seo";
import { blogHref, getAllPosts } from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";

export const metadata = {
  ...pageMetadata({
    title: `${lawyer.name} | ${lawyer.grade}`,
    description:
      "وب‌سایت علی رضوان، وکیل پایه یک دادگستری در تهران؛ چک و سفته، ملکی و اجاره، مطالبه و طلب، قرارداد.",
    path: "/",
  }),
  // The root layout appends the lawyer's name to titles; Home already contains it.
  title: { absolute: `${lawyer.name} | ${lawyer.grade}` },
};

export default async function Home() {
  const latestPosts = (await getAllPosts()).slice(0, 3);

  return (
    <>
      {/* From md the hero has no block padding: the portrait file carries its own top margin,
          and this keeps the license strip below it inside the first screen on laptops. */}
      <section className="relative isolate bg-surface py-10 md:py-0">
        <div aria-hidden="true" className="hero-dots" />
        <Container className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10 lg:gap-16">
          {/* Phones get the tight crop; from md the full portrait stands on the strip below. */}
          <Image
            src={lawyer.avatar.src}
            alt={`تصویر ${lawyer.name}`}
            width={lawyer.avatar.width}
            height={lawyer.avatar.height}
            sizes="7rem"
            className="size-28 shrink-0 rounded-md border border-line md:hidden"
          />
          <Image
            src={lawyer.photo.src}
            alt={`تصویر ${lawyer.name}`}
            width={lawyer.photo.width}
            height={lawyer.photo.height}
            sizes="(min-width: 64rem) 24rem, (min-width: 48rem) 16rem, 1px"
            preload
            className="hero-portrait hidden h-auto w-64 shrink-0 md:order-last md:block lg:w-96"
          />
          <div className="max-w-reading md:self-center md:py-10 lg:pt-0">
            <h1>
              <span className="block text-3xl font-black text-ink">{lawyer.name}</span>
              <span className="mt-1 block text-xl font-medium text-primary">
                {lawyer.grade}
              </span>
            </h1>
            <p className="mt-5 text-lg text-ink">{homeCopy.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <LinkButton href={requestNav.href} size="lg">
                {requestNav.label}
              </LinkButton>
              <CallButton size="lg" />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-2">
              <WhatsAppButton variant="ghost" size="sm" />
              <BaleButton variant="ghost" size="sm" />
            </div>
          </div>
        </Container>
      </section>
      <LicenseStrip />

      <Section id="practice" title="حوزه‌های کاری">
        <PracticeIndex areas={practiceAreas} />
      </Section>

      <Section
        id="tools"
        tone="muted"
        title="ابزارهای محاسبه"
        lead="نتیجه این ابزارها تخمینی است و مشاوره حقوقی محسوب نمی‌شود."
      >
        <Grid cols={3}>
          {toolList.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </Grid>
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
