# SESSIONS.md — 3-week build plan (10 sessions × 5 hours)

Launch: **Saturday 31 October 2026 (9 Aban 1405)**. One session every other day.
Each session lists what you (the human) must have ready, a starter prompt to paste into
Claude Code, and the "done when" check. If a session runs over, the unfinished item moves to
"after launch" in CLAUDE.md §3 — the launch date does not move.

---

## Before session 1 — do today or tomorrow (outside approvals are the slowest part)

- [ ] Pick and register the `.ir` domain at IRNIC (e.g., the lawyer's name in Latin letters)
- [ ] Open a hosting account with Next.js + PostgreSQL support (Liara is the default)
- [ ] Open an SMS provider account (e.g., Kavenegar), finish identity check, submit the OTP
      template for approval — this can take days
- [ ] Create a private GitHub repo; install Node.js 20+, Git and Claude Code
- [ ] Ask Ali Rezvan for: license number, licensing body, short bio, education, photos,
      office address, phone, working hours, fees (see the doc, section 8.4)
- [ ] Put `CLAUDE.md` and `SESSIONS.md` in the repo root

---

## Session 1 — Mon 12 Oct (20 Mehr): Setup and skeleton

**You need:** repo, hosting account, Node.js, Claude Code.

**Prompt:**
```
Read CLAUDE.md and SESSIONS.md. Today is session 1.
Scaffold the Next.js App Router project with TypeScript strict, Tailwind CSS, ESLint,
Vitest, and the directory layout in CLAUDE.md §4. Set up <html lang="fa" dir="rtl">,
self-hosted Vazirmatn via next/font/local, lib/format.ts (Persian digits, toman format,
ی/ک normalisation) with tests, content/lawyer.ts with placeholders, and a responsive
header, footer and sticky mobile contact bar (call, WhatsApp, Bale). Add .env.example and
npm scripts: dev, build, lint, typecheck, test. Then help me deploy a preview to Liara.
```
**Done when:** an empty RTL site runs locally and on a preview URL; tests pass.

## Session 2 — Wed 14 Oct (22 Mehr): Design system and Home

**You need:** a colour preference (or accept the default), lawyer photo if available.

**Prompt:**
```
Session 2. Define design tokens in app/globals.css (one deep accent colour, neutrals,
type scale for Vazirmatn, spacing, radius) and a typographic wordmark for «علی رضوان»
as an SVG component. Build core components: Button, Card, SectionHeading, FAQ accordion,
LawyerCard (name, grade, licensing body, license number, verify link), ContactCTA.
Build the Home page per CLAUDE.md and the PRD: hero with the three exits, four practice
cards, calculator teaser, latest guides (placeholder), office block. Follow §2.1 copy rules.
```
**Done when:** Home looks finished on a phone and on desktop.

## Session 3 — Fri 16 Oct (24 Mehr): Practice hubs, About, Contact

**You need:** lawyer bio, license number and licensing body, photos (placeholders OK).

**Prompt:**
```
Session 3. Create a practice-hub template driven by content/practice-areas.ts: problem
summary, legal route as numbered steps, related calculator, 6–10 FAQs with FAQPage
schema, guides list, sticky contact bar. Fill all four hubs with draft Persian copy; mark
every legal statement {/* TODO: lawyer review */}. Build About and Contact (Neshan map
embed or static map, Google Maps outbound link). At the end, export all draft copy into
review/hubs.md so I can send it to the lawyer.
```
**Done when:** 7 pages on preview; `review/hubs.md` sent to the lawyer.

## Session 4 — Sun 18 Oct (26 Mehr): Late-payment damages calculator

**You need:** the Central Bank monthly price-index table (download or copy from the CBI
site); 3 worked examples you have checked by hand or with the lawyer.

**Prompt:**
```
Session 4. Build content/cpi.json from the price-index data I give you (CLAUDE.md §5.1),
lib/calculators/damages.ts with full unit tests (including my 3 worked examples), and the
page /tools/khesarat-takhir: Jalali date pickers, toman input accepting Persian digits,
result card with principal, damages, total and index months used, the estimate
disclaimer, and SEO metadata. Mobile first.
```
**Done when:** all tests pass and results match the hand-checked examples.

## Session 5 — Tue 20 Oct (28 Mehr): Rent calculator and hand-off

**You need:** the lawyer's deposit-to-rent conversion rate; office address and hours
(to submit map listings today — verification takes days).

**Prompt:**
```
Session 5. Build lib/calculators/rent.ts with tests and the page /tools/ejare
(CLAUDE.md §5.2). Add to both calculators: "send this result to the lawyer" (links to
/request with the summary pre-filled), share via WhatsApp and Bale, and copy result.
Update content/lawyer.ts with the real address and hours and add LocalBusiness JSON-LD.
```
**Done when:** both calculators work on preview. You submit Google Business Profile,
Neshan and Balad listings the same day.

## Session 6 — Thu 22 Oct (30 Mehr): Request form, OTP, leads

**You need:** SMS API key with the approved OTP template, Bale bot token and chat ID,
PostgreSQL connection string, admin username and password, fees and consultation types.

**Prompt:**
```
Session 6. Implement the consultation request (CLAUDE.md §5.3): Drizzle schema for leads
and otp_codes, migrations, server actions with Zod, SMS OTP via lib/sms.ts (Kavenegar),
rate limiting, Bale alert via lib/notify.ts, confirmation screen. Build /admin
(CLAUDE.md §5.4) behind basic auth in middleware.ts. Write tests for OTP expiry,
attempts and rate limits. Walk me through a full test lead on the preview.
```
**Done when:** a test lead reaches `/admin` and arrives in Bale.

## Session 7 — Sat 24 Oct (2 Aban): Guides system and SEO

**You need:** 1-hour content review with the lawyer today (hub copy from session 3).

**Prompt:**
```
Session 7. Apply the lawyer's edits from review/hubs.md. Build the MDX guides system
(CLAUDE.md §5.5) with Zod-validated frontmatter, guide page, guides index, author box,
Article + FAQPage + BreadcrumbList JSON-LD, sitemap.ts, robots.ts, metadata and Open
Graph for all pages. Write the first 4 guides (one per practice area) as drafts with
TODO: lawyer review markers, choosing topics from the keyword clusters in the PRD.
```
**Done when:** 4 guides render; JSON-LD validates in a rich-results test.

## Session 8 — Mon 26 Oct (4 Aban): Remaining content and compliance

**Prompt:**
```
Session 8. Write 4 more guides (one per area), the Privacy and Disclaimer pages, and an
"estimate, not legal advice" notice component. Run a compliance pass over every page and
guide against CLAUDE.md §2.1 and list any risky phrases. Export all unreviewed copy to
review/guides.md for the lawyer.
```
**Done when:** `review/guides.md` sent; no §2.1 violations left.

## Session 9 — Wed 28 Oct (6 Aban): Production and QA

**You need:** 1-hour content review with the lawyer today; domain DNS access.

**Prompt:**
```
Session 9. Apply the lawyer's guide edits. Prepare production: environment variables,
database migration on Liara, custom domain with HTTPS, self-hosted Umami, security
headers, 404 and error pages. Then run a performance and RTL QA pass: Lighthouse on mobile
for Home, one hub, one calculator and one guide; fix anything over LCP 2.5 s or CLS 0.1.
Give me a manual test checklist for 3 real phones.
```
**Done when:** production is live on the domain; mobile LCP < 2.5 s on 3 phones.

## Session 10 — Fri 30 Oct (8 Aban): Launch checklist

**Prompt:**
```
Session 10. Work through the fix list from QA. Then run the launch checklist: all pages
indexed-ready, sitemap submitted to Search Console, OTP and Bale alerts tested in
production, admin password rotated, backups enabled, content/lawyer.ts final,
no TODO: lawyer review markers left on public pages. Summarise what moved to after launch.
```
**Done when:** checklist all green. Launch on Saturday 31 October.

---

## After launch (November onward)
Booking calendar with real slots, reminder SMS, PDF export of calculator results, 4 guides
a month, designed logo, referral partners, month-6 KPI review.
