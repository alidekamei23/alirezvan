// EmptyState — shown when a list or view has nothing yet. Says what is missing and, if
// possible, what to do next. Usage:
// <EmptyState title="هنوز راهنمایی منتشر نشده است" action={<LinkButton …/>} />
import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  Icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-md border border-dashed border-line-strong bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-8 text-muted" />
      <p className="mt-3 text-lg font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-reading text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
