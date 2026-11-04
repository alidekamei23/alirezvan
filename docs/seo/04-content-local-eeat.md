# سئوی محتوایی، سئوی محلی و E-E-A-T

[بازگشت به فهرست](README.md)

## ۱. سلسله‌مراتب headingها

crawl روی ۳۳ صفحه عمومی نشان داد **هر صفحه دقیقاً یک `<h1>` دارد.**

| سطح | از کجا می‌آید |
| --- | --- |
| `h1` | صفحه‌های داخلی: `components/PageHeader.tsx:30`؛ Home: `components/HomeHero.tsx:47-55` (نام + عنوان، با فاصله بین دو بخش در متن heading، خط 51)؛ مقاله: `app/(site)/blog/[slug]/page.tsx:124`؛ پرسش: `components/questions/QuestionArticle.tsx:35`؛ 404: `components/NotFoundContent.tsx:36` |
| `h2` | یک `h2` برای هر `Section` (`components/Section.tsx:3`، `40`)؛ `##` در Markdown مقاله؛ FAQ و منابع مقاله (`blog/[slug]/page.tsx:160`، `169`)؛ `ContactCta` (`components/ContactCta.tsx:25`)؛ عنوان ستون‌های Footer (`components/Footer.tsx:23`، `64`) |
| `h3` | مراحل `Steps` (`components/Steps.tsx:23`)؛ کارت مقاله داخل Section با `headingLevel="h3"` (`components/PostCard.tsx:20`)؛ `###` در Markdown |

نکته: `PostCard` به‌طور پیش‌فرض `h2` است و هر جا داخل یک `Section` می‌آید باید
`headingLevel="h3"` بگیرد (Home، هاب‌ها، مقاله‌های مرتبط این کار را کرده‌اند).

## ۲. تگ‌های semantic

- `<main id="main">` در `components/SiteShell.tsx:20` با skip link (`components/SkipLink.tsx`).
- `<header>`، `<footer>`، دو `<nav aria-label="ناوبری اصلی">` (دسکتاپ و موبایل،
  `components/Header.tsx:33`، `components/MobileMenu.tsx:46`).
- `<nav aria-label="مسیر صفحه">` برای breadcrumb (`components/Breadcrumbs.tsx:11`).
- `<article>` برای مقاله (`blog/[slug]/page.tsx:108`)، `<aside>` برای نویسنده و تماس (خط 202)،
  `<address>` برای نشانی در Home، Contact و Footer.
- FAQ با `<details>/<summary>`؛ پاسخ‌ها در HTML اولیه هستند (`components/Faq.tsx`).

## ۳. Breadcrumb

- **نمایش**: `components/Breadcrumbs.tsx`؛ آیتم آخر لینک نیست و `aria-current="page"` دارد.
- **داده**: همان مسیر به `BreadcrumbList` تبدیل می‌شود ([02-structured-data.md](02-structured-data.md)، بخش ۴).
- **مسیرها**:
  - هاب: خانه ← چک و سفته
  - ابزار: خانه ← ابزارهای محاسبه ← محاسبه خسارت تأخیر تأدیه
  - مقاله: خانه ← وبلاگ ← حوزه ← عنوان مقاله
  - پرسش: خانه ← پرسش و پاسخ ← دسته ← عنوان پرسش

## ۴. لینک‌سازی داخلی

یک نقشه مرکزی در `lib/links.ts` تعیین می‌کند چه چیزهایی به هم مربوط‌اند تا هر لینک مسیر
برگشت هم داشته باشد (commit `8f4c925`):

| از | به | پیاده‌سازی |
| --- | --- | --- |
| هاب | ابزارهای حوزه (`relatedTools`) | `components/PracticeHub.tsx:43-51`، `lib/links.ts:17-20` |
| هاب | ۳ مقاله تازه حوزه + «همه مقاله‌های …» (تاپیک) | `components/PracticeHub.tsx:57-83` |
| هاب | پرسش‌های همان دسته و فرم پرسیدن | `components/PracticeHub.tsx:85-95` |
| ابزار | هاب‌هایی که آن ابزار را دارند، مقاله‌های تازه آن هاب‌ها و بقیه ابزارها (نزدیک‌ترها اول) | `components/RelatedTools.tsx`، `lib/links.ts:23-41` |
| مقاله | ابزارهای حوزه، ۳ مقاله مرتبط، لینک هاب در sidebar | `app/(site)/blog/[slug]/page.tsx:206-238` |
| مقاله | مقاله‌های دیگر داخل متن | `components/ArticleBody.tsx:86-90`، `156-…` |
| پرسش | دسته، هاب مربوط، ابزارها، مقاله‌های مرتبط | `app/(site)/porsesh/[slug]/page.tsx`، `lib/links.ts:44-59` |
| همه صفحه‌ها | ۴ هاب، ابزارها، پرسش و پاسخ، وبلاگ، درباره، تماس، حریم خصوصی، سلب مسئولیت | `content/navigation.ts`، Header و Footer |

**مقاله‌های مرتبط** (`lib/blog.ts:226-241`) به این ترتیب انتخاب می‌شوند: `relatedSlugs`،
بعد مقاله pillar، بعد مقاله‌های همان `cluster`، بعد بقیه مقاله‌های همان حوزه.

**لینک به مقاله منتشرنشده** به صورت متن ساده نمایش داده می‌شود و وقتی مقاله منتشر شود خودش
لینک می‌شود (`components/ArticleBody.tsx:149-154`، `lib/blog.ts:217-220`). پس لینک شکسته
۴۰۴ داخل متن ساخته نمی‌شود. الان از ۱۹ لینک داخلی متن مقاله‌ها فقط ۳ لینک به مقاله
منتشرشده اشاره می‌کنند (دو لینک از `gholnameh-validity-in-court` و یکی از
`property-purchase-checks`)؛ بقیه منتظر مقاله‌های آینده‌اند (مثل
`bounced-cheque-what-to-do` و `mandatory-registration-property-deals` که pillar دو خوشه‌اند).

## ۵. ساختار صفحه‌های خدمات (هاب‌ها)

قالب واحد `components/PracticeHub.tsx` با داده `content/practice-areas.ts`:

1. `PageHeader`: breadcrumb، `h1` (مثلاً «وکیل چک و سفته در تهران»)، پاراگراف‌های مقدمه
2. «مسیر حقوقی»: مراحل (`Steps`)
3. «ابزارهای مرتبط»
4. «پرسش‌های پرتکرار» با FAQPage
5. «مقاله‌های …» (یا EmptyState)
6. «پرسش و پاسخ …»
7. `ContactCta`

**ماشین‌حساب‌ها**: `PageHeader` با فرمول، خود ابزار، «شاخص‌ها و نکته‌ها» در Disclosure،
`RelatedTools`، `ContactCta` و `WebApplication` (نمونه
`app/(site)/tools/khesarat-takhir/page.tsx:29-85`). برچسب «تخمینی است و مشاوره حقوقی
محسوب نمی‌شود» از `ESTIMATE_DISCLAIMER` (`content/legal.ts:2`).

## ۶. ساختار مقاله‌ها

- **فایل**: `content/blog/<slug>.md` با frontmatter؛ Zod در `lib/blog.ts:62-100`؛ راهنمای
  کامل در `docs/blog.md`.
- **ترتیب صفحه** (`app/(site)/blog/[slug]/page.tsx:106-256`): breadcrumb، `h1`، description به
  عنوان lead، «آخرین به‌روزرسانی» با تاریخ جلالی، «بازبینی‌شده توسط وکیل»، زمان مطالعه،
  کاور، متن (با ContactBox بعد از بخش دوم، `components/ArticleBody.tsx:49-77`)، FAQ، منابع،
  سلب مسئولیت، sidebar (AuthorBox، ContactBox، لینک هاب)، ابزارها، مقاله‌های مرتبط و
  ContactCta.
- **محتوای فعلی**: ۵ مقاله تأییدشده، همه با تاریخ `2026-10-23`؛ ۲ مقاله pillar ندارند و ۳ مقاله
  به pillarهایی اشاره می‌کنند که هنوز نوشته نشده‌اند. حوزه «قرارداد» هنوز مقاله‌ای ندارد.
- **منابع**: فیلد `references` لینک‌های بیرونی با `rel="noopener noreferrer"` می‌سازد
  (`blog/[slug]/page.tsx:167-191`). `nofollow` ندارند، که برای منابع قانونی رسمی درست است.

## ۷. alt تصاویر

crawl: **هیچ `<img>` بدون `alt` نیست.**

| تصویر | alt | منبع |
| --- | --- | --- |
| پرتره و آواتار در Hero و LawyerCard | «تصویر علی رضوان» | `components/HomeHero.tsx:31`، `39`؛ `components/LawyerCard.tsx:19` |
| کاور مقاله | `cover.alt` از frontmatter (حداقل ۳ کاراکتر، اجباری) | `blog/[slug]/page.tsx:147`، `lib/blog.ts:90` |
| تصویر داخل متن مقاله | alt از Markdown، با `loading="lazy"` | `components/ArticleBody.tsx:108-128` |
| کاور در کارت مقاله | `alt=""` (تزئینی، عنوان کنارش است) | `components/PostCard.tsx:36` |
| آواتار در AuthorBox | `alt=""` (نام کنارش است) | `components/AuthorBox.tsx:19` |
| نشان کانون | `alt=""` (نام کنارش است) | `components/LicensingBody.tsx:27` |
| تصویر 404 | `alt=""` | `components/NotFoundContent.tsx:29` |

## ۸. سئوی محلی

### NAP: یک منبع

همه چیز از `content/lawyer.ts:7-43` می‌آید:

| داده | مقدار | کجا نمایش داده می‌شود |
| --- | --- | --- |
| نام | علی رضوان | همه جا |
| نشانی | تهران، خیابان دکتر شریعتی، روبه‌روی حسینیه ارشاد، ابتدای کوچه شهیم، پلاک ۶، واحد ۳ | Footer (`components/Footer.tsx:66-68`)، Home (`app/(site)/page.tsx:97-103`)، Contact (`app/(site)/contact/page.tsx:50-56`)، schema `address` |
| تلفن | نمایش `0910-070-8005` با ارقام فارسی؛ `tel:+989100708005` | Footer، Home، Contact، `CallButton`، `StickyContactBar`، schema `telephone` |
| واتس‌اپ | `wa.me/989100708005` | `WhatsAppButton` |
| بله | `null` (دکمه پنهان) | `BaleButton` |

چون همه از یک object می‌خوانند، NAP در کل سایت یکسان است. در schema، `addressLocality`
«تهران» و `addressCountry` «IR» است؛ `postalCode` و `addressRegion` نیست.

### نقشه، ساعات کاری، حوزه جغرافیایی

| مورد | وضعیت | جزئیات |
| --- | --- | --- |
| نقشه | ❌ | `googleMapsUrl: null` (`content/lawyer.ts:35`). Contact فقط اگر لینک باشد دکمه «مسیریابی در Google Maps» نشان می‌دهد (`app/(site)/contact/page.tsx:68-81`). embed نشان یا تصویر استاتیک (CLAUDE.md §2.2) پیاده نشده |
| مختصات (`geo`) | ❌ | TODO در `content/lawyer.ts:32` |
| ساعات کاری | ❌ عمدی | «Working hours are not shown, by the owner's decision» (`content/lawyer.ts:32`) |
| حوزه خدمت | ✅ | `areaServed: City تهران` در schema؛ «در تهران» در titleهای هاب و متن‌ها |
| ثبت در نشان، بلد، Google Business Profile | ⚠️ نیاز به بررسی | در کد نیست؛ `SESSIONS.md:20` آن را کار باز می‌داند |

## ۹. E-E-A-T (YMYL حقوقی)

| سیگنال | وضعیت | کجا |
| --- | --- | --- |
| نام، عنوان، مرجع صدور، شماره پروانه | ✅ روی همه صفحه‌ها | Footer (`components/Footer.tsx:41-58`)، `LicenseStrip` زیر Hero، `LawyerCard` در About و Contact، `AuthorBox` |
| لینک استعلام رسمی پروانه | ✅ | `licenseLookupUrl: https://icbar.ir/fa/directory/40949` (`content/lawyer.ts:22`)؛ «استعلام پروانه» در Footer، AuthorBox و LawyerCard؛ `sameAs` در schema (commit `93e12cb`) |
| عضویت در کانون در schema | ✅ | `memberOf`، `hasCredential` با `recognizedBy` |
| صفحه About | 🟡 | `app/(site)/about/page.tsx`: معرفی، پروانه، حوزه‌ها، شیوه کار، انواع مشاوره، ProfilePage. **بیو و تحصیلات خالی است** و بخشش پنهان است (`about/page.tsx:36-49`، `content/lawyer.ts:24-26`) |
| نویسنده مقاله | ✅ | `AuthorBox` در sidebar (`components/AuthorBox.tsx`)، `author` در Article schema |
| تاریخ مقاله | ✅ | «آخرین به‌روزرسانی» با تاریخ جلالی (`components/UpdatedAt.tsx`)، `datePublished`/`dateModified` در schema، `article:*_time` در OG |
| نشان بازبینی وکیل | ✅ | «بازبینی‌شده توسط وکیل» بدون نام و تاریخ (`content/legal.ts:12`، `blog/[slug]/page.tsx:128-133`)، طبق CLAUDE.md §5.5 |
| منابع قانونی | ✅ | فیلد `references` مقاله |
| سلب مسئولیت | ✅ | صفحه `/disclaimer`، `SITE_DISCLAIMER` در Footer همه صفحه‌ها (`components/Footer.tsx:82`)، پاراگراف آخر هر مقاله، برچسب تخمینی ماشین‌حساب‌ها |
| حریم خصوصی | ✅ | `/privacy` |
| صفحه تماس | ✅ | `/contact` با نشانی، تلفن، واتس‌اپ، درخواست مشاوره و پروانه |
| پرهیز از ادعای تبلیغی | ✅ | بدون Review، رتبه، «رایگان» یا وعده نتیجه؛ تست در `tests/home.test.tsx` |
| عکس واقعی وکیل | ✅ | پرتره و آواتار |

**یک نکته سازگاری** (فقط گزارش، تصمیم با مالک است): سایت و schema عنوان «عضو کانون وکلای
دادگستری مرکز» را می‌گویند، ولی طبق توضیح خود کد صفحه دایرکتوری کانون که با `sameAs` به آن
لینک شده پایه «کارآموز» را نشان می‌دهد (`content/lawyer.ts:17-21`). جزئیات در
[07-issues.md](07-issues.md).
