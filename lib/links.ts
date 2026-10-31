/**
 * Internal links between the four kinds of content: practice hubs, calculators, blog
 * posts and Q&A. One map decides which belong together, so a link in one direction
 * always has its way back:
 *
 * - each practice area lists its calculators (`relatedTools` in content/practice-areas.ts);
 *   a calculator page links to every hub that lists it;
 * - a Q&A category with the slug of a practice area belongs to that hub; the other
 *   categories name their calculators in content/question-categories.ts.
 */
import { practiceAreas, type PracticeArea, type PracticeAreaSlug } from "@/content/practice-areas";
import { questionCategories } from "@/content/question-categories";
import { QUESTIONS_HREF } from "@/content/questions";
import { toolList, tools, type Tool, type ToolSlug } from "@/content/tools";

/** The calculators of one practice area, most relevant first. */
export function toolsForArea(area: PracticeAreaSlug): Tool[] {
  const entry = practiceAreas.find((candidate) => candidate.slug === area);
  return (entry?.relatedTools ?? []).map((slug) => tools[slug]);
}

/** The practice hubs a calculator is used in, in site order. */
export function areasForTool(tool: ToolSlug): PracticeArea[] {
  return practiceAreas.filter((area) => area.relatedTools.includes(tool));
}

/**
 * Every other calculator, the closest first: those sharing a hub with `current`, then
 * those in the same group of the /tools page, then the rest in site order.
 */
export function relatedToolsFor(current: ToolSlug): Tool[] {
  const hubs = areasForTool(current);
  const shared = new Set(hubs.flatMap((area) => area.relatedTools));
  const rank = (tool: Tool) =>
    shared.has(tool.slug) ? 0 : tool.group === tools[current].group ? 1 : 2;
  return toolList
    .filter((tool) => tool.slug !== current)
    .map((tool, index) => ({ tool, index }))
    .sort((a, b) => rank(a.tool) - rank(b.tool) || a.index - b.index)
    .map(({ tool }) => tool);
}

/** /porsesh filtered to one category. */
export function questionCategoryHref(category: string): string {
  return `${QUESTIONS_HREF}?dasteh=${category}`;
}

/** The practice hub of a Q&A category, when the category is one of the four areas. */
export function areaForQuestionCategory(category: string): PracticeArea | null {
  return practiceAreas.find((area) => area.slug === category) ?? null;
}

/** The calculators that fit questions of one category (none for «سایر» and the like). */
export function toolsForQuestionCategory(category: string): Tool[] {
  const area = areaForQuestionCategory(category);
  if (area) return toolsForArea(area.slug);
  const entry = questionCategories.find((candidate) => candidate.slug === category);
  return entry && "tools" in entry ? entry.tools.map((slug) => tools[slug]) : [];
}
