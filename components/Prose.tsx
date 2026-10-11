// Prose — typography for long-form Persian text (MDX guides): RTL-correct lists,
// blockquotes, tables and footnotes. Styles live in app/globals.css (.prose-fa).
// Usage: <Prose><MDXContent /></Prose>. Wrap wide tables in <Table>.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Prose({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("prose-fa", className)}>{children}</div>;
}
