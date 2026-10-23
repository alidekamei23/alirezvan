# Blog posts

Posts are Markdown files in `content/blog/<slug>.md`. `lib/blog.ts` reads and validates
them; `components/ArticleBody.tsx` renders the body. Only lawyer-approved articles are
added (CLAUDE.md §5.5).

## Frontmatter

```yaml
---
title: "عنوان مقاله"                 # the page's only H1
seoTitle: "عنوان برای نتایج جست‌وجو"   # <title>; the title is used when empty
description: "یک یا دو جمله"          # meta description, lead under the H1, card text (20–220)
slug: "english-words-with-hyphens"   # becomes /blog/<slug>; the file name must match; never change it
keyword: "کلیدواژه‌ی اصلی"
secondaryKeywords:
  - "کلیدواژه‌ی فرعی"
category: "ملک"                       # چک | ملک | اجاره | مطالبه طلب | قرارداد → practice area
cluster: "خرید و فروش ملک"           # posts of one cluster are related to each other
type: "cluster"                      # pillar | cluster
pillar: "pillar-post-slug"           # cluster posts: their pillar's slug, or ""
structure: "…"                       # optional editorial note, not shown
relatedSlugs:                        # shown first under «مطالب مرتبط», when published
  - "other-post-slug"
publishedAt: "2026-10-23"            # Gregorian ISO
updatedAt: "2026-10-23"              # Gregorian ISO; shown in Jalali as «آخرین به‌روزرسانی»
status: "approved"                   # draft | in-review | approved
cover:                               # optional; without it the site's branded image is used
  src: "/images/blog/<slug>.webp"
  width: 1600
  height: 893
  alt: "توصیف فارسی تصویر، با کلیدواژه"
faq:                                 # rendered as an accordion before the disclaimer
  - question: "پرسش"
    answer: "پاسخ"
references: []                       # optional: [{ title, url? }]
---
```

## Body

- No H1 (`# `); sections start at `##`.
- The contact box goes after the second section, or at a line with only `[contact-box]`.
- End with the disclaimer paragraph («سلب مسئولیت» / «… مشاوره‌ی حقوقی محسوب نمی‌شود»).
  It is split off and rendered after the FAQ.
- Links to other posts are written as `/blog/<slug>`. A link to a post that is not
  published is shown as plain text and turns into a link by itself once that post is
  published.

## Publishing rule

- `status: "approved"`: in the blog list, topic pages, practice hubs, home page, related
  posts, `sitemap.xml` and `/blog/rss.xml`.
- Any other status: 404 on the live site. In `npm run dev` the post page opens with a
  «پیش‌نویس — منتشر نشده» banner; it is still left out of every list.

## Cover image

```bash
npm run blog:cover -- "<path-to-photo>" <slug>
```

Writes `public/images/blog/<slug>.webp` (at most 1600 px wide, WebP, about 200 KB at
most, metadata such as EXIF/GPS removed) and `public/images/blog/og/<slug>.jpg` (1200×630
for Open Graph and Twitter cards). The original photo is not copied into the project.
`next/image` serves smaller sizes to phones. Put the printed width and height in `cover`.
