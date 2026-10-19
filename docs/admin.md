# Admin panel — setup and operation

Written phase by phase; sections for the import, the public pages, cache invalidation
and VPS deployment are added in Phase 3. Spec: `docs/admin-panel-spec.md`.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Keep `DATABASE_URL=file:./data/alirezvan.db` (the `data/` folder is ignored by Git).
3. Create the database: `npm run db:migrate`.
4. Choose `ADMIN_USERNAME`.
5. Run `npm run hash-password`, type the password twice (it is not shown; at least 12
   characters), and paste the whole printed line into `.env.local`. The `\$` escapes must
   stay: Next.js reads a bare `$` in an env file as the start of a variable.
6. Set `SESSION_SECRET` to at least 32 random characters (the command is in
   `.env.example`).
7. `npm run dev`, then open `/admin`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file: `file:<path>` or a plain path, relative to the project folder |
| `UPLOAD_DIR` | Folder for uploaded images, outside the build output |
| `ADMIN_USERNAME` | The one administrator's name |
| `ADMIN_PASSWORD_HASH` | bcrypt hash from `npm run hash-password` |
| `SESSION_SECRET` | Signs the session cookie. Changing it logs every browser out |
| `TRUSTED_IP_HEADER` | Header in which the reverse proxy passes the visitor's IP. Empty locally |

Next.js reads `.env.production.local` before `.env.local` when it runs `next start`.
Do not leave such a file in the project folder unless you mean it.

## Commands

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Creates or updates the database. Safe to run again |
| `npm run db:generate` | Writes a new migration after `db/schema.ts` changed |
| `npm run hash-password` | Makes `ADMIN_PASSWORD_HASH` from a typed password |
| `npm run unlock-login` | Forgets all failed login attempts (ends a lockout) |
| `npm run revoke-sessions` | Logs every browser out |
| `npm run uploads:clean` | Lists uploaded images no article uses; `-- --delete` removes them |
| `npm test` | All tests; the admin ones are in `tests/admin` |

## Database: schema and migrations

- SQLite through `better-sqlite3` (its Windows and Linux binaries come inside the npm
  package, so installing it downloads nothing extra) and Drizzle ORM.
- Schema: `db/schema.ts`. Tables: `articles`, `slug_redirects`, `sessions`,
  `rate_limit_events`.
- Each connection turns on WAL mode, foreign keys and a 5-second busy timeout
  (`db/client.ts`). WAL creates `-wal` and `-shm` files next to the database; they belong
  to it.
- To change the schema: edit `db/schema.ts`, run `npm run db:generate` (writes a new SQL
  file in `db/migrations`; commit it), then `npm run db:migrate`.
- Application code reaches the database only through `lib/db.ts` (server only) and the
  repository modules: `lib/auth/session.ts`, `lib/auth/rate-limit.ts` and
  `lib/articles/repository.ts`. Only those files contain Drizzle queries; pages,
  components and actions do not import Drizzle.
- Every repository function is async, although better-sqlite3 itself answers at once.
  A move to PostgreSQL would then mean rewriting `db/schema.ts`, `db/client.ts` and the
  query bodies inside the repository files, without touching their callers. It has not
  been tried.

## Login and sessions

- One administrator, from the environment. The password is checked with bcrypt.
- A successful login creates a row in `sessions` and sets the cookie `admin_session`:
  a random token plus an HMAC signature; HttpOnly, SameSite=Lax, Secure in production,
  7 days. The database stores only the token's SHA-256.
- Logout deletes the row, so a copied cookie stops working at once.
- Each session also stores a short fingerprint of the password hash it was made under
  (the first 16 hex characters of its SHA-256). A session whose fingerprint differs from
  the current `ADMIN_PASSWORD_HASH` is refused and deleted. So **changing the password
  ends every open session** as soon as the server restarts with the new hash; no extra
  step is needed.
- Sessions also stop working when `ADMIN_USERNAME` or `SESSION_SECRET` changes.
- `npm run revoke-sessions` ends every session by hand (for example if a cookie may
  have leaked). Run it on the machine that holds the database.
- Every admin page and every Server Action calls `requireAdminPage()` (no session: to the
  login page), and the upload route handler calls `requireAdminAction()` (no session:
  401). Both are in `lib/auth/admin.ts`. This is the access check.
- Failed logins are limited to 5 per 15 minutes per IP, stored in `rate_limit_events`.
  While limited, even the right password is refused. A wrong username and a wrong
  password give the same answer.
- The IP comes only from the header named in `TRUSTED_IP_HEADER`. In production the
  reverse proxy must overwrite that header with the real address.

### Lockout

Without `TRUSTED_IP_HEADER` the server cannot tell visitors apart, so all of them share
one counter. Anyone on the internet can then send five wrong passwords and lock the
admin out for 15 minutes, and keep doing it for as long as they like. This is the normal
state in local development and is harmless there. In production the server prints a
warning at startup when the variable is missing (`instrumentation.ts`).

To get back in after a lockout, run `npm run unlock-login` on the machine that holds
the database. It forgets all failed login attempts and touches nothing else.

## Admin pages

| Address | What it is |
| --- | --- |
| `/admin/login` | Login form |
| `/admin` | Article list: search in titles, filter by status, sort by edit, creation or publication date, 20 per page. The filters are in the address |
| `/admin/articles/new` | Editor for a new article |
| `/admin/articles/<id>/edit` | Editor for an existing article, with its dates, the private approval record and its old addresses |
| `/admin/articles/<id>/preview` | The saved version as a page, drafts included; admin only, never cached |
| `/admin/questions` | Q&A: status tabs with counts (default «در انتظار»), search, category filter. See `docs/qa-spec.md` |
| `/admin/questions/new` | Add a question and its answer by hand |
| `/admin/questions/<id>` | Review and answer: the visitor's original beside the editable copy, answer editor, SEO, status actions |
| `POST /admin/api/upload` | Image upload (admin session and same-origin request required) |
| `/uploads/<name>` | Serves an uploaded image (public) |

- `proxy.ts` (the Next.js 16 name for middleware) sends requests without a session
  cookie to the login page early and adds `X-Robots-Tag: noindex, nofollow` and
  `Cache-Control: no-store` to everything under `/admin`. It is not the access check;
  the pages and actions are.
- The admin pages are outside the `(site)` route group, so they have no public header,
  footer or contact bar, and they are not in the sitemap. `robots.txt` disallows `/admin`.
- The Server Actions are in `app/admin/actions.ts` (login, articles) and
  `app/admin/question-actions.ts` (Q&A). Each checks the session, parses its
  input with Zod (`lib/articles/schema.ts`) and answers with a Persian message; causes go
  to the server log only.
- CSRF: Server Actions rely on the Origin check built into Next.js. The upload route
  handler checks Origin against Host itself (`lib/auth/origin.ts`).
- **The public blog still reads the MDX files.** Articles made in the panel become
  public in Phase 3.

## Article lifecycle

- A new article is a draft. «ذخیره پیش‌نویس» keeps it a draft; a draft needs only a title
  and a practice area.
- «انتشار» needs: a summary of at least 20 characters, some text, a cover image with alt
  text, and the tick «وکیل این متن را تأیید کرده است». The same holds for every later
  save of a published article. Who ticked it and when is stored in `approved_by` and
  `approved_at` and shown only on the edit page.
- `published_at` is set at the first publication and never changes again, also not when
  the article is unpublished and published again.
- `content_updated_at` is the public «آخرین به‌روزرسانی» date. It is set at the first
  publication and moves to today only when «محتوا تغییر کرده است» is ticked on a save of a
  published article (or on publishing again).
- «لغو انتشار» turns the article back into a draft and keeps its dates and old addresses.
- Deleting removes the article and its redirects for good. Its images stay in the upload
  folder until they are cleaned up (see Images).
- The editor warns before the tab is closed or reloaded with unsaved changes. It does
  not warn when a link inside the panel is clicked.

## Slugs and redirects

`lib/articles/slug.ts`: NFC, Persian ی/ک, Latin digits, lower-case Latin; spaces,
half-spaces and every symbol become a hyphen; at most 80 characters; `page` and `topic`
are reserved. The unique index on `articles.slug` has the last word.

- The id of an article never changes. Editing the title never changes the slug; the
  slug changes only when the slug field is edited.
- An empty slug field on a new article makes one from the title; if it is taken, `-2`,
  `-3`… is added. A typed slug that another article uses is refused with a message.
- When an article that has ever been published gets a new slug, the old one is stored in
  `slug_redirects`. Each row points at the article itself, not at another slug, so
  several renames never form a chain. A row is removed when its slug comes into use
  again (by the same or another article), so there are no loops.
- Serving the redirect (308) is part of Phase 3.

## Markdown rendering

- `components/ArticleBody.tsx` renders the text of an article with `react-markdown`,
  `remark-gfm` (tables, footnotes, strikethrough) and `rehype-sanitize`, inside the
  site's `<Prose>` typography. The live preview in the editor and the preview page use
  this same component, and so will the public page.
- Nothing in the text is executed: HTML tags are dropped, MDX and JavaScript are plain
  text. Links may be `http(s)`, `mailto:`, `tel:`, a site path or an anchor; anything
  else is shown as text. Images may only be files of this site (`/uploads/…`,
  `/images/…`), which also keeps the site free of foreign hosts.
- The contact box is placed before the third `## ` heading (after the second section),
  or at the end when there are exactly two sections. A line containing only
  `[contact-box]` puts it there instead.

## Images

- Cover and inline images go through `POST /admin/api/upload`: JPEG, PNG or WebP, at most
  5 MB. The type is decided by decoding the bytes with `sharp`; the file name and the
  type claimed by the browser are ignored.
- Every image is rotated to its camera orientation, scaled down to at most 2400 px on
  its long side and written again as WebP. EXIF data (camera, GPS position), ICC and XMP
  are not written. The original bytes are never stored.
- Files are stored in `UPLOAD_DIR` as 32 random hex characters + `.webp`, never
  overwritten, and served by `/uploads/<name>` with a fixed `image/webp` type and
  `nosniff`. Only names of that exact form are looked up, so there is no path traversal
  and no directory listing.
- The editor inserts inline images as `![alt](/uploads/<name>.webp#<width>x<height>)`;
  the size after `#` lets the page reserve the space of the image before it loads.
- **Clean-up.** An image is "in use" when any article has it as its cover or in its
  text. `npm run uploads:clean` lists the other files that are older than one day;
  `npm run uploads:clean -- --delete` removes them. Nothing deletes images automatically.

## Tests

`npm test` runs everything; the admin tests are in `tests/admin` and use an in-memory
database with the real migrations. They cover: database constraints, sessions (expiry,
logout, revocation, password change), the login limit and generic errors, the page and
action guards, every Server Action and the upload route without a session, input
validation, Persian and duplicate slugs, the article lifecycle and redirects, XSS and
dangerous URLs in Markdown, spoofed, oversized and invalid uploads, metadata stripping,
and the maintenance scripts.
