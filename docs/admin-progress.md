# Admin panel — progress

Spec: `docs/admin-panel-spec.md`. Re-read both files at the start of every phase.

## Current phase

Phase 2 — Admin interface and editor: **done 13 Oct 2026, waiting for the owner to approve**.
Phase 3 has not started.

## Done

- Phase 0 (audit and plan): approved by the owner on 13 Oct 2026.
- Phase 1 (foundation and security): approved by the owner.
  - Driver check passed: better-sqlite3 13 installs on this machine with no download
    (prebuilt Windows and Linux binaries are inside the npm package); WAL works.
  - `db/schema.ts`, `db/client.ts`, `lib/db.ts`, migrations `0000` and `0001`.
  - `lib/auth/`: config, sessions, rate limit, login/logout, page and action guards.
  - `lib/articles/`: slug rules and the Zod input schema with publish requirements.
  - `npm run hash-password`, `db:generate`, `db:migrate`, `unlock-login`,
    `revoke-sessions`.
  - `docs/admin.md` started.
- Changes requested with the Phase 1 approval:
  1. Production startup warning when `TRUSTED_IP_HEADER` is missing
     (`instrumentation.ts`, checked with `next start`), and `npm run unlock-login`.
  2. Sessions carry a fingerprint of the password hash, so a password change ends all
     sessions (migration `0001`). `npm run revoke-sessions` for manual revocation.
  3. All repository and auth data-access functions are async, and Drizzle queries live
     only in the repository files.
- Phase 2:
  - Public pages moved into `app/(site)/`; `components/SiteShell.tsx` holds the public
    frame. All 33 public routes and their URLs are unchanged.
  - `proxy.ts`, login and logout, article list (search, status filter, sort, paging),
    editor with live side-by-side preview, preview page, delete with confirmation.
  - `lib/articles/repository.ts` (lifecycle, slug redirects without chains or loops).
  - `components/ArticleBody.tsx`: Markdown renderer shared by preview and (in Phase 3)
    the public page; contact box after section 2 or at a `[contact-box]` line.
  - Uploads: `lib/uploads.ts`, `POST /admin/api/upload`, `/uploads/<name>`,
    `npm run uploads:clean`.
  - SEO fields with search-result preview, character guidance, warnings, canonical
    preview, legal-review reminder and the required lawyer-approval tick.
  - Checked in the browser against `next start` with throwaway credentials (removed
    afterwards): login, wrong password, create, upload, publish, rename, unpublish,
    delete, logout, access without a session.
  - 259 tests pass (66 from before this task). Lint, typecheck, contrast and build pass.
- The owner's `.env.local` is complete (username, hash, session secret; never committed)
  and the local database exists at `data/alirezvan.db`.

## Approved decisions (owner's answers to the Phase 0 questions, 13 Oct 2026)

1. **Database and hosting.** SQLite + Drizzle ORM, not Prisma (avoids binary downloads
   that may fail from Iran). Hosting target is the owner's own VPS with `next start`;
   local only for now. WAL mode on. Persistence stays isolated in the repository layer so
   a later move to PostgreSQL is feasible.
2. **Admin routes and auth.** Articles at `/admin`; leads later at `/admin/leads` under
   the same session auth. HTTP basic auth is dropped. `ADMIN_PASSWORD` becomes
   `ADMIN_PASSWORD_HASH`. The middleware file is `proxy.ts` (Next.js 16).
3. **Article fields.** Add `area`, `faqs`, `references` and cover width/height to the
   spec's model. **No Tag table** — the site uses practice areas. Possible future addition.
4. **«آخرین به‌روزرسانی».** The shown date changes only when the admin ticks "content
   changed" on save (and on first publication), so a typo fix does not move it.
5. **Lawyer approval.** Publishing requires a "the lawyer has approved this" tick box.
   Who and when are stored privately and never shown publicly.
6. **ContactBox.** Placed automatically after the second section. If simple, a manual
   marker line in the Markdown overrides the position.
7. **Migration.** No real articles exist anywhere. Build and test the importer against
   `content/blog/_sample.mdx` only.
8. **Route group.** Public pages move into `app/(site)/` (Phase 2). URLs must not change
   and the baseline must stay green.
9. **Playwright.** Left out.
10. **Checkpoint commit** of the spec and the CLAUDE.md pointer: done (`3d9b54a`).

**Priority.** The admin panel comes first. The request form, OTP and leads admin come
after this task: the auth and database layers must be reusable for them, but they are not
built now.

## Other decisions from the Phase 0 plan (approved with the plan)

- Runtime Markdown rendering with `react-markdown` + `remark-gfm` + `rehype-sanitize`
  inside the existing `<Prose>`; the same component renders the public page and the
  editor preview. No MDX execution for database content.
- Published reads use `'use cache'` with tags; every mutation calls `updateTag`. Drafts
  never enter a cached function.
- Slug redirects are resolved in `/blog/[slug]` (308), with all old slugs pointing at the
  current one.
- Uploads: `sharp` re-encode, random names, served by a route handler from `UPLOAD_DIR`.
- Keep `NEXT_PUBLIC_SITE_URL`; `SITE_URL` is accepted as an override.
- Rollback: one env flag `BLOG_SOURCE=mdx|db`; MDX files and `@next/mdx` stay in place.

## Baseline before Phase 1 (13 Oct 2026)

`npm run lint`, `npm run typecheck`, `npm test` (66 tests), `npm run check:contrast`
(34 pairs) and `npm run build` (33 static pages) all pass. One build warning: a stray
`package-lock.json` in the user's home folder confuses Turbopack's root detection.

## Decisions made during Phase 1

- bcrypt through `bcryptjs` (pure JavaScript, nothing to compile), cost 12.
- The rate-limit table is general (`scope` + `key`) so OTP limits can reuse it.
- The client IP is read only from the header named in `TRUSTED_IP_HEADER`; without it
  all visitors share one login counter.
- `sessions.id` holds the SHA-256 of the token, not the token.
- Slugs: half-spaces become hyphens and digits are stored as Latin digits.
- Two dates per article: `updatedAt` (any save, admin only) and `contentUpdatedAt`
  (the public «آخرین به‌روزرسانی»).
- Repository files (`lib/auth/session.ts`, `lib/auth/rate-limit.ts`) use relative
  imports with `.ts` extensions so the maintenance scripts can run them with plain Node.

## Decisions made during Phase 2

- Server Actions redirect to the login page without a session; the upload route answers
  401. Both check the session themselves.
- A published article needs the lawyer-approval tick on every save, not only on the
  first publication, because every save of a published article goes live.
- Uploads are always stored as WebP, at most 2400 px on the long side.
- Inline images carry their size in the address (`#<width>x<height>`) so the page can
  reserve their space.
- Images in article text may only come from this site (no foreign hosts, CLAUDE.md §2.2).
- HTML typed into an article is dropped, not shown as text.
- The session check calls `connection()` so Next.js never renders it ahead of time.
- After a new article is created the "new" form is emptied, because Next.js keeps the
  previous page alive in the background.

## Open issues

- The hidden-input prompt of `hash-password` was tested by me only with piped input.
- The public blog still reads MDX; panel articles are not public until Phase 3. The list
  therefore has no "view on site" link yet.
- No cache invalidation yet (nothing public reads the database). Phase 3.
- The unsaved-changes warning covers closing and reloading the tab, not links inside the
  panel.
- Cover images on the public page will need a check that `next/image` can optimise
  files served by `/uploads/<name>` (Phase 3).
- The owner has not yet logged in with their own password; I tested with throwaway
  credentials only.
- `npm audit`: 5 high-severity advisories were there before this task (the ESLint plugin
  chain, through `braces`). Phase 1 added 4 moderate ones, all from the old `esbuild`
  inside `drizzle-kit`. Both are development tools and not part of the running site.
  Nothing was changed for them.

## Next step

Wait for approval of Phase 2. Then Phase 3: importer with dry-run (against
`content/blog/_sample.mdx`), switch public reads to the database behind
`BLOG_SOURCE`, draft 404s, slug redirects (308), cache tags and invalidation in the
actions, article metadata and sitemap, CLAUDE.md §4–§5.5, VPS documentation.
