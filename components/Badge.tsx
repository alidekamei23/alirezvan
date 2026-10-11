// Badge — a small non-interactive status or category label.
// Usage: <Badge tone="primary">چک و سفته</Badge>. Never use it for promotions.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "border-line bg-surface-muted text-ink",
  primary: "border-primary-line bg-primary-soft text-primary-active",
  success: "border-success-line bg-success-surface text-success-ink",
  warning: "border-warning-line bg-warning-surface text-warning-ink",
  danger: "border-danger-line bg-danger-surface text-danger-ink",
  info: "border-info-line bg-info-surface text-info-ink",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-sm font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
