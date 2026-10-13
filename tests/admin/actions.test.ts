// The Server Actions and Route Handlers of the admin panel, called the way Next.js calls
// them, with the request's cookies and headers replaced by test values. The main point:
// every one of them refuses to do anything without a valid session.
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMigrations } from "@/db/client";
import { articles, rateLimitEvents, sessions } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { TEST_PASSWORD, TEST_USERNAME, testConfig } from "./helpers";

const request = vi.hoisted(() => ({ cookies: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      request.cookies.has(name) ? { name, value: request.cookies.get(name)! } : undefined,
    set: (name: string, value: string) => request.cookies.set(name, value),
    delete: (name: string) => request.cookies.delete(name),
  }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new Error(`REDIRECT:${target}`);
  },
}));

const uploadDir = mkdtempSync(path.join(os.tmpdir(), "alirezvan-actions-"));
afterAll(() => rmSync(uploadDir, { recursive: true, force: true }));

process.env.DATABASE_URL = ":memory:";
process.env.UPLOAD_DIR = uploadDir;
process.env.ADMIN_USERNAME = testConfig.username;
process.env.ADMIN_PASSWORD_HASH = testConfig.passwordHash;
process.env.SESSION_SECRET = testConfig.sessionSecret;

const { getDb } = await import("@/lib/db");
const actions = await import("@/app/admin/actions");
const uploadRoute = await import("@/app/admin/api/upload/route");
const fileRoute = await import("@/app/uploads/[file]/route");
const { isSameOrigin } = await import("@/lib/auth/origin");

const db = getDb();
runMigrations(db);

const LOGIN_REDIRECT = "REDIRECT:/admin/login";
const draft = { title: "مقاله آزمایشی", area: "check-safte" };
const allArticles = () => db.select().from(articles).all();

function credentials(username: string, password: string) {
  const form = new FormData();
  form.set("username", username);
  form.set("password", password);
  return form;
}

async function logIn() {
  await expect(
    actions.loginAction({ error: null }, credentials(TEST_USERNAME, TEST_PASSWORD)),
  ).rejects.toThrow("REDIRECT:/admin");
}

async function createDraft(overrides: Record<string, unknown> = {}) {
  const result = await actions.saveArticleAction({
    id: null,
    action: "save",
    article: { ...draft, ...overrides },
  });
  if (!result.ok) throw new Error(result.message);
  return result;
}

beforeEach(() => {
  request.cookies.clear();
  db.delete(articles).run();
  db.delete(sessions).run();
  db.delete(rateLimitEvents).run();
});

describe("login and logout actions", () => {
  it("answers a wrong username and a wrong password with the same message and sets no cookie", async () => {
    const wrongUser = await actions.loginAction({ error: null }, credentials("someone", TEST_PASSWORD));
    const wrongPassword = await actions.loginAction({ error: null }, credentials(TEST_USERNAME, "wrong password!"));
    expect(wrongUser.error).toBe("نام کاربری یا گذرواژه نادرست است.");
    expect(wrongPassword).toEqual(wrongUser);
    expect(request.cookies.has(SESSION_COOKIE)).toBe(false);
  });

  it("locks the login after five failures and says how long, in Persian digits", async () => {
    for (let i = 0; i < 5; i++) {
      await actions.loginAction({ error: null }, credentials(TEST_USERNAME, "wrong password!"));
    }
    const blocked = await actions.loginAction({ error: null }, credentials(TEST_USERNAME, TEST_PASSWORD));
    expect(blocked.error).toMatch(/^تلاش‌های ناموفق زیاد بود\. ۱۵ دقیقه دیگر/);
    expect(request.cookies.has(SESSION_COOKIE)).toBe(false);
  });

  it("sets the session cookie and goes to /admin on success", async () => {
    await logIn();
    expect(request.cookies.get(SESSION_COOKIE)).toMatch(/^[\w-]+\.[\w-]+$/);
    expect(db.select().from(sessions).all()).toHaveLength(1);
  });

  it("logout deletes the session on the server and the cookie in the browser", async () => {
    await logIn();
    const cookie = request.cookies.get(SESSION_COOKIE)!;
    await expect(actions.logoutAction()).rejects.toThrow(LOGIN_REDIRECT);
    expect(request.cookies.has(SESSION_COOKIE)).toBe(false);
    expect(db.select().from(sessions).all()).toHaveLength(0);

    // The old cookie value is worthless now.
    request.cookies.set(SESSION_COOKIE, cookie);
    await expect(actions.saveArticleAction({ id: null, action: "save", article: draft })).rejects.toThrow(
      LOGIN_REDIRECT,
    );
  });

  it("does not reveal a configuration problem to the browser", async () => {
    const config = await import("@/lib/auth/config");
    const spy = vi.spyOn(config, "getAuthConfig").mockImplementation(() => {
      throw new Error("Admin login is not configured: SESSION_SECRET must be at least 32 characters");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await actions.loginAction({ error: null }, credentials(TEST_USERNAME, TEST_PASSWORD));
    expect(result.error).toBe("ورود در حال حاضر ممکن نیست. تنظیمات سرور را بررسی کنید.");
    expect(result.error).not.toContain("SESSION_SECRET");
    spy.mockRestore();
    log.mockRestore();
  });
});

describe("article actions without a session", () => {
  const cases: [string, () => void][] = [
    ["no cookie", () => {}],
    ["a forged cookie", () => request.cookies.set(SESSION_COOKIE, "forged.value")],
  ];

  it.each(cases)("save, publish and unpublish are refused with %s", async (_name, arrange) => {
    arrange();
    for (const action of ["save", "publish", "unpublish"]) {
      await expect(actions.saveArticleAction({ id: null, action, article: draft })).rejects.toThrow(
        LOGIN_REDIRECT,
      );
    }
    expect(allArticles()).toHaveLength(0);
  });

  it.each(cases)("edit and delete of an existing article are refused with %s", async (_name, arrange) => {
    await logIn();
    const { id } = await createDraft();
    request.cookies.clear();
    arrange();

    await expect(
      actions.saveArticleAction({ id, action: "save", article: { ...draft, title: "تغییر بی‌اجازه" } }),
    ).rejects.toThrow(LOGIN_REDIRECT);
    await expect(actions.deleteArticleAction(id)).rejects.toThrow(LOGIN_REDIRECT);

    expect(allArticles()).toMatchObject([{ id, title: draft.title }]);
  });

  it("is refused once the session is revoked, although the cookie is unchanged", async () => {
    await logIn();
    db.delete(sessions).run();
    await expect(actions.saveArticleAction({ id: null, action: "save", article: draft })).rejects.toThrow(
      LOGIN_REDIRECT,
    );
    expect(allArticles()).toHaveLength(0);
  });
});

describe("article actions with a session", () => {
  beforeEach(logIn);

  it("creates a draft and reports its id, slug and status", async () => {
    const result = await createDraft();
    expect(result).toMatchObject({ ok: true, slug: "مقاله-آزمایشی", status: "draft", created: true });
    expect(allArticles()).toHaveLength(1);
  });

  it("returns field messages for invalid input and saves nothing", async () => {
    const result = await actions.saveArticleAction({
      id: null,
      action: "save",
      article: { title: "", area: "nope", references: [{ title: "قانون", url: "javascript:alert(1)" }] },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["area", "references", "title"]);
    expect(allArticles()).toHaveLength(0);
  });

  it("refuses malformed requests: wrong shape, wrong action, an id that is not a UUID", async () => {
    for (const payload of [
      null,
      "text",
      { id: null, action: "destroy", article: draft },
      { id: "1; drop table articles", action: "save", article: draft },
      { id: null, action: "save" },
    ]) {
      expect((await actions.saveArticleAction(payload)).ok).toBe(false);
    }
    expect(allArticles()).toHaveLength(0);
  });

  it("ignores extra fields a client might add, such as status or approval data", async () => {
    await actions.saveArticleAction({
      id: null,
      action: "save",
      article: { ...draft, status: "published", publishedAt: 1, approvedBy: "x", id: "forced" },
    });
    expect(allArticles()).toMatchObject([{ status: "draft", publishedAt: null, approvedBy: null }]);
  });

  it("reports a duplicate slug on the slug field", async () => {
    await createDraft();
    const result = await actions.saveArticleAction({
      id: null,
      action: "save",
      article: { ...draft, title: "عنوان دیگر", slug: "مقاله-آزمایشی" },
    });
    expect(result).toMatchObject({ ok: false, fieldErrors: { slug: expect.any(String) } });
  });

  it("lists what is missing when publishing an incomplete draft", async () => {
    const { id } = await createDraft();
    const result = await actions.saveArticleAction({ id, action: "publish", article: draft });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors)).toEqual(
      expect.arrayContaining(["excerpt", "content", "coverImage", "lawyerApproved"]),
    );
    expect(allArticles()[0].status).toBe("draft");
  });

  it("records the logged-in admin as the one who confirmed the approval", async () => {
    const result = await actions.saveArticleAction({
      id: null,
      action: "publish",
      article: {
        ...draft,
        excerpt: "خلاصه‌ای کوتاه از مقاله برای کارت‌ها و نتیجه جست‌وجو.",
        content: "متن",
        coverImage: `/uploads/${"ab".repeat(16)}.webp`,
        coverImageAlt: "متن جایگزین",
        coverWidth: 10,
        coverHeight: 10,
        lawyerApproved: true,
      },
    });
    expect(result).toMatchObject({ ok: true, status: "published" });
    expect(allArticles()[0].approvedBy).toBe(TEST_USERNAME);
  });

  it("deletes an article and goes back to the list; a bad id deletes nothing", async () => {
    const { id } = await createDraft();
    await expect(actions.deleteArticleAction("not-a-uuid")).rejects.toThrow("REDIRECT:/admin?deleted=1");
    expect(allArticles()).toHaveLength(1);
    await expect(actions.deleteArticleAction(id)).rejects.toThrow("REDIRECT:/admin?deleted=1");
    expect(allArticles()).toHaveLength(0);
  });
});

describe("same-origin check", () => {
  const headers = (init: Record<string, string>) => new Headers(init);

  it("accepts only a request whose Origin names this host", () => {
    expect(isSameOrigin(headers({ origin: "https://example.ir", host: "example.ir" }))).toBe(true);
    expect(isSameOrigin(headers({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(true);
    expect(
      isSameOrigin(headers({ origin: "https://example.ir", host: "127.0.0.1:3000", "x-forwarded-host": "example.ir" })),
    ).toBe(true);

    expect(isSameOrigin(headers({ host: "example.ir" }))).toBe(false);
    expect(isSameOrigin(headers({ origin: "https://evil.example", host: "example.ir" }))).toBe(false);
    expect(isSameOrigin(headers({ origin: "https://example.ir.evil.example", host: "example.ir" }))).toBe(false);
    expect(isSameOrigin(headers({ origin: "null", host: "example.ir" }))).toBe(false);
    expect(isSameOrigin(headers({ origin: "http://localhost:3001", host: "localhost:3000" }))).toBe(false);
  });
});

describe("upload route", () => {
  const ORIGIN = { origin: "http://localhost:3000", host: "localhost:3000" };

  async function png() {
    return sharp({ create: { width: 20, height: 10, channels: 3, background: "#047857" } })
      .png()
      .toBuffer();
  }

  function post(bytes: Uint8Array, headers: Record<string, string> = ORIGIN, name = "a.png") {
    const form = new FormData();
    // A copy with its own ArrayBuffer, which is what File accepts.
    form.set("file", new File([new Uint8Array(bytes)], name, { type: "image/png" }));
    return uploadRoute.POST(new Request("http://localhost:3000/admin/api/upload", { method: "POST", body: form, headers }));
  }

  const stored = () => readdirSync(uploadDir).length;

  it("refuses without a session and stores nothing", async () => {
    const before = stored();
    expect((await post(await png())).status).toBe(401);
    request.cookies.set(SESSION_COOKIE, "forged.value");
    expect((await post(await png())).status).toBe(401);
    expect(stored()).toBe(before);
  });

  it("refuses a logged-in request from another origin or without an Origin header", async () => {
    await logIn();
    const before = stored();
    expect((await post(await png(), { host: "localhost:3000" })).status).toBe(403);
    expect((await post(await png(), { origin: "https://evil.example", host: "localhost:3000" })).status).toBe(403);
    expect(stored()).toBe(before);
  });

  it("stores a real image for the admin and answers with its path and size", async () => {
    await logIn();
    const response = await post(await png());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ path: expect.stringMatching(/^\/uploads\/[a-f0-9]{32}\.webp$/), width: 20, height: 10 });

    // …and the file route serves exactly that file, as WebP, to anyone.
    request.cookies.clear();
    const name = body.path.slice("/uploads/".length);
    const served = await fileRoute.GET(new Request(`http://localhost:3000${body.path}`), {
      params: Promise.resolve({ file: name }),
    });
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/webp");
    expect(served.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await sharp(Buffer.from(await served.arrayBuffer())).metadata()).format).toBe("webp");
  });

  it("refuses a spoofed file, an empty request and an oversized file, in Persian, without details", async () => {
    await logIn();
    const spoofed = await post(new TextEncoder().encode("<script>alert(1)</script>"), ORIGIN, "evil.png");
    expect(spoofed.status).toBe(415);
    const message = (await spoofed.json()).error as string;
    expect(message).toBe("این فایل یک تصویر سالم نیست.");

    const empty = await uploadRoute.POST(
      new Request("http://localhost:3000/admin/api/upload", { method: "POST", body: new FormData(), headers: ORIGIN }),
    );
    expect(empty.status).toBe(400);

    const large = await post(new Uint8Array(5 * 1024 * 1024 + 1));
    expect(large.status).toBe(413);
  });
});

describe("uploaded file route", () => {
  it("answers 404 for anything that is not a stored upload", async () => {
    for (const file of ["x", "../.env.local", "..%2f.env.local", `${"a".repeat(32)}.webp`, `${"a".repeat(32)}.php`]) {
      const response = await fileRoute.GET(new Request("http://localhost:3000/uploads/x"), {
        params: Promise.resolve({ file }),
      });
      expect(response.status).toBe(404);
      expect(await response.text()).toBe("");
    }
  });
});
