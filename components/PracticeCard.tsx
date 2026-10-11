// PracticeCard — links to a practice hub. Title, one line of topics, and a chevron.
// Usage: <PracticeCard area={practiceAreas[0]} />
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/Card";
import type { PracticeArea } from "@/content/practice-areas";

export function PracticeCard({ area }: { area: PracticeArea }) {
  return (
    <Card href={area.href} className="h-full">
      <span className="flex h-full items-start justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-lg font-bold text-ink group-hover:text-primary">
            {area.title}
          </span>
          <span className="text-sm text-muted">{area.summary}</span>
        </span>
        {/* Points left: "forward" in RTL. */}
        <ChevronLeft aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-primary" />
      </span>
    </Card>
  );
}
