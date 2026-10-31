// NotFoundContent — the body of the «صفحه پیدا نشد» page, without the site frame. Two
// not-found files use it: app/not-found.tsx (unknown addresses; wraps it in SiteShell
// itself) and app/(site)/not-found.tsx (notFound() inside a public page, which already
// sits in the (site) layout's frame). Usage: <NotFoundContent />
import Image from "next/image";
import { CallButton } from "@/components/CallButton";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";
import { blogCopy, notFoundCopy } from "@/content/pages";
import { blogHref } from "@/lib/blog";

/**
 * Paper, fountain pen and a sprig of leaves on a transparent background. Prepared like the
 * blog covers (scripts/blog-cover.mjs): sharp, WebP quality 80, transparent margin trimmed;
 * next/image serves the smaller sizes.
 */
const ILLUSTRATION = { src: "/images/not-found.webp", width: 640, height: 485 };

export function NotFoundContent() {
  return (
    // Less room on top than below: the illustration already opens the page.
    <div className="border-b border-line bg-surface pt-8 pb-16 md:pt-12 md:pb-24">
      <Container>
        <div className="max-w-reading">
          {/* Decorative: the heading says it all, so the image has an empty alt. Above the
              fold, so it is preloaded rather than lazy. */}
          <Image
            src={ILLUSTRATION.src}
            alt=""
            width={ILLUSTRATION.width}
            height={ILLUSTRATION.height}
            sizes="(min-width: 48rem) 15rem, 12rem"
            preload
            className="mb-6 h-auto w-48 md:w-60"
          />
          <h1 className="text-3xl font-black text-ink">{notFoundCopy.heading}</h1>
          <p className="mt-4 text-lg text-ink">{notFoundCopy.text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/" size="lg">
              {notFoundCopy.home}
            </LinkButton>
            <LinkButton href={blogHref()} variant="secondary" size="lg">
              {blogCopy.heading}
            </LinkButton>
            <CallButton variant="ghost" size="lg" />
          </div>
        </div>
      </Container>
    </div>
  );
}
