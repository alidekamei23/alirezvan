"use client";
// MohlatCalculator — the legal-deadline calculator: the law and the deadline (or a
// custom one), the start date, and holiday options. The result and a month calendar
// update as the visitor types; nothing leaves the browser. "Today" is known only in the
// browser, so the server renders a placeholder and the date fills in on load. Every
// date is computed by lib/mohlat/mohlat-calc.ts.
// Usage: <MohlatCalculator /> (once, on /tools/mohlat)
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { CalendarCheck, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Combobox } from "@/components/Combobox";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard } from "@/components/ResultCard";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { TextField } from "@/components/TextField";
import { mohlatCopy } from "@/content/mohlat";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";
import {
  CATEGORY_LAWS,
  CATEGORY_TITLES,
  DEADLINES,
  MONTHS,
  WEEKDAYS,
  calculateMohlat,
  monthLength,
  type Category,
  type JDate,
} from "@/lib/mohlat/mohlat-calc";
import {
  FIRST_YEAR,
  LAST_YEAR,
  LAWS,
  LAW_LABELS,
  MODE_LABELS,
  buildSummary,
  daysText,
  faLabel,
  faText,
  initialForm,
  monthGrid,
  monthTitle,
  parseCustomDays,
  parseExtraHolidays,
  remainingPill,
  resultHeading,
  sameDate,
  selectedDeadline,
  shiftMonth,
  tehranToday,
  toMohlatInput,
  type Mode,
  type MohlatForm,
  type MohlatOk,
} from "@/lib/mohlat/present";

/* "Today" from the browser clock, cached per day so React sees a stable value. */
let todayCache: JDate | null = null;
function browserToday(): JDate {
  const now = tehranToday();
  if (!todayCache || !sameDate(todayCache, now)) todayCache = now;
  return todayCache;
}
const serverToday = () => null;
const subscribe = () => () => {};

const COMBO_OPTIONS = DEADLINES.map((deadline) => ({
  value: deadline.id,
  label: deadline.title,
  group: `${CATEGORY_TITLES[deadline.category]}، ${deadline.article}`,
}));
const YEAR_OPTIONS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => {
  const year = FIRST_YEAR + i;
  return { value: String(year), label: toPersianDigits(year) };
});
const MONTH_OPTIONS = MONTHS.map((name, i) => ({ value: String(i + 1), label: name }));
/** Short weekday headings, Saturday first. */
const WEEKDAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function MohlatCalculator() {
  const id = useId();
  const today = useSyncExternalStore(subscribe, browserToday, serverToday);
  const [form, setForm] = useState<MohlatForm>(initialForm);
  const set = <K extends keyof MohlatForm>(key: K, value: MohlatForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const item = selectedDeadline(form);
  const isCustom = form.law === "custom";
  const start = form.start ?? today;
  const startTitle = isCustom ? "مبدأ مهلت" : `مبدأ: ${item?.start ?? "تاریخ مبدأ"}`;
  const extra = parseExtraHolidays(form.extraHolidays);
  const customDays = parseCustomDays(form.customDays);
  const customDaysError =
    isCustom && form.customDays.trim() !== "" && !customDays
      ? "تعداد روز را به‌صورت عدد صحیح مثبت وارد کنید."
      : undefined;
  const abroadAvailable = Boolean(item?.abroad.length);

  const result =
    start === null || (isCustom && !customDays)
      ? null
      : calculateMohlat(toMohlatInput({ ...form, abroad: form.abroad && abroadAvailable }, start, today));

  // A functional update, so two quick changes (month, then day) both apply. The day is
  // clamped to the month, e.g. 31 Shahrivar → 30 Mehr.
  const setStart = (patch: Partial<JDate>) =>
    setForm((current) => {
      const base = current.start ?? today;
      if (!base) return current;
      const next = { ...base, ...patch };
      return { ...current, start: { ...next, d: Math.min(next.d, monthLength(next.y, next.m)) } };
    });
  const pickDeadline = (deadlineId: string) => {
    const deadline = DEADLINES.find((candidate) => candidate.id === deadlineId);
    if (!deadline) return;
    setForm((current) => ({
      ...current,
      law: deadline.category,
      items: { ...current.items, [deadline.category]: deadline.id },
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <form
        noValidate
        aria-labelledby={`${id}-form-title`}
        onSubmit={(event) => event.preventDefault()}
        className="flex min-w-0 flex-col gap-8"
      >
        <div>
          <h2 id={`${id}-form-title`} className="text-xl font-bold text-ink">
            نوع مهلت
          </h2>
          <p className="mt-1 text-sm text-muted">{mohlatCopy.privacy}</p>
        </div>

        <div className="flex flex-col gap-5">
          <SegmentedControl
            legend="قانون"
            name="law"
            value={form.law}
            onValueChange={(value) => set("law", value as MohlatForm["law"])}
            options={LAWS.map((law) => ({ value: law, label: LAW_LABELS[law] }))}
          />

          {!isCustom && (
            <>
              <Combobox
                label="جستجوی مهلت"
                hint="بخشی از عنوان را بنویسید، مثلاً «تجدیدنظر» یا «واخواهی». در هر سه قانون جستجو می‌شود."
                placeholder={`جستجو در ${toPersianDigits(DEADLINES.length)} مهلت`}
                options={COMBO_OPTIONS}
                onSelect={pickDeadline}
              />
              <Select
                label="نوع مهلت"
                placeholder={null}
                title={item?.title}
                options={DEADLINES.filter((d) => d.category === form.law).map((d) => ({
                  value: d.id,
                  label: d.title,
                }))}
                value={form.items[form.law as Category]}
                onChange={(event) => pickDeadline(event.target.value)}
              />
              {item && (
                <div className="rounded-md border border-line bg-surface p-4">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="primary">{item.article}</Badge>
                    <Badge className="rounded-sm">{CATEGORY_LAWS[item.category]}</Badge>
                    <Badge tone="info">مدت: {daysText(item.days)}</Badge>
                    <Badge>
                      مقیم خارج: {item.abroad.length ? daysText(item.abroad) : "پیش‌بینی نشده"}
                    </Badge>
                    {item.mode === "earliest" && (
                      <Badge tone="warning">{MODE_LABELS.earliest}</Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {isCustom && (
            <>
              <TextField
                label="مدت مهلت (روز)"
                name="custom-days"
                inputMode="numeric"
                autoComplete="off"
                hint={mohlatCopy.customHint}
                value={form.customDays}
                error={customDaysError}
                onChange={(event) => set("customDays", event.target.value)}
                className="tabular-nums"
              />
              <RadioCards
                legend="نوع مهلت"
                name="custom-mode"
                columns={2}
                defaultValue={form.customMode}
                onValueChange={(value) => set("customMode", value as Mode)}
                options={[
                  { value: "deadline", title: MODE_LABELS.deadline, description: "اقدام تا این روز" },
                  { value: "earliest", title: MODE_LABELS.earliest, description: "اقدام نه زودتر از این روز" },
                ]}
              />
              <Checkbox
                name="custom-from-notice"
                label="مبدأ، ابلاغ یا اعلام است"
                description="روز ابلاغ و روز اقدام جزو مدت حساب نمی‌شود (ماده ۴۴۵)."
                checked={form.customFromNotice}
                onCheckedChange={(checked) => set("customFromNotice", checked)}
              />
            </>
          )}
        </div>

        <StartDateField
          legend={startTitle}
          value={start}
          today={today}
          onChange={setStart}
          onToday={() => set("start", null)}
        />

        <section
          aria-labelledby={`${id}-options`}
          className="flex flex-col gap-4 border-t border-line pt-8"
        >
          <h3 id={`${id}-options`} className="text-lg font-bold text-ink">
            تعطیلات و شرایط
          </h3>
          {!isCustom && (
            <Checkbox
              name="abroad"
              label="حداقل یکی از مخاطبان مقیم خارج از کشور است"
              description={abroadAvailable ? undefined : mohlatCopy.abroadUnavailable}
              checked={form.abroad && abroadAvailable}
              disabled={!abroadAvailable}
              onCheckedChange={(checked) => set("abroad", checked)}
            />
          )}
          <Checkbox
            name="thursday-off"
            label="پنجشنبه‌ها تعطیل"
            checked={form.thursdayOff}
            onCheckedChange={(checked) => set("thursdayOff", checked)}
          />
          <Checkbox
            name="skip-action-always"
            label="روز اقدام برای همه مهلت‌ها حذف شود، حتی وقتی مبدأ ابلاغ نیست"
            checked={form.skipActionAlways}
            onCheckedChange={(checked) => set("skipActionAlways", checked)}
          />
          <TextField
            label="روزهای تعطیل اضافه"
            name="extra-holidays"
            optional
            autoComplete="off"
            placeholder="۱۴۰۵/۰۸/۱۰، ۱۴۰۵/۰۸/۱۱"
            hint={mohlatCopy.extraHolidaysHint}
            value={form.extraHolidays}
            error={
              extra.invalid.length
                ? `این ${extra.invalid.length > 1 ? "موارد تاریخ معتبر نیستند" : "مورد تاریخ معتبر نیست"} و حساب نشد: ${extra.invalid.join("، ")}`
                : undefined
            }
            onChange={(event) => set("extraHolidays", event.target.value)}
            className="tabular-nums"
          />
        </section>
      </form>

      {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
        {start === null && (
          <div aria-busy="true" className="flex flex-col gap-3 rounded-md border border-line bg-surface p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
        {start !== null && result === null && (
          <EmptyState
            Icon={CalendarClock}
            title="مدت مهلت را وارد کنید"
            description="نتیجه با هر تغییر، همین‌جا به‌روز می‌شود."
          />
        )}
        {result?.ok === false && (
          <Alert tone="danger" live title="محاسبه انجام نشد">
            {faText(result.error)}
          </Alert>
        )}
        {result?.ok && start && (
          <MohlatResultView
            result={result}
            form={form}
            start={start}
            startTitle={startTitle}
            today={today}
            extraHolidays={extra.dates}
          />
        )}
      </div>
    </div>
  );
}

/** The start date as three dropdowns on the engine's calendar, with a «امروز» button. */
function StartDateField({
  legend,
  value,
  today,
  onChange,
  onToday,
}: {
  legend: string;
  value: JDate | null;
  today: JDate | null;
  onChange: (patch: Partial<JDate>) => void;
  onToday: () => void;
}) {
  const days = value ? monthLength(value.y, value.m) : 31;
  const isToday = value !== null && today !== null && sameDate(value, today);
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border-t border-line pt-8">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap items-center justify-between gap-2" aria-hidden="true">
        <p className="text-lg font-bold text-ink">{legend}</p>
        {value && <p className="text-sm text-muted">{faLabel(value)}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 xs:grid-cols-[4.5rem_minmax(0,1fr)_5.5rem] xs:gap-2">
        <Select
          label="روز"
          placeholder={value ? null : "—"}
          disabled={!value}
          value={value ? String(value.d) : ""}
          options={Array.from({ length: days }, (_, i) => ({
            value: String(i + 1),
            label: toPersianDigits(i + 1),
          }))}
          onChange={(event) => onChange({ d: Number(event.target.value) })}
        />
        <Select
          label="ماه"
          placeholder={value ? null : "—"}
          disabled={!value}
          value={value ? String(value.m) : ""}
          options={MONTH_OPTIONS}
          onChange={(event) => onChange({ m: Number(event.target.value) })}
        />
        <Select
          label="سال"
          placeholder={value ? null : "—"}
          disabled={!value}
          value={value ? String(value.y) : ""}
          options={YEAR_OPTIONS}
          onChange={(event) => onChange({ y: Number(event.target.value) })}
        />
      </div>
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={<CalendarCheck />}
          disabled={today === null || isToday}
          onClick={onToday}
        >
          امروز
        </Button>
      </div>
    </fieldset>
  );
}

const PILL_TONES = { neutral: "neutral", warning: "warning", danger: "danger", success: "success" } as const;

function MohlatResultView({
  result,
  form,
  start,
  startTitle,
  today,
  extraHolidays,
}: {
  result: MohlatOk;
  form: MohlatForm;
  start: JDate;
  startTitle: string;
  today: JDate | null;
  extraHolidays: string[];
}) {
  const pill = remainingPill(result.remaining, result.mode);
  return (
    <ResultCard
      title={resultHeading(result.mode)}
      rows={[]}
      highlight={
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-black tabular-nums text-primary-active">
            {faText(result.endLabel)}
          </p>
          <p className="text-base font-semibold">
            {faText(result.title)}، {daysText(result.days)}
            {result.item && <span className="font-normal text-muted"> ({result.item.article})</span>}
          </p>
          {pill && (
            <p>
              <Badge tone={PILL_TONES[pill.tone]}>{pill.text}</Badge>
            </p>
          )}
        </div>
      }
      body={
        <div className="flex flex-col gap-6">
          {result.warnings.map((warning) => (
            <Alert key={warning} tone="warning">
              {faText(warning)}
            </Alert>
          ))}
          <DeadlineCalendar
            start={start}
            end={result.end}
            today={today}
            thursdayOff={form.thursdayOff}
            extraHolidays={extraHolidays}
          />
          <div>
            <h3 className="font-bold text-ink">روند محاسبه</h3>
            <ol className="mt-2 flex list-[persian] flex-col gap-1.5 ps-6 text-sm text-ink marker:text-muted">
              {result.trace.map((step) => (
                <li key={step}>{faText(step)}</li>
              ))}
            </ol>
          </div>
        </div>
      }
      notes={result.notes.map(faText)}
    >
      <CopyButton text={buildSummary(result, form, start, startTitle)} />
    </ResultCard>
  );
}

/** A month of the engine's calendar, Saturday first, opening on the month of the end date. */
function DeadlineCalendar({
  start,
  end,
  today,
  thursdayOff,
  extraHolidays,
}: {
  start: JDate;
  end: JDate;
  today: JDate | null;
  thursdayOff: boolean;
  extraHolidays: string[];
}) {
  const id = useId();
  const endKey = `${end.y}/${end.m}/${end.d}`;
  // The shown month follows the end date until the visitor moves it.
  const [view, setView] = useState<{ anchor: string; y: number; m: number } | null>(null);
  const shown = view && view.anchor === endKey ? view : { anchor: endKey, y: end.y, m: end.m };
  const move = (delta: number) => setView({ anchor: endKey, ...shiftMonth(shown.y, shown.m, delta) });
  const weeks = monthGrid(shown.y, shown.m, { start, end, today, thursdayOff, extraHolidays });
  const atEnd = shown.y === end.y && shown.m === end.m;
  const atStart = shown.y === start.y && shown.m === start.m;

  return (
    <div className="rounded-md border border-line">
      <div className="flex items-center justify-between gap-2 border-b border-line p-2">
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronRight />}
          aria-label="ماه قبل"
          disabled={shown.y * 12 + shown.m <= FIRST_YEAR * 12 + 1}
          onClick={() => move(-1)}
        >
          <span className="sr-only">ماه قبل</span>
        </Button>
        <p id={`${id}-month`} aria-live="polite" className="font-bold text-ink">
          {monthTitle(shown.y, shown.m)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft />}
          aria-label="ماه بعد"
          disabled={shown.y * 12 + shown.m >= LAST_YEAR * 12 + 12}
          onClick={() => move(1)}
        >
          <span className="sr-only">ماه بعد</span>
        </Button>
      </div>
      <table aria-labelledby={`${id}-month`} className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            {WEEKDAY_SHORT.map((short, i) => (
              <th
                key={short}
                scope="col"
                className={cn("py-2 font-semibold", i === 6 ? "text-danger-ink" : "text-muted")}
              >
                <abbr title={WEEKDAYS[i]} className="no-underline">
                  {short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, i) =>
                day ? (
                  <td key={i} className="p-0.5">
                    <span
                      title={day.holiday ?? undefined}
                      className={cn(
                        "relative mx-auto flex h-9 w-full max-w-10 items-center justify-center rounded-sm tabular-nums",
                        day.inRange && "bg-primary-soft",
                        day.holiday && !day.isEnd && "font-semibold text-danger-ink",
                        !day.holiday && !day.isEnd && "text-ink",
                        day.isStart && "border-2 border-primary",
                        day.isEnd && "bg-primary font-bold text-on-primary",
                      )}
                    >
                      <span aria-hidden="true">{toPersianDigits(day.date.d)}</span>
                      <span className="sr-only">
                        {day.label}
                        {day.isStart && "، مبدأ"}
                        {day.isEnd && "، روز پایان"}
                        {day.isToday && "، امروز"}
                        {day.holiday && `، ${faText(day.holiday)}`}
                      </span>
                      {day.isToday && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute bottom-1 size-1 rounded-full",
                            day.isEnd ? "bg-on-primary" : "bg-primary",
                          )}
                        />
                      )}
                    </span>
                  </td>
                ) : (
                  <td key={i} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col gap-3 border-t border-line p-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
          <Legend swatch="border-2 border-primary">مبدأ</Legend>
          <Legend swatch="bg-primary">روز پایان</Legend>
          <Legend swatch="bg-primary-soft">میان مهلت</Legend>
          <Legend swatch="" dot>
            امروز
          </Legend>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="font-semibold text-danger-ink">
              ۱۲
            </span>
            تعطیل
          </li>
        </ul>
        {(!atEnd || !atStart) && (
          <div className="flex flex-wrap gap-2">
            {!atStart && (
              <Button variant="ghost" size="sm" onClick={() => setView({ anchor: endKey, y: start.y, m: start.m })}>
                ماه مبدأ
              </Button>
            )}
            {!atEnd && (
              <Button variant="ghost" size="sm" onClick={() => setView(null)}>
                ماه پایان
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ swatch, dot, children }: { swatch: string; dot?: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      {dot ? (
        <span aria-hidden="true" className="flex size-4 items-center justify-center">
          <span className="size-1.5 rounded-full bg-primary" />
        </span>
      ) : (
        <span aria-hidden="true" className={cn("size-4 rounded-sm", swatch)} />
      )}
      {children}
    </li>
  );
}
