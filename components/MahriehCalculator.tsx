"use client";
// MahriehCalculator — mahr at today's value: the cash mahr with its marriage and payment
// years, optional earlier part-payments, and optional coins and gold at today's price.
// The result updates as the visitor types; nothing leaves the browser. The arithmetic is
// lib/mahrieh/mahrieh-calc.ts and is only called here, never repeated.
// Usage: <MahriehCalculator /> (once, on /tools/mahrieh)
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { MoneyField } from "@/components/MoneyField";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard, type ResultRow } from "@/components/ResultCard";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";
import { mahriehCopy } from "@/content/mahrieh";
import { toPersianDigits } from "@/lib/format";
import { todayJalali } from "@/lib/jalali";
import {
  COIN_LABELS,
  FIRST_YEAR,
  LAST_YEAR,
  calculateMahr,
  numberToWords,
  parseAmount,
  paymentIndexYear,
  type CoinKind,
} from "@/lib/mahrieh/mahrieh-calc";
import {
  amountInWords,
  buildSummary,
  capStatus,
  coinsLabel,
  faText,
  formatMahrFactor,
  yearIndexLabel,
} from "@/lib/mahrieh/present";
import { formatIndex, rial } from "@/lib/tadieh/present";

type Unit = "rial" | "toman";
type PaymentRow = { id: number; amount: number | null; year: number | null };
type CoinState = { quantity: string; price: number | null };

const UNIT_LABEL: Record<Unit, string> = { rial: "ریال", toman: "تومان" };
const UNIT_FACTOR: Record<Unit, number> = { rial: 1, toman: 10 };
const COIN_KINDS = Object.keys(COIN_LABELS) as CoinKind[];
const OLDER = "older";

// The Jalali year in Tehran, read in the browser. The server render uses 1405, so the
// page can be prerendered; the browser corrects it after loading if the year has changed.
const DEFAULT_YEAR = 1405;
const subscribe = () => () => {};
const browserYear = () => todayJalali().year;
const serverYear = () => DEFAULT_YEAR;

const yearOptions = (from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => to - i).map((year) => ({
    value: String(year),
    label: toPersianDigits(year),
  }));

/** Quantity typed with Persian or Latin digits; null when empty, NaN when invalid. */
function parseQuantity(text: string): number | null {
  if (text.trim() === "") return null;
  const value = parseAmount(text);
  return value >= 0 ? value : NaN;
}

export function MahriehCalculator() {
  const id = useId();
  const nextId = useRef(1);
  const addRowRef = useRef<HTMLDivElement>(null);
  const currentYear = Math.max(useSyncExternalStore(subscribe, browserYear, serverYear), FIRST_YEAR);

  const [unit, setUnit] = useState<Unit>("rial");
  const [amount, setAmount] = useState<number | null>(null);
  const [marriage, setMarriage] = useState<string>("");
  const [paymentChoice, setPaymentChoice] = useState<number | null>(null);
  const [hasPartials, setHasPartials] = useState(false);
  const [partials, setPartials] = useState<PaymentRow[]>([{ id: 0, amount: null, year: null }]);
  const [hasCoins, setHasCoins] = useState(false);
  const [coins, setCoins] = useState<Record<CoinKind, CoinState>>(
    () =>
      Object.fromEntries(COIN_KINDS.map((kind) => [kind, { quantity: "", price: null }])) as Record<
        CoinKind,
        CoinState
      >,
  );

  const paymentYear = paymentChoice ?? currentYear;
  const marriageYear = marriage === "" || marriage === OLDER ? null : Number(marriage);
  const isOlder = marriage === OLDER;
  const unitFactor = UNIT_FACTOR[unit];
  const cashRial = amount && amount > 0 ? amount * unitFactor : 0;

  const patchPartial = (rowId: number, patch: Partial<PaymentRow>) =>
    setPartials((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  const removePartial = (rowId: number) => {
    setPartials((rows) => rows.filter((row) => row.id !== rowId));
    addRowRef.current?.querySelector("button")?.focus();
  };
  const patchCoin = (kind: CoinKind, patch: Partial<CoinState>) =>
    setCoins((current) => ({ ...current, [kind]: { ...current[kind], ...patch } }));

  const quantities = Object.fromEntries(
    COIN_KINDS.map((kind) => [kind, parseQuantity(coins[kind].quantity)]),
  ) as Record<CoinKind, number | null>;
  const items = hasCoins
    ? COIN_KINDS.flatMap((kind) => {
        const quantity = quantities[kind];
        return quantity && quantity > 0
          ? [{ kind, quantity, unitPrice: coins[kind].price ?? 0 }]
          : [];
      })
    : [];
  const fullCoinPrice = hasCoins ? (coins.full.price ?? undefined) : undefined;
  const invalidQuantity = hasCoins && COIN_KINDS.some((kind) => Number.isNaN(quantities[kind]));

  // What the result panel shows: nothing yet, a message, or the calculation.
  const needsMarriageYear = cashRial > 0 && marriageYear === null && !isOlder;
  const blockedByOlderYear = cashRial > 0 && isOlder;
  const hasInput = cashRial > 0 || items.length > 0;
  const result =
    hasInput && !needsMarriageYear && !blockedByOlderYear && !invalidQuantity
      ? calculateMahr(
          {
            cashAmount: cashRial,
            // Coins alone do not need the marriage year's index.
            marriageYear: marriageYear ?? Math.min(paymentYear, FIRST_YEAR - 1),
            paymentYear,
            partialPayments: hasPartials
              ? partials.flatMap((row) =>
                  row.amount && row.amount > 0
                    ? [{ amount: row.amount * unitFactor, year: row.year ?? marriageYear ?? paymentYear }]
                    : [],
                )
              : [],
            items,
          },
          fullCoinPrice,
        )
      : null;

  const partialYearOptions =
    marriageYear !== null ? yearOptions(marriageYear, paymentYear) : yearOptions(FIRST_YEAR, paymentYear);

  const resultRows: ResultRow[] = [];
  if (result?.ok) {
    if (result.cash && result.cash.paidAtMarriageValue > 0) {
      resultRows.push(
        { label: "مهریه نقدی عقدنامه", value: rial(result.cash.nominal) },
        {
          label: "پرداخت‌های قبلی به ارزش سال عقد",
          value: rial(result.cash.paidAtMarriageValue),
        },
        {
          label: "باقی‌مانده به ارزش سال عقد",
          value: rial(result.cash.remainingAtMarriageValue),
        },
      );
    }
    for (const line of result.lines) {
      resultRows.push({
        label: faText(line.label),
        value: rial(line.amount),
        detail: line.detail ? faText(line.detail) : undefined,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
      <form
        noValidate
        aria-labelledby={`${id}-form-title`}
        onSubmit={(event) => event.preventDefault()}
        className="flex min-w-0 flex-col gap-8"
      >
        <div>
          <h2 id={`${id}-form-title`} className="text-xl font-bold text-ink">
            مهریه نقدی
          </h2>
          <p className="mt-1 text-sm text-muted">{mahriehCopy.privacy}</p>
        </div>

        <RadioCards
          legend="واحد مبلغ عقدنامه"
          name="unit"
          columns={2}
          defaultValue={unit}
          onValueChange={(value) => setUnit(value as Unit)}
          options={[
            { value: "rial", title: "ریال" },
            { value: "toman", title: "تومان" },
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <MoneyField
            label="مبلغ مهریه در عقدنامه"
            name="amount"
            unit={UNIT_LABEL[unit]}
            hint={`مبلغ را به ${UNIT_LABEL[unit]} وارد کنید.`}
            onValueChange={setAmount}
          />
          {amount !== null && amount > 0 && (
            <p className="text-sm text-muted tabular-nums">
              {numberToWords(amount)} {UNIT_LABEL[unit]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <Select
              label="سال عقد"
              placeholder="انتخاب کنید"
              options={[
                ...yearOptions(FIRST_YEAR, currentYear),
                { value: OLDER, label: `پیش از ${toPersianDigits(FIRST_YEAR)}` },
              ]}
              value={marriage}
              onChange={(event) => setMarriage(event.target.value)}
            />
            {marriageYear !== null && (
              <p className="text-sm text-muted tabular-nums">{yearIndexLabel(marriageYear)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Select
              label="سال پرداخت"
              placeholder={null}
              options={yearOptions(FIRST_YEAR, Math.max(currentYear, LAST_YEAR + 1))}
              value={String(paymentYear)}
              onChange={(event) => setPaymentChoice(Number(event.target.value))}
            />
            <p className="text-sm text-muted tabular-nums">
              ملاک: {yearIndexLabel(paymentIndexYear(paymentYear))}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Checkbox
            name="has-partials"
            label="بخشی از مهریه قبلاً پرداخت شده است"
            description="هر پرداخت را با سال آن وارد کنید تا به ارزش سال عقد کسر شود."
            checked={hasPartials}
            onCheckedChange={setHasPartials}
          />
          {hasPartials && (
            <div className="flex flex-col gap-4">
              {partials.map((row, index) => {
                const rowTitle = toPersianDigits(`پرداخت ${index + 1}`);
                return (
                  <div
                    key={row.id}
                    role="group"
                    aria-labelledby={`${id}-partial-${row.id}`}
                    className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 id={`${id}-partial-${row.id}`} className="font-bold text-ink">
                        {rowTitle}
                      </h3>
                      {partials.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 />}
                          aria-label={`حذف ${rowTitle}`}
                          onClick={() => removePartial(row.id)}
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                      <MoneyField
                        label="مبلغ پرداخت‌شده"
                        name={`partial-amount-${row.id}`}
                        unit={UNIT_LABEL[unit]}
                        onValueChange={(value) => patchPartial(row.id, { amount: value })}
                      />
                      <Select
                        label="سال پرداخت"
                        placeholder={null}
                        options={partialYearOptions}
                        value={String(row.year ?? marriageYear ?? paymentYear)}
                        onChange={(event) =>
                          patchPartial(row.id, { year: Number(event.target.value) })
                        }
                      />
                    </div>
                  </div>
                );
              })}
              <div ref={addRowRef}>
                <Button
                  variant="secondary"
                  icon={<Plus />}
                  onClick={() =>
                    setPartials((rows) => [
                      ...rows,
                      { id: nextId.current++, amount: null, year: null },
                    ])
                  }
                >
                  افزودن پرداخت
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-8">
          <Checkbox
            name="has-coins"
            label="سکه یا طلا هم در مهریه هست (اختیاری)"
            description={mahriehCopy.coinHint}
            checked={hasCoins}
            onCheckedChange={setHasCoins}
          />
          {hasCoins &&
            COIN_KINDS.map((kind) => {
              const { title, unit: itemUnit } = COIN_LABELS[kind];
              const invalid = Number.isNaN(quantities[kind]);
              return (
                <div
                  key={kind}
                  role="group"
                  aria-labelledby={`${id}-coin-${kind}`}
                  className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 sm:p-5"
                >
                  <h3 id={`${id}-coin-${kind}`} className="font-bold text-ink">
                    {title}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                    <TextField
                      label={itemUnit === "گرم" ? "مقدار (گرم)" : "تعداد"}
                      name={`coin-quantity-${kind}`}
                      inputMode="decimal"
                      autoComplete="off"
                      optional
                      value={coins[kind].quantity}
                      error={invalid ? "عدد معتبر وارد کنید." : undefined}
                      onChange={(event) => patchCoin(kind, { quantity: event.target.value })}
                    />
                    <MoneyField
                      label={`قیمت روز هر ${itemUnit}`}
                      name={`coin-price-${kind}`}
                      unit="ریال"
                      optional
                      onValueChange={(value) => patchCoin(kind, { price: value })}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </form>

      {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
        {blockedByOlderYear && (
          <Alert tone="info" live title="این سال هنوز قابل محاسبه نیست">
            شاخص سال‌های پیش از {toPersianDigits(FIRST_YEAR)} هنوز در سامانه وارد نشده است.
          </Alert>
        )}
        {!blockedByOlderYear && result === null && (
          <EmptyState
            Icon={Calculator}
            title={needsMarriageYear ? "سال عقد را انتخاب کنید" : "مبلغ مهریه را وارد کنید"}
            description="نتیجه با هر تغییر، همین‌جا به‌روز می‌شود."
          />
        )}
        {result?.ok === false && (
          <Alert tone="danger" live title="محاسبه انجام نشد">
            {faText(result.error)}
          </Alert>
        )}
        {result?.ok && (
          <>
            {result.warnings.length > 0 && (
              <Alert tone="warning" live title="توجه">
                <ul className="flex flex-col gap-1">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{faText(warning)}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <ResultCard
              title="نتیجه محاسبه"
              rows={resultRows}
              total={{ label: "جمع کل", value: rial(result.total) }}
              notes={[
                `جمع کل به حروف: ${amountInWords(result.total)}`,
                ...(result.cash
                  ? [
                      `شاخص سال عقد: ${result.cash.factor.marriageIndex == null ? "—" : formatIndex(result.cash.factor.marriageIndex)}؛ شاخص سال ${toPersianDigits(result.cash.factor.paymentIndexYear)} (ملاک پرداخت): ${formatIndex(result.cash.factor.paymentIndex)}؛ ضریب ${formatMahrFactor(result.cash.factor.factor)}`,
                    ]
                  : []),
              ]}
            >
              <div className="flex flex-col gap-4">
                {result.coinEquivalent && (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-sm text-ink tabular-nums">
                      معادل جمع کل: {coinsLabel(result.coinEquivalent.coins)}
                    </p>
                    <Badge tone={result.coinEquivalent.overCap ? "warning" : "success"}>
                      {capStatus(result.coinEquivalent.overCap)}
                    </Badge>
                  </div>
                )}
                <CopyButton
                  text={buildSummary(result, {
                    marriageYear: marriageYear ?? paymentYear,
                    paymentYear,
                  })}
                />
              </div>
            </ResultCard>
          </>
        )}
      </div>
    </div>
  );
}
