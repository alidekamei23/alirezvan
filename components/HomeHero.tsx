// HomeHero — the top of Home: the lawyer's photo, name and grade, the lead and the
// consultation request. Used once, on Home.
// Phones (below `md`) get a dark emerald band: round photo beside the name, the lead and
// one light button underneath; call and WhatsApp stay in the sticky contact bar. Every
// phone-only style is a `max-md:` addition, so from `md` the hero is the white one with
// the full portrait and its contact buttons, unchanged.
// Usage: <HomeHero />
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { BaleButton } from "@/components/BaleButton";
import { CallButton } from "@/components/CallButton";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { lawyer } from "@/content/lawyer";
import { requestNav } from "@/content/navigation";
import { homeCopy } from "@/content/pages";

export function HomeHero() {
  return (
    // From md the hero has no block padding: the portrait file carries its own top margin,
    // and this keeps the license strip below it inside the first screen on laptops.
    <section className="relative isolate bg-surface py-10 md:py-0 max-md:bg-inverse-surface max-md:py-8 max-md:focus-inverse">
      <div aria-hidden="true" className="hero-dots max-md:hidden" />
      {/* Phones: a two-column grid (photo | name), and the text block below dissolves into
          it with `contents` so the lead and the button span both columns. */}
      <Container className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10 lg:gap-16 max-md:grid max-md:grid-cols-[auto_1fr] max-md:items-center max-md:gap-x-4">
        {/* Phones get the tight round crop; from md the full portrait stands on the strip below. */}
        <Image
          src={lawyer.avatar.src}
          alt={`تصویر ${lawyer.name}`}
          width={lawyer.avatar.width}
          height={lawyer.avatar.height}
          sizes="6rem"
          className="size-24 shrink-0 rounded-full border-2 border-on-inverse-muted md:hidden"
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
        <div className="max-w-reading md:self-center md:py-10 lg:pt-0 max-md:contents">
          <h1>
            <span className="block text-3xl font-black text-ink max-md:text-on-inverse">
              {lawyer.name}
            </span>
            <span className="mt-1 block text-xl font-medium text-primary max-md:text-base max-md:text-on-inverse-muted">
              {lawyer.grade}
            </span>
          </h1>
          <p className="mt-5 text-lg text-ink max-md:col-span-2 max-md:mt-0 max-md:text-on-inverse">
            {homeCopy.lead}
          </p>
          {/* Phones: the light button, the one filled button on the band. */}
          <LinkButton
            href={requestNav.href}
            variant="inverse"
            size="lg"
            fullWidth
            className="col-span-2 md:hidden"
          >
            {requestNav.label}
            {/* Points left: "forward" in RTL. */}
            <ArrowLeft aria-hidden="true" className="size-5" />
          </LinkButton>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap max-md:hidden">
            <LinkButton href={requestNav.href} size="lg">
              {requestNav.label}
            </LinkButton>
            <CallButton size="lg" />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-2 max-md:hidden">
            <WhatsAppButton variant="ghost" size="sm" />
            <BaleButton variant="ghost" size="sm" />
          </div>
        </div>
      </Container>
    </section>
  );
}
