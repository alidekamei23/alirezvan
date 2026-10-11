// Alert — an inline message about the page or a form: info, success, warning or danger.
// Usage: <Alert tone="danger" title="کد اشتباه است" live>دوباره تلاش کنید.</Alert>
// Set `live` only when the alert appears after an action, so screen readers announce it.
// For the calculator disclaimer use EstimateNotice.
import type { ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  info: { box: "border-info-line bg-info-surface text-info-ink", Icon: Info },
  success: {
    box: "border-success-line bg-success-surface text-success-ink",
    Icon: CircleCheck,
  },
  warning: {
    box: "border-warning-line bg-warning-surface text-warning-ink",
    Icon: TriangleAlert,
  },
  danger: {
    box: "border-danger-line bg-danger-surface text-danger-ink",
    Icon: CircleAlert,
  },
  estimate: {
    box: "border-estimate-line bg-estimate-surface text-estimate-ink",
    Icon: Info,
  },
} satisfies Record<string, { box: string; Icon: LucideIcon }>;

export type AlertTone = keyof typeof tones;

export function Alert({
  tone = "info",
  title,
  live = false,
  className,
  children,
}: {
  tone?: AlertTone;
  title?: string;
  live?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const { box, Icon } = tones[tone];
  return (
    <div
      role={live ? (tone === "danger" ? "alert" : "status") : undefined}
      className={cn("flex gap-3 rounded-sm border p-4", box, className)}
    >
      <Icon aria-hidden="true" className="mt-1 size-5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
}
