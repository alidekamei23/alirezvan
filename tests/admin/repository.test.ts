import { describe, expect, it } from "vitest";
import { slugRedirects } from "@/db/schema";
import {
  deleteArticle,
  getArticleById,
  listArticles,
  listRedirectsTo,
  referencedUploads,
  saveArticle,
  type SaveResult,
} from "@/lib/articles/repository";
import { articleInputSchema } from "@/lib/articles/schema";
import { DAY, testDb } from "./helpers";

const t0 = new Date("2026-10-13T08:00:00Z");
const at = (days: number) => new Date(t0.getTime() + days * DAY);
const admin = (now = t0) => ({ username: "modir", now });

const UPLOAD = `/uploads/${"ab".repeat(16)}.webp`;

function draft(overrides: Record<string, unknown> = {}) {
  return articleInputSchema.parse({ title: "چک برگشتی چیست", area: "check-safte", ...overrides });
}

function complete(overrides: Record<string, unknown> = {}) {
  return draft({
    excerpt: "خلاصه‌ای کوتاه از مقاله برای کارت‌ها و نتیجه جست‌وجو.",
    content: "## بخش نخست\n\nمتن.",
    coverImage: UPLOAD,
    coverImageAlt: "متن جایگزین",
    coverWidth: 1200,
    coverHeight: 750,
    lawyerApproved: true,
    ...overrides,
  });
}

function saved(result: SaveResult) {
  if (!result.ok) throw new Error(`save failed: ${result.error}`);
  return result.article;
}

describe("creating", () => {
  it("makes a draft with a slug from the title and an id of its own", async () => {
    const db = testDb();
    const result = await saveArticle(db, { id: null, input: draft(), action: "save" }, admin());
    const article = saved(result);
    expect(result.ok && result.created).toBe(true);
    expect(article).toMatchObject({
      slug: "چک-برگشتی-چیست",
      status: "draft",
      publishedAt: null,
      contentUpdatedAt: null,
      approvedBy: null,
    });
    expect(article.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(article.createdAt).toEqual(t0);
  });

  it("numbers the generated slug when the title is already used", async () => {
    const db = testDb();
    const first = saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    const second = saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    const third = saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    expect([first.slug, second.slug, third.slug]).toEqual([
      "چک-برگشتی-چیست",
      "چک-برگشتی-چیست-2",
      "چک-برگشتی-چیست-3",
    ]);
  });

  it("falls back to a generic slug when the title gives none", async () => {
    const db = testDb();
    const article = saved(
      await saveArticle(db, { id: null, input: draft({ title: "؟؟؟" }), action: "save" }, admin()),
    );
    expect(article.slug).toBe(`مقاله-${article.id.slice(0, 8)}`);
  });

  it("refuses a typed slug that another article uses, without changing anything", async () => {
    const db = testDb();
    saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    const result = await saveArticle(
      db,
      { id: null, input: draft({ title: "عنوان دیگر", slug: "چک-برگشتی-چیست" }), action: "save" },
      admin(),
    );
    expect(result).toEqual({ ok: false, error: "slug_taken" });
    expect((await listArticles(db, {})).total).toBe(1);
  });
});

describe("editing", () => {
  it("never changes the id or the slug when other fields change", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    const edited = saved(
      await saveArticle(
        db,
        { id: article.id, input: draft({ title: "عنوان تازه", content: "متن تازه" }), action: "save" },
        admin(at(1)),
      ),
    );
    expect(edited.id).toBe(article.id);
    expect(edited.slug).toBe(article.slug);
    expect(edited.title).toBe("عنوان تازه");
    expect(edited.createdAt).toEqual(t0);
    expect(edited.updatedAt).toEqual(at(1));
  });

  it("reports an unknown id", async () => {
    const result = await saveArticle(testDb(), { id: "nope", input: draft(), action: "save" }, admin());
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("refuses to take another article's slug", async () => {
    const db = testDb();
    saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    const other = saved(
      await saveArticle(db, { id: null, input: draft({ title: "عنوان دیگر" }), action: "save" }, admin()),
    );
    const result = await saveArticle(
      db,
      { id: other.id, input: draft({ title: "عنوان دیگر", slug: "چک-برگشتی-چیست" }), action: "save" },
      admin(),
    );
    expect(result).toEqual({ ok: false, error: "slug_taken" });
    expect((await getArticleById(db, other.id))?.slug).toBe("عنوان-دیگر");
  });
});

describe("publication lifecycle", () => {
  it("refuses to publish an incomplete article and leaves it a draft", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    const result = await saveArticle(db, { id: article.id, input: draft(), action: "publish" }, admin());
    expect(result.ok).toBe(false);
    if (result.ok || result.error !== "publish_problems") throw new Error("expected problems");
    expect(result.problems.map((p) => p.field)).toContain("lawyerApproved");
    expect((await getArticleById(db, article.id))?.status).toBe("draft");
  });

  it("refuses to publish without the lawyer's approval tick", async () => {
    const result = await saveArticle(
      testDb(),
      { id: null, input: complete({ lawyerApproved: false }), action: "publish" },
      admin(),
    );
    expect(result).toMatchObject({ ok: false, error: "publish_problems" });
  });

  it("sets the publication date, the public date and the private approval on first publication", async () => {
    const db = testDb();
    const article = saved(
      await saveArticle(db, { id: null, input: complete(), action: "publish" }, admin(at(2))),
    );
    expect(article).toMatchObject({
      status: "published",
      publishedAt: at(2),
      contentUpdatedAt: at(2),
      approvedBy: "modir",
      approvedAt: at(2),
    });
  });

  it("keeps both dates on an ordinary edit, and moves only the public date when content changed", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: complete(), action: "publish" }, admin()));

    const typo = saved(
      await saveArticle(db, { id: article.id, input: complete({ title: "عنوان اصلاح‌شده" }), action: "save" }, admin(at(3))),
    );
    expect(typo.status).toBe("published");
    expect(typo.publishedAt).toEqual(t0);
    expect(typo.contentUpdatedAt).toEqual(t0);
    expect(typo.updatedAt).toEqual(at(3));

    const rewritten = saved(
      await saveArticle(db, { id: article.id, input: complete({ contentChanged: true }), action: "save" }, admin(at(5))),
    );
    expect(rewritten.publishedAt).toEqual(t0);
    expect(rewritten.contentUpdatedAt).toEqual(at(5));
  });

  it("does not let a published article be saved into an unpublishable state", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: complete(), action: "publish" }, admin()));
    const result = await saveArticle(
      db,
      { id: article.id, input: complete({ content: "" }), action: "save" },
      admin(),
    );
    expect(result).toMatchObject({ ok: false, error: "publish_problems" });
    expect((await getArticleById(db, article.id))?.content).toBe("## بخش نخست\n\nمتن.");
  });

  it("unpublishes to a draft and keeps the first publication date when published again", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: complete(), action: "publish" }, admin()));

    const hidden = saved(
      await saveArticle(db, { id: article.id, input: complete({ lawyerApproved: false }), action: "unpublish" }, admin(at(1))),
    );
    expect(hidden).toMatchObject({ status: "draft", publishedAt: t0, contentUpdatedAt: t0, approvedAt: t0 });

    const again = saved(
      await saveArticle(db, { id: article.id, input: complete(), action: "publish" }, admin(at(9))),
    );
    expect(again).toMatchObject({
      status: "published",
      publishedAt: t0,
      contentUpdatedAt: t0,
      approvedAt: at(9),
    });
  });

  it("does not move the public date for changes made while unpublished unless asked", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: complete(), action: "publish" }, admin()));
    await saveArticle(db, { id: article.id, input: complete(), action: "unpublish" }, admin(at(1)));
    const again = saved(
      await saveArticle(db, { id: article.id, input: complete({ contentChanged: true }), action: "publish" }, admin(at(4))),
    );
    expect(again.contentUpdatedAt).toEqual(at(4));
    expect(again.publishedAt).toEqual(t0);
  });
});

describe("slug changes and redirects", () => {
  async function published(db = testDb()) {
    const article = saved(await saveArticle(db, { id: null, input: complete(), action: "publish" }, admin()));
    return { db, article };
  }
  const rename = (db: ReturnType<typeof testDb>, id: string, slug: string) =>
    saveArticle(db, { id, input: complete({ slug }), action: "save" }, admin());

  it("records the old slug of a published article", async () => {
    const { db, article } = await published();
    const renamed = saved(await rename(db, article.id, "چک-برگشتی"));
    expect(renamed.slug).toBe("چک-برگشتی");
    expect(await listRedirectsTo(db, article.id)).toEqual(["چک-برگشتی-چیست"]);
  });

  it("points every old slug straight at the article: no chains", async () => {
    const { db, article } = await published();
    await rename(db, article.id, "b");
    await rename(db, article.id, "c");
    await rename(db, article.id, "d");
    const rows = db.select().from(slugRedirects).all();
    expect(rows.map((row) => row.fromSlug).sort()).toEqual(["b", "c", "چک-برگشتی-چیست"]);
    expect(rows.every((row) => row.articleId === article.id)).toBe(true);
  });

  it("removes the redirect when an article goes back to an old slug: no loops", async () => {
    const { db, article } = await published();
    await rename(db, article.id, "b");
    const back = saved(await rename(db, article.id, "چک-برگشتی-چیست"));
    expect(back.slug).toBe("چک-برگشتی-چیست");
    expect(await listRedirectsTo(db, article.id)).toEqual(["b"]);
  });

  it("records nothing for a draft that was never public", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: draft(), action: "save" }, admin()));
    await saveArticle(db, { id: article.id, input: draft({ slug: "b" }), action: "save" }, admin());
    expect(db.select().from(slugRedirects).all()).toHaveLength(0);
  });

  it("still records the old slug of an article that was public and is now unpublished", async () => {
    const { db, article } = await published();
    await saveArticle(db, { id: article.id, input: complete(), action: "unpublish" }, admin());
    await saveArticle(db, { id: article.id, input: complete({ slug: "b" }), action: "save" }, admin());
    expect(await listRedirectsTo(db, article.id)).toEqual(["چک-برگشتی-چیست"]);
  });

  it("gives an old slug to a new article that asks for it, dropping the redirect", async () => {
    const { db, article } = await published();
    await rename(db, article.id, "b");
    const other = saved(
      await saveArticle(
        db,
        { id: null, input: draft({ title: "مقاله دیگر", slug: "چک-برگشتی-چیست" }), action: "save" },
        admin(),
      ),
    );
    expect(other.slug).toBe("چک-برگشتی-چیست");
    expect(db.select().from(slugRedirects).all()).toHaveLength(0);
  });
});

describe("deleting", () => {
  it("removes the article and its redirects", async () => {
    const db = testDb();
    const article = saved(await saveArticle(db, { id: null, input: complete(), action: "publish" }, admin()));
    await saveArticle(db, { id: article.id, input: complete({ slug: "b" }), action: "save" }, admin());

    expect(await deleteArticle(db, article.id)).toBe(true);
    expect(await getArticleById(db, article.id)).toBeNull();
    expect(db.select().from(slugRedirects).all()).toHaveLength(0);
    expect(await deleteArticle(db, article.id)).toBe(false);
  });
});

describe("listing", () => {
  async function seed() {
    const db = testDb();
    const titles = ["چک برگشتی", "اجاره‌نامه", "مطالبه طلب", "قرارداد ۱۰۰%"];
    for (const [index, title] of titles.entries()) {
      const input = index === 0 ? complete({ title }) : draft({ title });
      await saveArticle(db, { id: null, input, action: index === 0 ? "publish" : "save" }, admin(at(index)));
    }
    return db;
  }

  it("lists newest update first by default and counts everything", async () => {
    const { items, total } = await listArticles(await seed(), {});
    expect(total).toBe(4);
    expect(items.map((item) => item.title)).toEqual([
      "قرارداد ۱۰۰%",
      "مطالبه طلب",
      "اجاره‌نامه",
      "چک برگشتی",
    ]);
    expect(items[0]).not.toHaveProperty("content");
  });

  it("filters by status and searches the title", async () => {
    const db = await seed();
    expect((await listArticles(db, { status: "published" })).items.map((i) => i.title)).toEqual([
      "چک برگشتی",
    ]);
    expect((await listArticles(db, { status: "draft" })).total).toBe(3);
    expect((await listArticles(db, { q: "طلب" })).items.map((i) => i.title)).toEqual(["مطالبه طلب"]);
    // Arabic ك/ي in the query still finds Persian text.
    expect((await listArticles(db, { q: "چك برگشتي" })).total).toBe(1);
    expect((await listArticles(db, { q: "نیست" })).total).toBe(0);
  });

  it("treats % and _ in a search as plain characters", async () => {
    const db = await seed();
    expect((await listArticles(db, { q: "%" })).items.map((i) => i.title)).toEqual(["قرارداد ۱۰۰%"]);
    expect((await listArticles(db, { q: "_" })).total).toBe(0);
    expect((await listArticles(db, { q: "' or 1=1 --" })).total).toBe(0);
  });

  it("sorts by creation and publication date, never-published last", async () => {
    const db = await seed();
    const created = await listArticles(db, { sort: "created", dir: "asc" });
    expect(created.items[0].title).toBe("چک برگشتی");
    const published = await listArticles(db, { sort: "published", dir: "desc" });
    expect(published.items[0].title).toBe("چک برگشتی");
    const publishedAsc = await listArticles(db, { sort: "published", dir: "asc" });
    expect(publishedAsc.items[0].title).toBe("چک برگشتی");
  });

  it("pages through the list", async () => {
    const db = await seed();
    const first = await listArticles(db, { pageSize: 3, page: 1 });
    const second = await listArticles(db, { pageSize: 3, page: 2 });
    expect(first.items).toHaveLength(3);
    expect(second.items).toHaveLength(1);
    expect(second.total).toBe(4);
  });
});

describe("referenced uploads", () => {
  it("collects cover images and images inside the text", async () => {
    const db = testDb();
    const inline = `${"cd".repeat(16)}.webp`;
    await saveArticle(
      db,
      { id: null, input: complete({ content: `متن\n\n![تصویر](/uploads/${inline}#10x10)` }), action: "save" },
      admin(),
    );
    expect(await referencedUploads(db)).toEqual(new Set([`${"ab".repeat(16)}.webp`, inline]));
  });
});
