// Divider — a quiet horizontal rule between groups of content. Usage: <Divider />.
import { cn } from "@/lib/cn";

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}
