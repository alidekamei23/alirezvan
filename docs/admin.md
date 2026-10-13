# Admin panel — setup and operation

Written phase by phase; sections for the editor, import, redirects, images and VPS
deployment are added in Phases 2 and 3. Spec: `docs/admin-panel-spec.md`.

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

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file: `file:<path>` or a plain path, relative to the project folder |
| `UPLOAD_DIR` | Folder for uploaded images (used from Phase 2) |
| `ADMIN_USERNAME` | The one administrator's name |
| `ADMIN_PASSWORD_HASH` | bcrypt hash from `npm run hash-password` |
| `SESSION_SECRET` | Signs the session cookie. Changing it logs every browser out |
| `TRUSTED_IP_HEADER` | Header in which the reverse proxy passes the visitor's IP. Empty locally |

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
- `npm run db:migrate` is safe to run again; it applies only what is missing.
- Application code reaches the database only through `lib/db.ts` (server only) and the
  modules in `lib/auth` and `lib/articles`. Pages and components do not import Drizzle.
  A move to PostgreSQL would mean rewriting `db/schema.ts`, `db/client.ts` and the
  queries in those modules, and making their functions asynchronous; it has not been
  tried.

## Login and sessions

- One administrator, from the environment. The password is checked with bcrypt.
- A successful login creates a row in `sessions` and sets the cookie `admin_session`:
  a random token plus an HMAC signature; HttpOnly, SameSite=Lax, Secure in production,
  7 days. The database stores only the token's SHA-256.
- Logout deletes the row, so a copied cookie stops working at once. Deleting all rows of
  `sessions` logs every browser out. Sessions also stop working when `ADMIN_USERNAME` or
  `SESSION_SECRET` changes. **Changing only the password does not end open sessions**;
  empty the `sessions` table as well.
- Every admin page calls `requireAdminPage()` and every action or route handler calls
  `requireAdminAction()` (`lib/auth/admin.ts`). `proxy.ts` (Phase 2) is only an early
  redirect.
- Failed logins are limited to 5 per 15 minutes per IP, stored in `rate_limit_events`.
  While limited, even the right password is refused. A wrong username and a wrong
  password give the same answer.
- The IP comes only from the header named in `TRUSTED_IP_HEADER`. Without it, all
  visitors share one counter: five wrong passwords from anyone lock the login for
  everyone for up to 15 minutes. In production the reverse proxy must overwrite that
  header with the real address.

## Slugs

`lib/articles/slug.ts`: NFC, Persian ی/ک, Latin digits, lower-case Latin; spaces,
half-spaces and every symbol become a hyphen; at most 80 characters; `page` and `topic`
are reserved. The unique index on `articles.slug` has the last word.

## Tests

`npm test` runs everything; the admin tests are in `tests/admin` and use an in-memory
database with the real migrations.
