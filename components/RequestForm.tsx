"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
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
import { takeCalculatorResult } from "@/lib/consultation/prefill";
import {
  DESCRIPTION_LIMIT, NAME_LIMIT, OTHER_TOPIC_LIMIT, messengers, topics, type ConsultationDraft,
} from "@/lib/consultation/schema";
import { formatNumber, toPersianDigits } from "@/lib/format";

const emptyDraft: ConsultationDraft = {
  name: "", mobile: "", messenger: "", topic: "", otherTopic: "", description: "", source: "page",
};

type Errors = Partial<Record<keyof ConsultationDraft, string[]>>;
type Stage = "details" | "verify" | "saved";

export function RequestForm() {
  const [stage, setStage] = useState<Stage>("details");
  const [draft, setDraft] = useState(emptyDraft);
  const [topic, setTopic] = useState("");
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
  const focusError = useRef(false);
  const previousStage = useRef<Stage>("details");
  const previousChallenge = useRef("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const description = takeCalculatorResult();
      if (description) {
        setDraft((current) => ({
          ...current, source: "calculator", description: description.slice(0, DESCRIPTION_LIMIT),
        }));
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
    if (firstInvalid) firstInvalid.focus();
    else if (changed && focusAfterEdit.current) {
      panel.current?.querySelector<HTMLElement>("#consultation-mobile")?.focus();
      focusAfterEdit.current = false;
    } else if (changed) heading.current?.focus();
    else if (newCode) panel.current?.querySelector<HTMLElement>('input[autocomplete="one-time-code"]')?.focus();
  }, [stage, challengeId, errors, codeError, pending]);

  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const waitLabel = wait >= 60 ? `${formatNumber(Math.ceil(wait / 60))} دقیقه` : `${formatNumber(wait)} ثانیه`;

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
    const form = new FormData(event.currentTarget);
    const next = {
      name: String(form.get("name") ?? ""),
      mobile: String(form.get("mobile") ?? ""),
      messenger: String(form.get("messenger") ?? ""),
      topic,
      otherTopic: topic === "other" ? String(form.get("otherTopic") ?? "") : "",
      description: String(form.get("description") ?? ""),
      source: draft.source,
    };
    setDraft(next);
    send(next);
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
    <div ref={panel} className="min-w-0 rounded-md border border-line bg-surface p-4 sm:p-6">
      <h2 ref={heading} tabIndex={-1} className="scroll-mt-24 text-xl font-bold text-ink">
        {stage === "details" ? "اطلاعات درخواست" : stage === "verify" ? "تأیید شماره موبایل" : "ثبت درخواست"}
      </h2>

      {stage === "details" && (
        <form method="post" noValidate onSubmit={sendDetails} className="mt-5 flex flex-col gap-5">
          <fieldset disabled={pending} className="grid min-w-0 gap-5">
            <TextField label="نام" name="name" autoComplete="given-name" maxLength={NAME_LIMIT}
              defaultValue={draft.name} error={errors.name?.[0]} />
            <PhoneField label="شماره موبایل" id="consultation-mobile" name="mobile"
              defaultValue={draft.mobile} error={errors.mobile?.[0]}
              hint="کد تأیید به این شماره پیامک می‌شود." />
            <Select label="پیام‌رسان ترجیحی برای هماهنگی" name="messenger" optional
              options={[...messengers]} placeholder="بدون ترجیح" defaultValue={draft.messenger}
              error={errors.messenger?.[0]}
              hint="اگر ترجیح می‌دهید دفتر برای هماهنگی پیام بدهد، پیام‌رسانی را انتخاب کنید که با همین شماره در آن در دسترس هستید." />
            <RadioCards legend="موضوع مشاوره" name="topic" columns={1} options={[...topics]}
              defaultValue={topic} error={errors.topic?.[0]}
              onValueChange={(value) => {
                setTopic(value);
                setErrors((current) => ({ ...current, topic: undefined, otherTopic: undefined }));
                if (value !== "other") setDraft((current) => ({ ...current, otherTopic: "" }));
              }} />
            {topic === "other" && (
              <TextField label="موضوع شما در یک جمله" name="otherTopic" maxLength={OTHER_TOPIC_LIMIT}
                defaultValue={draft.otherTopic} error={errors.otherTopic?.[0]}
                hint="مثلاً برای بررسی قرارداد پیش از امضا مشاوره می‌خواهم." />
            )}
            <Textarea key={draft.source} label="شرح موضوع مشاوره" name="description" rows={7}
              maxLength={DESCRIPTION_LIMIT} defaultValue={draft.description} error={errors.description?.[0]}
              hint="بنویسید چه اتفاقی افتاده، تاکنون چه اقدامی کرده‌اید و دربارهٔ چه چیزی راهنمایی می‌خواهید. اگر تاریخ یا جزئیاتی در فهم موضوع مؤثر است، آن را هم ذکر کنید." />
          </fieldset>
          {notice && <Alert live tone="danger">{notice}</Alert>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button type="submit" loading={pending}>{pending ? "در حال ارسال کد" : "ارسال کد تأیید"}</Button>
            <Link href="/privacy" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">
              حریم خصوصی
            </Link>
          </div>
          {wait > 0 && notice && <p className="text-sm text-muted">زمان انتظار برای ارسال دوباره {waitLabel} است.</p>}
        </form>
      )}

      {stage === "verify" && (
        <form method="post" noValidate onSubmit={verify} className="mt-3 flex flex-col gap-5">
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
          <Button type="submit" className="self-start" disabled={pending}
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
