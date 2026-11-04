# Performance، Core Web Vitals و موارد فنی دیگر

[بازگشت به فهرست](README.md)

## ۱. نوع رندر صفحه‌ها (خروجی واقعی `npm run build`)

Next.js 16.4.3 با Turbopack، `cacheComponents: true`. نمادها: `○` Static، `◐` Partial
Prerender (HTML استاتیک با بخش‌های stream‌شده)، `ƒ` Dynamic.

| مسیر | نوع | توضیح |
| --- | --- | --- |
| `/`، `/about`، `/contact`، `/request`، `/privacy`، `/disclaimer` | ○ | |
| ۴ هاب، `/tools` و ۸ ابزار | ○ | |
| `/blog`، `/blog/rss.xml` | ○ | |
| `/blog/<slug>` | ○ برای ۵ مقاله (۲ تا در جدول نام برده شده و «+3 more paths») | `generateStaticParams` از فایل‌های Markdown |
| `/blog/topic/<area>` | ○ برای ۴ حوزه | |
| `/blog/page/[page]`، `/blog/topic/[area]/page/[page]` | فقط `__none__` (هنوز صفحه ۲ وجود ندارد) | |
| `/porsesh` | ƒ | `searchParams` می‌خواند؛ داده از کش `"use cache"` (`lib/questions/cached.ts:16-21`) |
| `/porsesh/[slug]` | ◐؛ هیچ پرسشی از پیش ساخته نمی‌شود | با درخواست اول render و کش می‌شود، revalidate ۱ روز، expire ۱ هفته |
| `/porsesh/bepors` | ◐ | فرم |
| `/porsesh/peygiri` | ○ | |
| `/sitemap.xml` | ○ با revalidate ۱ روز | |
| `/robots.txt`، `/icon.png`، `/apple-icon.png` | ○ | |
| `/admin/**` | ◐ / ƒ | |
| `/uploads/[file]`، `/api/porsesh/view`، `/admin/api/upload` | ƒ | |

**ISR به معنای `revalidate` قدیمی** استفاده نشده؛ تازه‌سازی پرسش‌ها با
`cacheTag("questions")` و `updateTag` از پنل ادمین انجام می‌شود (`lib/questions/cached.ts:1-4`).
مقاله‌ها فایل‌اند و با هر deploy دوباره build می‌شوند.

## ۲. تصاویر (`next/image`)

```js
// next.config.js:29
images: { formats: ["image/avif", "image/webp"] },
```

| تصویر | `sizes` | اولویت | فایل |
| --- | --- | --- | --- |
| پرتره Hero (md به بالا) | `(min-width: 64rem) 24rem, (min-width: 48rem) 16rem, 1px` | `preload` | `components/HomeHero.tsx:37-45` |
| آواتار Hero (موبایل) | `6rem` | عادی | `components/HomeHero.tsx:29-36` |
| کاور مقاله (LCP مقاله) | `(min-width: 48rem) 42rem, calc(100vw - 2rem)` | `preload` + `fetchPriority="high"` | `app/(site)/blog/[slug]/page.tsx:145-154` |
| کارت مقاله | متناسب با grid | lazy (پیش‌فرض) | `components/PostCard.tsx:34-39` |
| AuthorBox | `56px` | lazy | `components/AuthorBox.tsx:17-24` |
| LawyerCard | `96px` | lazy | `components/LawyerCard.tsx:17-22` |
| تصویر داخل متن مقاله | — (`<img>` ساده، فایل WebP از قبل کوچک‌شده) | `loading="lazy"`، `decoding="async"`، `width`/`height` از `#WxH` برای جلوگیری از CLS | `components/ArticleBody.tsx:108-128` |

- `1px` در `sizes` پرتره Hero برای موبایل است، چون آنجا با CSS پنهان است و نباید فایل بزرگ
  دانلود شود.
- همه `next/image`ها `width` و `height` دارند، پس فضا از قبل رزرو می‌شود.

## ۳. فونت (`next/font/local`)

```ts
// app/layout.tsx:8-30 (خلاصه)
const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-NL-Variable.woff2",   // فقط حروف فارسی، 48KB، preload
  variable: "--font-vazirmatn", weight: "100 900", display: "swap",
});
const vazirmatnLatin = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",      // نسخه کامل، 111KB
  display: "swap", preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0022, U+0025, U+0030-0039, U+0041-005A, U+0061-007A, U+2026" }],
});
```

- فونت self-hosted است و به هیچ CDN خارجی وابسته نیست (CLAUDE.md §2.2).
- نسخه لاتین فقط وقتی دانلود می‌شود که صفحه یکی از آن کاراکترها را داشته باشد.
- `display: swap` متن را بلافاصله با فونت جایگزین نشان می‌دهد.

## ۴. Lazy loading و JavaScript

- تصاویر خارج از دید lazy هستند (پیش‌فرض `next/image`).
- FAQ و Disclosureها بدون JavaScript کار می‌کنند (`<details>`).
- `partialPrefetching: true` (`next.config.js:35`).
- آیکون‌ها از `lucide-react` به صورت SVG داخل bundle‌اند، نه CDN.

## ۵. Core Web Vitals

| معیار | هدف CLAUDE.md §7 | آخرین اندازه‌گیری ثبت‌شده |
| --- | --- | --- |
| LCP | کمتر از 2.5s روی 4G | ⚠️ نیاز به بررسی: عدد جدا ثبت نشده |
| CLS | کمتر از 0.1 | ⚠️ نیاز به بررسی |
| Lighthouse موبایل | — | Performance 97–98، SEO 100 (`SESSIONS.md:20`، 2 Nov). ⚠️ در این بررسی دوباره اجرا نشد |

## ۶. Favicon، icons و manifest

| فایل | ابعاد | روش |
| --- | --- | --- |
| `app/favicon.ico` | ⚠️ (3.5KB) | قرارداد فایلی Next.js |
| `app/icon.png` | 512×512 | قرارداد فایلی؛ همچنین `logo` در schema (`lib/schema.ts:36`) |
| `app/apple-icon.png` | 180×180 | قرارداد فایلی |
| `manifest.webmanifest` / `app/manifest.ts` | ❌ وجود ندارد | |

**theme-color**: `#5752b4` در `app/layout.tsx:49`.

## ۷. Verification کنسول‌ها

در کد هیچ `verification` در metadata، هیچ `google-site-verification` و هیچ فایل HTML
تأیید (مثل `googleXXXX.html` یا `BingSiteAuth.xml`) در `public/` نیست. ⚠️ نیاز به بررسی:
ممکن است تأیید از راه DNS انجام شود؛ در کد چیزی ثبت نشده. `SESSIONS.md:20` ثبت در Search
Console را کار باز می‌داند.

## ۸. آنالیتیکس

CLAUDE.md §3 «Self-hosted Umami (script served from our own domain)» را در stack آورده، ولی
**در کد هیچ اسکریپت، component یا تنظیم Umami یا آنالیتیکس دیگری نیست.** صفحه حریم خصوصی
هم می‌گوید از ابزار ردیابی شرکت‌های دیگر استفاده نمی‌شود (`content/pages.ts:95`). تنها
شمارش موجود، شمارنده بازدید پرسش‌هاست که فقط در ادمین دیده می‌شود
(`app/api/porsesh/view/route.ts`، `components/questions/ViewCounter.tsx`).

## ۹. Security headers

```js
// next.config.js:9-17
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
];
```

- روی همه مسیرها اعمال می‌شود (`next.config.js:22-24`) و `poweredByHeader: false` (خط 21).
  روی پاسخ‌های 404 هم دیده شد.
- CSP عمداً `script-src` ندارد، چون Next.js اسکریپت inline دارد (`next.config.js:5-8`).
- HSTS بدون `includeSubDomains` و `preload` است، چون زیردامنه‌های دامنه آینده هنوز معلوم
  نیستند (خط 15).
- `/admin` علاوه بر این‌ها `X-Robots-Tag` و `Cache-Control: no-store` دارد (`proxy.ts:25-26`).
- تست: `tests/headers.test.ts`.

## ۱۰. میزبانی

- لیارا، app `alirezvanlegal`، سرور در ایران (`liara.json`: `"location": "iran"`)،
  `output: "standalone"` (`next.config.js:26`).
- هیچ وابستگی خارجی در مسیر بازدیدکننده نیست (فونت، آیکون، نقشه، آنالیتیکس)، که برای
  دسترس‌بودن در زمان قطع اینترنت بین‌الملل مهم است (CLAUDE.md §2.2).
