"use client";
// TadiehCalculator — the late-payment damages calculator: one debt or several checks /
// instalments, a payment month and the index basis. The result updates as the visitor
// types; nothing leaves the browser. The arithmetic is lib/tadieh/tadieh-calc.ts.
// Usage: <TadiehCalculator /> (once, on /tools/khesarat-takhir)
import { useId, useRef, useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { MoneyField } from "@/components/MoneyField";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard } from "@/components/ResultCard";
import { Select } from "@/components/Select";
import { Table } from "@/components/Table";
import { tadiehCopy } from "@/content/tadieh";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";
import {
  BASIS_LABELS,
  buildSummary,
  formatFactor,
  formatIndex,
  periodLabel,
  rial,
  tomanEquivalent,
} from "@/lib/tadieh/present";
import {
  MONTH_NAMES,
  YEARS,
  availableMonths,
  calculate,
  getIndex,
  latestAvailable,
  numberToWords,
  type Basis,
  type JalaliMonth,
} from "@/lib/tadieh/tadieh-calc";

type Mode = "single" | "multi";
type Row = { id: number; amount: number | null; due: JalaliMonth };

const LATEST = latestAvailable();
// A year before the latest index, so the first result is not zero.
const DEFAULT_DUE: JalaliMonth = availableMonths(LATEST.year - 1).includes(LATEST.month)
  ? { year: LATEST.year - 1, month: LATEST.month }
  : LATEST;

const YEAR_OPTIONS = [...YEARS]
  .reverse()
  .map((year) => ({ value: String(year), label: toPersianDigits(year) }));
const monthOptions = (months: number[]) =>
  months.map((month) => ({ value: String(month), label: MONTH_NAMES[month] }));
const ALL_MONTHS = monthOptions(MONTH_NAMES.map((_, month) => month));

/** The month after `date`, for the next instalment; `date` itself if it has no index yet. */
function nextDue(date: JalaliMonth): JalaliMonth {
  const next =
    date.month === 11
      ? { year: date.year + 1, month: 0 }
      : { year: date.year, month: date.month + 1 };
  return getIndex(next, "monthly") == null ? date : next;
}

/** Keeps the month when the new year has an index for it, else the year's last month. */
function withYear(date: JalaliMonth, year: number): JalaliMonth {
  const months = availableMonths(year);
  return { year, month: months.includes(date.month) ? date.month : (months.at(-1) ?? 0) };
}

function IndexLine({ date, basis }: { date: JalaliMonth; basis: Basis }) {
  const index = getIndex(date, basis);
  const period = periodLabel(date, basis);
  return (
    <p className="text-sm text-muted">
      {index == null ? (
        basis === "annual" ? (
          `میانگین ${period} هنوز کامل نشده است.`
        ) : (
          `شاخص ${period} هنوز منتشر نشده است.`
        )
      ) : (
        <>
          {basis === "annual" ? "میانگین شاخص" : "شاخص"} {period}:{" "}
          <span className="font-semibold text-ink tabular-nums">{formatIndex(index)}</span>
        </>
      )}
    </p>
  );
}

export function TadiehCalculator() {
  const id = useId();
  const nextId = useRef(1);
  const addRowRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("single");
  const [basis, setBasis] = useState<Basis>("monthly");
  const [rows, setRows] = useState<Row[]>([{ id: 0, amount: null, due: DEFAULT_DUE }]);
  const [payment, setPayment] = useState<JalaliMonth>(LATEST);

  const multi = mode === "multi";
  const activeRows = multi ? rows : rows.slice(0, 1);

  const patchRow = (rowId: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );

  const addRow = () =>
    setRows((current) => [
      ...current,
      { id: nextId.current++, amount: null, due: nextDue(current[current.length - 1].due) },
    ]);

  const removeRow = (rowId: number) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
    // The removed button had the focus; hand it to the nearest stable control.
    addRowRef.current?.querySelector("button")?.focus();
  };

  // Nothing typed yet is not an error; a half-filled list is, and says which row.
  const result = activeRows.some((row) => row.amount !== null)
    ? calculate(
        activeRows.map((row) => ({ principal: row.amount ?? NaN, due: row.due })),
        payment,
        basis,
      )
    : null;

  const annual = basis === "annual";

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
        <form
          noValidate
          aria-labelledby={`${id}-form-title`}
          onSubmit={(event) => event.preventDefault()}
          className="flex min-w-0 flex-col gap-8"
        >
          <div>
            <h2 id={`${id}-form-title`} className="text-xl font-bold text-ink">
              مشخصات بدهی
            </h2>
            <p className="mt-1 text-sm text-muted">{tadiehCopy.privacy}</p>
          </div>

          <RadioCards
            legend="نوع محاسبه"
            name="mode"
            columns={2}
            defaultValue={mode}
            onValueChange={(value) => setMode(value as Mode)}
            options={[
              { value: "single", title: "یک بدهی" },
              { value: "multi", title: "چند چک / چند قسط" },
            ]}
          />

          <div className="flex flex-col gap-4">
            {activeRows.map((row, index) => {
              const rowTitle = toPersianDigits(`ردیف ${index + 1}`);
              const dueMonths = availableMonths(row.due.year);
              return (
                <div
                  key={row.id}
                  role="group"
                  aria-labelledby={`${id}-row-${row.id}`}
                  className={cn(
                    "flex flex-col gap-4",
                    multi && "rounded-md border border-line bg-surface p-4 sm:p-5",
                  )}
                >
                  <div
                    className={cn("flex items-center justify-between gap-3", !multi && "sr-only")}
                  >
                    <h3 id={`${id}-row-${row.id}`} className="font-bold text-ink">
                      {multi ? rowTitle : "بدهی"}
                    </h3>
                    {multi && rows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 />}
                        aria-label={`حذف ${rowTitle}`}
                        onClick={() => removeRow(row.id)}
                      >
                        حذف
                      </Button>
                    )}
                  </div>
                  <MoneyField
                    label="مبلغ اصل دین"
                    name={`principal-${row.id}`}
                    unit="ریال"
                    hint={
                      row.amount
                        ? `معادل ${tomanEquivalent(row.amount)}`
                        : "مبلغ را به ریال وارد کنید."
                    }
                    onValueChange={(amount) => patchRow(row.id, { amount })}
                  />
                  <div className={cn("grid gap-3", !annual && "grid-cols-2")}>
                    <Select
                      label="سال سررسید"
                      placeholder={null}
                      options={YEAR_OPTIONS}
                      value={String(row.due.year)}
                      onChange={(event) =>
                        patchRow(row.id, { due: withYear(row.due, Number(event.target.value)) })
                      }
                    />
                    {!annual && (
                      <Select
                        label="ماه سررسید"
                        placeholder={null}
                        options={monthOptions(dueMonths)}
                        value={String(row.due.month)}
                        onChange={(event) =>
                          patchRow(row.id, {
                            due: { ...row.due, month: Number(event.target.value) },
                          })
                        }
                      />
                    )}
                  </div>
                  <IndexLine date={row.due} basis={basis} />
                </div>
              );
            })}
            {multi && (
              <div ref={addRowRef}>
                <Button variant="secondary" icon={<Plus />} onClick={addRow}>
                  افزودن ردیف
                </Button>
              </div>
            )}
          </div>

          <div
            role="group"
            aria-labelledby={`${id}-payment`}
            className="flex flex-col gap-4 border-t border-line pt-8"
          >
            <div>
              <h3 id={`${id}-payment`} className="font-bold text-ink">
                تاریخ پرداخت
              </h3>
              <p className="text-sm text-muted">
                اگر هنوز پرداخت نشده، آخرین ماهی را که شاخص دارد نگه دارید.
              </p>
            </div>
            <div className={cn("grid gap-3", !annual && "grid-cols-2")}>
              <Select
                label="سال پرداخت"
                placeholder={null}
                options={YEAR_OPTIONS}
                value={String(payment.year)}
                onChange={(event) =>
                  setPayment({ ...payment, year: Number(event.target.value) })
                }
              />
              {!annual && (
                <Select
                  label="ماه پرداخت"
                  placeholder={null}
                  options={ALL_MONTHS}
                  value={String(payment.month)}
                  onChange={(event) =>
                    setPayment({ ...payment, month: Number(event.target.value) })
                  }
                />
              )}
            </div>
            <IndexLine date={payment} basis={basis} />
          </div>

          <RadioCards
            legend="ملاک شاخص"
            name="basis"
            columns={2}
            defaultValue={basis}
            onValueChange={(value) => setBasis(value as Basis)}
            options={[
              {
                value: "monthly",
                title: "ماهانه",
                description: "شاخص ماه سررسید و ماه پرداخت",
              },
              {
                value: "annual",
                title: "میانگین سالانه",
                description: "میانگین شاخص سال سررسید و سال پرداخت",
              },
            ]}
          />
        </form>

        {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
          {result === null && (
            <EmptyState
              Icon={Calculator}
              title="مبلغ اصل دین را وارد کنید"
              description="نتیجه با هر تغییر، همین‌جا به‌روز می‌شود."
            />
          )}
          {result?.ok === false && (
            <Alert tone="danger" live title="محاسبه انجام نشد">
              {toPersianDigits(result.error)}
            </Alert>
          )}
          {result?.ok && (
            <>
              {result.warnings.length > 0 && (
                <Alert tone="warning" live title="توجه">
                  <ul className="flex flex-col gap-1">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{toPersianDigits(warning)}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              <ResultCard
                title="نتیجه محاسبه"
                rows={[
                  {
                    label: multi ? "جمع اصل دین" : "اصل دین",
                    value: rial(result.totalPrincipal),
                  },
                  {
                    label: "خسارت تأخیر تأدیه",
                    value: rial(result.totalDamage),
                    emphasis: true,
                  },
                ]}
                total={{ label: "مبلغ قابل پرداخت", value: rial(result.grandTotal) }}
                notes={[
                  `خسارت به حروف: ${numberToWords(result.totalDamage)} ریال`,
                  `معادل ${tomanEquivalent(result.totalDamage)} (${numberToWords(result.totalDamage / 10)} تومان)`,
                  `ملاک: ${BASIS_LABELS[result.basis]}؛ شاخص ${periodLabel(result.payment, result.basis)} (زمان پرداخت): ${formatIndex(result.paymentIndex)}`,
                  ...(result.rows.length === 1
                    ? [
                        `شاخص ${periodLabel(result.rows[0].due, result.basis)} (زمان سررسید): ${formatIndex(result.rows[0].dueIndex)}؛ ضریب ${formatFactor(result.rows[0].factor)}`,
                      ]
                    : []),
                ]}
              >
                <CopyButton text={buildSummary(result)} />
              </ResultCard>
            </>
          )}
        </div>
      </div>

      {multi && result?.ok && (
        <section aria-labelledby={`${id}-breakdown`}>
          <h2 id={`${id}-breakdown`} className="mb-4 text-xl font-bold text-ink">
            ریز محاسبه
          </h2>
          <div className="tabular-nums">
            <Table
              caption="ریز محاسبه هر ردیف"
              head={["سررسید", "اصل دین (ریال)", "شاخص", "ضریب", "خسارت (ریال)", "جمع (ریال)"]}
              rows={[
                ...result.rows.map((row, index) => [
                  <span key="due" className="whitespace-nowrap">
                    {toPersianDigits(`${index + 1}. `)}
                    {periodLabel(row.due, result.basis)}
                  </span>,
                  formatNumberCell(row.principal),
                  formatIndex(row.dueIndex),
                  formatFactor(row.factor),
                  formatNumberCell(row.damage),
                  formatNumberCell(row.total),
                ]),
                [
                  "جمع",
                  <strong key="principal">{formatNumberCell(result.totalPrincipal)}</strong>,
                  "—",
                  "—",
                  <strong key="damage" className="text-primary">
                    {formatNumberCell(result.totalDamage)}
                  </strong>,
                  <strong key="total">{formatNumberCell(result.grandTotal)}</strong>,
                ],
              ]}
            />
          </div>
        </section>
      )}
    </div>
  );
}

/** A rial amount for a table cell (the unit is in the column head). */
function formatNumberCell(value: number): string {
  return rial(value).replace(" ریال", "");
}
