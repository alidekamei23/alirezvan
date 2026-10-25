// PracticeTiles — the practice areas as a two-column grid of short tiles (icon and title),
// for phones, where the four areas should fit in one glance under the hero. From `md`
// Home shows PracticeIndex instead.
// Usage: <PracticeTiles areas={practiceAreas} />
import Link from "next/link";
import { HandCoins, House, ReceiptText, Signature, type LucideIcon } from "lucide-react";
import type { PracticeArea, PracticeAreaSlug } from "@/content/practice-areas";

// Typed over every slug, so a new practice area cannot ship without an icon.
const icons: Record<PracticeAreaSlug, LucideIcon> = {
  "check-safte": ReceiptText,
  "melki-ejare": House,
  motalebe: HandCoins,
  gharardad: Signature,
};

export function PracticeTiles({ areas }: { areas: PracticeArea[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {areas.map((area) => {
        const Icon = icons[area.slug];
        return (
          <li key={area.slug}>
            <Link
              href={area.href}
              className="flex h-full min-h-16 items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 font-semibold text-ink transition-colors hover:border-primary hover:text-primary active:bg-primary-soft"
            >
              <Icon aria-hidden="true" className="size-6 shrink-0 text-primary" />
              {area.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
