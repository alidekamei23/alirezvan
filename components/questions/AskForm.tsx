"use client";
// AskForm — a visitor's question: display name (optional), category, title, body with a
// counter, and the publication consent. The same Zod schema checks it here (instant
// messages) and on the server (the real check). A hidden honeypot field and a signed
// timestamp keep simple bots out. After sending, the tracking code is shown large with a
// copy button and saved in this browser for «سؤال‌های من».
// Usage: <AskForm token={signedToken} />
import { useActionState, useEffect, useId, useState } from "react";
import { Check, Copy, Send, ShieldAlert } from "lucide-react";
import { askQuestionAction, type AskState } from "@/app/(site)/porsesh/actions";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { FieldError, FieldHint, FieldLabel, controlClasses } from "@/components/Field";
import { LinkButton } from "@/components/LinkButton";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { questionCategories } from "@/content/question-categories";
import { TRACK_HREF, askCopy } from "@/content/questions";
import { toPersianDigits } from "@/lib/format";
import { formatTrackingCode } from "@/lib/questions/core";
import { QUESTION_LIMITS, askSchema, fieldErrors } from "@/lib/questions/schema";
import { saveCode } from "./savedCodes";

const CATEGORY_OPTIONS = questionCategories.map((category) => ({
  value: category.slug,
  label: category.title,
}));

type Values = { displayName: string; category: string; title: string; body: string };
const EMPTY: Values = { displayName: "", category: "", title: "", body: "" };

export function AskForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<AskState, FormData>(askQuestionAction, null);
  // Server results for the same form stay until the next send.
  const [values, setValues] = useState<Values>(EMPTY);
  const [accepted, setAccepted] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string> | null>(null);
  const [shownState, setShownState] = useState<AskState>(null);

  // A new server answer replaces what was typed by what the server saw, and clears the
  // local check.
  if (state !== shownState) {
    setShownState(state);
    if (state && !state.ok) {
      setValues(state.values);
      setClientErrors(null);
    }
  }

  const errors = clientErrors ?? (state && !state.ok ? state.fieldErrors : {});
  const set = (key: keyof Values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  if (state?.ok) return <Sent code={state.trackingCode} />;

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(event) => {
        const parsed = askSchema.safeParse({ ...values, accepted });
        if (!parsed.success) {
          event.preventDefault();
          setClientErrors(fieldErrors(parsed.error));
        }
      }}
      className="flex flex-col gap-6"
    >
      <Alert tone="warning" title="اطلاعات شخصی ننویسید">
        {askCopy.privacyWarning}
      </Alert>

      {state && !state.ok && state.message && (
        <Alert tone="danger" live>
          {state.message}
        </Alert>
      )}

      <input type="hidden" name="token" value={token} />
      {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          وب‌سایت
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label={askCopy.displayNameLabel}
          name="displayName"
          optional
          maxLength={QUESTION_LIMITS.displayName}
          placeholder={askCopy.displayNamePlaceholder}
          hint={askCopy.displayNameHint}
          autoComplete="off"
          value={values.displayName}
          onChange={(event) => set("displayName", event.target.value)}
          error={errors.displayName}
        />
        <Select
          label="دسته‌بندی"
          name="category"
          options={CATEGORY_OPTIONS}
          value={values.category}
          onChange={(event) => set("category", event.target.value)}
          error={errors.category}
        />
      </div>

      <TextField
        label={askCopy.titleLabel}
        name="title"
        hint={askCopy.titleHint}
        maxLength={QUESTION_LIMITS.titleMax}
        autoComplete="off"
        value={values.title}
        onChange={(event) => set("title", event.target.value)}
        error={errors.title}
      />

      <BodyField value={values.body} onChange={(value) => set("body", value)} error={errors.body} />

      <div className="flex flex-col gap-1.5">
        <Checkbox
          name="accepted"
          label={askCopy.consent}
          checked={accepted}
          onCheckedChange={setAccepted}
          aria-invalid={errors.accepted ? true : undefined}
        />
        {errors.accepted && <FieldError>{errors.accepted}</FieldError>}
      </div>

      <div>
        <Button type="submit" size="lg" icon={<Send />} loading={pending}>
          {askCopy.submit}
        </Button>
      </div>
    </form>
  );
}

function BodyField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = useId();
  const max = QUESTION_LIMITS.bodyMax;
  const length = value.trim().length;
  const short = length > 0 && length < QUESTION_LIMITS.bodyMin;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id}>{askCopy.bodyLabel}</FieldLabel>
      <FieldHint id={`${id}-hint`}>{askCopy.bodyHint}</FieldHint>
      <textarea
        id={id}
        name="body"
        rows={9}
        maxLength={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint ${id}-counter`}
        className={controlClasses(error, "resize-y py-2.5 leading-loose")}
      />
      <p
        id={`${id}-counter`}
        aria-live="polite"
        className={short ? "text-sm text-warning-ink" : "text-sm text-muted"}
      >
        {toPersianDigits(value.length)} از {toPersianDigits(max)} نویسه
        {short && ` (دست‌کم ${toPersianDigits(QUESTION_LIMITS.bodyMin)} نویسه)`}
      </p>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

/** After sending: the tracking code, large, with a copy button. */
function Sent({ code }: { code: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const shown = formatTrackingCode(code);

  useEffect(() => {
    saveCode(code);
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown);
      setCopied(true);
      toast("کد پیگیری کپی شد.");
    } catch {
      toast("کپی انجام نشد. کد را یادداشت کنید.");
    }
  };

  return (
    <div role="status" className="flex flex-col gap-6">
      <Alert tone="success" title={askCopy.successText} />
      <div className="rounded-md border-2 border-primary bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-muted">{askCopy.codeLabel}</p>
        <p
          dir="ltr"
          className="mt-2 text-3xl font-black tracking-widest text-primary-active tabular-nums select-all"
        >
          {shown}
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" icon={copied ? <Check /> : <Copy />} onClick={copy}>
            {copied ? "کپی شد" : "کپی کد"}
          </Button>
        </div>
        <p className="mt-4 inline-flex items-start gap-2 text-start text-sm text-ink">
          <ShieldAlert aria-hidden="true" className="mt-1 size-4 shrink-0 text-warning-ink" />
          {askCopy.codeWarning}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <LinkButton href={TRACK_HREF} variant="secondary">
          پیگیری سؤال
        </LinkButton>
        <Button variant="ghost" onClick={() => window.location.reload()}>
          {askCopy.askAnother}
        </Button>
      </div>
    </div>
  );
}
