// PendingQuestions — how many questions wait for review, for the admin menu badge and the
// card on the articles page. Shows nothing without a valid session, so the layout can use
// it before the page itself has checked the session.
// Usage: <Suspense fallback={null}><PendingQuestionsBadge /></Suspense>
import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { Badge } from "@/components/Badge";
import { getAdminSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { toPersianDigits } from "@/lib/format";
import { countByStatus } from "@/lib/questions/repository";

async function pendingCount(): Promise<number | null> {
  if (!(await getAdminSession())) return null;
  return (await countByStatus(getDb())).pending;
}

export async function PendingQuestionsBadge() {
  const count = await pendingCount();
  if (!count) return null;
  return (
    <Badge tone="warning">
      <span className="sr-only">در انتظار: </span>
      {toPersianDigits(count)}
    </Badge>
  );
}

export async function PendingQuestionsCard() {
  const count = await pendingCount();
  if (!count) return null;
  return (
    <Link
      href="/admin/questions"
      className="mt-6 flex min-h-14 items-center gap-3 rounded-md border border-warning-line bg-warning-surface p-4 font-semibold text-warning-ink transition-colors hover:border-warning-ink"
    >
      <MessageCircleQuestion aria-hidden="true" className="size-5 shrink-0" />
      {toPersianDigits(count)} پرسش تازه در انتظار بررسی است.
      <span className="ms-auto underline underline-offset-4">بررسی پرسش‌ها</span>
    </Link>
  );
}
