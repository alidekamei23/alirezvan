# Crawl، Index و ساختار URL

[بازگشت به فهرست](README.md)

## ۱. سوییچ index در کل سایت

یک متغیر build-time همه چیز را کنترل می‌کند:

```ts
// lib/seo.ts:16
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
```

| `NEXT_PUBLIC_ALLOW_INDEXING` | `robots.txt` | meta robots صفحه‌ها |
| --- | --- | --- |
| هر مقداری جز `true` (الان: `false` در `.env.production:9`) | `Disallow: /` | همه `noindex, nofollow` (`app/layout.tsx:41`) |
| `true` | `Allow: /`، `Disallow: /admin`، `/admin/`، `/api/` و لینک sitemap | فقط صفحه‌هایی که خودشان noindex می‌گیرند |

- چون متغیر `NEXT_PUBLIC_*` است، **در زمان build ثابت می‌شود**؛ تغییرش بدون build دوباره اثری
  ندارد. build لیارا متغیرهای کنسول را نمی‌بیند، به همین دلیل مقدار در `.env.production`
  نگه داشته شده (توضیح `.env.production:1-3`).
- در build محلی `.env.local` روی `.env.production` اولویت دارد؛ برای همین sitemap محلی
  آدرس `http://localhost:3000` دارد.

## ۲. `robots.ts`

```ts
// app/robots.ts:8-20
export const DISALLOWED_PATHS = ["/admin", "/admin/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
```

خروجی واقعی build فعلی (index خاموش):

```
User-Agent: *
Disallow: /
```

`/porsesh/peygiri` و `/design-system` عمداً در `robots.txt` نیستند: صفحه‌ای که crawl نشود
تگ noindex خود را نشان نمی‌دهد و آدرس خالی‌اش ممکن است در نتایج بماند
(`app/robots.ts:4-7`، commit `ee72993`).

## ۳. `sitemap.ts`

```ts
// app/sitemap.ts:35-70 (خلاصه)
const [posts, questions] = await Promise.all([getAllPosts(), cachedQuestionSitemap()]);
return [
  { url: absoluteUrl("/"), lastModified: latest(posts) },
  { url: absoluteUrl("/blog"), lastModified: latest(posts) },
  { url: absoluteUrl(QUESTIONS_HREF), lastModified: newest question },
  ...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),          // بدون lastModified
  ...practiceAreas.map((area) => ({ url, lastModified: latest(areaPosts) })),
  ...areas with posts → /blog/topic/<area>,
  ...posts.map((post) => ({ url, lastModified: post.updatedAt })),
  ...questions.map((q) => ({ url: absoluteUrl(encodeURI(questionHref(q.slug))), lastModified })),
];
```

| گروه | شامل | `lastModified` |
| --- | --- | --- |
| Home، `/blog` | همیشه | `updatedAt` جدیدترین مقاله |
| `/porsesh` | همیشه | `updatedAt` جدیدترین پرسش منتشرشده |
| `STATIC_PATHS` (`app/sitemap.ts:13-21`) | `/about`، `/contact`، `/request`، `/tools`، ۸ ابزار، `/privacy`، `/disclaimer` | ندارد (عمدی: تاریخ ساختگی build باعث می‌شود موتورها فیلد را نادیده بگیرند) |
| ۴ هاب | همیشه | جدیدترین مقاله آن حوزه؛ هاب بدون مقاله ندارد |
| `/blog/topic/<area>` | فقط حوزه‌هایی که مقاله دارند | جدیدترین مقاله آن حوزه |
| مقاله‌ها | فقط `status: approved` | `updatedAt` |
| پرسش‌ها | فقط منتشرشده‌ها (از دیتابیس، کش‌شده) | `updatedAt` |

- **حذف عمدی**: صفحه‌های paginated (`/blog/page/N`) چون همه مقاله‌هایشان جدا آمده‌اند
  (`app/sitemap.ts:31-34`)، و دسته‌های پرسش و پاسخ (`/porsesh?dasteh=…`).
- **`priority` و `changeFrequency` تنظیم نشده‌اند.** گوگل هر دو را نادیده می‌گیرد.
- sitemap در build با `revalidate` یک روز و expire یک هفته تولید می‌شود (جدول build:
  `○ /sitemap.xml 1d 1w`)، چون داده پرسش‌ها از `"use cache"` با `cacheLife("days")` می‌آید
  (`lib/questions/cached.ts:30-35`).
- خروجی build فعلی ۳۰ URL دارد: Home، `/blog` و `/porsesh`؛ ۱۴ صفحه `STATIC_PATHS`؛ ۴ هاب؛
  ۳ تاپیک؛ ۵ مقاله؛ و یک پرسش (در دیتابیس محلی).

## ۴. صفحه‌های noindex

| صفحه | robots | کجا |
| --- | --- | --- |
| کل سایت تا روشن‌شدن index | `noindex, nofollow` | `app/layout.tsx:41` |
| `/admin/**` | `noindex, nofollow, nocache` + header `X-Robots-Tag: noindex, nofollow` + `Cache-Control: no-store` + `Disallow` | `app/admin/layout.tsx:7`، `proxy.ts:25-26`، `app/robots.ts:8` |
| `/porsesh/peygiri` (پیگیری با کد شخصی) | `noindex, nofollow` | `app/(site)/porsesh/peygiri/page.tsx:10` |
| `/porsesh?q=…` (نتیجه جست‌وجو) | `noindex, follow` | `app/(site)/porsesh/page.tsx:62` |
| `/porsesh?dasteh=…` بدون پرسش، یا صفحه بعد از آخرین | `noindex, follow` | همان |
| `/blog/topic/<area>` بدون مقاله (الان `gharardad`) | `noindex, follow` | `app/(site)/blog/topic/[area]/page.tsx:25` |
| `/design-system` | `noindex, nofollow` و در production اصلاً 404 | `app/(site)/design-system/page.tsx:53` و `130` |
| صفحه‌های 404 | `noindex` (خودکار Next.js) | |

`NOINDEX_FOLLOW` وقتی کل سایت بسته است `follow` را هم خاموش می‌کند
(`lib/seo.ts:18-22`)، تا با noindex سراسری تناقض نداشته باشد.

مقاله منتشرنشده (`draft` یا `in-review`) در production صفحه ندارد و 404 می‌دهد
(`lib/blog.ts:210-214`)؛ فقط در `npm run dev` با بنر «پیش‌نویس» باز می‌شود.

## ۵. مدیریت 404

- **ریشه**: `app/not-found.tsx` با `SiteShell` (برای آدرس‌هایی که route ندارند).
- **داخل `(site)`**: `app/(site)/not-found.tsx` بدون قاب دوباره (برای `notFound()` داخل
  صفحه‌ها)؛ محتوای مشترک در `components/NotFoundContent.tsx`.
- **soft 404 برطرف شده** (commit `91809ec`): routeهای داینامیک
  `export const ensureStatic = "navigation"` دارند تا آدرسی که prerender نشده قبل از ارسال
  کامل render شود و `notFound()` بتواند status را 404 کند:
  - `app/(site)/blog/[slug]/page.tsx:90`
  - `app/(site)/blog/page/[page]/page.tsx:32`
  - `app/(site)/blog/topic/[area]/page.tsx:31`
  - `app/(site)/blog/topic/[area]/page/[page]/page.tsx:44`
  - `app/(site)/porsesh/[slug]/page.tsx:50`
- `NO_PARAMS = "__none__"` (`lib/blog.ts:43`) جای خالی `generateStaticParams` را پر می‌کند و
  همیشه 404 می‌دهد.

نتیجه آزمون روی build:

| آدرس | status |
| --- | --- |
| `/nothing-here` | 404 |
| `/blog/nope` | 404 |
| `/design-system` (production) | 404 |
| `/admin` بدون کوکی | 307 → `/admin/login` |

## ۶. ساختار URL

| بخش | الگو | نوع slug | منبع |
| --- | --- | --- | --- |
| هاب‌ها | `/check-safte`، `/melki-ejare`، `/motalebe`، `/gharardad` | لاتین (فینگلیش) | `content/practice-areas.ts`، `content/navigation.ts:6-11` |
| ابزارها | `/tools/<slug>` مثل `/tools/khesarat-takhir` | لاتین | `content/tools.ts` |
| صفحه‌های ثابت | `/about`، `/contact`، `/request`، `/privacy`، `/disclaimer` | انگلیسی | |
| وبلاگ | `/blog`، `/blog/page/N`، `/blog/topic/<area>`، `/blog/topic/<area>/page/N` | | `lib/blog.ts:254-257` |
| مقاله | `/blog/<slug>` | **انگلیسی**، فقط `a-z0-9` و خط تیره؛ `page` و `topic` رزرو | `lib/blog.ts:46`، `51-54` |
| پرسش و پاسخ | `/porsesh`، `/porsesh?dasteh=<c>&page=N` | | `app/(site)/porsesh/page.tsx:37-44` |
| پرسش | `/porsesh/<slug>` | **فارسی** (ی/ک فارسی، ارقام لاتین، ZWNJ و فاصله به خط تیره، حداکثر ۸۰ کاراکتر) | `lib/articles/slug.ts:16-28` |
| RSS | `/blog/rss.xml` | | |

- **encoding**: slug فارسی در دیتابیس به شکل Unicode ذخیره می‌شود؛ sitemap آن را با
  `encodeURI` به percent-encoding می‌برد (`app/sitemap.ts:66`)، routeها پارامتر را با
  `decodeSlug()` برمی‌گردانند (`lib/blog.ts:260-266`) و redirect پرسش هم `encodeURI` دارد
  (`app/(site)/porsesh/[slug]/page.tsx:55`). نمونه واقعی در sitemap:
  `/porsesh/%D9%BE%D9%88%D9%84%D9%85%D9%88-…`.
- **ثبات slug**: slug مقاله «هرگز تغییر نمی‌کند» (`lib/blog.ts:68`، CLAUDE.md §4). نام فایل
  باید با slug یکی باشد (`lib/blog.ts:144-146`) و slug تکراری build را متوقف می‌کند
  (`lib/blog.ts:184-188`). slug قدیمی پرسش‌ها از جدول `question_slug_redirects` با
  `permanentRedirect` (308) به slug جدید می‌رود (`docs/qa-spec.md:31-32`،
  `app/(site)/porsesh/[slug]/page.tsx:55`).

## ۷. Redirectها و جلوگیری از محتوای تکراری

```js
// next.config.js:39-48
async redirects() {
  return [
    { source: "/blog/page/1", destination: "/blog", permanent: true },
    { source: "/blog/topic/:area/page/1", destination: "/blog/topic/:area", permanent: true },
  ];
},
```

- این redirectها در config هستند و نه داخل صفحه، چون redirect از صفحه prerender‌شده از کش
  با status 308 ولی بدون header `Location` می‌رسید (`next.config.js:36-38`). صفحه‌ها هم
  fallback دارند (`app/(site)/blog/page/[page]/page.tsx:37`).
- **trailing slash**: تنظیم `trailingSlash` نیست، پس پیش‌فرض Next.js کار می‌کند:
  `/blog/` → 308 → `/blog` (تأییدشده با curl).
- **rewrite** وجود ندارد.
- **canonical خودارجاع** روی همه صفحه‌ها، از جمله صفحه‌های paginated
  (`tests/seo.test.ts:81`).
- **description یکتا در pagination** با `pagedDescription()`.
- **پارامتر جست‌وجو** (`q`) در canonical نمی‌آید و صفحه‌اش noindex است.
- **دامنه**: redirect از `alirezvanlegal.liara.run` به دامنه نهایی (یا برعکس) و انتخاب
  `www` یا بدون `www` در کد نیست. ⚠️ نیاز به بررسی: باید در تنظیمات لیارا و DNS انجام شود.

## ۸. RSS

`app/(site)/blog/rss.xml/route.ts:21-55` یک RSS 2.0 از مقاله‌های منتشرشده می‌سازد: عنوان،
لینک، `guid`، description، دسته، `pubDate` (ساعت ۰۰:۰۰ تهران، خط 16)، `enclosure` تصویر OG
و `lastBuildDate` از جدیدترین `updatedAt`. صفحه `/blog` با `alternates.types` آن را معرفی
می‌کند (`app/(site)/blog/page.tsx:12-18`). در build از نوع `○` (Static) است.
