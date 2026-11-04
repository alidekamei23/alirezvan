# راهنمای نگهداری و نقشه داده‌ها

[بازگشت به فهرست](README.md)

## ۱. چک‌لیست: افزودن مقاله تازه

مقاله‌ها فقط وقتی اضافه می‌شوند که وکیل آن‌ها را تأیید کرده باشد (CLAUDE.md §5.5).

- [ ] فایل `content/blog/<slug>.md` با نام دقیقاً برابر `slug` بساز (`lib/blog.ts:144-146`).
- [ ] `slug` انگلیسی، فقط `a-z`، `0-9` و خط تیره؛ نه `page` و نه `topic`. **بعد از انتشار
      هرگز تغییرش نده** (redirect خودکاری برای مقاله‌ها وجود ندارد).
- [ ] `title` و `seoTitle`: عنوان نهایی با « | علی رضوان» حداکثر ۶۰ کاراکتر (یعنی حدود ۴۸
      کاراکتر برای خود عنوان).
- [ ] `description`: ۱۲۰ تا ۱۶۰ کاراکتر (Zod فقط ۲۰ تا ۲۲۰ را می‌گیرد).
- [ ] `keyword` و `secondaryKeywords`.
- [ ] `category` یکی از `چک`، `ملک`، `اجاره`، `مطالبه طلب`، `قرارداد`؛ حوزه هاب را تعیین
      می‌کند (`lib/blog.ts:27-33`).
- [ ] `cluster`، `type` (`pillar` یا `cluster`)، `pillar` و `relatedSlugs`.
- [ ] `publishedAt` و `updatedAt` به صورت ISO (`2026-10-23`)؛ هر بازنویسی واقعی `updatedAt`
      را جلو ببرد (sitemap، Article schema، OG و «آخرین به‌روزرسانی» از آن می‌خوانند).
- [ ] `cover` با `src` زیر `/images/blog/`، ابعاد واقعی و `alt` توصیفی.
- [ ] `npm run blog:cover` برای ساختن `public/images/blog/og/<slug>.jpg` (1200×630).
      اگر نسازی، کاور به جای تصویر OG استفاده می‌شود (`lib/blog.ts:152-155`).
- [ ] `faq` (پرسش‌ها FAQPage می‌سازند) و `references`.
- [ ] پاراگراف آخر سلب مسئولیت («… مشاوره حقوقی محسوب نمی‌شود»)، تا بعد از FAQ نمایش داده
      شود (`lib/blog.ts:125-134`).
- [ ] در متن به هاب، ابزار یا مقاله‌های دیگر با مسیر نسبی (`/blog/<slug>`) لینک بده.
      لینک به مقاله منتشرنشده خودکار متن ساده می‌شود.
- [ ] در مقاله‌های قدیمی‌تر همان خوشه، به این مقاله لینک برگشت بده یا `relatedSlugs`
      آن‌ها را به‌روز کن.
- [ ] `status: "approved"` فقط وقتی تأیید وکیل گرفته شد.
- [ ] `npm run lint`، `npm run typecheck`، `npm test`، `npm run build`.

**خودکار انجام می‌شود (کاری لازم نیست):** canonical، OG و Twitter، Article و FAQPage و
BreadcrumbList، ورود به sitemap و RSS، لیست `/blog` و تاپیک، سه مقاله تازه هاب و ابزارها،
مقاله‌های مرتبط، `lastModified` صفحه اصلی، وبلاگ، هاب و تاپیک، و برداشتن noindex از تاپیکی
که اولین مقاله‌اش را گرفته است.

## ۲. چک‌لیست: افزودن حوزه کاری (هاب) تازه

- [ ] یک entry به `practiceAreas` در `content/practice-areas.ts` اضافه کن: `slug`، `href`،
      `title`، `heading` (همان `h1` و title صفحه)، `metaDescription` ۱۲۰ تا ۱۶۰ کاراکتر،
      `intro`، `steps`، `faqs`، `relatedTools`.
- [ ] `app/(site)/<slug>/page.tsx` مثل `app/(site)/check-safte/page.tsx` بساز
      (`pageMetadata` + `<PracticeHub area={…} />`).
- [ ] آیتم منو در `practiceNav` (`content/navigation.ts:6-11`).
- [ ] دسته مقاله در `CATEGORY_AREAS` (`lib/blog.ts:27-33`).
- [ ] اگر پرسش و پاسخ هم دسته‌ای با همین slug می‌خواهد، در `content/question-categories.ts`.
- [ ] sitemap، تاپیک وبلاگ (`generateStaticParams`)، `knowsAbout` در schema و FAQPage
      خودکارند.
- [ ] CLAUDE.md §4 (فهرست پوشه‌ها) را به‌روز کن.

## ۳. چک‌لیست: افزودن ماشین‌حساب تازه

- [ ] entry در `content/tools.ts` (`slug`، `href`، `title`، `summary`، `group`).
- [ ] متن صفحه در `content/<tool>.ts` با `metaTitle` (شامل «ماشین‌حساب»، حداکثر ۶۰ کاراکتر با
      پسوند) و `metaDescription`.
- [ ] `app/(site)/tools/<slug>/page.tsx` با `pageMetadata`، `PageHeader` (breadcrumb:
      ابزارهای محاسبه ← ابزار)، `RelatedTools`، `ContactCta` و
      `<JsonLd data={toolSchema(tool)} />`.
- [ ] برچسب «این نتیجه تخمینی است و مشاوره حقوقی محسوب نمی‌شود» (CLAUDE.md §2.1).
- [ ] ابزار را به `relatedTools` هاب‌های مربوط اضافه کن تا لینک دوطرفه شود.
- [ ] sitemap (از `toolList`) و صفحه `/tools` خودکارند.

## ۴. چک‌لیست: افزودن صفحه ثابت تازه

- [ ] `export const metadata = pageMetadata({ title, description, path })`؛ متن در
      `content/pages.ts`.
- [ ] `PageHeader` با `crumbs` (یک `h1` و BreadcrumbList خودکار).
- [ ] مسیر را به `STATIC_PATHS` در `app/sitemap.ts:13-21` اضافه کن، مگر اینکه نباید index
      شود.
- [ ] اگر باید از نتایج بیرون بماند: `robots` در metadata (`NOINDEX_FOLLOW` یا
      `{ index: false, follow: false }`)، و **نه** `Disallow` در `robots.ts`.
- [ ] لینک در `siteNav` یا `legalNav` (`content/navigation.ts`) اگر لازم است.

## ۵. چک‌لیست: انتشار پرسش و پاسخ

- [ ] slug فارسی کوتاه و خوانا (پیش‌فرض از عنوان ساخته می‌شود، `lib/articles/slug.ts`).
      تغییر slug بعداً redirect 308 می‌سازد.
- [ ] `metaTitle` و `metaDescription` اختیاری؛ اگر خالی باشند عنوان و ۱۵۵ کاراکتر اول پاسخ
      استفاده می‌شود.
- [ ] حذف هر اطلاعات شناسایی‌کننده (CLAUDE.md §2.1).
- [ ] sitemap، FAQPage و breadcrumb خودکارند؛ کش با `updateTag` تازه می‌شود.

## ۶. چک‌لیست: روشن‌کردن index روی دامنه نهایی

- [ ] تأیید متن‌ها توسط وکیل (`npm run review:copy`).
- [ ] `NEXT_PUBLIC_SITE_URL` در `.env.production:6` به دامنه نهایی (با `https://`، بدون
      اسلش پایانی).
- [ ] `NEXT_PUBLIC_ALLOW_INDEXING=true` در `.env.production:9`.
- [ ] build و deploy دوباره (متغیرها build-time هستند).
- [ ] redirect دائمی از `alirezvanlegal.liara.run` و نسخه www/بدون www به آدرس اصلی (در
      لیارا یا DNS).
- [ ] بررسی `/robots.txt` و `/sitemap.xml` روی دامنه.
- [ ] ثبت در Google Search Console و Bing Webmaster، ارسال sitemap.
- [ ] پاک‌کردن پرسش‌های آزمایشی از دیتابیس production.

## ۷. نقشه داده‌های مرکزی

### `content/lawyer.ts` (منبع یکتای هویت)

| فیلد | مقدار فعلی | مصرف‌کننده‌ها |
| --- | --- | --- |
| `name` | علی رضوان | title template و default (`app/layout.tsx:35-36`)، `og:site_name` (`lib/seo.ts:63`)، alt تصویر OG (`lib/seo.ts:39`)، همه schemaها، HomeHero، Footer، AuthorBox، LawyerCard، RSS `<copyright>` |
| `grade` | عضو کانون وکلای دادگستری مرکز | title پیش‌فرض و Home، `jobTitle` و `hasCredential.name` و نام `LegalService`، HomeHero، Footer، AuthorBox، LawyerCard |
| `licensingBody` | کانون وکلای دادگستری مرکز | `Organization` schema، LicenseStrip، LawyerCard |
| `licensingBodyLogo` | `/images/kanoon-markaz.webp` | schema، `components/LicensingBody.tsx` |
| `licenseNumber` | 40949 | `hasCredential.identifier`، Footer، AuthorBox، LicenseStrip، LawyerCard |
| `licensingBodyUrl` | `https://icbar.ir` | `Organization.url` |
| `licenseLookupUrl` | `https://icbar.ir/fa/directory/40949` | `sameAs` و `hasCredential.url`، لینک «استعلام پروانه» در Footer، AuthorBox، LicenseStrip و LawyerCard |
| `bio`، `education` | `null`، `[]` | بخش «سوابق و تحصیلات» About (پنهان)، `ProfilePage.description` |
| `photo` | `/images/ali-rezvan-portrait.jpg` 976×1100 | `image` در schema، Hero |
| `avatar` | `/images/ali-rezvan-avatar.jpg` 384×384 | Hero موبایل، AuthorBox، LawyerCard |
| `city` | تهران | `addressLocality`، `areaServed`، نشانی‌ها |
| `address` | خیابان دکتر شریعتی … واحد ۳ | `streetAddress`، Footer، Home، Contact |
| `googleMapsUrl` | `null` | `hasMap`، دکمه مسیریابی Contact |
| `phone` | `0910-070-8005` / `+989100708005` | `telephone` در schema، `contactLinks.call`، Footer، Home، Contact، StickyContactBar |
| `whatsapp` | 989100708005 | `contactLinks.whatsapp` |
| `bale` | `null` | `contactLinks.bale` |

### دامنه و index

| داده | تعریف | مصرف |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `.env.production:6` (live)، `.env.local` (محلی)، `.env.example:4` | `SITE_URL` (`lib/seo.ts:7`) ← `metadataBase`، `absoluteUrl()` ← sitemap، robots، RSS، canonical مقاله، OG مقاله؛ `components/JsonLd.tsx` ← همه URLهای JSON-LD |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `.env.production:9`، `.env.example:8` | `ALLOW_INDEXING` (`lib/seo.ts:16`) ← `app/layout.tsx:41`، `app/robots.ts:13`، `NOINDEX_FOLLOW`، robots مقاله |

### داده‌های دیگر

| داده | فایل | مصرف |
| --- | --- | --- |
| حوزه‌های کاری (عنوان، heading، description، FAQ، ابزارها) | `content/practice-areas.ts` | هاب‌ها، منو، sitemap، تاپیک‌ها، `knowsAbout`، `lib/links.ts` |
| منو | `content/navigation.ts` | Header، MobileMenu، Footer |
| ابزارها | `content/tools.ts` + `content/<tool>.ts` | صفحه‌های ابزار، `/tools`، sitemap، `WebApplication` |
| متن صفحه‌های ثابت و descriptionها | `content/pages.ts` | About، Contact، Request، Privacy، Disclaimer، Blog، RSS |
| پرسش و پاسخ | `content/questions.ts`، `content/question-categories.ts`، دیتابیس SQLite | `/porsesh/**`، sitemap |
| برچسب‌های حقوقی | `content/legal.ts` | Footer، مقاله، ماشین‌حساب‌ها |
| مقاله‌ها | `content/blog/*.md` | وبلاگ، هاب‌ها، Home، sitemap، RSS |
| تصویر OG پیش‌فرض | `public/images/og.png` (ارجاع در `lib/seo.ts:36`، `lib/blog.ts:49`) | همه صفحه‌های بدون تصویر اختصاصی |
| رنگ برند | `app/globals.css` (توکن iris-700) | `themeColor` (`app/layout.tsx:49`، دستی کپی شده) |
