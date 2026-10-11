// Section — a vertical band of the page with consistent block spacing and an optional
// heading. Usage: <Section title="حوزه‌های کاری" lead="…">…</Section>.
// One <h2> per section; tone="muted" gives the alternate background.
import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { cn } from "@/lib/cn";

export function Section({
  title,
  lead,
  tone = "page",
  width = "page",
  id,
  className,
  children,
}: {
  title?: string;
  lead?: string;
  tone?: "page" | "muted" | "surface";
  width?: "page" | "reading" | "form";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const headingId = id && title ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "py-12 md:py-16",
        tone === "muted" && "bg-surface-muted",
        tone === "surface" && "bg-surface",
        className,
      )}
    >
      <Container width={width}>
        {title && (
          <header className="mb-8 max-w-reading">
            <h2 id={headingId} className="text-2xl font-bold text-ink">
              {title}
            </h2>
            {lead && <p className="mt-2 text-muted">{lead}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}
