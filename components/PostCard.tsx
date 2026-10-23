// PostCard — one blog post in a list: cover image, practice area, title, summary, date.
// No box or shadow; the image carries the card. Below `sm` it becomes a compact row
// (small image beside the title, no summary) so a page of posts stays short on phones.
// `featured` is the large horizontal version for the newest post on the first page.
// Usage: <PostCard post={post} /> or <PostCard post={post} featured />
import Image from "next/image";
import Link from "next/link";
import { UpdatedAt } from "@/components/UpdatedAt";
import { getPracticeArea } from "@/content/practice-areas";
import { postHref, type Post } from "@/lib/blog";
import { cn } from "@/lib/cn";

export function PostCard({
  post,
  featured = false,
  headingLevel = "h2",
}: {
  post: Post;
  featured?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const area = getPracticeArea(post.area);

  return (
    <article
      className={cn(
        "group relative flex gap-4",
        featured
          ? "flex-col md:flex-row md:items-center md:gap-10"
          : "flex-row sm:flex-col",
      )}
    >
      <Image
        src={post.cover.src}
        alt=""
        width={post.cover.width}
        height={post.cover.height}
        sizes={
          featured
            ? "(min-width: 48rem) 50vw, 100vw"
            : "(min-width: 64rem) 22rem, (min-width: 40rem) 50vw, 7rem"
        }
        preload={featured}
        className={cn(
          "rounded-md border border-line bg-surface-muted object-cover",
          featured
            ? "aspect-[16/10] w-full md:w-1/2 md:rounded-lg"
            : "aspect-square w-28 shrink-0 sm:aspect-[16/10] sm:w-full",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:gap-2">
        <p className="text-sm font-semibold text-primary">{area.title}</p>
        <Heading
          className={cn(
            "font-bold text-ink",
            featured ? "text-2xl" : "text-lg leading-relaxed",
          )}
        >
          {/* The link's ::after covers the whole card, so the card is one tap target. */}
          <Link
            href={postHref(post)}
            className="outline-none after:absolute after:inset-0 after:rounded-md group-hover:text-primary focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-focus"
          >
            {post.title}
          </Link>
        </Heading>
        <p
          className={cn(
            "text-muted",
            featured ? "text-base" : "hidden text-sm sm:line-clamp-3 sm:block",
          )}
        >
          {post.description}
        </p>
        <UpdatedAt date={post.updatedJalali} short className="mt-auto pt-1" />
      </div>
    </article>
  );
}
