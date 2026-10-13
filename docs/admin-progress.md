# Admin panel — progress

Spec: `docs/admin-panel-spec.md`. Re-read both files at the start of every phase.

## Current phase

Phase 1 — Foundation and security: **in progress**.

## Done

- Phase 0 (audit and plan): approved by the owner on 13 Oct 2026.

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

## Open issues

- None yet.

## Next step

Phase 1: driver check, schema and first migration, auth, sessions, rate limiting,
validation, slug utilities, `hash-password`, tests. Then stop and report.
