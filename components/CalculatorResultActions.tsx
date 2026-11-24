"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/buttonStyles";
import { CopyButton } from "@/components/CopyButton";
import { handOffCalculatorResult } from "@/lib/consultation/prefill";

export function CalculatorResultActions({ text, label }: { text: string; label?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/request" className={buttonClasses()} onNavigate={() => handOffCalculatorResult(text)}>
        <Send aria-hidden="true" className="size-5" />
        ارسال نتیجه برای وکیل
      </Link>
      <CopyButton text={text} label={label} />
    </div>
  );
}
