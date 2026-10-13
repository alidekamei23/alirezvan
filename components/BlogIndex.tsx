// BlogIndex — the blog listing template shared by /blog, /blog/page/N,
// /blog/topic/<area> and /blog/topic/<area>/page/N: header, topic filter, the posts of
// one page (the newest one large on page 1) and pagination.
// Usage: <BlogIndex area={null} page={1} />
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { TopicFilter } from "@/components/TopicFilter";
import { blogCopy } from "@/content/pages";
import { getPracticeArea, type PracticeAreaSlug } from "@/content/practice-areas";
import { blogHref, getAllPosts, getPostsByArea } from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";
import { pageCount, pageSlice } from "@/lib/pagination";

export async function BlogIndex({
  area,
  page,
}: {
  area: PracticeAreaSlug | null;
  /** 1-based. */
  page: number;
}) {
  const posts = area ? await getPostsByArea(area) : await getAllPosts();
  const total = pageCount(posts.length);
  if (page > total) notFound();

  const visible = pageSlice(posts, page);
  const featured = page === 1 ? visible[0] : undefined;
  const rest = page === 1 ? visible.slice(1) : visible;
  const areaTitle = area ? getPracticeArea(area).title : null;

  const title = areaTitle ? `${blogCopy.heading}: ${areaTitle}` : blogCopy.heading;
  const crumbs = areaTitle
    ? [{ label: blogCopy.heading, href: blogHref() }, { label: areaTitle }]
    : [{ label: blogCopy.heading }];

  return (
    <>
      <PageHeader title={title} lead={page === 1 ? blogCopy.lead : undefined} crumbs={crumbs}>
        {page > 1 && (
          <p className="mt-2 text-muted">
            صفحه {toPersianDigits(page)} از {toPersianDigits(total)}
          </p>
        )}
      </PageHeader>

      <Container className="py-8 md:py-12">
        <TopicFilter active={area} />

        {visible.length === 0 ? (
          <EmptyState
            className="mt-8"
            title={blogCopy.emptyTitle}
            description={blogCopy.emptyText}
          />
        ) : (
          <>
            {featured && (
              <div className="mt-8 border-b border-line pb-8 md:pb-12">
                <PostCard post={featured} featured />
              </div>
            )}
            {rest.length > 0 && (
              <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
                {rest.map((post) => (
                  <li
                    key={post.slug}
                    className="border-b border-line pb-6 last:border-b-0 sm:border-b-0 sm:pb-0"
                  >
                    <PostCard post={post} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-10 md:mt-14">
              <Pagination
                current={page}
                total={total}
                hrefFor={(target) => blogHref(area, target)}
              />
            </div>
          </>
        )}
      </Container>
    </>
  );
}
