// NotFoundContent — the body of the «صفحه پیدا نشد» page, without the site frame. Two
// not-found files use it: app/not-found.tsx (unknown addresses; wraps it in SiteShell
// itself) and app/(site)/not-found.tsx (notFound() inside a public page, which already
// sits in the (site) layout's frame). Usage: <NotFoundContent />
import { CallButton } from "@/components/CallButton";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";
import { blogCopy, notFoundCopy } from "@/content/pages";
import { blogHref } from "@/lib/blog";

export function NotFoundContent() {
  return (
    <div className="border-b border-line bg-surface py-16 md:py-24">
      <Container>
        <div className="max-w-reading">
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
