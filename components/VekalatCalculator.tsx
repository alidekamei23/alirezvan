"use client";
// VekalatCalculator — the lawyer's-fee and stamp calculator: the subject of the case and
// its details, the conditions of the case, and the licence issuer for the stamp. The
// result updates as the visitor types; nothing leaves the browser. The tariff and the
// arithmetic are lib/vekalat/ and are only called here.
// Usage: <VekalatCalculator /> (once, on /tools/haghol-vekale)
import { useId, useState, type ReactNode } from "react";
import { Calculator, Plane } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Checkbox } from "@/components/Checkbox";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { MoneyField } from "@/components/MoneyField";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard } from "@/components/ResultCard";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Select } from "@/components/Select";
import { Stepper } from "@/components/Stepper";
import { Table } from "@/components/Table";
import { TextField } from "@/components/TextField";
import { vekalatCopy } from "@/content/vekalat";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";
import { rial } from "@/lib/tadieh/present";
import { OUTCOMES, calculateVekalat } from "@/lib/vekalat/vekalat-calc";
import {
  EXECUTION_LABELS,
  FINALITY_LABELS,
  ISSUER_LABELS,
  ITEM_LISTS,
  SUBJECTS,
  SUBJECT_LABELS,
  THIRD_PARTY_LABELS,
  TRAVEL_LABELS,
  amountInWords,
  buildSummary,
  faText,
  isCivilLike,
  rangeText,
  sampleForm,
  selectedItem,
  toVekalatInput,
  type ExecutionItem,
  type Finality,
  type Issuer,
  type ListSubject,
  type Outcome,
  type ThirdPartyStage,
  type TravelScope,
  type VekalatForm,
  type VekalatOk,
} from "@/lib/vekalat/present";

const options = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

const OUTCOME_OPTIONS = (Object.keys(OUTCOMES) as Outcome[]).map((value) => ({
  value,
  label: OUTCOMES[value].title,
}));

/** A heading and its fields, separated from the previous group by a rule. */
function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 border-t border-line pt-8">
      <h3 id={id} className="text-lg font-bold text-ink">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function VekalatCalculator() {
  const id = useId();
  const [form, setForm] = useState<VekalatForm>(sampleForm);
  const set = <K extends keyof VekalatForm>(key: K, value: VekalatForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const { subject } = form;
  const item = selectedItem(form);
  const input = toVekalatInput(form);
  const result = input ? calculateVekalat(input) : null;

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
            موضوع وکالت
          </h2>
          <p className="mt-1 text-sm text-muted">{vekalatCopy.privacy}</p>
        </div>

        <div className="flex flex-col gap-5">
          <SegmentedControl
            legend="موضوع"
            name="subject"
            value={subject}
            onValueChange={(value) => set("subject", value as VekalatForm["subject"])}
            options={SUBJECTS.map((value) => ({ value, label: SUBJECT_LABELS[value] }))}
          />

          {subject === "financial" && (
            <>
              <div className="flex flex-col gap-1.5">
                <MoneyField
                  label="بهای خواسته"
                  name="value"
                  unit="ریال"
                  defaultValue={form.value ?? undefined}
                  onValueChange={(value) => set("value", value)}
                />
                {form.value !== null && form.value > 0 && (
                  <p className="text-sm text-muted tabular-nums">{amountInWords(form.value)}</p>
                )}
              </div>
              <Select
                label="قطعیت حکم بدوی از حیث بهای خواسته"
                placeholder={null}
                options={options(FINALITY_LABELS)}
                value={form.finality}
                onChange={(event) => set("finality", event.target.value as Finality)}
              />
            </>
          )}

          {(subject === "nonFinancial" || subject === "criminal" || subject === "other") && (
            <Select
              label="نوع موضوع"
              placeholder={null}
              title={item?.title}
              options={ITEM_LISTS[subject].map((candidate) => ({
                value: candidate.id,
                label: candidate.title,
              }))}
              value={form.items[subject]}
              onChange={(event) =>
                set("items", { ...form.items, [subject as ListSubject]: event.target.value })
              }
            />
          )}
          {item && (
            <p className="-mt-2 text-sm text-muted">
              {item.article}
              {/* A closed select cuts long titles off; the full one is here. */}
              <span className="block text-ink">{item.title}</span>
            </p>
          )}
          {item?.unit === "ساعت" && (
            <TextField
              label="تعداد ساعت"
              name="hours"
              inputMode="decimal"
              autoComplete="off"
              hint="اعشار مجاز است، مثلاً ۱٫۵"
              value={form.hours}
              onChange={(event) => set("hours", event.target.value)}
              className="tabular-nums"
            />
          )}

          {subject === "criminal" && (
            <>
              <Stepper
                label="تعداد جرایم اضافه بر جرم اشد"
                hint="هر جرم اضافه ۲۰٪ به حق‌الوکاله می‌افزاید (تبصره ۳ ماده ۱۴)."
                value={form.extraCrimes}
                max={20}
                onValueChange={(value) => set("extraCrimes", value)}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Checkbox
                  name="no-dadsara"
                  label="رسیدگی مرحله دادسرا ندارد"
                  checked={form.noDadsara}
                  onCheckedChange={(checked) => set("noDadsara", checked)}
                />
                <Checkbox
                  name="criminal-final"
                  label="حکم بدوی قطعی است"
                  checked={form.criminalFinal}
                  onCheckedChange={(checked) => set("criminalFinal", checked)}
                />
              </div>
            </>
          )}

          {subject === "execution" && (
            <>
              <Select
                label="نوع امر اجرایی"
                placeholder={null}
                options={options(EXECUTION_LABELS)}
                value={form.executionItem}
                onChange={(event) => set("executionItem", event.target.value as ExecutionItem)}
              />
              {form.executionItem === "judgment" && (
                <div className="flex flex-col gap-1.5">
                  <MoneyField
                    label="مبلغ محکوم‌به یا مورد اجرا"
                    name="execution-value"
                    unit="ریال"
                    defaultValue={form.executionValue ?? undefined}
                    onValueChange={(value) => set("executionValue", value)}
                  />
                  {form.executionValue !== null && form.executionValue > 0 && (
                    <p className="text-sm text-muted tabular-nums">
                      {amountInWords(form.executionValue)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <FormGroup title="شرایط پرونده">
          {isCivilLike(subject) && (
            <>
              <Select
                label="نتیجه دعوا"
                placeholder={null}
                options={OUTCOME_OPTIONS}
                value={form.outcome}
                onChange={(event) => set("outcome", event.target.value as Outcome)}
              />
              <Select
                label="ورود، جلب یا اعتراض ثالث، یا دعوای تقابل"
                placeholder={null}
                options={options(THIRD_PARTY_LABELS)}
                value={form.thirdPartyStage}
                onChange={(event) =>
                  set("thirdPartyStage", event.target.value as ThirdPartyStage)
                }
              />
              <Checkbox
                name="settlement"
                label="صلح و سازش یا ارجاع به داوری"
                description="حق‌الوکاله کل دعوا تعلق می‌گیرد (ماده ۲۳)."
                checked={form.settlement}
                onCheckedChange={(checked) => set("settlement", checked)}
              />
            </>
          )}
          <div className="grid grid-cols-1 gap-3">
            <Checkbox
              name="after-reversal"
              label="وکالت پس از نقض رأی (ماده ۱۸)"
              checked={form.afterReversal}
              onCheckedChange={(checked) => set("afterReversal", checked)}
            />
            <Checkbox
              name="specialist"
              label="وکیل گواهی وکالت تخصصی دارد (تبصره ماده ۲۲)"
              checked={form.specialist}
              onCheckedChange={(checked) => set("specialist", checked)}
            />
            <Checkbox
              name="appointed"
              label="وکالت تسخیری یا معاضدتی (ماده ۸)"
              checked={form.appointed}
              onCheckedChange={(checked) => set("appointed", checked)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stepper
              label="تعداد وکلا"
              value={form.lawyers}
              min={1}
              max={10}
              onValueChange={(value) => set("lawyers", value)}
            />
            <Stepper
              label="روزهای سفر"
              value={form.travelDays}
              max={60}
              onValueChange={(value) => set("travelDays", value)}
            />
          </div>
          <RadioCards
            legend="محل سفر"
            name="travel-scope"
            columns={2}
            defaultValue={form.travelScope}
            onValueChange={(value) => set("travelScope", value as TravelScope)}
            options={(Object.keys(TRAVEL_LABELS) as TravelScope[]).map((value) => ({
              value,
              title: TRAVEL_LABELS[value],
            }))}
          />
        </FormGroup>

        <FormGroup title="تمبر مالیاتی">
          <RadioCards
            legend="مرجع صدور پروانه وکیل"
            name="issuer"
            columns={2}
            defaultValue={form.issuer}
            onValueChange={(value) => set("issuer", value as Issuer)}
            options={(Object.keys(ISSUER_LABELS) as Issuer[]).map((value) => ({
              value,
              ...ISSUER_LABELS[value],
            }))}
          />
          <MoneyField
            label="مبلغ حق‌الوکاله در وکالت‌نامه"
            name="agreed-fee"
            unit="ریال"
            optional
            hint={vekalatCopy.agreedFeeHint}
            onValueChange={(value) => set("agreedFee", value)}
          />
          <div className="grid grid-cols-1 gap-3">
            <Checkbox
              name="relative-free"
              label="وکالت تبرعی برای اقربا (ماده ۷)"
              checked={form.relativeFree}
              onCheckedChange={(checked) => set("relativeFree", checked)}
            />
            <Checkbox
              name="government-client"
              label="موکل دستگاه دولتی یا شهرداری است (ماده ۳۳)"
              checked={form.governmentClient}
              onCheckedChange={(checked) => set("governmentClient", checked)}
            />
          </div>
        </FormGroup>
      </form>

      {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
        {result === null && (
          <EmptyState
            Icon={Calculator}
            title={subject === "execution" ? "مبلغ محکوم‌به را وارد کنید" : "بهای خواسته را وارد کنید"}
            description="نتیجه با هر تغییر، همین‌جا به‌روز می‌شود."
          />
        )}
        {result?.ok === false && (
          <Alert tone="danger" live title="محاسبه انجام نشد">
            {faText(result.error)}
          </Alert>
        )}
        {result?.ok && <VekalatResultView result={result} form={form} />}
      </div>
    </div>
  );
}

/** One of the three key figures. */
function Figure({
  label,
  value,
  primary,
  className,
  children,
}: {
  label: string;
  value: string;
  primary?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-md border p-4",
        primary ? "border-primary-line bg-primary-soft" : "border-line bg-surface",
        className,
      )}
    >
      <dt className={cn("text-sm", primary ? "font-semibold text-ink" : "text-muted")}>{label}</dt>
      <dd
        className={cn(
          "font-bold tabular-nums",
          primary ? "text-2xl text-primary" : "text-lg text-ink",
        )}
      >
        {value}
      </dd>
      {children}
    </div>
  );
}

function VekalatResultView({ result, form }: { result: VekalatOk; form: VekalatForm }) {
  const { stamp, stages } = result;
  const stageTotals = stages.reduce(
    (sum, stage) => ({
      min: sum.min + stage.fee.min,
      max: sum.max + stage.fee.max,
      stamp: sum.stamp + stage.stamp,
      share: sum.share + stage.share,
      total: sum.total + stage.total,
    }),
    { min: 0, max: 0, stamp: 0, share: 0, total: 0 },
  );
  const nowrap = (text: string) => (
    <span className="whitespace-nowrap tabular-nums">{text}</span>
  );
  const stageRows: ReactNode[][] = stages.map((stage) => [
    stage.title,
    nowrap(rangeText(stage.fee)),
    nowrap(rial(stage.stamp)),
    nowrap(rial(stage.share)),
    nowrap(rial(stage.total)),
  ]);
  if (stages.length > 1) {
    stageRows.push([
      <span key="sum" className="font-bold">
        جمع
      </span>,
      nowrap(rangeText({ min: stageTotals.min, max: stageTotals.max })),
      nowrap(rial(stageTotals.stamp)),
      nowrap(rial(stageTotals.share)),
      <span key="total" className="whitespace-nowrap font-bold tabular-nums">
        {rial(stageTotals.total)}
      </span>,
    ]);
  }

  return (
    <ResultCard
      title="نتیجه محاسبه"
      rows={[]}
      body={
        <div className="flex flex-col gap-6">
          {result.warnings.map((warning) => (
            <Alert key={warning} tone="warning">
              {faText(warning)}
            </Alert>
          ))}

          <dl className="grid grid-cols-2 gap-3">
            <Figure
              label="حق‌الوکاله طبق تعرفه"
              value={rangeText(result.fee)}
              primary
              className="col-span-2"
            >
              {!result.isRange && (
                <dd className="text-sm text-muted">{amountInWords(result.fee.max)}</dd>
              )}
              <dd className="text-sm text-ink">
                {faText(result.title)}، {result.article}
              </dd>
              {form.lawyers > 1 && (
                <dd className="text-sm text-ink tabular-nums">
                  سهم هر وکیل ({toPersianDigits(form.lawyers)} وکیل): {rangeText(result.perLawyer)}
                </dd>
              )}
            </Figure>
            <Figure label="جمع تمبر" value={rial(stamp.total)} />
            <Figure label={stamp.shareLabel} value={rial(stamp.share)} />
          </dl>

          {result.steps.length > 0 && (
            <div>
              <h3 className="font-bold text-ink">مراحل محاسبه</h3>
              <dl className="mt-2 divide-y divide-line border-y border-line">
                {result.steps.map((step) => (
                  <div
                    key={step.label}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
                  >
                    <dt className="min-w-0 text-sm text-muted">{faText(step.label)}</dt>
                    <dd className="font-semibold text-ink tabular-nums">
                      {rangeText(step.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-ink">تقسیم بین مراحل</h3>
            <Table
              caption="حق‌الوکاله، تمبر و سهم هر مرحله"
              head={["مرحله", "حق‌الوکاله", "تمبر", stamp.shareLabel, "جمع تمبر و سهم"]}
              rows={stageRows}
            />
            <p className="text-sm text-muted">
              {stamp.exempt ? faText(stamp.exempt) : `مبنای تمبر: ${stamp.base}`}
            </p>
          </div>

          {result.travel > 0 && (
            <div className="flex items-start gap-3 rounded-md border border-info-line bg-info-surface p-4 text-info-ink">
              <Plane aria-hidden="true" className="mt-1 size-5 shrink-0" />
              <div>
                <p className="font-bold">فوق‌العاده مأموریت (ماده ۳۰)</p>
                <p className="text-lg font-bold tabular-nums">{rial(result.travel)}</p>
                <p className="text-sm">
                  {toPersianDigits(form.travelDays)} روز سفر {TRAVEL_LABELS[form.travelScope]}؛
                  جدا از حق‌الوکاله.
                </p>
              </div>
            </div>
          )}
        </div>
      }
      notes={result.notes.map(faText)}
    >
      <CopyButton text={buildSummary(result, form)} />
    </ResultCard>
  );
}
