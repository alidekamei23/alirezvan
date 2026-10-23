import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { lawyer } from "@/content/lawyer";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/seo";
import "./globals.css";

// The Persian build of Vazirmatn (no Latin glyphs, 48KB) is the font every page loads.
const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-NL-Variable.woff2",
  variable: "--font-vazirmatn",
  weight: "100 900",
  display: "swap",
});

// The full build (111KB) covers what the Persian one lacks: Latin letters and digits,
// and % " …. Its unicode-range means the browser downloads it only on pages that
// actually show one of those characters, so it is not preloaded.
const vazirmatnLatin = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  variable: "--font-vazirmatn-latin",
  weight: "100 900",
  display: "swap",
  preload: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0022, U+0025, U+0030-0039, U+0041-005A, U+0061-007A, U+2026",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${lawyer.name} | ${lawyer.grade}`,
    template: `%s | ${lawyer.name}`,
  },
  description:
    "وب‌سایت علی رضوان، عضو کانون وکلای دادگستری مرکز، در تهران؛ چک و سفته، ملکی و اجاره، مطالبه و طلب، قرارداد.",
  // Test and preview deployments tell search engines to stay away (see app/robots.ts).
  ...(!ALLOW_INDEXING && { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  // Lets the page use the whole screen on notched phones; the gutters and the sticky
  // bar then add the safe-area insets themselves (see app/globals.css).
  viewportFit: "cover",
  // emerald-700, the primary token in app/globals.css
  themeColor: "#047857",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${vazirmatnLatin.variable} h-full antialiased`}
    >
      {/* Public pages add their frame in app/(site)/layout.tsx, the admin panel in app/admin. */}
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
