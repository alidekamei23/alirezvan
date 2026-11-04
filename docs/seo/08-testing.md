# روش تست

[بازگشت به فهرست](README.md)

## ۱. تست‌های خودکار موجود

```bash
npm test
```

| فایل | چه چیزی را می‌سنجد |
| --- | --- |
| `tests/seo.test.ts` | robots در دو حالت index، باز بودن صفحه‌های noindex برای crawler، حذف اسلش پایانی `SITE_URL`، canonical و OG خودارجاع، canonical صفحه‌های paginated، `pagedDescription`، noindex تاپیک خالی، نبودن URL صفحه ۱ |
| `tests/schema.test.tsx` | گراف سراسری، نبودن فیلدهای ناشناخته، `WebApplication`، Article، FAQPage پرسش‌ها، escape تگ script، BreadcrumbList و یکی‌بودنش با `PageHeader`، ProfilePage |
| `tests/not-found.test.tsx` | `ensureStatic` در routeهای داینامیک، عنوان «صفحه پیدا نشد»، یک‌بار رسم‌شدن قاب |
| `tests/headers.test.ts` | security headers |
| `tests/blog.test.ts`، `tests/pagination.test.ts` | frontmatter، مرتب‌سازی، pagination |
| `tests/links.test.tsx` | لینک‌های دوطرفه هاب، ابزار و پرسش |
| `tests/home.test.tsx` | نبودن عبارت تبلیغی مثل «رایگان» |

## ۲. بررسی محلی خروجی واقعی

```bash
npm run build
```

```bash
npm run start -- -p 3100
```

در جدول آخر build نوع رندر هر route دیده می‌شود (`○`، `◐`، `ƒ`).

```bash
curl -s http://localhost:3100/robots.txt
```

```bash
curl -s http://localhost:3100/sitemap.xml
```

```bash
curl -s http://localhost:3100/blog/rss.xml
```

برای دیدن حالت index روشن، یک build جدا با متغیر shell بگیر (متغیر shell بر فایل‌های
`.env` اولویت دارد). بعد از آن دوباره build عادی بگیر تا خروجی محلی index‌پذیر نماند:

```bash
NEXT_PUBLIC_ALLOW_INDEXING=true NEXT_PUBLIC_SITE_URL=https://example.ir npm run build
```

### status و redirect

```bash
curl -sI http://localhost:3100/blog/page/1
```

انتظار: `308` با `location: /blog`.

```bash
curl -sI http://localhost:3100/blog/does-not-exist
```

انتظار: `404` از همان درخواست اول.

```bash
curl -sI http://localhost:3100/blog/
```

انتظار: `308` به `/blog`.

```bash
curl -sI http://localhost:3100/admin/login
```

انتظار: `X-Robots-Tag: noindex, nofollow`.

### بررسی تگ‌های یک صفحه

```bash
curl -s http://localhost:3100/blog/new-cheque-rules | grep -oE '<title>[^<]*</title>|<link rel="canonical"[^>]*>|<meta (name|property)="(description|robots|og:[a-z:_]+|twitter:[a-z]+)"[^>]*>'
```

برای همه صفحه‌ها یک اسکریپت کوچک Node با `fetch` بنویس که title، طول description، canonical،
robots، تعداد `<h1>` و نوع blockهای `application/ld+json` را چاپ کند (این مستند با همین
روش ساخته شد).

## ۳. Structured data

1. **Google Rich Results Test** (`search.google.com/test/rich-results`): روی دامنه عمومی، یا با
   حالت «Code» و HTML کپی‌شده از `view-source:`. انتظار:
   - مقاله: Article، FAQ، Breadcrumbs
   - هاب: FAQ، Breadcrumbs
   - صفحه پرسش: FAQ، Breadcrumbs
   - همه: بدون خطا در Local business / Organization
2. **Schema Markup Validator** (`validator.schema.org`): برای انواعی که گوگل rich result
   ندارد (`Person`، `ProfilePage`، `WebApplication`، `EducationalOccupationalCredential`) و
   برای دیدن اتصال `@id`ها در یک گراف.
3. بررسی کن همه URLها کامل‌اند (با `https://` و دامنه درست) و هیچ `/images/...` نسبی نمانده.

> این دو ابزار سرویس خارجی‌اند و از ایران ممکن است در دسترس نباشند؛ تست را روی دامنه عمومی
> و بعد از وصل‌شدن دامنه انجام بده.

## ۴. Search Console (بعد از روشن‌شدن index)

- **Sitemaps**: ارسال `https://<domain>/sitemap.xml`؛ تعداد URLهای کشف‌شده با sitemap برابر
  باشد.
- **URL Inspection**: برای Home، یک هاب، یک مقاله و یک پرسش؛ «User-declared canonical» و
  «Google-selected canonical» یکی باشند و صفحه «Indexing allowed» باشد.
- **Pages**: «Excluded by noindex» فقط باید شامل نتایج جست‌وجو، دسته‌های خالی، تاپیک‌های بی‌مقاله
  و `/porsesh/peygiri` باشد. «Soft 404» باید خالی باشد.
- **Enhancements**: Breadcrumbs بدون خطا.
- **Bing Webmaster Tools**: همان sitemap (امکان import از Search Console هست).

## ۵. Performance

- **Lighthouse** در Chrome DevTools، حالت Mobile، روی build production (`npm run start`)، نه
  `npm run dev`. صفحه‌های نمونه: `/`، یک مقاله، یک ماشین‌حساب.
  هدف CLAUDE.md §7: LCP کمتر از 2.5s، CLS کمتر از 0.1، tap target حداقل 44px.
- در تب Network بررسی کن: فونت `Vazirmatn-NL-Variable.woff2` preload شده، فایل لاتین فقط وقتی
  لازم است دانلود شده، تصاویر AVIF یا WebP هستند، و هیچ درخواستی به دامنه خارجی نیست.
- **PageSpeed Insights** و گزارش Core Web Vitals در Search Console برای داده واقعی کاربران
  (بعد از اینکه ترافیک کافی برسد).

## ۶. Open Graph

- پیش‌نمایش لینک در پیام‌رسان‌ها (واتس‌اپ، تلگرام، بله): عنوان، توضیح و تصویر 1200×630.
- ابزارهای debug شبکه‌های اجتماعی (مثل Facebook Sharing Debugger) فقط روی دامنه عمومی کار
  می‌کنند.

## ۷. چک دستی بعد از هر تغییر بزرگ

- [ ] `npm run lint`، `npm run typecheck`، `npm test`، `npm run check:contrast`
- [ ] `npm run build` بدون خطا؛ مقاله تازه در جدول build دیده شود
- [ ] `/sitemap.xml` شامل صفحه یا مقاله تازه باشد
- [ ] صفحه تازه یک `<h1>`، canonical درست و description ۱۲۰ تا ۱۶۰ کاراکتر داشته باشد
- [ ] Rich Results Test برای صفحه تازه بدون خطا باشد
