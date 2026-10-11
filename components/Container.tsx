// Container — centres content and applies the page gutters.
// Usage: <Container>…</Container>; width="reading" for long text, "form" for forms.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const widths = {
  page: "max-w-page",
  reading: "max-w-reading",
  form: "max-w-form",
} as const;

export function Container({
  width = "page",
  className,
  children,
}: {
  width?: keyof typeof widths;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", widths[width], className)}>
      {children}
    </div>
  );
}
