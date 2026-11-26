"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { sendConsultationCode, submitConsultation } from "@/app/(site)/request/actions";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Ltr } from "@/components/Ltr";
import { OtpInput } from "@/components/OtpInput";
import { PhoneField } from "@/components/PhoneField";
import { RadioCards } from "@/components/RadioCards";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { TextField } from "@/components/TextField";
import {
  forgetConsultationDraft, getConsultationDraft, rememberConsultationDraft, takeCalculatorResult,
} from "@/lib/consultation/prefill";
import {
  DESCRIPTION_LIMIT, NAME_LIMIT, OTHER_TOPIC_LIMIT, messengers, topics,
  type CalculatorResult, type ConsultationDraft,
} from "@/lib/consultation/schema";
import { formatNumber, toPersianDigits } from "@/lib/format";

const emptyDraft: ConsultationDraft = {
  name: "", mobile: "", messenger: "", topic: "", otherTopic: "", description: "", source: "page",
};

type Errors = Partial<Record<keyof ConsultationDraft, string[]>>;
type Stage = "details" | "verify" | "saved";

const panelClass = "min-w-0 rounded-lg border border-line bg-surface p-4 shadow-sm sm:px-6";

function withResult(draft: ConsultationDraft, calculatorResult: CalculatorResult | undefined): ConsultationDraft {
  return { ...draft, calculatorResult, source: calculatorResult ? "calculator" : "page" };
}

function CalculatorResultPreview({ result, onRemove, error }: {
  result: CalculatorResult;
  onRemove?: () => void;
  error?: string;
}) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="grid gap-1 rounded-md border border-line bg-surface-muted px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <h2 id={titleId} className="font-bold text-ink">{result.title}</h2>
        {onRemove && <Button variant="ghost" size="sm" onClick={onRemove}>حذف نتیجه</Button>}
      </div>
      <ul className="grid gap-1 text-sm font-semibold text-ink">
        {result.lines.map((line, index) => <li key={index} className="wrap-break-word">{line}</li>)}
      </ul>
      {onRemove && <p className="text-sm text-muted">این نتیجه همراه درخواست شما ثبت می‌شود.</p>}
      {error && <p role="alert" className="text-sm text-danger-ink">{error}</p>}
    </section>
  );
}

export function RequestForm({ enabled, resultId }: { enabled: boolean; resultId?: string }) {
  const { bfcacheId } = useRouter();
  // A fresh visit must start its own form, even when Next restores the route's DOM.
  const entryId = JSON.stringify([bfcacheId, resultId]);
  return <RequestVisit key={entryId} entryId={entryId} enabled={enabled} resultId={resultId} />;
}

type Visit = {
  initial: ConsultationDraft;
  previous?: NonNullable<ReturnType<typeof getConsultationDraft>>;
  incoming?: CalculatorResult;
  revision: number;
};

function RequestVisit({ entryId, enabled, resultId }: { entryId: string; enabled: boolean; resultId?: string }) {
  const [visit, setVisit] = useState<Visit>();
  const ownedDraftWhenHidden = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const incoming = takeCalculatorResult(resultId);
      const saved = getConsultationDraft();
      const owned = saved?.entryId === entryId;
      const lostDraft = ownedDraftWhenHidden.current && !owned;
      setVisit((current) => {
        if (current && !incoming && !lostDraft && (!current.previous || current.previous.entryId === saved?.entryId)) {
          return current;
        }
        const result = incoming ?? current?.incoming;
        const previous = owned ? undefined : saved;
        return {
          initial: owned && !result ? saved.draft : withResult(emptyDraft, previous ? undefined : result),
          previous,
          incoming: previous ? result : undefined,
          revision: (current?.revision ?? -1) + 1,
        };
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      ownedDraftWhenHidden.current = getConsultationDraft()?.entryId === entryId;
    };
  }, [entryId, resultId]);

  function chooseDraft(keep: boolean) {
    if (!visit?.previous) return;
    const saved = getConsultationDraft();
    const previous = saved?.entryId === visit.previous.entryId ? saved : undefined;
    let initial = withResult(emptyDraft, visit.incoming);
    if (previous && keep) {
      initial = visit.incoming ? withResult(previous.draft, visit.incoming) : previous.draft;
      rememberConsultationDraft(entryId, initial);
    } else if (previous) {
      forgetConsultationDraft(previous.entryId);
    }
    setVisit({ initial, revision: visit.revision + 1 });
  }

  if (!visit) {
    return (
      <div className={panelClass} aria-busy="true">
        <h1 className="text-2xl font-bold text-ink">درخواست مشاوره</h1>
        <p role="status" className="sr-only">در حال آماده کردن فرم مشاوره…</p>
      </div>
    );
  }

  if (visit.incoming && visit.previous) {
    return (
      <div className={`${panelClass} grid gap-3`}>
        <h1 className="text-2xl font-bold text-ink">درخواست مشاوره</h1>
        <CalculatorResultPreview result={visit.incoming} />
        <Alert live title="یک پیش‌نویس مشاوره دارید">
          <p>
            {visit.previous.draft.calculatorResult ? "می‌توانید نتیجهٔ قبلی را عوض کنید و نوشته‌تان را نگه دارید." : "می‌توانید این نتیجه را به پیش‌نویس اضافه کنید."}
            {" با شروع درخواست تازه، پیش‌نویس قبلی پاک می‌شود."}
          </p>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => chooseDraft(true)}>استفاده از نتیجه در همین درخواست</Button>
          <Button variant="secondary" onClick={() => chooseDraft(false)}>شروع درخواست تازه</Button>
        </div>
      </div>
    );
  }

  return <RequestDetails key={visit.revision} enabled={enabled} entryId={entryId} initial={visit.initial}
    focusOnMount={visit.revision > 0} onResume={visit.previous ? () => chooseDraft(true) : undefined} />;
}

function RequestDetails({ enabled, entryId, initial, focusOnMount, onResume }: {
  enabled: boolean;
  entryId: string;
  initial: ConsultationDraft;
  focusOnMount: boolean;
  onResume?: () => void;
}) {
  const [stage, setStage] = useState<Stage>("details");
  const [draft, setDraft] = useState(initial);
  const latestDraft = useRef(initial);
  const [canResume, setCanResume] = useState(Boolean(onResume));
  const [challengeId, setChallengeId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState("");
  const [codeError, setCodeError] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const [pendingTask, setPendingTask] = useState<"send" | "verify">("send");
  const [pending, startTransition] = useTransition();
  const requestId = useRef("");
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusAfterEdit = useRef(false);
  const focusOnOpen = useRef(focusOnMount);
  const focusError = useRef(false);
  const previousStage = useRef<Stage>("details");
  const previousChallenge = useRef("");

  useEffect(() => {
    if (retryAt <= now) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(1000, retryAt - now));
    return () => window.clearTimeout(timer);
  }, [now, retryAt]);

  useEffect(() => {
    if (pending) return;
    const changed = previousStage.current !== stage;
    const newCode = previousChallenge.current !== challengeId && stage === "verify";
    previousStage.current = stage;
    previousChallenge.current = challengeId;
    const firstInvalid = focusError.current
      ? panel.current?.querySelector<HTMLElement>('fieldset[aria-invalid="true"] input, input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]')
      : undefined;
    focusError.current = false;
    if (focusOnOpen.current) {
      focusOnOpen.current = false;
      heading.current?.focus({ preventScroll: true });
    } else if (firstInvalid) firstInvalid.focus();
    else if (changed && focusAfterEdit.current) {
      panel.current?.querySelector<HTMLElement>("#consultation-mobile")?.focus();
      focusAfterEdit.current = false;
    } else if (changed) heading.current?.focus();
    else if (newCode) panel.current?.querySelector<HTMLElement>('input[autocomplete="one-time-code"]')?.focus();
  }, [stage, challengeId, errors, codeError, pending]);

  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const waitLabel = wait >= 60 ? `${formatNumber(Math.ceil(wait / 60))} دقیقه` : `${formatNumber(wait)} ثانیه`;

  function updateDraft(changes: Partial<ConsultationDraft>) {
    const next = { ...latestDraft.current, ...changes };
    latestDraft.current = next;
    setDraft(next);
    rememberConsultationDraft(entryId, next);
    if (next.description.trim()) setCanResume(false);
    return next;
  }

  function clearFeedback() {
    setErrors({});
    setNotice("");
    setCodeError("");
  }

  function send(next: ConsultationDraft) {
    if (pending) return;
    clearFeedback();
    setPendingTask("send");
    requestId.current ||= crypto.randomUUID();
    const id = requestId.current;
    startTransition(async () => {
      try {
        const result = await sendConsultationCode(id, next);
        if (result.kind === "sent" || result.kind === "limited" || result.kind === "send_failed") {
          setNow(Date.now());
          setRetryAt(result.retryAt);
        }
        switch (result.kind) {
          case "sent":
            setChallengeId(result.challengeId);
            setStage("verify");
            if (stage === "verify") setNotice("کد جدید پیامک شد.");
            break;
          case "fields":
            focusError.current = true;
            setErrors(result.errors);
            setStage("details");
            break;
          case "limited":
            setNotice("برای ارسال کد دیگری کمی صبر کنید. زمان انتظار زیر دکمه نمایش داده می‌شود.");
            break;
          case "closed":
            setNotice("این مرحله پایان یافته است. برای پیگیری با دفتر تماس بگیرید.");
            break;
          case "unavailable":
            setNotice("ارسال کد در دسترس نیست. برای هماهنگی با دفتر تماس بگیرید.");
            break;
          default:
            setNotice("ارسال کد انجام نشد. دوباره تلاش کنید.");
        }
      } catch {
        setNotice("ارتباط برقرار نشد. دوباره تلاش کنید.");
      }
    });
  }

  function sendDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled) return;
    const form = new FormData(event.currentTarget);
    const topic = String(form.get("topic") ?? "");
    send(updateDraft({
      name: String(form.get("name") ?? ""),
      mobile: String(form.get("mobile") ?? ""),
      messenger: String(form.get("messenger") ?? ""),
      topic,
      otherTopic: topic === "other" ? String(form.get("otherTopic") ?? "") : "",
      description: String(form.get("description") ?? ""),
    }));
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const code = new FormData(event.currentTarget).get("code");
    clearFeedback();
    setPendingTask("verify");
    const id = requestId.current;
    startTransition(async () => {
      try {
        const result = await submitConsultation(id, challengeId, code, draft);
        focusError.current = true;
        switch (result.kind) {
          case "saved":
            forgetConsultationDraft(entryId);
            setDraft(emptyDraft);
            setStage("saved");
            break;
          case "fields":
            setErrors(result.errors);
            setStage("details");
            break;
          case "incomplete":
            setCodeError("هر پنج رقم کد را وارد کنید.");
            break;
          case "wrong":
            setCodeError(`کد درست نیست. ${toPersianDigits(result.remaining)} تلاش دیگر دارید.`);
            break;
          case "locked":
            setCodeError("تعداد تلاش‌ها به سقف رسید. کد جدید بگیرید.");
            break;
          case "expired":
            setCodeError("این کد دیگر اعتبار ندارد. کد جدید بگیرید.");
            break;
          case "unavailable":
            setNotice("ثبت درخواست در دسترس نیست. برای هماهنگی با دفتر تماس بگیرید.");
            break;
          default:
            setNotice("ثبت درخواست انجام نشد. دوباره تلاش کنید.");
        }
      } catch {
        setNotice("ارتباط برقرار نشد. دوباره تلاش کنید.");
      }
    });
  }

  return (
    <div ref={panel} className={panelClass}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line pb-3">
        <h1 ref={heading} tabIndex={-1} className="scroll-mt-24 text-2xl font-bold text-ink">
          {stage === "details" ? "درخواست مشاوره" : stage === "verify" ? "تأیید شماره موبایل" : "درخواست ثبت شد"}
        </h1>
        {stage !== "saved" && (
          <ol aria-label="مراحل ثبت درخواست" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {["اطلاعات درخواست", "تأیید شماره"].map((label, index) => (
              <li key={label} aria-current={(stage === "details" ? 0 : 1) === index ? "step" : undefined}
                className="group flex items-center gap-1.5 rounded-sm px-2 py-1 text-muted aria-[current=step]:bg-primary-soft aria-[current=step]:text-primary">
                <span className="grid size-5 place-items-center rounded-full bg-surface-muted text-xs group-aria-[current=step]:bg-primary group-aria-[current=step]:text-white">{index === 0 ? "۱" : "۲"}</span>
                {label}
              </li>
            ))}
          </ol>
        )}
      </header>

      {stage === "details" && (
        <form method="post" noValidate onSubmit={sendDetails} className="mt-3 grid gap-3">
          {!enabled && (
            <Alert title="ثبت آنلاین فعلاً در دسترس نیست" tone="warning">
              برای هماهنگی مشاوره از <a href="#office-contact" className="font-bold underline">راه‌های تماس با دفتر</a> استفاده کنید.
            </Alert>
          )}
          {enabled && canResume && onResume && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-line px-3 py-1.5">
              <p className="text-sm text-muted">یک درخواست ناتمام دارید.</p>
              <Button variant="ghost" size="sm" onClick={onResume}>ادامهٔ پیش‌نویس</Button>
            </div>
          )}
          <fieldset disabled={pending || !enabled} className="grid min-w-0 gap-3">
            <div className="grid items-start gap-4 sm:grid-cols-2 [&_p[id$='-hint']]:order-last">
              <TextField label="نام" name="name" autoComplete="given-name" maxLength={NAME_LIMIT}
                defaultValue={draft.name} error={errors.name?.[0]}
                onChange={(event) => updateDraft({ name: event.target.value })} />
              <PhoneField label="شماره موبایل" id="consultation-mobile" name="mobile"
                defaultValue={draft.mobile} error={errors.mobile?.[0]}
                hint="کد تأیید به این شماره پیامک می‌شود."
                onValueChange={(mobile) => updateDraft({ mobile })} />
            </div>
            <Select label="پیام‌رسان ترجیحی" name="messenger" optional
              options={[...messengers]} placeholder="بدون ترجیح" defaultValue={draft.messenger}
              error={errors.messenger?.[0]}
              onChange={(event) => updateDraft({ messenger: event.target.value })} />
            <RadioCards legend="موضوع مشاوره" name="topic" compact options={[...topics]}
              defaultValue={draft.topic} error={errors.topic?.[0]}
              onValueChange={(value) => {
                updateDraft({ topic: value, otherTopic: "" });
                setErrors((current) => ({ ...current, topic: undefined, otherTopic: undefined }));
              }} />
            {draft.topic === "other" && (
              <TextField label="موضوع شما در یک جمله" name="otherTopic" maxLength={OTHER_TOPIC_LIMIT}
                defaultValue={draft.otherTopic} error={errors.otherTopic?.[0]}
                hint="مثلاً برای بررسی قرارداد پیش از امضا مشاوره می‌خواهم."
                onChange={(event) => updateDraft({ otherTopic: event.target.value })} />
            )}
            {draft.calculatorResult && (
              <CalculatorResultPreview result={draft.calculatorResult} error={errors.calculatorResult?.[0]} onRemove={() => {
                updateDraft(withResult(latestDraft.current, undefined));
                setErrors((current) => ({ ...current, calculatorResult: undefined }));
                panel.current?.querySelector<HTMLTextAreaElement>('textarea[name="description"]')?.focus();
              }} />
            )}
            <Textarea label="شرح موضوع مشاوره" name="description" rows={3}
              maxLength={DESCRIPTION_LIMIT} defaultValue={draft.description} error={errors.description?.[0]}
              hint="چه اتفاقی افتاده و می‌خواهید وکیل چه چیزی را بررسی کند؟"
              onValueChange={(description) => updateDraft({ description })} />
          </fieldset>
          {notice && <Alert live tone="danger">{notice}</Alert>}
          <div className="flex flex-col items-stretch gap-x-4 gap-y-1 sm:flex-row sm:items-center">
            <Button type="submit" disabled={!enabled} loading={pending}>{pending ? "در حال ارسال کد" : "ارسال کد تأیید"}<ArrowLeft aria-hidden="true" className="size-4" /></Button>
            <Link href="/privacy" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4">
              حریم خصوصی
            </Link>
          </div>
          {wait > 0 && notice && <p className="text-sm text-muted">زمان انتظار برای ارسال دوباره {waitLabel} است.</p>}
        </form>
      )}

      {stage === "verify" && (
        <form method="post" noValidate onSubmit={verify} className="mt-4 flex max-w-form flex-col gap-4">
          <p className="text-muted">
            کد به شمارهٔ <strong className="text-ink"><Ltr>{toPersianDigits(draft.mobile)}</Ltr></strong> پیامک شد.
          </p>
          <OtpInput key={challengeId} label="کد تأیید" name="code" disabled={pending} error={codeError}
            hint="کد ۵ رقمی را وارد کنید. کد تا ۲ دقیقه اعتبار دارد." />
          {notice && <Alert live tone={notice === "کد جدید پیامک شد." ? "info" : "danger"}>{notice}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" disabled={pending} onClick={() => {
              clearFeedback();
              setRetryAt(0);
              focusAfterEdit.current = true;
              setStage("details");
            }}>ویرایش شماره</Button>
            <Button variant="ghost" disabled={pending || wait > 0} onClick={() => send(draft)}>
              {pending && pendingTask === "send" ? "در حال ارسال کد" : "ارسال مجدد کد"}
            </Button>
          </div>
          {wait > 0 && <p className="-mt-3 text-sm text-muted">تا ارسال مجدد کد، {waitLabel} صبر کنید.</p>}
          <Button type="submit" className="sm:self-start" disabled={pending}
            loading={pending && pendingTask === "verify"}>
            {pending && pendingTask === "verify" ? "در حال ثبت درخواست" : "تأیید و ثبت درخواست"}
          </Button>
        </form>
      )}

      {stage === "saved" && (
        <div className="mt-4">
          <Alert tone="success" live>درخواست شما ثبت شد. دفتر برای هماهنگی با شما تماس می‌گیرد.</Alert>
        </div>
      )}
    </div>
  );
}
