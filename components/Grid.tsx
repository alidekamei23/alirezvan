// Grid — responsive equal columns; always one column at 360px.
// Usage: <Grid cols={4}>…</Grid> gives 1 → 2 → 4 columns.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const columns = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

export function Grid({
  cols = 3,
  className,
  children,
}: {
  cols?: keyof typeof columns;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:gap-6", columns[cols], className)}>
      {children}
    </div>
  );
}
