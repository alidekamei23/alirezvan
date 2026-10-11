// PracticeIndex — the practice areas as a ruled index: one full-width row per area under
// a single emerald rule. Use it where the areas are the main content (Home). For a
// compact grid of areas inside other content use PracticeCard.
// Usage: <PracticeIndex areas={practiceAreas} />
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { PracticeArea } from "@/content/practice-areas";

export function PracticeIndex({ areas }: { areas: PracticeArea[] }) {
  return (
    <ul className="border-t-2 border-primary">
      {areas.map((area) => (
        <li key={area.slug} className="border-b border-line">
          <Link
            href={area.href}
            className="group grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-6 py-4 transition-colors -outline-offset-2 hover:bg-primary-soft active:bg-primary-soft-strong md:grid-cols-[16rem_1fr_auto] md:px-4 md:py-5"
          >
            <span className="text-xl font-bold text-ink group-hover:text-primary">
              {area.title}
            </span>
            <span className="col-start-1 text-sm text-muted md:col-start-2 md:text-base">
              {area.summary}
            </span>
            {/* Points left: "forward" in RTL. */}
            <ChevronLeft
              aria-hidden="true"
              className="col-start-2 row-span-2 row-start-1 size-5 text-primary md:col-start-3 md:row-span-1"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
