# Structured Data (JSON-LD)

[بازگشت به فهرست](README.md)

## ۱. معماری

- **سازنده‌ها**: همه schemaها توابع خالص در `lib/schema.ts` هستند.
- **رندر**: `<JsonLd data={…} />` در `components/JsonLd.tsx` یک
  `<script type="application/ld+json">` می‌سازد و دو کار می‌کند:
  1. مقدار کلیدهای `item`، `url`، `image`، `mainEntityOfPage` و `@id` را اگر با `/` شروع
     شوند با `SITE_URL` کامل می‌کند (`components/JsonLd.tsx:6-19`). این کار در عمق اشیا و
     آرایه‌ها هم انجام می‌شود، مثلاً `logo.url`.
  2. `<` را به `<` تبدیل می‌کند تا متن داده نتواند تگ script را ببندد
     (`components/JsonLd.tsx:22-24`؛ تست در `tests/schema.test.tsx:156`).
- **گراف با `@id`**: موجودیت‌های سراسری یک بار تعریف می‌شوند و schemaهای صفحه فقط با
  `@id` به آن‌ها اشاره می‌کنند (commit `8b0a9c5`):

```ts
// lib/schema.ts:21-24
export const PRACTICE_ID = "/#practice";
export const LAWYER_ID = "/#lawyer";
export const LICENSING_BODY_ID = "/#licensing-body";
export const WEBSITE_ID = "/#website";
```

- **قاعده داده**: هر واقعیت فقط از `content/lawyer.ts` می‌آید و فیلدی که آنجا نیست حدس زده
  نمی‌شود: `geo`، `openingHours`، `priceRange` و `offers` عمداً حذف شده‌اند
  (`lib/schema.ts:9-13`).

## ۲. نقشه schemaها در صفحه‌ها

خروجی crawl از build واقعی:

| صفحه | blockهای JSON-LD |
| --- | --- |
| همه صفحه‌های عمومی (از جمله 404) | `@graph`: `LegalService+Attorney`، `Person`، `Organization`، `WebSite` |
| `/` | فقط گراف سراسری |
| `/about` | `BreadcrumbList`، `ProfilePage` |
| `/contact`، `/request`، `/privacy`، `/disclaimer`، `/tools`، `/blog`، `/blog/topic/*`، `/porsesh`، `/porsesh/bepors`، `/porsesh/peygiri` | `BreadcrumbList` |
| ۴ هاب (`/check-safte` و …) | `BreadcrumbList`، `FAQPage` |
| ۸ ماشین‌حساب (`/tools/*`) | `BreadcrumbList`، `WebApplication` |
| `/blog/<slug>` | `FAQPage`، `Article`، `BreadcrumbList` |
| `/porsesh/<slug>` | `FAQPage` (یک پرسش)، `BreadcrumbList` |

## ۳. گراف سراسری: `siteGraph()`

- **محل تزریق**: `components/SiteJsonLd.tsx:7-9` ← `components/SiteShell.tsx:25`. `SiteShell`
  هم در `app/(site)/layout.tsx` و هم در `app/not-found.tsx` استفاده می‌شود، پس روی همه
  صفحه‌های عمومی هست و روی ادمین نیست.
- **کد**: `lib/schema.ts:39-105`

### `LegalService` + `Attorney` (`@id: /#practice`)، خطوط 70-93

| فیلد | مقدار | منبع |
| --- | --- | --- |
| `name` | «علی رضوان، عضو کانون وکلای دادگستری مرکز» | `lawyer.name` + `lawyer.grade` |
| `url` | `/` | |
| `image` | `/images/ali-rezvan-portrait.jpg` | `lawyer.photo.src` |
| `logo` | `ImageObject` با `/icon.png`، 512×512 | `lib/schema.ts:36` |
| `telephone` | `+989100708005` | `lawyer.phone.tel` |
| `address` | `PostalAddress`: `streetAddress`، `addressLocality: تهران`، `addressCountry: IR` | `lawyer.address`، `lawyer.city` |
| `areaServed` | `City` تهران در `Country` ایران | `lawyer.city` |
| `knowsAbout` | عنوان چهار حوزه کاری | `content/practice-areas.ts` |
| `founder`، `employee` | `{ @id: /#lawyer }` | |
| `hasMap` | فقط اگر `googleMapsUrl` باشد (الان `null`) | `lawyer.googleMapsUrl` |

`LegalService` در schema.org زیرنوع `LocalBusiness` است، پس نیاز CLAUDE.md §6 به
«`LegalService`/`Attorney` + `LocalBusiness`» از همین راه پوشش داده شده است.

### `Person` (`@id: /#lawyer`)، خطوط 48-68

| فیلد | مقدار |
| --- | --- |
| `name`، `jobTitle` | علی رضوان، «عضو کانون وکلای دادگستری مرکز» |
| `url`، `image`، `telephone` | `/about`، پرتره، تلفن |
| `worksFor` | `{ @id: /#practice }` |
| `memberOf` | `{ @id: /#licensing-body }` |
| `sameAs` | `[https://icbar.ir/fa/directory/40949]` (صفحه پروانه در دایرکتوری کانون) |
| `hasCredential` | `EducationalOccupationalCredential` با `identifier: 40949`، `recognizedBy` کانون و `url` استعلام |
| `knowsAbout` | چهار حوزه کاری |

### `Organization` (`@id: /#licensing-body`)، خطوط 40-46

نام «کانون وکلای دادگستری مرکز»، `url: https://icbar.ir` و `logo` از
`/images/kanoon-markaz.webp`.

### `WebSite` (`@id: /#website`)، خطوط 95-102

`name: علی رضوان`، `inLanguage: fa-IR` و `publisher: { @id: /#practice }`. `SearchAction`
(جعبه جست‌وجوی sitelinks) ندارد؛ گوگل این قابلیت را از ۲۰۲۴ نمایش نمی‌دهد.

## ۴. BreadcrumbList

```ts
// lib/schema.ts:110-121
export function breadcrumbSchema(items) {
  return { "@context": CONTEXT, "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name,
      ...(item.href && { item: item.href }),
    })) };
}
```

- **صفحه‌های داخلی عادی**: `components/PageHeader.tsx:35` همان مسیری را که نشان می‌دهد به
  JSON-LD می‌دهد و «خانه» را خودش اول اضافه می‌کند (خط 24). آخرین آیتم لینک ندارد و `item`
  نمی‌گیرد، که گوگل برای آیتم آخر می‌پذیرد. اگر صفحه‌ای `PageHeader` دارد نباید breadcrumb
  جدا اضافه کند (توضیح خطوط 4-5).
- **مقاله**: `app/(site)/blog/[slug]/page.tsx:99-104` و `255`: خانه ← وبلاگ ← حوزه ← مقاله
  (آیتم آخر هم `item` دارد).
- **پرسش**: `app/(site)/porsesh/[slug]/page.tsx:154-161`: خانه ← پرسش و پاسخ ← دسته
  (`/porsesh?dasteh=…`) ← پرسش.

## ۵. FAQPage

دو مسیر دارد:

1. **کامپوننت `Faq` با prop `schema`** (`components/Faq.tsx:26`، سازنده `faqPageSchema` در
   `lib/schema.ts:143-156`). پاسخ‌ها داخل `<details>` در HTML هستند و بدون JavaScript هم
   خوانده می‌شوند.
   - هاب‌ها: `components/PracticeHub.tsx:54` با `area.faqs` از `content/practice-areas.ts`.
   - مقاله‌ها: `app/(site)/blog/[slug]/page.tsx:163` با `faq` از frontmatter.
2. **صفحه هر پرسش**: `questionPageSchema()` در `lib/schema.ts:213-247`، یک `Question` با
   `text`، `answerCount: 1`، `datePublished`، `author` (نام نمایشی پرسنده یا پیش‌فرض) و
   `acceptedAnswer` که نویسنده‌اش وکیل است (`{ @id: /#lawyer, jobTitle }`). طبق CLAUDE.md
   §6 و commit `f36e980` به جای `QAPage` از `FAQPage` استفاده شده، چون فقط وکیل پاسخ
   می‌دهد.

`toolSchema()` هم می‌تواند FAQPage را کنار `WebApplication` بگذارد (`lib/schema.ts:176`)،
ولی هیچ صفحه ابزاری الان `faq` به آن نمی‌دهد.

> گوگل از اوت ۲۰۲۳ نمایش rich result برای FAQ را به سایت‌های دولتی و سلامت معتبر محدود کرده
> است. schema معتبر است و ضرری ندارد، ولی انتظار نتیجه گرافیکی FAQ در جست‌وجو نباید داشت.

## ۶. Article

```ts
// lib/schema.ts:180-207 (خلاصه)
{
  "@type": "Article",
  "@id": `${post.href}#article`,
  headline, description,
  image: [ogImage, cover],
  datePublished, dateModified,
  inLanguage: "fa-IR",
  keywords: "…، …",
  articleSection: area.title,
  author: lawyerRef,                       // { @type: Person, @id: /#lawyer, name, url: /about }
  publisher: { @id: /#practice, name, logo },
  isPartOf: { @id: /#website },
  mainEntityOfPage: { @type: WebPage, @id: post.href },
}
```

- محل تزریق: `app/(site)/blog/[slug]/page.tsx:243-254`.
- داده: frontmatter مقاله (`lib/blog.ts`)؛ `image` اول تصویر OG و بعد کاور است
  (`blog/[slug]/page.tsx:248`).
- نوع `Article` است، نه `BlogPosting`. هر دو برای Article rich result پذیرفته می‌شوند.
- تست: `tests/schema.test.tsx:102-128`.

## ۷. ProfilePage (صفحه About)

```ts
// lib/schema.ts:124-139
{ "@type": "ProfilePage", "@id": "/about#profile", url: "/about", inLanguage: "fa-IR",
  isPartOf: { @id: /#website },
  mainEntity: { ...lawyerRef, jobTitle, image, ...(lawyer.bio && { description: lawyer.bio }) } }
```

تزریق در `app/(site)/about/page.tsx:70`. چون `lawyer.bio` هنوز `null` است `description`
ندارد.

## ۸. WebApplication (ماشین‌حساب‌ها)

```ts
// lib/schema.ts:162-177 (خلاصه)
{ "@type": "WebApplication", "@id": `${tool.href}#app`, name: tool.title,
  description: tool.summary, url: tool.href,
  applicationCategory: "FinanceApplication" | "BusinessApplication",
  operatingSystem: "All", browserRequirements: "Requires JavaScript",
  inLanguage: "fa-IR", provider: { @id: /#practice }, isPartOf: { @id: /#website } }
```

- ابزارهای گروه `debt`، `fees` و `family` از نوع `FinanceApplication`‌اند و بقیه
  `BusinessApplication` (`lib/schema.ts:159`).
- داده از `content/tools.ts`. تزریق در خط آخر هر `app/(site)/tools/*/page.tsx`، مثلاً
  `tools/khesarat-takhir/page.tsx:83`.
- `offers` (و برچسب «رایگان») عمداً حذف شده تا موتور جست‌وجو عبارت تبلیغی نشان ندهد
  (`lib/schema.ts:11-13`). بدون `offers` و `aggregateRating` این صفحه‌ها واجد rich result
  نرم‌افزار گوگل نیستند؛ این انتخاب آگاهانه است.

## ۹. schemaهایی که نیستند

| Schema | وضعیت | دلیل |
| --- | --- | --- |
| `Review`، `AggregateRating` | ❌ عمدی | نظر و امتیاز موکل در عمل تبلیغ و مقایسه است (CLAUDE.md §2.1) |
| `BlogPosting` | جایگزین با `Article` | |
| `QAPage` | جایگزین با `FAQPage` | فقط وکیل پاسخ می‌دهد |
| `Organization` جدا برای خود دفتر | ادغام در `LegalService` | |
| `geo`، `openingHoursSpecification`، `priceRange` | ❌ | داده‌اش در `content/lawyer.ts` نیست (مختصات نامعلوم، ساعات کاری به تصمیم مالک منتشر نمی‌شود) |
| `SearchAction` | ❌ | گوگل دیگر نمایش نمی‌دهد |
