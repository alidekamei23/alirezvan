"use client";
// ViewCounter — tells the server once per browser tab session that a question was read
// (POST /api/porsesh/view). Renders nothing. Reloads and repeat visits in the same tab
// session do not count again; the server ignores bots.
// Usage: <ViewCounter slug={question.slug} />
import { useEffect } from "react";

export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `porsesh-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: count anyway, the server limits repeats.
    }
    void fetch("/api/porsesh/view", { method: "POST", body: slug, keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
