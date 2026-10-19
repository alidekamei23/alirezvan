// ToolIndex — calculators as a ruled index, in the manner of PracticeIndex: one
// full-width row per tool with an icon, the title, its one-line summary and an arrow.
// Use it where the tools are the main content (/tools). For a compact grid inside other
// content use ToolCard.
// Usage: <ToolIndex tools={toolList.filter((tool) => tool.group === "debt")} />
import Link from "next/link";
import {
  Briefcase,
  ChevronLeft,
  ClipboardCheck,
  Gem,
  Landmark,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Tool, ToolSlug } from "@/content/tools";

const ICONS: Record<ToolSlug, LucideIcon> = {
  "khesarat-takhir": TrendingUp,
  "hazine-dadresi": Landmark,
  mahrieh: Gem,
  "sahm-ol-ers": Users,
  "haghol-vekale": Briefcase,
  "dastmozd-karshenasi": ClipboardCheck,
};

export function ToolIndex({ tools }: { tools: Tool[] }) {
  return (
    <ul className="border-t-2 border-primary">
      {tools.map((tool) => {
        const Icon = ICONS[tool.slug];
        return (
          <li key={tool.slug} className="border-b border-line">
            <Link
              href={tool.href}
              className="group grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-x-4 py-4 transition-colors -outline-offset-2 hover:bg-primary-soft active:bg-primary-soft-strong md:grid-cols-[auto_18rem_1fr_auto] md:gap-x-6 md:px-4 md:py-5"
            >
              <span
                aria-hidden="true"
                className="row-span-2 flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary transition-colors group-hover:bg-surface md:row-span-1"
              >
                <Icon className="size-5" />
              </span>
              <span className="text-lg font-bold text-ink group-hover:text-primary">
                {tool.title}
              </span>
              <span className="col-start-2 text-sm text-muted md:col-start-3 md:text-base">
                {tool.summary}
              </span>
              {/* Points left: "forward" in RTL. */}
              <ChevronLeft
                aria-hidden="true"
                className="col-start-3 row-span-2 row-start-1 size-5 text-primary md:col-start-4 md:row-span-1"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
