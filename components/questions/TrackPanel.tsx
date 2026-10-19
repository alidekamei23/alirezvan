"use client";
// TrackPanel — follow a question with its tracking code, plus «سؤال‌های من»: every code
// saved in this browser, looked up together. Shows only the public status (waiting,
// published with a link, or not published), never an internal reason.
// Usage: <TrackPanel />
import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, Clock, Search, X, XCircle } from "lucide-react";
import { trackQuestionsAction, type TrackedQuestion } from "@/app/(site)/porsesh/actions";
import { Alert } from "@/components/Alert";
import { Badge, type BadgeTone } from "@/components/Badge";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { requestNav } from "@/content/navigation";
import { trackCopy } from "@/content/questions";
import { formatTrackingCode, normalizeTrackingCode, type PublicTrackingStatus } from "@/lib/questions/core";
import { questionHref } from "@/lib/questions/view";
import { forgetCode, loadCodes, saveCode } from "./savedCodes";

const TONES: Record<PublicTrackingStatus, BadgeTone> = {
  waiting: "info",
  published: "success",
  closed: "neutral",
};
const ICONS = { waiting: Clock, published: CircleCheck, closed: XCircle };

export function TrackPanel() {
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackedQuestion | null>(null);
  const [mine, setMine] = useState<TrackedQuestion[] | null>(null);
  const [pending, startTransition] = useTransition();

  // «سؤال‌های من»: look up every code saved in this browser once, on load.
  useEffect(() => {
    const codes = loadCodes();
    if (codes.length === 0) return;
    void trackQuestionsAction(codes).then((state) => {
      if (state?.ok) setMine(state.results);
    });
  }, []);

  function lookUp() {
    setError("");
    setResult(null);
    const normalized = normalizeTrackingCode(code);
    if (!normalized) {
      setError("کد پیگیری درست نیست. کد ۱۰ نویسه‌ای را همان‌طور که دریافت کرده‌اید وارد کنید.");
      return;
    }
    startTransition(async () => {
      const state = await trackQuestionsAction([normalized]);
      if (!state?.ok) {
        setError(state?.message ?? "پیگیری انجام نشد.");
        return;
      }
      const found = state.results[0];
      setResult(found);
      if (found?.found) {
        saveCode(found.code);
        setMine((current) =>
          current ? [found, ...current.filter((item) => item.code !== found.code)] : [found],
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <form
        role="search"
        aria-label={trackCopy.heading}
        onSubmit={(event) => {
          event.preventDefault();
          lookUp();
        }}
        className="flex max-w-form flex-col gap-4"
      >
        <div className="min-w-0">
          <TextField
            label={trackCopy.codeLabel}
            name="code"
            hint={trackCopy.codeHint}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            maxLength={20}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={error || undefined}
            className="text-start tracking-wider uppercase"
          />
        </div>
        <div>
          <Button type="submit" icon={<Search />} loading={pending}>
            {trackCopy.submit}
          </Button>
        </div>
      </form>

      <div aria-live="polite">
        {result && !result.found && <Alert tone="warning">{trackCopy.notFound}</Alert>}
        {result?.found && <TrackedCard item={result} />}
      </div>

      {mine && mine.some((item) => item.found) && (
        <section aria-labelledby={`${id}-mine`}>
          <h2 id={`${id}-mine`} className="text-xl font-bold text-ink">
            {trackCopy.mine}
          </h2>
          <p className="mt-1 text-sm text-muted">{trackCopy.mineHint}</p>
          <ul className="mt-4 flex flex-col gap-3">
            {mine
              .filter((item) => item.found)
              .map((item) => (
                <li key={item.code}>
                  <TrackedCard
                    item={item}
                    onForget={() => {
                      forgetCode(item.code);
                      setMine((current) => current?.filter((other) => other.code !== item.code) ?? null);
                    }}
                  />
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TrackedCard({ item, onForget }: { item: TrackedQuestion; onForget?: () => void }) {
  const status = item.status ?? "waiting";
  const Icon = ICONS[status];
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 font-bold text-ink">{item.title}</p>
        <Badge tone={TONES[status]}>
          <Icon aria-hidden="true" className="size-4" />
          {trackCopy.status[status]}
        </Badge>
      </div>
      <p className="text-sm text-muted">{trackCopy.statusText[status]}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span dir="ltr" className="text-sm tracking-wider text-muted tabular-nums">
          {formatTrackingCode(item.code)}
        </span>
        <span className="flex flex-wrap gap-2">
          {status === "published" && item.slug && (
            <Link
              href={questionHref(item.slug)}
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {trackCopy.view}
            </Link>
          )}
          {status === "closed" && (
            <Link
              href={requestNav.href}
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {requestNav.label}
            </Link>
          )}
          {onForget && (
            <Button variant="ghost" size="sm" icon={<X />} onClick={onForget}>
              {trackCopy.forget}
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}
