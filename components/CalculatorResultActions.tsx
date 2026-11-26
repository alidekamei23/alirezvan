"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { handOffCalculatorResult } from "@/lib/consultation/prefill";
import type { CalculatorResult } from "@/lib/consultation/schema";

export function CalculatorResultActions({ text, label, result }: {
  text: string;
  label?: string;
  result: CalculatorResult;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      <Button icon={<Send />} loading={pending} onClick={() => {
        const id = handOffCalculatorResult(result);
        startTransition(() => router.push(`/request?result=${id}`));
      }}>
        مشاوره درباره این نتیجه
      </Button>
      <CopyButton text={text} label={label} />
    </div>
  );
}
