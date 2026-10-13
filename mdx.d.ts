// Every blog post exports `meta` next to its default component (see lib/blog.ts).
declare module "*.mdx" {
  export const meta: unknown;
}
