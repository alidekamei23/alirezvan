"use client";
// ShareActions — what a visitor can do with a calculator result: send it to the lawyer
// (the one primary action), share it, or copy it. `text` must already include the
// estimate disclaimer. Usage: <ShareActions text={summary} requestHref="/request?…" />
import { useState, useSyncExternalStore } from "react";
import { Check, Copy, MessageCircle, Send, Share2 } from "lucide-react";
import { Button } from "@/components/Button";
import { LinkButton } from "@/components/LinkButton";
import { useToast } from "@/components/Toast";

export function ShareActions({
  text,
  requestHref,
}: {
  text: string;
  /** Link to the request form with the result pre-filled. */
  requestHref: string;
}) {
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

  // Web Share exists on phones mostly; resolved on the client to avoid a hydration mismatch.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => "share" in navigator,
    () => false,
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <LinkButton href={requestHref} icon={<Send />}>
        ارسال نتیجه برای وکیل
      </LinkButton>
      <LinkButton
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        external
        variant="secondary"
        icon={<MessageCircle />}
      >
        اشتراک در واتس‌اپ
      </LinkButton>
      {canShare && (
        <Button
          variant="secondary"
          icon={<Share2 />}
          onClick={() => navigator.share({ text }).catch(() => {})}
        >
          اشتراک‌گذاری
        </Button>
      )}
      <Button variant="ghost" icon={copied ? <Check /> : <Copy />} onClick={copy}>
        {copied ? "کپی شد" : "کپی نتیجه"}
      </Button>
    </div>
  );
}
