# مشکلات و پیشنهادها

[بازگشت به فهرست](README.md)

این بخش فقط گزارش است و هیچ کدی تغییر نکرده. اولویت‌ها از نظر اثر بر دیده‌شدن در جست‌وجو
تعیین شده‌اند.

## اولویت بالا

### H1. دامنه نهایی تنظیم نشده

- **کجا**: `.env.production:6`، `NEXT_PUBLIC_SITE_URL=https://alirezvanlegal.liara.run`
- **اثر**: canonical، `og:url`، sitemap، robots، RSS و همه URLهای JSON-LD از این مقدار
  ساخته می‌شوند. اگر index روی همین مقدار روشن شود، گوگل زیردامنه لیارا را نسخه اصلی
  می‌شناسد و جابه‌جایی بعدی هزینه دارد.
- **پیشنهاد**: پیش از روشن‌کردن index، دامنه را وصل کن، این مقدار را عوض کن، دوباره build
  بگیر، و redirect دائمی از `liara.run` به دامنه بگذار (⚠️ نیاز به بررسی: در کد نیست و باید
  در لیارا یا DNS انجام شود).

### H2. کل سایت هنوز noindex است

- **کجا**: `.env.production:9`، `NEXT_PUBLIC_ALLOW_INDEXING=false` ← `robots.txt` با
  `Disallow: /` و `noindex, nofollow` روی همه صفحه‌ها.
- **وضعیت**: عمدی، تا تأیید متن‌ها توسط وکیل (CLAUDE.md §6). لانچ برای ۳۱ اکتبر برنامه‌ریزی
  شده بود و الان ۴ نوامبر است.
- **پیشنهاد**: بعد از H1 و تأیید وکیل، چک‌لیست
  بخش ۶ [06-maintenance-data-map.md](06-maintenance-data-map.md)
  را اجرا کن. تا آن زمان هیچ کار سئوی دیگری در نتایج دیده نمی‌شود.

### H3. Verification و Search Console

- **کجا**: هیچ `verification` در `app/layout.tsx` و هیچ فایل تأیید در `public/` نیست.
- **پیشنهاد**: بعد از وصل‌شدن دامنه، Search Console را با DNS TXT (یا
  `metadata.verification.google`) تأیید کن، sitemap را بفرست و Bing Webmaster را هم اضافه کن.

## اولویت متوسط

### M1. descriptionهای کوتاه‌تر از قاعده CLAUDE.md §6 (۱۲۰ تا ۱۶۰ کاراکتر)

| صفحه | طول | منبع |
| --- | --- | --- |
| `/` | 107 | `app/(site)/page.tsx:27-28` (همان description پیش‌فرض `app/layout.tsx:38-39`) |
| `/about` | 114 | `content/pages.ts:19-20` |
| `/contact` | 117 | `content/pages.ts:46-47` |
| `/request` | 114 | `content/pages.ts:71-72` |
| `/privacy` | 91 | `content/pages.ts:87-88` |
| `/disclaimer` | 93 | `content/pages.ts:137-138` |
| `/blog` | 111 | `content/pages.ts:54-55` |
| `/blog/topic/<area>` (۴ صفحه) | 79–81 | `app/(site)/blog/topic/[area]/page.tsx:20` |
| `/porsesh/peygiri` | 44 | noindex است؛ اهمیتی ندارد |

متن‌ها طبق CLAUDE.md §8 باید توسط وکیل تأیید شوند؛ پیشنهاد متن تازه هم باید از همان مسیر برود.

### M2. صفحه About بیو و سوابق ندارد

- **کجا**: `content/lawyer.ts:24-26` (`bio: null`، `education: []`)؛ بخش «سوابق و تحصیلات»
  پنهان است (`app/(site)/about/page.tsx:36-49`) و `ProfilePage` بدون `description` است.
- **اثر**: در حوزه YMYL حقوقی، تجربه و تخصص نویسنده مهم‌ترین سیگنال E-E-A-T است. About
  فعلاً فقط مشخصات پروانه و فهرست حوزه‌ها را دارد.
- **پیشنهاد**: بیو، تحصیلات، سال شروع کار و عضویت‌ها از وکیل گرفته شود. با پرشدن
  `content/lawyer.ts` صفحه و schema خودکار کامل می‌شوند.

### M3. سئوی محلی ناقص است

- نقشه نیست (`googleMapsUrl: null`)؛ embed نشان یا تصویر استاتیک پیاده نشده
  (`app/(site)/contact/page.tsx:68-69`، TODO).
- `geo`، `postalCode`، `addressRegion` و `hasMap` در `PostalAddress` و `LegalService` نیستند
  (`lib/schema.ts:78-83`).
- ساعات کاری به تصمیم مالک منتشر نمی‌شود؛ این برای پروفایل‌های محلی (Google Business،
  نشان، بلد) نقطه ضعف است ولی تصمیم با مالک است.
- ثبت در Google Business Profile، نشان و بلد در کد قابل بررسی نیست
  (⚠️ نیاز به بررسی؛ `SESSIONS.md:20` آن را باز می‌داند).
- **پیشنهاد**: مختصات و کد پستی را در `content/lawyer.ts` اضافه کن و schema را بسط بده؛
  NAP پروفایل‌های بیرونی را دقیقاً مثل `content/lawyer.ts` بنویس.

### M4. سازگاری عنوان وکیل با منبع تأیید

- **کجا**: `content/lawyer.ts:9` و `17-22`
- **شرح**: سایت و schema (`jobTitle`، `hasCredential.name`، نام `LegalService`) عبارت «عضو
  کانون وکلای دادگستری مرکز» را دارند، در حالی که توضیح خود کد می‌گوید صفحه دایرکتوری کانون
  که با `sameAs` و «استعلام پروانه» به آن لینک شده پایه «کارآموز» را نشان می‌دهد. این عبارت
  تصمیم مالک است (CLAUDE.md §1، 23 Oct). اینجا فقط ثبت می‌شود که موتور جست‌وجو یا
  بازدیدکننده‌ای که دو منبع را مقایسه کند تفاوت را می‌بیند.
- **پیشنهاد**: تصمیمی برای تغییر نیست؛ اگر بعداً پایه پروانه عوض شد، فقط `grade` در
  `content/lawyer.ts` را به‌روز کن.

### M5. آنالیتیکس پیاده نشده

- **کجا**: CLAUDE.md §3 «Self-hosted Umami»؛ در کد هیچ اسکریپتی نیست.
- **اثر**: بدون آن، اثر سئو (ورودی ارگانیک، تماس‌ها، صفحه‌های ورود) اندازه‌گیری نمی‌شود.
  Search Console بخشی از این را جبران می‌کند.
- **پیشنهاد**: Umami روی دامنه خودی، و در صورت نیاز به‌روز کردن متن `/privacy`
  (`content/pages.ts:95` می‌گوید ابزار ردیابی شرکت‌های دیگر استفاده نمی‌شود؛ Umami
  self-hosted با این متن سازگار است).

### M6. پرسش آزمایشی در دیتابیس محلی

- **کجا**: sitemap محلی و `/porsesh/پولمو-کی-میدن` با عنوان «پولمو کی میدن؟؟؟؟؟!!!!!!!!!».
- **اثر**: اگر چنین پرسش‌هایی در دیتابیس production منتشرشده باشند، محتوای کم‌کیفیت index
  می‌شود.
- **پیشنهاد**: ⚠️ نیاز به بررسی: دیتابیس production روی دیسک لیارا را پیش از روشن‌کردن index
  بررسی کن.

### M7. دسته‌های پرسش و پاسخ با query string

- **کجا**: `lib/links.ts:44-46` (`/porsesh?dasteh=<c>`)، canonical خودارجاع با query
  (`app/(site)/porsesh/page.tsx:57`).
- **اثر**: صفحه‌های دسته index‌پذیرند ولی در sitemap نیستند. URL با query string برای صفحه
  فرود دسته‌ای ضعیف‌تر از مسیر ثابت است. این طراحی تصمیم ثبت‌شده است
  (`docs/qa-spec.md:84-85`).
- **پیشنهاد**: تا وقتی پرسش‌ها کم‌اند مشکلی نیست؛ اگر دسته‌ها پر شدند، مسیر ثابت
  (`/porsesh/dasteh/<c>`) یا افزودن آن‌ها به sitemap را بررسی کن.

## اولویت پایین

| # | موضوع | کجا | توضیح و پیشنهاد |
| --- | --- | --- | --- |
| L1 | FAQ rich result دیده نمی‌شود | `components/Faq.tsx`، `lib/schema.ts:213` | گوگل از ۲۰۲۳ FAQ rich result را فقط برای سایت‌های دولتی و سلامت نشان می‌دهد. schema بی‌ضرر است؛ انتظار نتیجه گرافیکی نباشد |
| L2 | `WebApplication` واجد rich result نیست | `lib/schema.ts:162-177` | بدون `offers` و `aggregateRating`؛ حذف عمدی و درست (قواعد کانون) |
| L3 | لینک داخلی بین مقاله‌ها کم است | `content/blog/*.md` | فقط ۳ لینک از ۱۹ لینک متن به مقاله منتشرشده می‌رود؛ pillarهای `bounced-cheque-what-to-do` و `mandatory-registration-property-deals` هنوز نیستند. با انتشار مقاله‌ها خودکار درست می‌شود |
| L4 | حوزه «قرارداد» مقاله ندارد | `/gharardad`، `/blog/topic/gharardad` | تاپیک آن noindex است و هاب EmptyState نشان می‌دهد |
| L5 | همه مقاله‌ها یک تاریخ دارند | frontmatter (`2026-10-23`) | طبیعی است (انتشار هم‌زمان)؛ با هر بازنویسی `updatedAt` را جلو ببر |
| L6 | HTML سرور برای 404 مسیرهای داینامیک `<title>` ندارد | `/blog/nope`، `/design-system` | پاسخ `__next_error__` با status 404 و `noindex` است و محتوا از payload RSC در مرورگر کشیده می‌شود. برای سئو مشکلی نیست (status درست است) |
| L7 | دو تگ robots روی 404 ریشه | `/nothing-here` | `noindex` (Next.js) + `noindex, nofollow` (layout، چون index خاموش است). با روشن‌شدن index یکی می‌ماند |
| L8 | `X-Robots-Tag` روی redirect ادمین نیست | `proxy.ts:17-21` | پاسخ 307 به `/admin/login` این header را ندارد؛ چون `/admin` در robots بسته است و صفحه login خودش noindex دارد، اثری ندارد |
| L9 | web manifest نیست | — | برای سئو لازم نیست؛ برای «افزودن به صفحه اصلی» مفید است |
| L10 | `og.png` حدود 242KB است | `public/images/og.png` | commit `f36e980` می‌گوید به 193KB فشرده شد؛ فایل فعلی بزرگ‌تر است (احتمالاً بعد از تغییر رنگ برند در `8ad092f` دوباره ساخته شده، ⚠️ نیاز به بررسی). زیر حد پیام‌رسان‌هاست |
| L11 | `<enclosure length="0">` در RSS | `app/(site)/blog/rss.xml/route.ts:33` | طبق RSS 2.0 باید حجم فایل باشد؛ بیشتر خواننده‌ها 0 را می‌پذیرند |
| L12 | `meta keywords` فقط روی مقاله‌ها | `app/(site)/blog/[slug]/page.tsx:63` | گوگل نادیده می‌گیرد؛ بی‌ضرر |
| L13 | کاور در کارت مقاله `alt=""` دارد | `components/PostCard.tsx:36` | برای دسترس‌پذیری درست است (عنوان کنارش هست)؛ در جست‌وجوی تصویر فقط کاور صفحه خود مقاله با alt دیده می‌شود |
| L14 | مثال کامنت قدیمی | `components/Breadcrumbs.tsx:3` | مثال هنوز `/guides` و «راهنماها» دارد، در حالی که بخش «وبلاگ» است |
| L15 | `themeColor` دستی کپی شده | `app/layout.tsx:49` | اگر رنگ برند در `app/globals.css` عوض شود باید این هم عوض شود |
| L16 | `twitter:site` نیست | `lib/seo.ts:68-73` | فقط اگر حساب X ساخته شد |
