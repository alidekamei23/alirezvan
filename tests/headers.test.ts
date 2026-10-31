// Security headers from next.config.js: present on every path, and loose enough not to
// break what the site uses (inline Next.js scripts, clipboard, Web Share).
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const config = require("../next.config.js") as {
  poweredByHeader?: boolean;
  headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>;
};

async function headers() {
  const rules = await config.headers();
  const all = rules.find((rule) => rule.source === "/:path*");
  return Object.fromEntries((all?.headers ?? []).map((header) => [header.key, header.value]));
}

describe("security headers", () => {
  it("applies to every path and hides the framework name", async () => {
    expect(Object.keys(await headers())).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Strict-Transport-Security",
        "Permissions-Policy",
      ]),
    );
    expect(config.poweredByHeader).toBe(false);
  });

  it("forbids framing the site", async () => {
    const set = await headers();
    expect(set["X-Frame-Options"]).toBe("DENY");
    expect(set["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("leaves scripts and styles alone, so inline Next.js scripts keep working", async () => {
    const csp = (await headers())["Content-Security-Policy"];
    for (const directive of ["default-src", "script-src", "style-src", "connect-src", "img-src"]) {
      expect(csp).not.toContain(directive);
    }
  });

  it("keeps clipboard and Web Share available", async () => {
    const policy = (await headers())["Permissions-Policy"];
    expect(policy).not.toContain("clipboard");
    expect(policy).not.toContain("web-share");
    expect(policy).toContain("camera=()");
  });
});
