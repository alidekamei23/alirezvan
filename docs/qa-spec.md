# Q&A section («پرسش و پاسخ حقوقی») — spec

The owner's brief of 19 Oct 2026, condensed, with the decisions taken before building.
Progress, open issues and production notes: `docs/qa-progress.md`.

## Goal and tone

People ask legal questions, the lawyer answers, the best ones are published. Not a
forum: no accounts, no comments, no votes. What matters most is SEO and a clean, useful
page. Same design language, components and patterns as the blog and the admin panel.

## Flow

1. A visitor sends a question without registering and without contact details.
2. It is stored as PENDING and appears only in the admin panel, never on the site.
3. The lawyer reviews it, edits it if needed (e.g. to remove personal details), answers,
   and publishes or rejects it. The admin can also add a question and answer by hand.
4. Only PUBLISHED questions, with their answers, appear on the site.
5. The visitor follows their question with a tracking code.

## Data (table `questions`)

id, slug (unique, Persian-friendly, editable), tracking code (unique, unguessable, about
10 characters without look-alike characters; **only its hash is stored**), display name
(optional, max 30; empty shows «کاربر ناشناس»), title and body (plain text) plus the
untouchable original title and body, category, status (PENDING | ANSWERED | PUBLISHED |
REJECTED | ARCHIVED), answer (Markdown, as in the article editor), answered by/at,
published at, private rejection reason and admin note, related articles, featured flag,
view count, meta title and description, IP hash (HMAC with a secret from the
environment; never the raw IP), created/updated/deleted at (soft delete). Indexes on
status, published at, slug, category and tracking code. Old slugs of published questions
redirect (table `question_slug_redirects`).

## Public pages

- **List** `/porsesh`: published and undeleted only; featured first, then newest. Search in
  title, body and answer with ی/ک, digit and half-space normalisation. Category filter,
  pagination, a clear «سؤال خود را بپرسید» button and a «پیگیری سؤال» link.
- **Question** `/porsesh/<slug>`: question, sanitised answer, Jalali date, category, related
  articles, same-category questions, display name or «کاربر ناشناس», the notice «پاسخ‌ها
  جنبه اطلاع‌رسانی عمومی دارند و جایگزین مشاوره تخصصی نیستند» with a call to action.
  Anything unpublished is not found.
- **Ask** `/porsesh/bepors`: display name (optional), category, title (10–150), body
  (30–3000, with a counter), required consent stating that the question and answer are
  published after review, and the warning not to write full name, national ID, phone,
  case number or address. Same validation in browser and server. Anti-spam without Google:
  honeypot, at least 3 seconds to fill (signed timestamp), rate limit by IP hash (3 per
  hour, configurable), links limited. After sending: the tracking code shown large with a
  copy button and the note that it is the only way to follow the question; the code is
  saved in localStorage for «سؤال‌های من». No double submission.
- **Track** `/porsesh/peygiri` (noindex): status for a code (waiting / answered and published
  with a link / not published, never the internal reason), «سؤال‌های من», rate-limited
  look-ups.
- **SEO**: full metadata and canonical; JSON-LD QAPage and BreadcrumbList; sitemap; the
  list and page refresh at once after publish, edit or unpublish; links in the menu and
  footer.

## Admin

- Menu item «پرسش و پاسخ» with the pending count; a «new questions» card on `/admin`.
- List with status tabs and counts (default: pending), search, category filter, pages.
- Review page: editable title, body and display name next to the visitor's original;
  answer in the article editor; category, slug, SEO fields, related articles, featured,
  private note; preview of the public page.
- Actions: save (→ ANSWERED), publish (only with an answer), unpublish (→ ANSWERED), reject
  (optional private reason), archive, soft delete; confirmations; invalid status changes
  refused on the server.

## Security

Public queries select fields explicitly; IP hash, tracking code, rejection reason, admin
note and the original text never reach a public page. Every admin action and page checks
the session itself. Visitor input is plain text; the answer is sanitised when rendered.

## Decisions taken with the owner (19 Oct 2026)

1. **Categories**: a separate list for Q&A (not the four practice areas), editable later —
   kept in `content/question-categories.ts` (slug + title). No category admin page.
2. **Related articles**: built, but only published articles are shown, and none until the
   public blog reads the database (admin task phase 3); then turn on
   `DB_ARTICLES_ARE_PUBLIC` in `lib/questions/public.ts`.
3. **Lawyer-approval tick for answers**: not for now.
4. **Hiding the menu link until N questions exist**: no; the owner adds questions by hand.
5. **Addresses**: simple and SEO-friendly — `/porsesh`, `/porsesh/<Persian slug>`,
   `/porsesh/bepors`, `/porsesh/peygiri`; category and page as `?dasteh=` and `?page=`.
6. **View count**: simple — one count per browser tab session, bots ignored, shown in the
   admin only.
