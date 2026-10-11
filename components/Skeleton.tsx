// Skeleton — placeholder block while data loads. Give it the size of the real content
// so nothing shifts. Usage: <Skeleton className="h-6 w-40" />. Hidden from screen
// readers; put aria-busy="true" on the region that is loading.
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-surface-muted", className)}
    />
  );
}
