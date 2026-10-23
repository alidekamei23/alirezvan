// ArticleBody — renders an article's Markdown. The public article page and the editor's
// live preview both use this one component, so they cannot drift apart. It works in
// Server and Client Components.
//
// Safety: the text is treated as Markdown only. HTML tags typed into it are dropped,
// MDX and JavaScript are plain text, links may only be web, mail or phone links, and
// images may only come from this site. The result also passes an allowlist sanitizer.
//
// The contact box goes after the second section (CLAUDE.md §5.5): before the third
// "## " heading, or at the end when there are exactly two. A line containing only
// [contact-box] puts it there instead. With contactBox={false} (answers in the Q&A
// section, which have their own call to action) there is no box and the marker is dropped.
// Usage: <ArticleBody content={article.content} />
import type { Element, ElementContent, Root, RootContent } from "hast";
import type { ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { ContactBox } from "@/components/ContactBox";
import { Prose } from "@/components/Prose";

/** A line with only this text marks where the contact box goes. */
export const CONTACT_BOX_MARKER = "[contact-box]";
const CONTACT_BOX_TAG = "contact-box";

/** Images: only files of this site (uploads and bundled images). */
const LOCAL_IMAGE = /^\/(uploads|images)\/[A-Za-z0-9._/-]+(#\d{1,5}x\d{1,5})?$/;
/** Links: web, mail and phone addresses, and paths or anchors on this site. */
const SAFE_LINK = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

/** Decides what happens to every URL in the text; "" removes it. */
export function articleUrl(url: string, key: string): string {
  const value = url.trim();
  if (key === "src") return LOCAL_IMAGE.test(value) && !value.includes("..") ? value : "";
  return SAFE_LINK.test(value) ? value : "";
}

function isElement(node: RootContent | ElementContent, tagName: string): node is Element {
  return node.type === "element" && node.tagName === tagName;
}

function isMarker(node: RootContent): boolean {
  if (!isElement(node, "p") || node.children.length !== 1) return false;
  const only = node.children[0];
  return only.type === "text" && only.value.trim() === CONTACT_BOX_MARKER;
}

/** Puts one <contact-box> element into the tree (see the note at the top). */
function placeContactBox() {
  return (tree: Root) => {
    const box = (): Element => ({
      type: "element",
      tagName: CONTACT_BOX_TAG,
      properties: {},
      children: [],
    });

    let placed = false;
    tree.children = tree.children.flatMap((node) => {
      if (!isMarker(node)) return [node];
      if (placed) return [];
      placed = true;
      return [box()];
    });
    if (placed) return;

    const headings = tree.children.flatMap((node, index) => (isElement(node, "h2") ? [index] : []));
    if (headings.length >= 3) {
      tree.children.splice(headings[2], 0, box());
    } else if (headings.length === 2) {
      // Keep the footnotes, when there are any, as the very last thing.
      const last = tree.children.at(-1);
      const beforeFootnotes = last && isElement(last, "section");
      tree.children.splice(beforeFootnotes ? -1 : tree.children.length, 0, box());
    }
  };
}

/** Removes [contact-box] lines, for text shown without a contact box. */
function dropContactBoxMarker() {
  return (tree: Root) => {
    tree.children = tree.children.filter((node) => !isMarker(node));
  };
}

/** "/blog/<slug>" → "<slug>"; null for list pages and every other address. */
function blogPostSlug(href: string): string | null {
  const match = /^\/blog\/([^/?#]+)\/?(?:[?#].*)?$/.exec(href);
  return match && match[1] !== "page" && match[1] !== "topic" ? match[1] : null;
}

function renderLink(href: string | undefined, children: ReactNode) {
  // A link whose address was refused is shown as plain text.
  if (!href) return <>{children}</>;
  const external = /^https?:\/\//i.test(href);
  return (
    <a href={href} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
      {children}
    </a>
  );
}

const components = {
  [CONTACT_BOX_TAG]: () => <ContactBox />,

  a: ({ href, children }) => renderLink(href, children),

  img({ src, alt }) {
    if (typeof src !== "string" || src === "") return null;
    // The editor adds "#<width>x<height>" to uploaded images so the page can reserve
    // their space before they load.
    const [file, size] = src.split("#");
    const [width, height] = size ? size.split("x").map(Number) : [undefined, undefined];
    return (
      // A plain <img>: uploads are already resized WebP files, and the same markup must
      // work in the editor preview.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={file}
        alt={alt ?? ""}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="h-auto max-w-full rounded-md border border-line bg-surface-muted"
      />
    );
  },

  table({ children }) {
    // A wide table scrolls inside its own box; the page never scrolls sideways.
    return (
      <div tabIndex={0} className="max-w-full overflow-x-auto">
        <table>{children}</table>
      </div>
    );
  },
} as Components;

export function ArticleBody({
  content,
  className,
  contactBox = true,
  linkableSlugs,
}: {
  content: string;
  className?: string;
  contactBox?: boolean;
  /**
   * Blog posts that exist. When given, a link to any other /blog/<slug> is shown as
   * plain text, so a post can link ahead to one that is not published yet without a 404;
   * the link turns on by itself once that post is published.
   */
  linkableSlugs?: ReadonlySet<string>;
}) {
  const used: Components = linkableSlugs
    ? {
        ...components,
        a: ({ href, children }) => {
          const slug = href ? blogPostSlug(href) : null;
          if (slug && !linkableSlugs.has(decodeURIComponent(slug))) return <>{children}</>;
          return renderLink(href, children);
        },
      }
    : components;

  return (
    <Prose className={className}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, contactBox ? placeContactBox : dropContactBoxMarker]}
        urlTransform={articleUrl}
        components={used}
      >
        {content}
      </Markdown>
    </Prose>
  );
}
