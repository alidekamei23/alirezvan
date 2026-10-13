import bcrypt from "bcryptjs";
import { openDatabase, runMigrations, type Db } from "@/db/client";
import type { AuthConfig } from "@/lib/auth/config";

export const TEST_USERNAME = "modir";
export const TEST_PASSWORD = "correct horse battery";

/** A fresh in-memory database with every migration applied. */
export function testDb(): Db {
  const db = openDatabase(":memory:");
  runMigrations(db);
  return db;
}

export const testConfig: AuthConfig = {
  username: TEST_USERNAME,
  // Cost 4 keeps the tests fast; the real script uses 12.
  passwordHash: bcrypt.hashSync(TEST_PASSWORD, 4),
  sessionSecret: "test-secret-test-secret-test-secret-1234",
};

export const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;

export function articleRow(overrides: Partial<{ id: string; slug: string }> = {}) {
  const now = new Date("2026-10-13T08:00:00Z");
  return {
    id: overrides.id ?? "a1",
    title: "عنوان آزمایشی",
    slug: overrides.slug ?? "عنوان-آزمایشی",
    area: "check-safte",
    excerpt: "",
    content: "",
    createdAt: now,
    updatedAt: now,
  };
}
