// EstimateNotice — the fixed "estimate, not legal advice" notice required next to every
// calculator result (CLAUDE.md §2.1). The wording is not configurable on purpose.
// Usage: <EstimateNotice />. ResultCard already includes it.
import { Alert } from "@/components/Alert";
import { ESTIMATE_DISCLAIMER } from "@/content/legal";

export function EstimateNotice({ className }: { className?: string }) {
  return <Alert tone="estimate" title={ESTIMATE_DISCLAIMER} className={className} />;
}
