import Image from "next/image";
import { Clock, MapPin, Phone } from "lucide-react";
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
import { PracticeIndex } from "@/components/PracticeIndex";
import { Section } from "@/components/Section";
import { ToolCard } from "@/components/ToolCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { lawyer } from "@/content/lawyer";
import { requestNav } from "@/content/navigation";
import { homeCopy } from "@/content/pages";
import { practiceAreas } from "@/content/practice-areas";
import { toolList } from "@/content/tools";
import { pageMetadata } from "@/lib/seo";
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

export default function Home() {
  return (
    <>
      <section className="relative isolate bg-surface py-10 md:py-16 lg:pb-0">
        <div aria-hidden="true" className="hero-dots" />
        <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          {/* Phones get the tight crop; from lg the full portrait stands on the strip below. */}
          <Image
            src={lawyer.avatar.src}
            alt={`تصویر ${lawyer.name}`}
            width={lawyer.avatar.width}
            height={lawyer.avatar.height}
            sizes="7rem"
            className="size-28 shrink-0 rounded-md border border-line lg:hidden"
          />
          <Image
            src={lawyer.photo.src}
            alt={`تصویر ${lawyer.name}`}
            width={lawyer.photo.width}
            height={lawyer.photo.height}
            sizes="(min-width: 64rem) 24rem, 1px"
            preload
            className="hero-portrait hidden h-auto w-96 shrink-0 lg:order-last lg:block"
          />
          <div className="max-w-reading lg:self-center lg:pb-16">
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
        <Grid cols={2}>
          {toolList.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </Grid>
      </Section>

      <Section id="guides" title="راهنماهای حقوقی">
        <EmptyState
          title="راهنماها در حال آماده‌سازی است"
          description="راهنماهای هر حوزه پس از بازبینی حقوقی در همین بخش منتشر می‌شود."
        />
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
                <Clock aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-muted" />
                <span>{lawyer.workingHours}</span>
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
