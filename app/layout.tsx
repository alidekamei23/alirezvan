import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SkipLink } from "@/components/SkipLink";
import { StickyContactBar } from "@/components/StickyContactBar";
import { ToastProvider } from "@/components/Toast";
import { lawyer } from "@/content/lawyer";
import "./globals.css";

const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  variable: "--font-vazirmatn",
  weight: "100 900",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${lawyer.name} | ${lawyer.grade}`,
    template: `%s | ${lawyer.name}`,
  },
  description:
    "وب‌سایت علی رضوان، وکیل پایه یک دادگستری در تهران؛ چک و سفته، ملکی و اجاره، مطالبه و طلب، قرارداد.",
};

export const viewport: Viewport = {
  // emerald-700, the primary token in app/globals.css
  themeColor: "#047857",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-(--contact-bar-height) font-sans lg:pb-0">
        <ToastProvider>
          <SkipLink />
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
          <StickyContactBar />
        </ToastProvider>
      </body>
    </html>
  );
}
