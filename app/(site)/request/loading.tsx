import { Container } from "@/components/Container";
import { Skeleton } from "@/components/Skeleton";
import { requestCopy } from "@/content/pages";

export default function RequestLoading() {
  return (
    <Container className="py-3 sm:py-4">
      <div className="mx-auto grid max-w-[64rem] gap-3 rounded-lg border border-line bg-surface p-4 sm:px-6">
        <h1 className="border-b border-line pb-3 text-2xl font-bold">{requestCopy.heading}</h1>
        <p role="status" className="sr-only">در حال بارگذاری فرم مشاوره…</p>
        <div aria-busy="true" className="grid gap-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-20" />
          <Skeleton className="h-28" />
          <Skeleton className="h-32" />
          <Skeleton className="h-12 w-36" />
        </div>
      </div>
    </Container>
  );
}
