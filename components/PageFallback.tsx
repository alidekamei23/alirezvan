// PageFallback — the loading state of a page whose content depends on the URL (blog
// posts and paginated lists). Shown only while such a page streams in; pages built
// ahead of time never show it. Usage: <Suspense fallback={<PageFallback />}>…</Suspense>
import { Container } from "@/components/Container";
import { Skeleton } from "@/components/Skeleton";

export function PageFallback() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        در حال بارگذاری
      </span>
      <div className="border-b border-line bg-surface pt-6 pb-10">
        <Container>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-10 w-2/3 max-w-reading" />
          <Skeleton className="mt-4 h-6 w-full max-w-reading" />
        </Container>
      </div>
      <Container className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-[16/10] w-full" />
        <Skeleton className="hidden aspect-[16/10] w-full sm:block" />
        <Skeleton className="hidden aspect-[16/10] w-full lg:block" />
      </Container>
    </div>
  );
}
