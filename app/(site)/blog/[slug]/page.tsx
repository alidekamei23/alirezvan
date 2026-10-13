import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { AuthorBox } from "@/components/AuthorBox";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactBox } from "@/components/ContactBox";
import { ContactCta } from "@/components/ContactCta";
import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/Section";
import { UpdatedAt } from "@/components/UpdatedAt";
import { lawyer } from "@/content/lawyer";
import { blogCopy } from "@/content/pages";
import { getPracticeArea } from "@/content/practice-areas";
import {
  NO_PARAMS,
  blogHref,
  decodeSlug,
  getAllPosts,
  getPostBody,
  getPostBySlug,
  getRelatedPosts,
  postHref,
} from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";
import { jalaliToGregorianISO } from "@/lib/jalali";
import { pageMetadata } from "@/lib/seo";

type Props = PageProps<"/blog/[slug]">;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.length > 0
    ? posts.map((post) => ({ slug: post.slug }))
    : [{ slug: NO_PARAMS }];
}

export async function generateMetadata({ params }: Props) {
  const post = await getPostBySlug(decodeSlug((await params).slug));
  if (!post) return {};
  const base = pageMetadata({
    title: post.title,
    description: post.summary,
    path: postHref(post),
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      images: [{ url: post.cover.src, width: post.cover.width, height: post.cover.height }],
    },
  };
}

// The page waits for the URL before rendering, so an unknown address gets a real 404
// status. `instant = false` tells Next.js that blocking here is intended.
export const instant = false;

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(decodeSlug((await params).slug));
  if (!post) notFound();

  const area = getPracticeArea(post.area);
  const [Body, related] = await Promise.all([getPostBody(post), getRelatedPosts(post)]);
  const isoDate = jalaliToGregorianISO(post.updatedAt);

  return (
    <>
      <article>
        <div className="border-b border-line bg-surface pt-3 pb-8 md:pb-10">
          <Container>
            <Breadcrumbs
              items={[
                { label: "خانه", href: "/" },
                { label: blogCopy.heading, href: blogHref() },
                { label: area.title, href: blogHref(area.slug) },
                { label: post.title },
              ]}
            />
            <div className="mt-4 max-w-reading">
              <h1 className="text-3xl font-black text-ink">{post.title}</h1>
              <p className="mt-4 text-lg text-ink">{post.summary}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1">
                <UpdatedAt date={post.updatedAt} />
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Clock aria-hidden="true" className="size-4 shrink-0" />
                  زمان مطالعه: {toPersianDigits(post.readingMinutes)} دقیقه
                </span>
              </div>
            </div>
          </Container>
        </div>

        <Container className="grid gap-x-16 gap-y-10 py-8 md:py-12 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
          <div className="min-w-0">
            <Image
              src={post.cover.src}
              alt={post.cover.alt}
              width={post.cover.width}
              height={post.cover.height}
              sizes="(min-width: 48rem) 42rem, 100vw"
              preload
              className="mb-8 aspect-[16/10] w-full rounded-lg border border-line bg-surface-muted object-cover"
            />

            <Prose>
              <Body />
            </Prose>

            {post.faqs.length > 0 && (
              <section aria-labelledby="post-faq" className="mt-12">
                <h2 id="post-faq" className="mb-4 text-2xl font-bold text-ink">
                  پرسش‌های پرتکرار
                </h2>
                <Faq items={post.faqs} schema />
              </section>
            )}

            {post.references.length > 0 && (
              <section aria-labelledby="post-references" className="mt-12">
                <h2 id="post-references" className="mb-3 text-xl font-bold text-ink">
                  منابع
                </h2>
                <ul className="list-disc ps-6 text-sm text-ink">
                  {post.references.map((reference) => (
                    <li key={reference.title} className="py-1">
                      {reference.url ? (
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-4 hover:text-primary-hover"
                        >
                          {reference.title}
                        </a>
                      ) : (
                        reference.title
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside aria-label="درباره نویسنده و راه تماس" className="min-w-0">
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              <AuthorBox />
              <ContactBox />
              <Link
                href={area.href}
                className="flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                مسیر حقوقی و پرسش‌های {area.title}
              </Link>
            </div>
          </aside>
        </Container>
      </article>

      {related.length > 0 && (
        <Section id="related" tone="surface" title={`مقاله‌های دیگر ${area.title}`}>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <PostCard post={item} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <ContactCta />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.summary,
          image: post.cover.src,
          inLanguage: "fa",
          ...(isoDate && { dateModified: isoDate }),
          author: {
            "@type": "Person",
            name: lawyer.name,
            jobTitle: lawyer.grade,
            url: "/about",
          },
          mainEntityOfPage: postHref(post),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { name: "خانه", item: "/" },
            { name: blogCopy.heading, item: blogHref() },
            { name: area.title, item: blogHref(area.slug) },
            { name: post.title, item: postHref(post) },
          ].map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.item,
          })),
        }}
      />
    </>
  );
}
