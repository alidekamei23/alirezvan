# Metadata، Open Graph، Twitter و زبان

[بازگشت به فهرست](README.md)

## ۱. ساختار کلی

- Next.js **16.4.3** با **App Router** (`package.json`). Pages Router وجود ندارد.
- `cacheComponents: true` و `partialPrefetching: true` در `next.config.js:34-35` روشن‌اند.
- صفحه‌های عمومی در route group `app/(site)/` هستند؛ این پوشه در URL دیده نمی‌شود و فقط
  header، footer و JSON-LD سراسری را از `/admin` جدا نگه می‌دارد
  (`app/(site)/layout.tsx:3-6`).
- `proxy.ts` (نام Next.js 16 برای middleware) فقط روی `/admin` اجرا می‌شود
  (`proxy.ts:30-32`) و روی سئوی صفحه‌های عمومی اثری ندارد.

## ۲. ریشه: `app/layout.tsx`

```tsx
// app/layout.tsx:32-42
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${lawyer.name} | ${lawyer.grade}`,
    template: `%s | ${lawyer.name}`,
  },
  description: "وب‌سایت علی رضوان، عضو کانون وکلای دادگستری مرکز، در تهران؛ …",
  ...(!ALLOW_INDEXING && { robots: { index: false, follow: false } }),
};
```

- **`metadataBase`** از `SITE_URL` می‌آید (`lib/seo.ts:7-10`): مقدار
  `NEXT_PUBLIC_SITE_URL` بدون اسلش پایانی، و `http://localhost:3000` اگر تعریف نشده باشد.
  همه canonicalها و آدرس‌های OG نسبی‌اند و Next.js آن‌ها را با همین پایه کامل می‌کند.
- **template**: هر صفحه فقط بخش اول عنوان را می‌دهد و « | علی رضوان» اضافه می‌شود.
- **default**: «علی رضوان | عضو کانون وکلای دادگستری مرکز»؛ Home همین را با
  `title.absolute` تکرار می‌کند تا نام دو بار نیاید (`app/(site)/page.tsx:31-32`).
- **robots سراسری**: وقتی index خاموش است همه صفحه‌ها `noindex, nofollow` می‌گیرند
  (جزئیات در [03-crawl-index-urls.md](03-crawl-index-urls.md)).

### Viewport و theme-color

```tsx
// app/layout.tsx:44-50
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#5752b4", // iris-700
};
```

## ۳. helper مرکزی: `pageMetadata()`

همه صفحه‌های عمومی به جز مقاله‌ها metadata را از این تابع می‌گیرند:

```ts
// lib/seo.ts:46-75
export function pageMetadata({ title, description, path }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title, description, url: path,
      siteName: lawyer.name,
      locale: "fa_IR",
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE.url] },
  };
}
```

helperهای کنار آن در `lib/seo.ts`:

| نام | خط | کار |
| --- | --- | --- |
| `SITE_URL` | 7-10 | origin عمومی |
| `ALLOW_INDEXING` | 16 | فقط مقدار دقیق `"true"` index را روشن می‌کند |
| `NOINDEX_FOLLOW` | 22 | `{ index: false, follow: ALLOW_INDEXING }` برای لیست‌های خالی و نتایج جست‌وجو |
| `pagedDescription()` | 25-27 | از صفحه ۲ به بعد « صفحه N.» به description اضافه می‌کند تا تکراری نشود |
| `absoluteUrl()` | 30-32 | مسیر را به آدرس کامل تبدیل می‌کند (sitemap، RSS، JSON-LD) |
| `DEFAULT_OG_IMAGE` | 35-40 | `/images/og.png`، 1200×630، alt «علی رضوان، عضو کانون…» |
| `NOT_FOUND_METADATA` | 82 | `{ title: "صفحه پیدا نشد" }` برای صفحه‌هایی که چیزی پیدا نمی‌کنند |

## ۴. Metadata هر صفحه

مقادیر زیر از crawl خروجی build (`next start`) استخراج شده‌اند. طول title شامل
« | علی رضوان» است. سقف CLAUDE.md §6 برای title شصت کاراکتر و بازه description
۱۲۰ تا ۱۶۰ کاراکتر است.

| مسیر | منبع metadata | title | طول title | طول description |
| --- | --- | --- | --- | --- |
| `/` | `app/(site)/page.tsx:24-33` | علی رضوان \| عضو کانون وکلای دادگستری مرکز | 41 | **107** |
| `/about` | `app/(site)/about/page.tsx:14-18` | درباره وکیل | 23 | **114** |
| `/contact` | `app/(site)/contact/page.tsx:18-22` | تماس با دفتر | 24 | **117** |
| `/request` | `app/(site)/request/page.tsx:16` | درخواست مشاوره | 26 | **114** |
| `/privacy` | `app/(site)/privacy/page.tsx:5` | حریم خصوصی | 22 | **91** |
| `/disclaimer` | `app/(site)/disclaimer/page.tsx:5` | سلب مسئولیت | 23 | **93** |
| `/check-safte` | `app/(site)/check-safte/page.tsx:7` ← `content/practice-areas.ts` | وکیل چک و سفته در تهران | 35 | 138 |
| `/melki-ejare` | همان الگو | وکیل ملکی و اجاره در تهران | 38 | 148 |
| `/motalebe` | همان الگو | وکیل مطالبه طلب در تهران | 36 | 140 |
| `/gharardad` | همان الگو | وکیل قرارداد در تهران | 33 | 152 |
| `/tools` | `app/(site)/tools/page.tsx:12` | ماشین‌حساب‌های حقوقی: خسارت تأخیر، دیه، مهریه | 57 | 158 |
| `/tools/khesarat-takhir` | `content/tadieh.ts` (`metaTitle`) | ماشین‌حساب خسارت تأخیر تأدیه با شاخص بانک مرکزی | 59 | 160 |
| `/tools/hazine-dadresi` | `content/hazine.ts` | ماشین‌حساب هزینه دادرسی دعاوی مالی | 46 | 129 |
| `/tools/mahrieh` | `content/mahrieh.ts` | ماشین‌حساب مهریه به نرخ روز با شاخص بانک مرکزی | 58 | 153 |
| `/tools/dastmozd-karshenasi` | `content/karshenasi.ts` | ماشین‌حساب دستمزد کارشناس رسمی دادگستری ۱۴۰۵ | 56 | 140 |
| `/tools/sahm-ol-ers` | `content/ers.ts` | ماشین‌حساب سهم‌الارث بر پایه قانون مدنی | 51 | 127 |
| `/tools/haghol-vekale` | `content/vekalat.ts` | ماشین‌حساب حق‌الوکاله و تمبر مالیاتی وکیل | 53 | 137 |
| `/tools/mohlat` | `content/mohlat.ts` | ماشین‌حساب مهلت تجدیدنظر، واخواهی و فرجام | 53 | 124 |
| `/tools/diyeh` | `content/diyeh.ts` | ماشین‌حساب دیه ۱۴۰۵: قتل، اعضا، منافع و جراحات | 58 | 148 |
| `/blog` | `app/(site)/blog/page.tsx:6-18` | وبلاگ | 17 | **111** |
| `/blog/page/N` | `app/(site)/blog/page/[page]/page.tsx:18-27` | وبلاگ، صفحه N | — | description + « صفحه N.» |
| `/blog/topic/<area>` | `app/(site)/blog/topic/[area]/page.tsx:14-26` | وبلاگ: چک و سفته | 28 | **81** |
| `/blog/topic/<area>/page/N` | `app/(site)/blog/topic/[area]/page/[page]/page.tsx:24` | — | — | با `pagedDescription` |
| `/blog/<slug>` | `app/(site)/blog/[slug]/page.tsx:49-85` | `seoTitle` یا `title` مقاله | 55–59 | 141–149 |
| `/porsesh` | `app/(site)/porsesh/page.tsx:46-63` | پرسش و پاسخ حقوقی: سؤال‌های واقعی و پاسخ وکیل | 57 | 133 |
| `/porsesh?dasteh=<c>` | همان | پرسش و پاسخ حقوقی: چک و سفته | 40 | 133 |
| `/porsesh/<slug>` | `app/(site)/porsesh/[slug]/page.tsx:31-45` | `metaTitle` یا عنوان پرسش | — | `metaDescription` یا ۱۵۵ کاراکتر اول پاسخ |
| `/porsesh/bepors` | `app/(site)/porsesh/bepors/page.tsx:11` | پرسیدن سؤال حقوقی از وکیل | 37 | 138 |
| `/porsesh/peygiri` | `app/(site)/porsesh/peygiri/page.tsx:8-11` | پیگیری سؤال حقوقی | 29 | 44 (noindex) |

اعداد **پررنگ** زیر حداقل ۱۲۰ کاراکتر CLAUDE.md §6 هستند (فهرست در
[07-issues.md](07-issues.md)).

### مقاله‌ها: metadata اختصاصی

مقاله‌ها از `pageMetadata` استفاده نمی‌کنند چون OG از نوع `article` و تصویر اختصاصی دارند:

```ts
// app/(site)/blog/[slug]/page.tsx:49-66 (خلاصه)
const title = post.seoTitle || post.title;
const url = absoluteUrl(postHref(post));
return {
  title,
  description: post.description,
  keywords: [post.keyword, ...post.secondaryKeywords],
  alternates: { canonical: url },
  ...(ALLOW_INDEXING && isPublished(post) && { robots: { index: true, follow: true } }),
  openGraph: { type: "article", …, images: [image],
    publishedTime: post.publishedAt, modifiedTime: post.updatedAt },
  twitter: { card: "summary_large_image", … },
};
```

- `seoTitle` و `description` از frontmatter فایل Markdown می‌آیند (`lib/blog.ts:62-100`).
  Zod طول description را بین ۲۰ و ۲۲۰ نگه می‌دارد (`lib/blog.ts:67`)؛ بازه ۱۲۰ تا ۱۶۰ را
  نویسنده باید رعایت کند.
- **keywords** فقط روی مقاله‌ها تنظیم شده است. گوگل `meta keywords` را نمی‌خواند؛ اثرش
  حداکثر برای موتورهای دیگر است.
- canonical مقاله با `absoluteUrl` کامل ساخته می‌شود و بقیه صفحه‌ها نسبی‌اند؛ خروجی هر دو
  یکی است (آدرس کامل).

### پرسش و پاسخ

- canonical لیست شامل `dasteh` و `page` است ولی **عبارت جست‌وجو (`q`) هرگز در canonical
  نمی‌آید** (`app/(site)/porsesh/page.tsx:36-44`). crawl تأیید کرد: canonical آدرس
  `/porsesh?q=test` برابر `/porsesh` است.
- صفحه هر پرسش OG از نوع `article` می‌گیرد (`app/(site)/porsesh/[slug]/page.tsx:44`).

### صفحه‌های بدون محتوا (404)

وقتی `generateMetadata` چیزی پیدا نمی‌کند `NOT_FOUND_METADATA` برمی‌گرداند تا تب مرورگر
«صفحه پیدا نشد | علی رضوان» نشان دهد، نه عنوان پیش‌فرض سایت
(`app/(site)/blog/[slug]/page.tsx:51`، `blog/topic/[area]/page.tsx:16`،
`blog/page/[page]/page.tsx:21`، `porsesh/[slug]/page.tsx:35`). `app/not-found.tsx:5` هم
همین را export می‌کند.

### ادمین

`app/admin/layout.tsx:5-7` برای همه صفحه‌های ادمین
`robots: { index: false, follow: false, nocache: true }` می‌گذارد. titleهای ادمین ساده‌اند
(«مقاله‌ها»، «ورود» و …).

## ۵. Open Graph و Twitter Card

| مورد | مقدار | منبع |
| --- | --- | --- |
| `og:locale` | `fa_IR` | `lib/seo.ts:64`، `blog/[slug]/page.tsx:73` |
| `og:site_name` | علی رضوان | `lib/seo.ts:63` |
| `og:type` | `website`؛ مقاله و پرسش `article` | `lib/seo.ts:65`، `blog/[slug]/page.tsx:68`، `porsesh/[slug]/page.tsx:44` |
| تصویر پیش‌فرض | `public/images/og.png`، 1200×630 PNG، حدود 242KB | `lib/seo.ts:35-40` |
| تصویر مقاله | `public/images/blog/og/<slug>.jpg` 1200×630؛ اگر نبود، کاور مقاله | `lib/blog.ts:152-155` |
| `article:published_time` / `modified_time` | از `publishedAt` و `updatedAt` | `blog/[slug]/page.tsx:75-76` |
| `twitter:card` | `summary_large_image` | `lib/seo.ts:69` |

- **`opengraph-image` داینامیک وجود ندارد**؛ همه تصاویر فایل استاتیک‌اند. تصویر OG مقاله با
  `npm run blog:cover` (`scripts/blog-cover.mjs`) ساخته می‌شود.
- ابعاد با `sharp` بررسی شد: `og.png` و `blog/og/new-cheque-rules.jpg` هر دو 1200×630‌اند.
- `twitter:site` و `twitter:creator` تنظیم نشده‌اند (سایت حساب X ندارد).

## ۶. زبان و RTL

```tsx
// app/layout.tsx:54-58
<html lang="fa" dir="rtl" className={`${vazirmatn.variable} …`}>
```

- `inLanguage: "fa-IR"` در همه schemaها (`lib/schema.ts`) و `<language>fa-IR</language>` در
  RSS (`app/(site)/blog/rss.xml/route.ts:44`).
- **hreflang و `alternates.languages` وجود ندارد**. سایت فقط فارسی است و نسخه انگلیسی طبق
  CLAUDE.md §3 به بعد از لانچ موکول شده؛ پس نبودنش درست است.
- چیدمان با کلاس‌های منطقی Tailwind (`ms-*`، `ps-*`) انجام شده (CLAUDE.md §2.3).
