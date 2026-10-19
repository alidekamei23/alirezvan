# Q&A section — progress

Spec: `docs/qa-spec.md`.

## Status

Built and checked locally on 19 Oct 2026; waiting for the owner's review. Not deployed.

## Done

- Table `questions` and `question_slug_redirects`, migration `0002_questions`
  (`npm run db:migrate`).
- `lib/questions/`: `core.ts` (status rules, tracking-code format, search normalisation,
  link count; safe in the browser), `secure.ts` (code generation and hashing, IP hash,
  signed form timestamp), `schema.ts` (Zod, shared by form and server), `repository.ts`
  (admin and visitor writes), `public.ts` (public reads with an explicit field list),
  `cached.ts` (`'use cache'` + tag `questions`), `config.ts` (secret and limits),
  `view.ts`, `admin-view.ts`, `editor.ts`.
- Public pages `/porsesh`, `/porsesh/<slug>`, `/porsesh/bepors`, `/porsesh/peygiri`;
  `POST /api/porsesh/view`; menu, footer, sitemap; privacy page section.
- Admin: `/admin/questions` (tabs with counts, search, filter), `/admin/questions/new`,
  `/admin/questions/<id>`; menu badge and `/admin` card. `MarkdownEditor` extracted from
  `ArticleEditor` and shared by both editors.
- Tests: `tests/questions/` (25) — status rules, private fields never in public reads,
  drafts invisible by address, publish/unpublish, slug redirects and neutral addresses,
  Persian search, view counting, every admin action refused without a session, honeypot,
  fill time, forged token, links, consent, ask and tracking limits.
- Checked in the browser against `next start` with a throwaway database and login (both
  deleted afterwards): ask → pending invisible on the site → review, edit, answer, publish
  → page, list, sitemap, QAPage JSON-LD, no private data in the HTML → view counted →
  unpublish removes it at once → tracking and «سؤال‌های من». Responsive at 320, 360, 768,
  1024, 1280 and 1440 px. The article editor still works after the extraction.

## Decisions made while building

- **Neutral address until publication.** A visitor's question gets `q-<8 hex>` as its slug;
  the real address is made from the *edited* title on first publication (or a save before
  it), so a name in the original title can never reach the URL. Published questions keep
  their address; changing it adds a permanent redirect.
- **Tracking code** is stored only as a SHA-256 hash; the admin never sees it.
- **One secret** (`IP_HASH_SALT`) for the IP HMAC and the form timestamp signature.
- Answers render with `ArticleBody` but without the automatic contact box
  (`contactBox={false}`); the page has its own notice and call to action.
- Search results (`?q=`) and the tracking page are `noindex`; on deployments that may not
  be indexed at all, links are not followed either.
- The image clean-up (`npm run uploads:clean`) now also keeps images used in answers.
- Old rate-limit rows (older than a day) are pruned now and then by the view counter.
- Header: nine desktop menu items fit on one line from 1024 px with link padding 8 px.

## Open issues

- **First request of an unknown address answers 200** (with the not-found page and
  `noindex`), later requests 404. Seen for `/porsesh/<unknown>` and also for the blog's
  dynamic routes, so it is not specific to this section. No content leaks. To look into
  with the Next.js cache/streaming settings.
- In this development browser pane `requestAnimationFrame` never fires, so streamed
  Suspense content (the ask form, admin pages) is not revealed there; real browsers are
  not affected. Tests in that pane need the reveal triggered by hand.
- Answer headings written as `##` render as `<h2>` under the page's «پاسخ وکیل» `<h2>`.
  Harmless; could be shifted one level later.

## Production TODO

- Set `IP_HASH_SALT` (32+ random characters) — the app refuses to run the Q&A without it in
  production.
- Set `TRUSTED_IP_HEADER` behind the reverse proxy; without it all visitors share one
  limit key (3 questions per hour for everyone).
- Run `npm run db:migrate` before `npm run build` (the build reads the questions table).
- Decide `QUESTION_LIMIT_PER_HOUR` (default 3).
- Lawyer review of the copy marked `TODO: lawyer review` in `content/questions.ts`,
  `content/question-categories.ts` and the privacy section.
- After admin phase 3: set `DB_ARTICLES_ARE_PUBLIC = true` and add `updateTag("questions")`
  to the article save/delete actions, so related-article links refresh.
- Optional: a Bale alert to the assistant when a new question arrives (with `lib/notify.ts`).
