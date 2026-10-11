// Stack — vertical rhythm between siblings. Usage: <Stack gap="md">…</Stack>.
// Use it instead of ad-hoc margins on children.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const gaps = {
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
} as const;

export function Stack({
  gap = "md",
  className,
  children,
}: {
  gap?: keyof typeof gaps;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("flex flex-col", gaps[gap], className)}>{children}</div>;
}
