// The site must not name other legal-calculator services anywhere: not in page copy, not
// in text the calculators show, not in code comments. The owner's decision, 19 Oct 2026.
// Supplied engine files are copied in from outside, so this guards against a new copy
// bringing a name back.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const BANNED = ["دادحساب", "dadhesab"];
const ROOTS = ["app", "components", "content", "lib", "docs", "public"];
const TEXT = /\.(tsx?|mdx?|json|css|txt|svg)$/i;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return TEXT.test(name) ? [full] : [];
  });
}

describe("third-party names", () => {
  it("appear nowhere in the site's source", () => {
    const hits = ROOTS.flatMap(files).filter((file) => {
      const text = readFileSync(file, "utf8").toLowerCase();
      return BANNED.some((name) => text.includes(name));
    });
    expect(hits).toEqual([]);
  });
});
