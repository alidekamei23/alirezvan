# مستند سئوی سایت علی رضوان

این پوشه وضعیت سئوی سایت را همان‌طور که در کد هست ثبت می‌کند. هر ادعا با مسیر فایل و
شماره خط آمده است. هر چیزی که از روی کد یا خروجی build قابل تأیید نبود با برچسب
«⚠️ نیاز به بررسی» مشخص شده است.

- تاریخ بررسی: ۱۴ آبان ۱۴۰۵ (4 Nov 2026)
- شاخه: `feature/license-lookup`، آخرین commit: `93e12cb`
- منبع‌ها: کد پروژه، `git log` (۹۲ commit)، خروجی `npm run build` و crawl صفحه‌های build
  شده با `next start` روی پورت 3100

## فهرست فایل‌ها

| فایل | محتوا |
| --- | --- |
| [README.md](README.md) | خلاصه اجرایی، جدول وضعیت، تاریخچه |
| [01-metadata-og.md](01-metadata-og.md) | Metadata، title و description، canonical، Open Graph، Twitter، زبان و RTL |
| [02-structured-data.md](02-structured-data.md) | همه schemaهای JSON-LD |
| [03-crawl-index-urls.md](03-crawl-index-urls.md) | robots، sitemap، noindex، 404، ساختار URL، redirect، RSS |
| [04-content-local-eeat.md](04-content-local-eeat.md) | headingها، breadcrumb، لینک داخلی، alt، سئوی محلی، E-E-A-T |
| [05-performance-technical.md](05-performance-technical.md) | نوع رندر، کش، تصویر، فونت، favicon، آنالیتیکس، security headers |
| [06-maintenance-data-map.md](06-maintenance-data-map.md) | چک‌لیست افزودن صفحه یا مقاله، نقشه داده‌های مرکزی |
| [07-issues.md](07-issues.md) | مشکلات و پیشنهادها با اولویت |
| [08-testing.md](08-testing.md) | روش تست هر بخش |

## ۱. خلاصه اجرایی

- **زیرساخت سئو کامل و متمرکز است.** هر صفحه عمومی metadata خود را از `pageMetadata()` در
  `lib/seo.ts` می‌گیرد: title یکتا، description، canonical، Open Graph با `fa_IR` و
  Twitter card. crawl خروجی build نشان داد همه ۳۳ صفحه بررسی‌شده canonical، OG و دقیقاً
  یک `<h1>` دارند.
- **Structured data یک گراف به‌هم‌پیوسته است.** `LegalService`+`Attorney`، `Person`،
  `Organization` (کانون وکلا) و `WebSite` روی همه صفحه‌ها هستند و schemaهای صفحه‌ها
  (`Article`، `FAQPage`، `BreadcrumbList`، `WebApplication`، `ProfilePage`) با `@id` به
  آن‌ها اشاره می‌کنند. همه داده‌ها از `content/lawyer.ts` می‌آیند.
- **سایت فعلاً عمداً از index بیرون است.** `NEXT_PUBLIC_ALLOW_INDEXING=false` در
  `.env.production` است، پس `robots.txt` همه را `Disallow: /` می‌کند و همه صفحه‌ها
  `noindex, nofollow` دارند. دامنه نهایی هم هنوز تنظیم نشده (`alirezvanlegal.liara.run`).
  این دو مهم‌ترین کار پیش از دیده‌شدن در گوگل‌اند.
- **کمبودهای اصلی محتوایی و محلی‌اند، نه فنی:** بیوگرافی و سوابق وکیل خالی است، نقشه،
  مختصات، کد پستی و ساعات کاری نیست، آنالیتیکس (Umami) پیاده نشده، verification کنسول
  گوگل نیست و description یازده صفحه از حداقل ۱۲۰ کاراکتر CLAUDE.md کوتاه‌تر است.
- **Performance:** صفحه‌ها static یا Partial Prerender هستند، فونت self-hosted است و تصاویر
  AVIF/WebP. طبق `SESSIONS.md` (خط 20) نمره Lighthouse موبایل 97–98 در Performance و 100
  در SEO بوده است (⚠️ نیاز به بررسی: در این بررسی دوباره اجرا نشد).

## ۲. جدول وضعیت

✅ انجام‌شده · 🟡 ناقص · ❌ انجام‌نشده

| موضوع | وضعیت | فایل‌ها | توضیح |
| --- | --- | --- | --- |
| title با template و default | ✅ | `app/layout.tsx:34-37` | `%s \| علی رضوان`؛ Home با `title.absolute` |
| description هر صفحه | 🟡 | `lib/seo.ts:46`، `content/pages.ts` | همه یکتا؛ ۱۱ صفحه زیر ۱۲۰ کاراکتر |
| metadataBase و canonical | ✅ | `app/layout.tsx:33`، `lib/seo.ts:58` | canonical خودارجاع روی همه صفحه‌ها، از جمله صفحه‌های paginated |
| keywords | 🟡 | `app/(site)/blog/[slug]/page.tsx:63` | فقط روی مقاله‌ها (گوگل این تگ را نادیده می‌گیرد) |
| Open Graph | ✅ | `lib/seo.ts:59-67` | `locale: fa_IR`، تصویر 1200×630؛ مقاله‌ها `type: article` با تصویر اختصاصی |
| Twitter Card | ✅ | `lib/seo.ts:68-73` | `summary_large_image` |
| `opengraph-image` داینامیک | ❌ | — | عمداً فایل استاتیک: `public/images/og.png` و `public/images/blog/og/<slug>.jpg` |
| `lang="fa"` و `dir="rtl"` | ✅ | `app/layout.tsx:55-56` | |
| hreflang / alternates زبانی | ❌ (لازم نیست) | — | سایت تک‌زبانه است |
| JSON-LD سراسری (LegalService/Attorney/Person/Organization/WebSite) | ✅ | `lib/schema.ts:39-105`، `components/SiteShell.tsx:25` | |
| LocalBusiness | 🟡 | `lib/schema.ts:70-93` | `LegalService` خودش زیرنوع LocalBusiness است؛ `geo`، `openingHours`، `postalCode` ندارد |
| BreadcrumbList | ✅ | `components/PageHeader.tsx:35`، صفحه مقاله و پرسش | روی همه صفحه‌های داخلی |
| FAQPage | ✅ | `components/Faq.tsx:26`، `lib/schema.ts:213` | هاب‌ها، مقاله‌ها، صفحه هر پرسش |
| Article | ✅ | `lib/schema.ts:180-207` | `Article` (نه `BlogPosting`) |
| ProfilePage | ✅ | `lib/schema.ts:124-139` | صفحه About؛ بدون `description` تا بیو برسد |
| WebApplication (ابزارها) | ✅ | `lib/schema.ts:162-177` | بدون `offers` (عمدی) |
| Review / AggregateRating | ❌ (عمدی) | — | با قواعد تبلیغ کانون (CLAUDE.md §2.1) ناسازگار است |
| robots.ts با سوییچ index | ✅ | `app/robots.ts:8-20` | |
| sitemap.ts داینامیک | ✅ | `app/sitemap.ts:35-70` | مقاله‌ها، پرسش‌ها، تاپیک‌ها؛ lastModified فقط از تاریخ واقعی |
| priority / changeFrequency | ❌ (عمدی) | `app/sitemap.ts` | گوگل این دو را نادیده می‌گیرد |
| noindex صفحه‌های خالی و جست‌وجو | ✅ | `lib/seo.ts:22`، `blog/topic/[area]/page.tsx:25`، `porsesh/page.tsx:62` | `noindex, follow` |
| noindex ادمین | ✅ | `app/admin/layout.tsx:7`، `proxy.ts:25` | meta و `X-Robots-Tag` |
| 404 واقعی | ✅ | `ensureStatic = "navigation"` در ۵ route | status 404 از اولین درخواست |
| slug انگلیسی برای مقاله | ✅ | `lib/blog.ts:51-54` | `/blog/<english-slug>` |
| slug فارسی برای پرسش‌ها | ✅ | `lib/articles/slug.ts:16-28` | در sitemap با `encodeURI` |
| redirect صفحه ۱ لیست‌ها | ✅ | `next.config.js:39-48` | 308 به آدرس اصلی |
| trailing slash | ✅ | پیش‌فرض Next.js | `/blog/` → 308 → `/blog` |
| RSS | ✅ | `app/(site)/blog/rss.xml/route.ts` | با `<link rel="alternate">` روی `/blog` |
| یک H1 در هر صفحه | ✅ | `components/PageHeader.tsx:30` | crawl تأیید کرد |
| breadcrumb دیداری | ✅ | `components/Breadcrumbs.tsx` | |
| لینک‌سازی داخلی | ✅ | `lib/links.ts` | هاب ↔ ابزار ↔ مقاله ↔ پرسش، دوطرفه |
| alt تصاویر | ✅ | — | هیچ `<img>` بدون alt نیست؛ تصاویر تزئینی `alt=""` |
| NAP یکسان | ✅ | `content/lawyer.ts` | یک منبع برای Footer، Home، Contact و schema |
| نقشه | ❌ | `app/(site)/contact/page.tsx:68` | `googleMapsUrl: null`، Neshan پیاده نشده |
| ساعات کاری | ❌ (تصمیم مالک) | `content/lawyer.ts:32` | |
| معرفی وکیل و شماره پروانه | ✅ | `components/LawyerCard.tsx`، `components/Footer.tsx:41-58` | با لینک استعلام کانون |
| بیوگرافی و سوابق | ❌ | `content/lawyer.ts:24-26` | `bio: null`، `education: []` |
| نویسنده و تاریخ مقاله | ✅ | `components/AuthorBox.tsx`، `components/UpdatedAt.tsx` | |
| سلب مسئولیت | ✅ | `app/(site)/disclaimer/page.tsx`، `components/Footer.tsx:82` | |
| next/image | ✅ | `components/HomeHero.tsx`، `blog/[slug]/page.tsx:145` | `sizes`، `preload`، AVIF/WebP |
| next/font محلی | ✅ | `app/layout.tsx:8-30` | Vazirmatn، `display: swap` |
| favicon و icons | ✅ | `app/favicon.ico`، `app/icon.png` (512)، `app/apple-icon.png` (180) | |
| web manifest | ❌ | — | |
| theme-color | ✅ | `app/layout.tsx:49` | `#5752b4` |
| verification گوگل / Bing | ❌ | — | |
| آنالیتیکس | ❌ | — | Umami در CLAUDE.md §3 آمده ولی در کد نیست |
| security headers | ✅ | `next.config.js:9-17` | CSP محدود، HSTS، XFO و … |
| دامنه نهایی | ❌ | `.env.production:6` | `https://alirezvanlegal.liara.run` |
| روشن‌کردن index | ❌ (عمدی تا تأیید وکیل) | `.env.production:9` | |

## ۳. تاریخچه کارهای سئو (از git log)

| تاریخ | Commit | کار |
| --- | --- | --- |
| 11 Oct | `583002e` | متن هاب‌ها، About، Contact و helper متادیتا (`pageMetadata`) |
| 13 Oct | `59ab1e9`، `4dcc76b` | لایه داده و routeهای وبلاگ، pagination |
| 13 Oct | `37b6b77` | sitemap، robots با سوییچ index، favicon |
| 13 Oct | `d12e848` | status 404 واقعی برای آدرس‌های ناشناخته وبلاگ |
| 13 Oct | `7075dc9` | schema سراسری Attorney و تصویر link-preview |
| 13 Oct | `e009f01` | انتقال صفحه‌های عمومی به route group `(site)` بدون تغییر URL |
| 19 Oct | `7b103a8` | صفحه `/tools` |
| 19 Oct | `e8dc89c` | بخش پرسش و پاسخ با آدرس فارسی |
| 23 Oct | `d00037b` | پنج مقاله تأییدشده به جای نمونه‌ها؛ slug انگلیسی |
| 23 Oct | `56d63d4` | `NEXT_PUBLIC_SITE_URL` برای build لایو در `.env.production` |
| 23 Oct | `dd63147` | عنوان «عضو کانون وکلای دادگستری مرکز» به جای عنوان پایه‌یک |
| 31 Oct | `836ba27` | سخت‌ترکردن robots، redirect صفحه ۱ لیست‌ها |
| 31 Oct | `8b0a9c5` | یکپارچه‌کردن JSON-LD در یک گراف با `@id`؛ schema ابزارها |
| 31 Oct | `c56d4b4` | BreadcrumbList روی همه صفحه‌های داخلی، ProfilePage روی About |
| 31 Oct | `ee72993` | برداشتن `/porsesh/peygiri` و `/design-system` از robots تا crawler تگ noindex را ببیند |
| 31 Oct | `059e560` | حذف یک صفت عالی و یک ادعای دقت از متن عمومی |
| 31 Oct | `8f4c925` | لینک دوطرفه هاب، ابزار، مقاله و پرسش |
| 31 Oct | `91809ec` | 404 واقعی از اولین درخواست (`ensureStatic`) |
| 2 Nov | `f36e980` | quick winهای ممیزی سئو: کوتاه‌کردن titleها، noindex لیست‌های خالی، FAQPage برای پرسش‌ها، lastmod در sitemap، Twitter card، AVIF |
| 2 Nov | `93e12cb` | لینک شماره پروانه به صفحه دایرکتوری کانون مرکز (`sameAs`) |
