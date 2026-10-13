# Admin Panel & Content Management — Implementation Spec

> How to use this file: this is the authoritative spec for the current task. Re-read it at the start of every phase and after any context reset. Track progress in `docs/admin-progress.md` (see "Progress tracking").

## Context

You are working inside my existing Next.js website repository.

This website belongs to a lawyer or law firm. Its primary business goal is to attract qualified potential clients through organic search, establish professional credibility, and generate relevant legal consultation inquiries. SEO matters, but site-wide SEO work is a **separate, later task** — do not start it here. This task covers only the admin panel, article management, content migration, and the SEO features that belong directly to articles.

The website is in **LOCAL DEVELOPMENT** and has not been deployed. The implementation must be production-conscious, secure, maintainable, and tested locally. Do not deploy anything, and do not claim production readiness.

Your task: inspect the existing project, propose a plan, then implement an admin panel for creating, editing, publishing, and deleting articles without unnecessarily rebuilding the existing website.

## Non-negotiable workflow

### Phase 0 is investigation and planning only

During Phase 0:
- Do not create, modify, delete, rename, or migrate project source files.
- Do not install dependencies.
- You MAY run read-only and verification commands: `lint`, `typecheck`, `build`, `git status`/`git log`, and existing tests. (Build artifacts such as `.next` are acceptable.)
- Inspect the actual repository rather than assuming its structure.
- Present findings and the plan, then ask for my explicit approval.

After every later phase, give a concise report: changed files, decisions, test results, unresolved issues, risks. Then wait for my approval before the next phase.

Do not treat silence as approval. Do not skip phases. If a requirement conflicts with the existing architecture, identify the conflict and recommend the safest minimal change instead of silently replacing the architecture.

### Progress tracking

From Phase 1 onward, maintain `docs/admin-progress.md`: current phase, what is done, approved decisions (including my Phase 0 answers), open issues, and next step. Update it at the end of each phase so work can resume after a context reset.

## Phase 0 — Repository audit and plan

Inspect and report:
1. Next.js, React, Node.js, TypeScript, and package manager versions. Note version-specific conventions (e.g. in Next.js 16 `middleware.ts` is renamed `proxy.ts`; caching APIs differ between versions).
2. App Router vs Pages Router.
3. Styling system, component library, icons, UI conventions, RTL support.
4. Existing auth, middleware/proxy, Server Actions, Route Handlers, authorization patterns.
5. Current article source (Markdown, MDX, filesystem, JSON, database, CMS).
6. The full article rendering pipeline: Markdown plugins, custom components, frontmatter, image handling, public styles.
7. Every route that displays articles or article lists (article page, lists, home page sections, related posts, feeds, sitemap) — these define what must be revalidated later.
8. Existing article metadata, canonical URLs, sitemap, redirects.
9. Build, lint, test scripts and whether a test framework exists.
10. Results of running lint, typecheck, and build as they are now (pre-existing failures must be recorded so they are not confused with new ones).

Determine the site's language and URL conventions from the repository. Do not invent business information, credentials, addresses, or contact details. If critical information is missing, ask concise questions.

The Phase 0 report must include: verified findings, risks/conflicts, recommended architecture and dependencies, exact files/directories expected to change, the phased plan with acceptance criteria, and a migration and rollback strategy. Then STOP.

## Architectural decisions

### Preserve the existing website
- Keep the existing Next.js architecture unless the audit shows a compelling reason to change it.
- Reuse existing components, layouts, styling, and content-rendering utilities.
- Do not rewrite unrelated pages or add unnecessary dependencies.
- No separate Express backend, no second CMS.
- Use only features compatible with a conventional Node.js VPS running `next start` (no Vercel-only, serverless-only, or edge-only features).
- Use TypeScript consistently with the project.

### Database
SQLite with Drizzle ORM (decided after Phase 0, replacing Prisma: no binary downloads that may fail from Iran). Driver: `better-sqlite3`, WAL mode on. Hosting target: the owner's own VPS running `next start`.
- Connection from `DATABASE_URL`; database file outside build output.
- Database access only on the server.
- Drizzle migrations (`drizzle-kit`) with a documented dev workflow.
- Appropriate indexes, unique constraints, foreign keys, and transactions.
- Slug uniqueness enforced by the database as the final authority (handle constraint violations gracefully).
- Keep persistence isolated so a future move to PostgreSQL stays feasible; do not claim it is automatic without verifying.

### Data model
Base the Drizzle schema on this logical model:

**Article**: `id` (immutable), `title`, `slug` (unique), `excerpt`, `content` (Markdown), `coverImage` (optional), `coverImageAlt`, `status` (DRAFT | PUBLISHED), `publishedAt` (null until first publication), `seoTitle`, `seoDescription`, `createdAt`, `updatedAt`.

**Tag**: not built (decided after Phase 0: the site uses practice areas and nothing would use tags). A possible future addition. Ignore later mentions of tags in this file.

**SlugRedirect**: `fromSlug` (unique), `articleId` — records old published slugs so they can be permanently redirected.

**Session**: database-backed sessions (see Authentication).

**LoginAttempt** (or equivalent): persistent store for rate limiting.

In Phase 0, evaluate and recommend only additional fields that fit the actual site (for example author/reviewer attribution or a last-reviewed date for legal content). Do not add complexity without justification.

## Authentication and security

One administrator. Environment variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.

- Hash with bcrypt. Provide `npm run hash-password`, which prompts for the password without echoing it. Never accept plaintext passwords as CLI arguments or log them.
- Never commit real credentials. Provide `.env.example` with comments and safe placeholders.
- **Sessions are stored in the database** (Session table) with a random session ID in a signed, HttpOnly, SameSite=Lax cookie, Secure in production, ~7-day expiry. This makes logout and revocation real: logout deletes the session server-side. Create a new session on each successful login.
- Validate the session on the server for every admin page and **every mutation independently**. Middleware/proxy is only an additional early check, not the security boundary.
- Persistent login rate limiting: 5 failed attempts per 15 minutes per IP, stored in the database. Document that the client IP must come from a trusted proxy header in production.
- CSRF: rely on Next.js's built-in Origin checks for Server Actions; add explicit Origin/Host validation only for state-changing Route Handlers. Do not build a custom token system unless Phase 0 shows a need.
- Do not reveal whether the username or the password was wrong.
- `noindex, nofollow` on all admin pages (robots directives are not access control). Exclude admin routes from the sitemap.
- Never expose drafts, private metadata, or admin API responses publicly.
- Secure error handling: no secrets, stack traces, or filesystem paths in responses.
- Validate all mutation input server-side with Zod.

## Admin routes and UI

Adapting to the existing routing architecture:
- `/admin/login`
- `/admin` — paginated article list; search by title; filter by status; sort by created/updated/published date; quick links to edit and preview; loading, error, and empty states.
- `/admin/articles/new` and `/admin/articles/[id]/edit`:
  - all article fields, including tags and cover image with alt text;
  - Markdown editor with live side-by-side preview;
  - save draft / publish / unpublish actions;
  - delete with confirmation;
  - unsaved-changes warning where feasible;
  - clear server-validation messages; accessible forms and keyboard navigation.

If the site is Persian, the admin interface must be fully Persian and RTL. Reuse the site's design system.

### Article SEO in the editor
- SEO title and description fields with a live search-result style preview and character-count *guidance* (not hard limits or "SEO scores").
- Warnings for missing SEO title/description, cover image alt text.
- Canonical URL preview.
- A reminder that legal content must be reviewed for accuracy by a qualified professional before publishing.

## Slugs and publication lifecycle

Slugs:
- Internal ID is immutable; editing title, body, image, or tags never changes it.
- Support Persian Unicode and English slugs; normalize Unicode (NFC) consistently; whitespace and separators → hyphens.
- Generate readable slugs from titles; handle duplicates, collisions, empty results, and manual edits.
- Preserve existing slugs and the existing public URL structure during migration.
- When a **published** article's slug changes, store the old slug in SlugRedirect and serve a permanent (308/301) redirect. Prevent loops and chains (point all old slugs at the current one).
- Canonical metadata always points to the current URL.

Lifecycle:
- New articles default to DRAFT.
- Drafts are never publicly reachable: not in article pages, lists, related content, search, feeds, APIs, or the sitemap. Public requests for drafts return 404.
- `publishedAt` is set on first publication and kept on ordinary edits. Define and document unpublish/republish behavior.
- Never serve unpublished content from a cache.
- Admin preview of drafts is available only to the authenticated admin.

## Markdown, images, content safety

- Reuse the existing public Markdown/MDX pipeline. The editor preview must use the same rendering components, typography, plugins, and sanitization as the public page.
- Preserve legitimate existing Markdown features. Never execute user-supplied MDX expressions or JavaScript.
- Sanitize HTML with a maintained allowlist sanitizer (e.g. rehype-sanitize); block dangerous URL protocols (`javascript:`, `data:` except safe images, etc.). Test common XSS payloads.

Image uploads (cover and inline):
- Store under `UPLOAD_DIR` from the environment, outside build output.
- JPEG, PNG, WebP only; max 5 MB.
- Verify real file content with `sharp` (do not trust client MIME type or extension) and **re-encode the image, stripping EXIF/metadata** (including GPS location).
- Cryptographically random filenames; prevent path traversal, overwrites, executable uploads, directory listing.
- Uploads require an authenticated admin session.
- Serve files through a safe, predictable URL (route handler or documented static mapping); configure Next.js image handling accordingly.
- Insert Markdown image syntax (with alt text) into the editor automatically.
- Do not delete images still referenced by any article; document cleanup for abandoned uploads.

## Cache invalidation

After create, edit, publish, unpublish, delete, or slug change, invalidate every affected route identified in Phase 0 (article page, old and new slug, lists, home page sections, related content, feeds, sitemap). Follow the actual caching behavior of the project's Next.js version; do not assume `revalidatePath` alone covers everything — verify.

## Articles in the sitemap and metadata

Limited to articles (site-wide SEO is a later task):
- Each published article has a unique title, description (from SEO fields with sensible fallbacks), canonical URL based on a configurable `SITE_URL` env variable, and Open Graph metadata.
- The sitemap includes only published article URLs (integrated with the existing sitemap if one exists).
- No localhost URLs leak into canonical tags or the sitemap when `SITE_URL` is set.

## Migration of existing content

- Inspect the actual source format before writing the importer.
- Preserve slugs, content, metadata, status, dates, and valid image references.
- Detect duplicate slugs and malformed records.
- Idempotent importer with a dry-run mode; report imported, skipped, failed records.
- Compare source vs destination counts and verify representative pages render identically.
- Keep original files untouched. Switch public reads only after validation. Keep a rollback path (e.g. a flag or a revertible commit).
- Never delete original files until I explicitly confirm.

## Testing

If the project has no test framework, add **Vitest** for server logic; add **Playwright** for a small end-to-end suite (login, create, publish, edit, delete) if approved in Phase 0.

Test at least:
- login, logout, session expiry, revoked sessions;
- rate limiting and generic login errors;
- access denial without a session, on pages and on every mutation;
- Zod validation, invalid and duplicate slugs, Persian slugs;
- XSS and dangerous URL payloads in Markdown;
- spoofed, oversized, and invalid uploads; metadata stripping;
- draft confidentiality and 404 for drafts;
- slug-change redirects (no loops/chains);
- cache invalidation after each lifecycle action;
- importer idempotency and dry-run.

## Local development and future deployment

- Working local workflow; local `.env`, only `.env.example` committed.
- Document local DB setup, migrations, seeding/import, and test commands.
- All persistent paths (`DATABASE_URL`, `UPLOAD_DIR`) configurable via env.
- No production credentials, server, domain, Nginx, or HTTPS required locally.

Document (do not perform) future VPS requirements for `next start`: production env variables, persistent DB and upload paths, permissions, production Drizzle migrations, backups and restore for the SQLite file and uploads, reverse proxy with HTTPS, request-size limits for uploads, trusted proxy headers for client IP, process management and restarts (note: in-memory state is unsafe with multiple processes). Do not invent server details; production deployment is a separate task I will request explicitly.

## Implementation phases

- **Phase 0 — Audit and plan.** Findings only. Stop.
- **Phase 1 — Foundation and security.** Drizzle schema and migrations, hash-password script, DB sessions, auth, authorization helpers, rate limiting, validation, test setup and focused tests. Stop and report.
- **Phase 2 — Admin interface and editor.** Dashboard, article CRUD, Markdown editor with shared-pipeline preview, image uploads, tags, article SEO fields. Stop and report.
- **Phase 3 — Migration and public integration.** Importer with dry-run, switch public reads after validation, draft handling, slug redirects, cache invalidation, article metadata and sitemap entries. Run tests, lint, build; report pre-existing failures separately. Update documentation. Stop and report. Do not delete original content.

## Documentation

Create or update docs covering: local setup, env variables, admin password generation, schema and migrations, import and validation, article lifecycle, slug changes and redirects, Markdown rendering and image storage, testing, and future VPS deployment and backups.

## Definition of done

- Existing public functionality preserved.
- Auth and authorization tested; article CRUD works.
- Preview matches public rendering.
- Public routes expose only published content.
- Existing article URLs preserved or correctly redirected.
- Migration validated; rollback documented.
- Tests, lint, and build run, with honest results.
- Documentation complete.
- No original article files deleted without my explicit approval.

Start with Phase 0 only.
