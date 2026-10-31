"use client";
// CopyButton — copies a calculator result as plain text and confirms with a toast.
// `text` must already include the estimate disclaimer.
// Usage: <CopyButton text={summary} /> (`label` defaults to «کپی نتیجه»)
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";

export function CopyButton({ text, label = "کپی نتیجه" }: { text: string; label?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("نتیجه کپی شد.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("کپی انجام نشد. متن را دستی انتخاب و کپی کنید.");
    }
  };

  return (
    <Button variant="secondary" icon={copied ? <Check /> : <Copy />} onClick={copy}>
      {copied ? "کپی شد" : label}
    </Button>
  );
}
