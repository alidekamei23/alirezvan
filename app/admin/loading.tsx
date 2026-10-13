import { Container } from "@/components/Container";
import { Skeleton } from "@/components/Skeleton";

// Shown while an admin page checks the session and reads the database.
export default function AdminLoading() {
  return (
    <Container className="py-8">
      <p className="sr-only" role="status">
        در حال بارگذاری…
      </p>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-6 h-12 w-full" />
      <Skeleton className="mt-3 h-64 w-full" />
    </Container>
  );
}
