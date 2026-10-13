"use client";
// HazineCalculator — the court-fee calculator for financial claims: an amount, the stage
// of the case and, optionally, the enforcement fee. The result updates as the visitor
// types; nothing leaves the browser. The arithmetic is lib/hazine/hazine-calc.ts.
// Usage: <HazineCalculator /> (once, on /tools/hazine-dadresi)
import { useId, useState } from "react";
import { Calculator } from "lucide-react";
import { Checkbox } from "@/components/Checkbox";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { MoneyField } from "@/components/MoneyField";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard } from "@/components/ResultCard";
import { Table } from "@/components/Table";
import { hazineCopy } from "@/content/hazine";
import {
  STAGES,
  calculateCourtFee,
  compareAllStages,
  formatRial,
  type Stage,
} from "@/lib/hazine/hazine-calc";
import { TARIFF_YEAR_LABEL, amountInWords, buildSummary } from "@/lib/hazine/present";
import { rial, tomanEquivalent } from "@/lib/tadieh/present";

const STAGE_OPTIONS = (Object.keys(STAGES) as Stage[]).map((stage) => ({
  value: stage,
  title: STAGES[stage].title,
  description: STAGES[stage].rateLabel,
}));

export function HazineCalculator() {
  const id = useId();
  const [amount, setAmount] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>("badvi");
  const [includeEnforcement, setIncludeEnforcement] = useState(false);

  // An empty or zero amount is "nothing to calculate yet", not an error.
  const hasAmount = amount !== null && amount > 0;
  const result = hasAmount ? calculateCourtFee(amount, stage, { includeEnforcement }) : null;
  const comparison = hasAmount ? compareAllStages(amount) : [];

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
              مشخصات دعوا
            </h2>
            <p className="mt-1 text-sm text-muted">{hazineCopy.privacy}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <MoneyField
              label={STAGES[stage].basisLabel}
              name="amount"
              unit="ریال"
              hint="مبلغ را به ریال وارد کنید."
              onValueChange={setAmount}
            />
            {hasAmount && (
              <p className="text-sm text-muted tabular-nums">{amountInWords(amount)}</p>
            )}
          </div>

          <RadioCards
            legend="مرحله رسیدگی"
            name="stage"
            columns={1}
            defaultValue={stage}
            onValueChange={(value) => setStage(value as Stage)}
            options={STAGE_OPTIONS}
          />

          <Checkbox
            name="enforcement"
            label="حق اجرا (نیم‌عشر) را هم حساب کن"
            checked={includeEnforcement}
            onCheckedChange={setIncludeEnforcement}
          />
        </form>

        {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
          {result ? (
            <ResultCard
              title="نتیجه محاسبه"
              rows={result.lines.map((line) => ({
                label: line.label,
                value: rial(line.amount),
                detail: line.detail,
              }))}
              total={{ label: "جمع کل", value: rial(result.total) }}
              notes={[
                `جمع کل به حروف: ${amountInWords(result.total)}`,
                `بر پایه تعرفه سال ${TARIFF_YEAR_LABEL}`,
              ]}
            >
              <CopyButton text={buildSummary(result)} />
            </ResultCard>
          ) : (
            <EmptyState
              Icon={Calculator}
              title="مبلغ را وارد کنید"
              description="نتیجه با هر تغییر، همین‌جا به‌روز می‌شود."
            />
          )}
        </div>
      </div>

      {result && (
        <section aria-labelledby={`${id}-compare`}>
          <h2 id={`${id}-compare`} className="mb-4 text-xl font-bold text-ink">
            مقایسه همه مراحل برای همین مبلغ
          </h2>
          <div className="tabular-nums">
            <Table
              caption="هزینه هر مرحله برای مبلغ واردشده"
              head={["مرحله", "نرخ", "ریال", "تومان"]}
              selectedRow={comparison.findIndex((row) => row.key === stage)}
              rows={comparison.map((row) => [
                row.key === stage ? `${row.title} (مرحله انتخابی)` : row.title,
                row.rateLabel,
                <span key="rial" className="whitespace-nowrap">
                  {formatRial(row.fee)}
                </span>,
                <span key="toman" className="whitespace-nowrap">
                  {tomanEquivalent(row.fee).replace(" تومان", "")}
                </span>,
              ])}
            />
          </div>
        </section>
      )}
    </div>
  );
}
