// The Q&A Server Actions, called the way Next.js calls them, with cookies, headers and the
// cache replaced by test doubles. Admin actions must refuse everything without a session;
// the visitor's actions must stop bots, floods and malformed input.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runMigrations } from "@/db/client";
import { questions, rateLimitEvents, sessions } from "@/db/schema";
import { TEST_PASSWORD, TEST_USERNAME, testConfig } from "../admin/helpers";

const request = vi.hoisted(() => ({ cookies: new Map<string, string>(), tags: [] as string[] }));

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
vi.mock("next/cache", () => ({
  updateTag: (tag: string) => request.tags.push(tag),
  cacheTag: () => {},
  cacheLife: () => {},
}));

process.env.DATABASE_URL = ":memory:";
process.env.ADMIN_USERNAME = testConfig.username;
process.env.ADMIN_PASSWORD_HASH = testConfig.passwordHash;
process.env.SESSION_SECRET = testConfig.sessionSecret;
process.env.IP_HASH_SALT = "test-salt-test-salt-test-salt-test-salt";

const { getDb } = await import("@/lib/db");
const adminActions = await import("@/app/admin/actions");
const questionActions = await import("@/app/admin/question-actions");
const visitorActions = await import("@/app/(site)/porsesh/actions");
const { signFormToken } = await import("@/lib/questions/secure");

const db = getDb();
runMigrations(db);

const LOGIN_REDIRECT = "REDIRECT:/admin/login";
const SECRET = process.env.IP_HASH_SALT!;

function askForm(overrides: Record<string, string> = {}, ageMs = 10_000) {
  const form = new FormData();
  const fields = {
    displayName: "مریم",
    category: "check-safte",
    title: "مهلت شکایت از چک برگشتی چقدر است؟",
    body: "یک چک برگشتی دارم که شش ماه پیش برگشت خورده است. هنوز می‌توانم شکایت کیفری کنم؟",
    accepted: "on",
    website: "",
    token: signFormToken(Date.now() - ageMs, SECRET),
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

const edit = {
  displayName: "",
  category: "check-safte",
  title: "مهلت شکایت کیفری از چک برگشتی",
  body: "یک چک برگشتی دارم که شش ماه پیش برگشت خورده است. هنوز می‌توانم شکایت کیفری کنم؟",
  answer: "پاسخ آزمایشی.",
  slug: "",
  metaTitle: "",
  metaDescription: "",
  isFeatured: false,
  adminNote: "",
  relatedArticles: [],
};

async function logIn() {
  const form = new FormData();
  form.set("username", TEST_USERNAME);
  form.set("password", TEST_PASSWORD);
  await expect(adminActions.loginAction({ error: null }, form)).rejects.toThrow("REDIRECT:/admin");
}

beforeEach(() => {
  request.cookies.clear();
  request.tags.length = 0;
  db.delete(questions).run();
  db.delete(sessions).run();
  db.delete(rateLimitEvents).run();
});

describe("visitor: asking", () => {
  it("stores a question and returns a tracking code", async () => {
    const state = await visitorActions.askQuestionAction(null, askForm());
    expect(state).toMatchObject({ ok: true });
    expect(db.select().from(questions).all()).toHaveLength(1);
    // Nothing public changed, so no cache refresh.
    expect(request.tags).toEqual([]);
  });

  it("refuses a filled honeypot, a form sent too fast, a forged or missing token", async () => {
    const cases = [
      askForm({ website: "http://spam.example" }),
      askForm({}, 500),
      askForm({ token: `${Date.now() - 10_000}.forged` }),
      askForm({ token: "" }),
    ];
    for (const form of cases) {
      expect(await visitorActions.askQuestionAction(null, form)).toMatchObject({ ok: false });
    }
    expect(db.select().from(questions).all()).toHaveLength(0);
  });

  it("refuses link-heavy text and missing consent, with messages per field", async () => {
    const links = await visitorActions.askQuestionAction(
      null,
      askForm({ body: "ببینید http://a.com و http://b.com و www.c.com برای اطلاعات بیشتر درباره چک" }),
    );
    expect(links).toMatchObject({ ok: false, fieldErrors: { body: expect.stringContaining("پیوند") } });
    const consent = await visitorActions.askQuestionAction(null, askForm({ accepted: "" }));
    expect(consent).toMatchObject({ ok: false, fieldErrors: { accepted: expect.any(String) } });
    expect(db.select().from(questions).all()).toHaveLength(0);
  });

  it("allows three questions an hour from one address", async () => {
    for (let i = 0; i < 3; i++) {
      expect(await visitorActions.askQuestionAction(null, askForm())).toMatchObject({ ok: true });
    }
    const fourth = await visitorActions.askQuestionAction(null, askForm());
    expect(fourth).toMatchObject({ ok: false, message: expect.stringContaining("دقیقه دیگر") });
    expect(db.select().from(questions).all()).toHaveLength(3);
  });
});

describe("visitor: tracking", () => {
  it("shows the status for a code and nothing for a wrong one", async () => {
    const asked = await visitorActions.askQuestionAction(null, askForm());
    if (!asked?.ok) throw new Error("ask failed");
    const state = await visitorActions.trackQuestionsAction([asked.trackingCode.toLowerCase()]);
    expect(state).toEqual({
      ok: true,
      results: [{ code: asked.trackingCode, found: true, status: "waiting", title: expect.any(String) }],
    });
    expect(await visitorActions.trackQuestionsAction(["ABCDEFGHJK"])).toEqual({
      ok: true,
      results: [{ code: "ABCDEFGHJK", found: false }],
    });
    expect(await visitorActions.trackQuestionsAction(["0000"])).toMatchObject({ ok: false });
  });

  it("limits look-ups so codes cannot be guessed", async () => {
    for (let i = 0; i < 20; i++) await visitorActions.trackQuestionsAction(["ABCDEFGHJK"]);
    expect(await visitorActions.trackQuestionsAction(["ABCDEFGHJK"])).toMatchObject({ ok: false });
  });
});

describe("admin actions", () => {
  it("do nothing without a session", async () => {
    const asked = await visitorActions.askQuestionAction(null, askForm());
    if (!asked?.ok) throw new Error("ask failed");
    const id = db.select().from(questions).get()!.id;
    const requests = [
      { id: null, action: "publish", question: edit },
      { id, action: "publish", question: edit },
      { id, action: "unpublish" },
      { id, action: "reject", reason: "" },
      { id, action: "archive" },
    ];
    for (const payload of requests) {
      await expect(questionActions.questionAction(payload)).rejects.toThrow(LOGIN_REDIRECT);
    }
    await expect(questionActions.deleteQuestionAction(id)).rejects.toThrow(LOGIN_REDIRECT);
    const row = db.select().from(questions).get()!;
    expect(row.status).toBe("pending");
    expect(row.deletedAt).toBeNull();
    expect(request.tags).toEqual([]);
  });

  it("publish and unpublish with a session, refreshing the public cache each time", async () => {
    await logIn();
    const created = await questionActions.questionAction({ id: null, action: "publish", question: edit });
    expect(created).toMatchObject({ ok: true, status: "published", created: true });
    if (!created.ok) return;
    expect(await questionActions.questionAction({ id: created.id, action: "unpublish" })).toMatchObject({
      ok: true,
      status: "answered",
    });
    expect(request.tags).toEqual(["questions", "questions"]);
    // Not allowed from "answered": refused, and the cache is left alone.
    expect(await questionActions.questionAction({ id: created.id, action: "unpublish" })).toMatchObject({
      ok: false,
    });
    expect(request.tags).toHaveLength(2);
  });

  it("refuses to publish without an answer and reports the field", async () => {
    await logIn();
    const result = await questionActions.questionAction({
      id: null,
      action: "publish",
      question: { ...edit, answer: "" },
    });
    expect(result).toMatchObject({ ok: false, fieldErrors: { answer: expect.any(String) } });
  });
});
