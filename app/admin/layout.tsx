import type { Metadata } from "next";

// Everything under /admin: never indexed, never followed. (This is not access control;
// that is lib/auth/admin.ts.)
export const metadata: Metadata = {
  title: { default: "مدیریت وب‌سایت", template: "%s | مدیریت وب‌سایت" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-1 flex-col bg-page">{children}</div>;
}
