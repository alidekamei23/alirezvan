import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { databasePath, isUniqueViolation, openDatabase, runMigrations } from "@/db/client";
import { articles, slugRedirects } from "@/db/schema";
import { articleRow, testDb } from "./helpers";

describe("database", () => {
  it("opens a file database in WAL mode with foreign keys on", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "alirezvan-db-"));
    try {
      const db = openDatabase(`file:${path.join(dir, "nested", "test.db")}`);
      runMigrations(db);
      expect(db.get<{ journal_mode: string }>(sql`pragma journal_mode`).journal_mode).toBe("wal");
      expect(db.get<{ foreign_keys: number }>(sql`pragma foreign_keys`).foreign_keys).toBe(1);
      db.$client.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("resolves DATABASE_URL forms", () => {
    expect(databasePath("file::memory:")).toBe(":memory:");
    expect(databasePath("file:./data/x.db")).toBe(path.resolve("data/x.db"));
    expect(databasePath("./data/x.db")).toBe(path.resolve("data/x.db"));
    expect(() => databasePath("file:")).toThrow();
  });

  it("is safe to migrate twice", () => {
    const db = testDb();
    expect(() => runMigrations(db)).not.toThrow();
  });

  it("stores defaults, JSON fields and dates", () => {
    const db = testDb();
    db.insert(articles)
      .values({ ...articleRow(), faqs: [{ q: "پرسش نمونه؟", a: "پاسخ نمونه" }] })
      .run();
    const row = db.select().from(articles).get()!;
    expect(row.status).toBe("draft");
    expect(row.publishedAt).toBeNull();
    expect(row.references).toEqual([]);
    expect(row.faqs).toEqual([{ q: "پرسش نمونه؟", a: "پاسخ نمونه" }]);
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("refuses a second article with the same slug, and says so recognisably", () => {
    const db = testDb();
    db.insert(articles).values(articleRow()).run();
    let caught: unknown;
    try {
      db.insert(articles).values(articleRow({ id: "a2" })).run();
    } catch (error) {
      caught = error;
    }
    expect(isUniqueViolation(caught)).toBe(true);
    expect(isUniqueViolation(new Error("something else"))).toBe(false);
    expect(db.select().from(articles).all()).toHaveLength(1);
  });

  it("ties slug redirects to an existing article and removes them with it", () => {
    const db = testDb();
    const now = new Date();
    expect(() =>
      db
        .insert(slugRedirects)
        .values({ fromSlug: "old", articleId: "missing", createdAt: now })
        .run(),
    ).toThrow();

    db.insert(articles).values(articleRow()).run();
    db.insert(slugRedirects).values({ fromSlug: "old", articleId: "a1", createdAt: now }).run();
    db.delete(articles).where(eq(articles.id, "a1")).run();
    expect(db.select().from(slugRedirects).all()).toHaveLength(0);
  });
});
