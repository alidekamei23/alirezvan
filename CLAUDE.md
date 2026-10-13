# CLAUDE.md — Ali Rezvan law practice website

Read this file at the start of every session. It describes what we are building, the rules
that cannot be broken, and how the code is organised. The full strategy and PRD live in the
"Lawyer Website — Strategy, Plan & PRD" doc; this file is the working summary for code.

## 1. Project in one paragraph

A Persian-only (RTL) website for **Ali Rezvan (علی رضوان), grade-one attorney (وکیل پایه یک)**
in Tehran. Practice areas: checks and promissory notes (چک و سفته), real estate and leases
(ملکی و اجاره), debt claims (مطالبه و طلب), contracts (قرارداد). The site's one job is lead
generation: phone calls, WhatsApp/Bale chats and consultation requests. Launch date:
**Saturday 31 October 2026 (9 Aban 1405)**.

## 2. Non-negotiable rules

### 2.1 Bar Association compliance (copy and UI)
The Iranian Bar actively disciplines lawyers for advertising-style content. The site is an
information and practice site, not an advert.

Never write or render:
- Superlatives or rankings: «بهترین وکیل», «شماره یک», «برترین», «معروف‌ترین»
- Outcome promises: «تضمینی», «۱۰۰٪», «قطعاً برنده», win rates or success percentages
- Discounts, promotions, countdowns, «تخفیف», comparisons with other lawyers
- Identifiable client details or court documents
- Sensational imagery (gavels exploding, robe-selfie style)

Always:
- Show name, license grade, licensing body and license number (from `content/lawyer.ts`)
- Link to the official license-lookup page of the licensing body
- Label every calculator result: «این نتیجه تخمینی است و مشاوره حقوقی محسوب نمی‌شود.»
- Show an «آخرین به‌روزرسانی» (last updated) date on every blog post. (Changed 13 Oct 2026
  by the site owner: it replaces the earlier «آخرین بازبینی حقوقی» date. The lawyer approves
  each article offline before it is added; that approval date is not published.)

If a request would break these rules, stop and say so instead of writing the copy.

### 2.2 Must work on Iran's domestic network alone
Global internet access in Iran has been cut several times (most recently Feb–May 2026).
- No runtime dependency on foreign services in the visitor path: no Google Fonts, Google
  Analytics, reCAPTCHA, foreign CDNs, YouTube embeds, or external icon/font CDNs.
- Fonts are self-hosted (`next/font/local`, Vazirmatn). Icons are inline SVG or a bundled
  package (e.g., `lucide-react`), never a CDN.
- Maps: Neshan embed or static image; Google Maps only as an outbound link.
- Third-party scripts need explicit approval in the PR description.

### 2.3 Persian and RTL
- `<html lang="fa" dir="rtl">`. Use Tailwind logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`,
  `start-*`, `end-*`, `text-start`), never `ml-*`/`mr-*`/`left-*`/`right-*` for layout.
- Persian digits in all visible numbers (`toPersianDigits()` in `lib/format.ts`); store and
  compute with Latin digits. Accept both Persian and Latin digits in inputs.
- Money: tomans in the UI with thousands separators (`۱۲٬۵۰۰٬۰۰۰ تومان`).
- Dates: Jalali everywhere in the UI (`date-fns-jalali`), Asia/Tehran time zone.
- Use the Persian letters ی and ک (not Arabic ي and ك) and the zero-width non-joiner (ZWNJ)
  where Persian needs it (e.g., «می‌شود», «پرونده‌ها»). Normalise user input the same way.

## 3. Stack (launch version)

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router), TypeScript strict, React Server Components by default |
| Styling | Tailwind CSS, logical properties, design tokens in `app/globals.css` |
| Content | MDX files in `content/blog/*.mdx` (an exported `meta` object validated with Zod) |
| Database | SQLite (WAL mode) with Drizzle ORM (`db/schema.ts`, migrations in `db/migrations`); all access through the repository layer in `lib/`, so a later move to PostgreSQL stays feasible |
| Validation | Zod for every form, server action and content file |
| Dates | `date-fns-jalali` |
| SMS / OTP | Iranian SMS gateway behind `lib/sms.ts` (Kavenegar first; swappable) |
| Lead alerts | Bale bot (Telegram-compatible Bot API) behind `lib/notify.ts` |
| Admin | `/admin` (articles; leads later at `/admin/leads`) behind a database-backed session login. `proxy.ts` (the Next.js 16 name for middleware) is only an early check; every page and action checks the session itself |
| Analytics | Self-hosted Umami (script served from our own domain) |
| Tests | Vitest for logic (calculators, digits, OTP); Playwright smoke tests if time allows |
| Hosting | The owner's own VPS running `next start` (local only for now). SQLite file and uploads live outside the build output |

Deferred until after launch (do not build unless asked): Payload CMS, real-time booking
calendar, reminder SMS, PDF export, online payment, client accounts, English version.

## 4. Directory layout

```
app/
  layout.tsx                 # fonts, <html dir="rtl">, header, footer, sticky contact bar
  page.tsx                   # Home
  check-safte/page.tsx       # practice hub: checks and promissory notes
  melki-ejare/page.tsx       # practice hub: real estate and leases
  motalebe/page.tsx          # practice hub: debt claims
  gharardad/page.tsx         # practice hub: contracts
  tools/khesarat-takhir/     # late-payment damages calculator
  tools/hazine-dadresi/      # court-fee calculator
  blog/page.tsx              # blog index (page 1); blog/page/[page] for pages 2..N
  blog/topic/[area]/         # posts of one practice area, with the same pagination
  blog/[slug]/page.tsx       # blog post (Persian slug from the post's meta)
  about/ contact/ request/ privacy/ disclaimer/
  admin/                     # login, articles; leads later at admin/leads (session auth)
  api/ or actions/           # server actions for request form and OTP
  sitemap.ts robots.ts
components/                  # UI components (one per file, Persian-first props)
content/
  lawyer.ts                  # single source of truth for name, license, address, phones
  practice-areas.ts          # hub data: titles, steps, FAQs
  blog/*.mdx                 # posts; files starting with "_" are dev fixtures
  cpi.json                   # Central Bank monthly price index (see §5.1)
lib/                         # format, jalali, calculators, sms, notify, otp, seo helpers
db/                          # Drizzle schema and migrations
tests/
```

Practice hubs and fixed pages use the Latin slugs above. Blog posts use Persian slugs.
The public name of the section is «وبلاگ».

## 5. Feature specs

### 5.1 Late-payment damages calculator (`lib/calculators/damages.ts`)
- Inputs: principal (tomans), start date (due date, or bounce date for a check), end date
  (default: today), all Jalali.
- Method: monthly consumer price index of the Central Bank, as Tehran courts apply it:
  `value = principal × (index[endMonth] / index[startMonth])`, `damages = value − principal`.
- `content/cpi.json`: `{ "base": "...", "source": "CBI ...", "updated": "1405-07-..",
  "months": { "1404-01": 0.0, ... } }` keyed by Jalali `YYYY-MM`. Use one consistent base
  year. If `endMonth` is not published yet, use the latest available month and tell the user
  which month was used.
- Output: principal, damages, total, and the two index months used.
- Unit tests: at least 3 hand-checked examples, plus edge cases (same month, end before
  start, missing months, Persian-digit input).

### 5.2 Rent increase calculator (removed)
Removed by the site owner on 13 Oct 2026. Do not build it or link to it unless asked.

### 5.3 Consultation request (launch version)
1. Fields: name, mobile (09xxxxxxxxx), practice area, consultation type (phone 15 min /
   in-office 45 min / video 45 min), preferred day and time window, summary ≤ 300 chars.
2. SMS OTP: 5 digits, stored hashed, expires in 2 minutes, max 3 attempts, rate-limited
   per phone and per IP.
3. On success: save lead (status `new`, `source` = page or calculator), send Bale alert to
   the assistant, show a confirmation screen with the office phone.
4. Calculator "send result to the lawyer" pre-fills the summary with the result.

### 5.4 Leads admin
`/admin` lists leads newest first with status (`new`, `contacted`, `consultation`,
`retained`, `closed`), source, area and created time (Jalali). Status is editable. No delete.

### 5.5 Blog (MDX)
Each post exports `meta` (Zod schema in `lib/blog.ts`): `title`, `slug` (Persian), `area`,
`summary`, `updatedAt` (Jalali date), `cover` (image with width, height, alt; every post
has one), `faqs` (array of q/a), `references` (laws with links), `draft`. Each post renders
an author box, FAQ schema, a `<ContactBox />` after section 2 and the contact band at the
end. Every post belongs to exactly one practice area and is listed on that area's hub.
Lists are paginated with real URLs: 10 posts on page 1 (the newest shown large), 9 after.
Only lawyer-approved articles are added; do not write or publish legal articles yourself.

## 6. SEO checklist (every page)
- Unique Persian `<title>` and meta description; canonical URL; Open Graph tags.
- JSON-LD: `LegalService`/`Attorney` + `LocalBusiness` site-wide (from `content/lawyer.ts`),
  `Article` + `FAQPage` + `BreadcrumbList` on blog posts.
- `sitemap.ts` and `robots.ts`; no `noindex` outside `/admin` on the live site. Deployments
  without `NEXT_PUBLIC_ALLOW_INDEXING=true` (local, preview, test) are closed to search
  engines as a whole; turn it on only on the real domain after the lawyer approves the copy.

## 7. Quality bar
- Mobile first. LCP < 2.5 s and CLS < 0.1 on a 4G phone. Tap targets ≥ 44 px.
- WCAG 2.1 AA contrast; every input has a visible label.
- Collect only the fields above. No document uploads.
- UI is built only from the tokens and components in `docs/design-system.md`.
- `npm run lint`, `npm run typecheck`, `npm test` and `npm run check:contrast` pass before a
  session ends.

## 8. Working agreement for Claude Code
- Start each session by reading this file and `SESSIONS.md`, then confirm the session goal.
- Keep commits small and messages in English; UI copy in Persian.
- Do not invent legal facts. When copy needs a legal statement, write a draft marked
  `{/* TODO: lawyer review */}` and list it at the end of the session.
- Anything that needs a secret goes in `.env.local` (never committed); keep `.env.example`
  up to date.
- End each session with: what was done, what moved to "after launch", and what the next
  session needs from the human.
Current task spec: docs/admin-panel-spec.md — progress in docs/admin-progress.md. Re-read both at the start of every phase.
