"use client";
// Shown when an admin page fails. The cause stays in the server log.
import { useEffect } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container width="reading" className="py-12">
      <Alert tone="danger" title="خطایی رخ داد" live>
        این صفحه بارگذاری نشد. دوباره تلاش کنید؛ اگر ادامه داشت، گزارش سرور را ببینید.
      </Alert>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => retry()}>تلاش دوباره</Button>
        <LinkButton href="/admin" variant="secondary">
          فهرست مقاله‌ها
        </LinkButton>
      </div>
    </Container>
  );
}
