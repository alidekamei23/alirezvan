// The Q&A data layer: visitor questions, tracking codes, the status rules, slugs and
// redirects, search, and above all that public reads never expose private data.
import { describe, expect, it } from "vitest";
import { questions } from "@/db/schema";
import { normalizeForSearch, normalizeTrackingCode, nextStatus, canApply } from "@/lib/questions/core";
import { countView, getQuestionPage, listPublishedForSitemap, listPublishedQuestions } from "@/lib/questions/public";
import {
  applyQuestionAction,
  countByStatus,
  createVisitorQuestion,
  findByTrackingCode,
  getQuestionById,
  listQuestions,
} from "@/lib/questions/repository";
import { askSchema, questionEditSchema, type QuestionEditInput } from "@/lib/questions/schema";
import { hashTrackingCode } from "@/lib/questions/secure";
import { testDb } from "../admin/helpers";

const ADMIN = { username: "modir" };

const ask = askSchema.parse({
  displayName: "",
  category: "check-safte",
  title: "چك برگشتي را چطور وصول كنم؟",
  body: "چکی ۱۲۰ میلیون تومانی دارم که برگشت خورده است. اول باید شکایت کیفری کنم یا حقوقی؟",
  accepted: true,
});

function edit(overrides: Partial<QuestionEditInput> = {}): QuestionEditInput {
  return questionEditSchema.parse({
    displayName: "",
    category: "check-safte",
    title: "وصول چک برگشتی؛ کیفری یا حقوقی؟",
    body: "چکی ۱۲۰ میلیون تومانی دارم که برگشت خورده است. اول باید شکایت کیفری کنم یا حقوقی؟",
    answer: "## پاسخ\n\nبرای وصول چک برگشتی دو راه وجود دارد.",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    isFeatured: false,
    adminNote: "یادداشت داخلی",
    relatedArticles: [],
    ...overrides,
  });
}

async function visitorQuestion(db = testDb()) {
  const created = await createVisitorQuestion(db, ask, { ipHash: "iphash-1" });
  return { db, ...created };
}

async function publishedQuestion() {
  const { db, id, trackingCode } = await visitorQuestion();
  const result = await applyQuestionAction(db, { id, action: "publish", input: edit() }, ADMIN);
  if (!result.ok || !result.question) throw new Error("publish failed");
  return { db, id, trackingCode, slug: result.question.slug };
}

describe("visitor questions", () => {
  it("are stored pending, with only the hash of the tracking code", async () => {
    const { db, id, trackingCode } = await visitorQuestion();
    const row = await getQuestionById(db, id);
    expect(row?.status).toBe("pending");
    expect(row?.trackingCodeHash).toBe(hashTrackingCode(trackingCode));
    expect(JSON.stringify(row)).not.toContain(trackingCode);
    // ی/ک made Persian; the original keeps what was sent (after the same cleaning).
    expect(row?.title).toBe("چک برگشتی را چطور وصول کنم؟");
    expect(row?.originalTitle).toBe(row?.title);
    expect(normalizeTrackingCode(trackingCode)).toBe(trackingCode);
  });

  it("are invisible publicly, also by direct address, until published", async () => {
    const { db, id } = await visitorQuestion();
    const row = await getQuestionById(db, id);
    expect(await getQuestionPage(db, row!.slug)).toEqual({ kind: "missing" });
    expect((await listPublishedQuestions(db, {})).total).toBe(0);
    expect(await listPublishedForSitemap(db)).toEqual([]);
    expect(await countView(db, row!.slug)).toBe(false);
  });

  it("can be followed with the tracking code, typed loosely", async () => {
    const { db, id, trackingCode } = await visitorQuestion();
    const typed = `${trackingCode.slice(0, 5).toLowerCase()} - ${trackingCode.slice(5)}`;
    const code = normalizeTrackingCode(typed)!;
    expect(await findByTrackingCode(db, code)).toMatchObject({ status: "waiting", slug: null });

    await applyQuestionAction(db, { id, action: "publish", input: edit() }, ADMIN);
    expect(await findByTrackingCode(db, code)).toMatchObject({ status: "published" });

    await applyQuestionAction(db, { id, action: "unpublish" }, ADMIN);
    await applyQuestionAction(db, { id, action: "reject", reason: "تکراری" }, ADMIN);
    const rejected = await findByTrackingCode(db, code);
    expect(rejected).toMatchObject({ status: "closed", slug: null });
    expect(JSON.stringify(rejected)).not.toContain("تکراری");

    await applyQuestionAction(db, { id, action: "delete" }, ADMIN);
    expect(await findByTrackingCode(db, code)).toBeNull();
    expect(await findByTrackingCode(db, "ABCDEFGHJK")).toBeNull();
  });
});

describe("status rules", () => {
  it("allow only the listed actions", () => {
    expect(canApply("pending", "unpublish")).toBe(false);
    expect(canApply("published", "reject")).toBe(false);
    expect(canApply("archived", "publish")).toBe(false);
    expect(nextStatus("pending", "save", true)).toBe("answered");
    expect(nextStatus("pending", "save", false)).toBe("pending");
    expect(nextStatus("published", "save", true)).toBe("published");
    expect(nextStatus("published", "unpublish", true)).toBe("answered");
  });

  it("are enforced by the repository", async () => {
    const { db, id } = await visitorQuestion();
    expect(await applyQuestionAction(db, { id, action: "unpublish" }, ADMIN)).toEqual({
      ok: false,
      error: "invalid_transition",
    });
    expect(
      await applyQuestionAction(db, { id, action: "publish", input: edit({ answer: "" }) }, ADMIN),
    ).toEqual({ ok: false, error: "needs_answer" });
  });

  it("saving an answer makes it answered; publishing sets the date once", async () => {
    const { db, id } = await visitorQuestion();
    const saved = await applyQuestionAction(db, { id, action: "save", input: edit() }, ADMIN);
    expect(saved.ok && saved.question?.status).toBe("answered");
    expect(saved.ok && saved.question?.answeredBy).toBe("modir");

    const first = new Date("2026-10-20T08:00:00Z");
    await applyQuestionAction(db, { id, action: "publish", input: edit() }, { ...ADMIN, now: first });
    await applyQuestionAction(db, { id, action: "unpublish" }, ADMIN);
    const again = await applyQuestionAction(db, { id, action: "publish", input: edit() }, ADMIN);
    expect(again.ok && again.question?.publishedAt).toEqual(first);
  });

  it("an admin can add a question with its answer by hand", async () => {
    const db = testDb();
    const result = await applyQuestionAction(db, { id: null, action: "publish", input: edit() }, ADMIN);
    expect(result.ok && result.created).toBe(true);
    expect(result.ok && result.question?.trackingCodeHash).toBeNull();
    expect((await listPublishedQuestions(db, {})).total).toBe(1);
    expect(
      await applyQuestionAction(db, { id: null, action: "reject" }, ADMIN),
    ).toEqual({ ok: false, error: "invalid_transition" });
  });

  it("delete is soft and hides the question everywhere", async () => {
    const { db, id, slug } = await publishedQuestion();
    await applyQuestionAction(db, { id, action: "delete" }, ADMIN);
    expect(await getQuestionById(db, id)).toBeNull();
    expect(await getQuestionPage(db, slug)).toEqual({ kind: "missing" });
    expect((await countByStatus(db)).published).toBe(0);
    expect(db.select().from(questions).all()).toHaveLength(1);
  });
});

describe("public reads", () => {
  it("never contain private fields", async () => {
    const { db, slug, trackingCode } = await publishedQuestion();
    const page = await getQuestionPage(db, slug);
    const list = await listPublishedQuestions(db, {});
    const text = JSON.stringify([page, list]);
    for (const secret of ["iphash-1", "یادداشت داخلی", hashTrackingCode(trackingCode), trackingCode]) {
      expect(text).not.toContain(secret);
    }
    if (page.kind !== "question") throw new Error("expected a question");
    expect(Object.keys(page.question).sort()).toEqual(
      [
        "answer",
        "answeredAt",
        "body",
        "category",
        "displayName",
        "isFeatured",
        "metaDescription",
        "metaTitle",
        "publishedAt",
        "slug",
        "title",
        "updatedAt",
      ].sort(),
    );
  });

  it("unpublishing takes it off the site at once", async () => {
    const { db, id, slug } = await publishedQuestion();
    expect((await getQuestionPage(db, slug)).kind).toBe("question");
    await applyQuestionAction(db, { id, action: "unpublish" }, ADMIN);
    expect(await getQuestionPage(db, slug)).toEqual({ kind: "missing" });
  });

  it("an old slug of a published question redirects to the new one", async () => {
    const { db, id, slug } = await publishedQuestion();
    await applyQuestionAction(db, { id, action: "save", input: edit({ slug: "وصول-چک" }) }, ADMIN);
    expect(await getQuestionPage(db, slug)).toEqual({ kind: "redirect", slug: "وصول-چک" });
    // Back to the first slug: no redirect loop.
    await applyQuestionAction(db, { id, action: "save", input: edit({ slug }) }, ADMIN);
    expect((await getQuestionPage(db, slug)).kind).toBe("question");
    expect(await getQuestionPage(db, "وصول-چک")).toEqual({ kind: "redirect", slug });
  });

  it("a slug taken by another question is refused", async () => {
    const { db, slug } = await publishedQuestion();
    const other = await applyQuestionAction(db, { id: null, action: "save", input: edit({ title: "سؤال دیگری درباره چک" }) }, ADMIN);
    if (!other.ok || !other.question) throw new Error();
    expect(
      await applyQuestionAction(db, { id: other.question.id, action: "save", input: edit({ slug }) }, ADMIN),
    ).toEqual({ ok: false, error: "slug_taken" });
  });

  it("search ignores ی/ک, Persian digits and half-spaces", async () => {
    const { db } = await publishedQuestion();
    for (const query of ["كيفري", "۱۲۰ میلیون", "برگشتی حقوقی", "چک‌ برگشتی"]) {
      expect((await listPublishedQuestions(db, { q: query })).total, query).toBe(1);
    }
    expect((await listPublishedQuestions(db, { q: "مهریه" })).total).toBe(0);
    expect((await listPublishedQuestions(db, { category: "khanevade" })).total).toBe(0);
    expect(normalizeForSearch("سفته‌ها ۱۰")).toBe("سفته ها 10");
  });

  it("counts views of published questions only", async () => {
    const { db, id, slug } = await publishedQuestion();
    await countView(db, slug);
    await countView(db, slug);
    expect((await getQuestionById(db, id))?.viewCount).toBe(2);
    const admin = await listQuestions(db, { status: "published" });
    expect(admin.items[0].viewCount).toBe(2);
  });
});

describe("addresses of visitor questions", () => {
  it("stay neutral until publication, then come from the edited title", async () => {
    const { db, id } = await visitorQuestion();
    const pending = await getQuestionById(db, id);
    // Nothing from the visitor's own words is in the address before review.
    expect(pending?.slug).toMatch(/^q-[0-9a-f]{8}$/);

    const result = await applyQuestionAction(
      db,
      { id, action: "publish", input: edit({ title: "وصول چک برگشتی؛ کیفری یا حقوقی؟" }) },
      ADMIN,
    );
    expect(result.ok && result.question?.slug).toBe("وصول-چک-برگشتی-کیفری-یا-حقوقی");
  });

  it("keep their address once published, even when the title changes", async () => {
    const { db, id, slug } = await publishedQuestion();
    const saved = await applyQuestionAction(db, { id, action: "save", input: edit({ title: "عنوان تازه برای همین پرسش" }) }, ADMIN);
    expect(saved.ok && saved.question?.slug).toBe(slug);
  });
});
