"use client";
// Shown when a page fails while rendering. Replaces the framework's default English
// screen. The header, footer and contact bar stay in place around it.
import { useEffect } from "react";
import { Button } from "@/components/Button";
import { CallButton } from "@/components/CallButton";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";
import { errorCopy } from "@/content/pages";

export default function ErrorPage({
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
    <div className="border-b border-line bg-surface py-16 md:py-24">
      <Container>
        <div role="alert" className="max-w-reading">
          <h1 className="text-3xl font-black text-ink">{errorCopy.heading}</h1>
          <p className="mt-4 text-lg text-ink">{errorCopy.text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" onClick={() => retry()}>
              {errorCopy.retry}
            </Button>
            <LinkButton href="/" variant="secondary" size="lg">
              {errorCopy.home}
            </LinkButton>
            <CallButton variant="ghost" size="lg" />
          </div>
        </div>
      </Container>
    </div>
  );
}
