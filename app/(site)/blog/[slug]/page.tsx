import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/Alert";
import { ArticleBody } from "@/components/ArticleBody";
import { AuthorBox } from "@/components/AuthorBox";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactBox } from "@/components/ContactBox";
import { ContactCta } from "@/components/ContactCta";
import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { Section } from "@/components/Section";
import { UpdatedAt } from "@/components/UpdatedAt";
import { lawyer } from "@/content/lawyer";
import { LAWYER_REVIEWED_LABEL } from "@/content/legal";
import { blogCopy } from "@/content/pages";
import { getPracticeArea } from "@/content/practice-areas";
import {
  NO_PARAMS,
  blogHref,
  decodeSlug,
  getAllPosts,
  getLinkableSlugs,
  getPostBySlug,
  getRelatedPosts,
  isPublished,
  postHref,
} from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { ALLOW_INDEXING, absoluteUrl } from "@/lib/seo";

type Props = PageProps<"/blog/[slug]">;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.length > 0
    ? posts.map((post) => ({ slug: post.slug }))
    : [{ slug: NO_PARAMS }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(decodeSlug((await params).slug));
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const url = absoluteUrl(postHref(post));
  const image = {
    url: absoluteUrl(post.ogImage.url),
    width: post.ogImage.width,
    height: post.ogImage.height,
    alt: post.cover.alt,
  };
  return {
    title,
    description: post.description,
    keywords: [post.keyword, ...post.secondaryKeywords],
    alternates: { canonical: url },
    // Only where the whole site may be indexed; elsewhere the layout's noindex stays.
    ...(ALLOW_INDEXING && isPublished(post) && { robots: { index: true, follow: true } }),
    openGraph: {
      type: "article",
      title,
      description: post.description,
      url,
      siteName: lawyer.name,
      locale: "fa_IR",
      images: [image],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
      images: [image.url],
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
  const [related, linkableSlugs] = await Promise.all([getRelatedPosts(post), getLinkableSlugs()]);
  const crumbs = [
    { name: "خانه", href: "/" },
    { name: blogCopy.heading, href: blogHref() },
    { name: area.title, href: blogHref(area.slug) },
    { name: post.title, href: postHref(post) },
  ];

  return (
    <>
      <article>
        <div className="border-b border-line bg-surface pt-3 pb-8 md:pb-10">
          <Container>
            <Breadcrumbs
              items={crumbs.map((crumb, index) =>
                index === crumbs.length - 1
                  ? { label: crumb.name }
                  : { label: crumb.name, href: crumb.href },
              )}
            />
            <div className="mt-4 max-w-reading">
              {!isPublished(post) && (
                <Alert tone="warning" title={blogCopy.unpublishedBanner.title} className="mb-4">
                  {blogCopy.unpublishedBanner.text}
                </Alert>
              )}
              <h1 className="text-3xl font-black text-ink">{post.title}</h1>
              <p className="mt-4 text-lg text-ink">{post.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1">
                <UpdatedAt date={post.updatedJalali} />
                {isPublished(post) && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                    <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
                    {LAWYER_REVIEWED_LABEL}
                  </span>
                )}
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
              sizes="(min-width: 48rem) 42rem, calc(100vw - 2rem)"
              preload
              fetchPriority="high"
              className="mb-8 aspect-video w-full rounded-lg border border-line bg-surface-muted object-cover object-center"
            />

            <ArticleBody content={post.body} linkableSlugs={linkableSlugs} />

            {post.faq.length > 0 && (
              <section aria-labelledby="post-faq" className="mt-12">
                <h2 id="post-faq" className="mb-4 text-2xl font-bold text-ink">
                  {blogCopy.faqHeading}
                </h2>
                <Faq items={post.faq.map((item) => ({ q: item.question, a: item.answer }))} schema />
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

            {post.disclaimer && (
              <ArticleBody
                content={post.disclaimer}
                contactBox={false}
                className="mt-12 border-t border-line pt-6 text-sm text-muted"
              />
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
        <Section id="related" tone="surface" title={blogCopy.relatedHeading}>
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
        data={articleSchema({
          title: post.title,
          description: post.description,
          href: postHref(post),
          images: [post.ogImage.url, post.cover.src],
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          keywords: [post.keyword, ...post.secondaryKeywords],
          section: area.title,
        })}
      />
      <JsonLd data={breadcrumbSchema(crumbs)} />
    </>
  );
}
