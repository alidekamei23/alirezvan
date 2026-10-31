// ToolLinks — a short list of calculator links for a sidebar that is not sticky (a Q&A
// question). Renders nothing for an empty list; the list has no fixed height, so keep it
// out of sticky boxes. Usage: <ToolLinks tools={toolsForQuestionCategory("ers")} />
import Link from "next/link";
import type { Tool } from "@/content/tools";

export function ToolLinks({ tools, title = "ابزارهای محاسبه مرتبط" }: { tools: Tool[]; title?: string }) {
  if (tools.length === 0) return null;
  return (
    <section aria-labelledby="tool-links">
      <h2 id="tool-links" className="mb-3 text-xl font-bold text-ink">
        {title}
      </h2>
      <ul className="flex flex-col">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={tool.href}
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {tool.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
