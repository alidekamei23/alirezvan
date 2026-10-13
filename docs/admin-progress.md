# Admin panel — progress

Spec: `docs/admin-panel-spec.md`. Re-read both files at the start of every phase.

## Current phase

Phase 1 — Foundation and security: **done 13 Oct 2026, waiting for the owner to approve**.
Phase 2 has not started.

## Done

- Phase 0 (audit and plan): approved by the owner on 13 Oct 2026.
- Phase 1:
  - Driver check passed: better-sqlite3 13 installs on this machine with no download
    (prebuilt Windows and Linux binaries are inside the npm package); WAL works.
  - `db/schema.ts`, `db/client.ts`, `lib/db.ts`, first migration `0000_init`.
  - `lib/auth/`: config, sessions, rate limit, login/logout, page and action guards.
  - `lib/articles/`: slug rules and the Zod input schema with publish requirements.
  - `npm run hash-password`, `npm run db:generate`, `npm run db:migrate`.
  - 79 new tests in `tests/admin` (145 in total). Lint, typecheck, contrast and build pass.
  - `docs/admin.md` started.

## Approved decisions (owner's answers to the Phase 0 questions, 13 Oct 2026)

1. **Database and hosting.** SQLite + Drizzle ORM, not Prisma (avoids binary downloads
   that may fail from Iran). Hosting target is the owner's own VPS with `next start`;
   local only for now. WAL mode on. Persistence stays isolated in the repository layer so
   a later move to PostgreSQL is feasible. First step of Phase 1: verify that the SQLite
   driver installs and works on this Windows machine; if it fails, report options, do not
   work around it silently.
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

## Open issues

- The hidden-input prompt of `hash-password` was tested only with piped input; the
  owner should run it once in a real terminal.
- `npm audit`: 5 high-severity advisories were there before this task (the ESLint plugin
  chain, through `braces`). Phase 1 added 4 moderate ones, all from the old `esbuild`
  inside `drizzle-kit`. Both are development tools and not part of the running site.
  Nothing was changed for them.
- `proxy.ts`, the login page and the article repository belong to Phase 2.

## Next step

Wait for approval of Phase 1. Then Phase 2: move public pages into `app/(site)/`,
`proxy.ts`, login page, article repository and actions, list, editor with preview,
uploads, SEO fields.
