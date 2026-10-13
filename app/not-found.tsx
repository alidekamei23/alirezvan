import { CallButton } from "@/components/CallButton";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";
import { SiteShell } from "@/components/SiteShell";
import { blogCopy, notFoundCopy } from "@/content/pages";
import { blogHref } from "@/lib/blog";

export const metadata = { title: notFoundCopy.heading };

// Shown for every unknown address. It sits above the "(site)" layout, so it brings the
// public frame itself. Replaces the framework default page, which is in English and
// turns black when the device is in dark mode.
export default function NotFound() {
  return (
    <SiteShell>
      <div className="border-b border-line bg-surface py-16 md:py-24">
        <Container>
          <div className="max-w-reading">
            <h1 className="text-3xl font-black text-ink">
              {notFoundCopy.heading}
            </h1>
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
    </SiteShell>
  );
}
