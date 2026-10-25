// ScrollCue — a quiet "more below" link to the next section of the same page, with a
// downward chevron. The label names what is really there. No animation.
// Usage: <ScrollCue href="#tools" label="ابزارهای محاسبه و بیشتر" />
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function ScrollCue({
  href,
  label,
  className,
}: {
  href: `#${string}`;
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "mx-auto flex min-h-11 w-fit flex-col items-center justify-center rounded-sm px-4 py-1 text-sm text-muted transition-colors hover:text-primary",
        className,
      )}
    >
      <ChevronDown aria-hidden="true" className="size-5" />
      {label}
    </a>
  );
}
