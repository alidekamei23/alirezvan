import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { SkipLink } from "@/components/SkipLink";
import { PendingQuestionsBadge } from "@/components/admin/PendingQuestions";
import { lawyer } from "@/content/lawyer";

// The frame of the admin pages behind the login. It shows nothing private itself; each
// page under it checks the session before rendering.
export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SkipLink />
      <header className="border-b border-line bg-surface">
        <Container className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
          <p className="font-black text-ink">
            مدیریت وب‌سایت <span className="font-normal text-muted">{lawyer.name}</span>
          </p>
          <nav aria-label="بخش‌های مدیریت" className="flex flex-1 flex-wrap items-center gap-x-2">
            <Link
              href="/admin"
              className="flex min-h-11 items-center rounded-sm px-3 font-semibold text-primary hover:bg-primary-soft"
            >
              مقاله‌ها
            </Link>
            <Link
              href="/admin/questions"
              className="flex min-h-11 items-center gap-2 rounded-sm px-3 font-semibold text-primary hover:bg-primary-soft"
            >
              پرسش و پاسخ
              <Suspense fallback={null}>
                <PendingQuestionsBadge />
              </Suspense>
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="flex min-h-11 items-center gap-1.5 rounded-sm px-3 text-ink hover:bg-surface-muted"
            >
              مشاهده وب‌سایت
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </nav>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" icon={<LogOut />}>
              خروج
            </Button>
          </form>
        </Container>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
    </>
  );
}
