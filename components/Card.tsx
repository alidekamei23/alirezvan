// Card — a bordered white surface that groups related content. Cards are flat (border,
// no shadow); only cards that are links lift slightly on hover.
// Usage: <Card>…</Card>, or <Card href="/guides/…">…</Card> to make the whole card a link.
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const paddings = { none: "", md: "p-5", lg: "p-6 md:p-8" } as const;

export function Card({
  href,
  padding = "md",
  className,
  children,
}: {
  href?: string;
  padding?: keyof typeof paddings;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(
    "block rounded-md border border-line bg-surface",
    paddings[padding],
    className,
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          classes,
          "group transition-[border-color,box-shadow] hover:border-primary hover:shadow-sm active:bg-primary-soft",
        )}
      >
        {children}
      </Link>
    );
  }
  return <div className={classes}>{children}</div>;
}
