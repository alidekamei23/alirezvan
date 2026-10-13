// SiteShell — the frame of every public page: skip link, header, main area, footer,
// the sticky contact bar on phones and the site-wide JSON-LD. Used by the layout of the
// public pages and by the not-found page. The admin panel does not use it.
// Usage: <SiteShell>{children}</SiteShell>
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { SkipLink } from "@/components/SkipLink";
import { StickyContactBar } from "@/components/StickyContactBar";
import { ToastProvider } from "@/components/Toast";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    // The bottom padding keeps the last content clear of the sticky contact bar.
    <div className="flex flex-1 flex-col pb-[calc(var(--contact-bar-height)+env(safe-area-inset-bottom))] lg:pb-0">
      <ToastProvider>
        <SkipLink />
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <StickyContactBar />
        <SiteJsonLd />
      </ToastProvider>
    </div>
  );
}
