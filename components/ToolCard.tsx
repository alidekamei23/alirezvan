// ToolCard — links to one of the calculators: icon, title, one-line description.
// Usage: <ToolCard tool={tools["khesarat-takhir"]} />
import { Calculator, ChevronLeft } from "lucide-react";
import { Card } from "@/components/Card";
import type { Tool } from "@/content/tools";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Card href={tool.href} className="h-full">
      <span className="flex items-start gap-4">
        <Calculator aria-hidden="true" className="mt-1 size-6 shrink-0 text-primary" />
        <span className="flex flex-1 flex-col gap-1">
          <span className="text-lg font-bold text-ink group-hover:text-primary">
            {tool.title}
          </span>
          <span className="text-sm text-muted">{tool.summary}</span>
        </span>
        {/* Points left: "forward" in RTL. */}
        <ChevronLeft aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-primary" />
      </span>
    </Card>
  );
}
