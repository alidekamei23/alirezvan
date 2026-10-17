"use client";
// ErsCalculator — the inheritance-share calculator: the deceased and spouse, the three
// classes of heirs, and an optional estate. Every change recalculates at once; nothing
// leaves the browser (family details are sensitive). The rules are
// lib/ers/ers-calc.ts and are only called here.
// Usage: <ErsCalculator /> (once, on /tools/sahm-ol-ers)
import { useId, useRef, useState, type ReactNode } from "react";
import { Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Badge, type BadgeTone } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { MoneyField } from "@/components/MoneyField";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard } from "@/components/ResultCard";
import { Select } from "@/components/Select";
import { ShareBar } from "@/components/ShareBar";
import { Stepper } from "@/components/Stepper";
import { Table } from "@/components/Table";
import { ersCopy } from "@/content/ers";
import { cn } from "@/lib/cn";
import { formatToman, toPersianDigits } from "@/lib/format";
import { calculateErs, type Frac } from "@/lib/ers/ers-calc";
import {
  GRANDPARENT_KEYS,
  GRANDPARENT_LABELS,
  HAKEM_BASIS,
  HAKEM_LABEL,
  SIDE_HINTS,
  SIDE_LABELS,
  UNCLE_LABELS,
  UNCLE_RELATIVES,
  UNCLE_SIDES,
  buildSummary,
  classStatus,
  colorShares,
  emptyForm,
  fracDisplay,
  hasAnyHeir,
  percentText,
  resultTitle,
  sampleForm,
  toErsInput,
  type ClassStatus,
  type ErsForm,
  type ErsOk,
  type GrandchildRow,
  type NephewRow,
  type Side,
} from "@/lib/ers/present";

const STATUS_TONES: Record<ClassStatus["kind"], BadgeTone> = {
  none: "neutral",
  entered: "neutral",
  inherits: "success",
  excluded: "warning",
};

const SIDES: Side[] = ["full", "paternal", "maternal"];
const SIDE_OPTIONS = SIDES.map((side) => ({
  value: side,
  label: `${SIDE_LABELS[side]} (${SIDE_HINTS[side]})`,
}));
const SIBLING_SIDES = [
  { side: "full", brothers: "fullBrothers", sisters: "fullSisters" },
  { side: "paternal", brothers: "patBrothers", sisters: "patSisters" },
  { side: "maternal", brothers: "matBrothers", sisters: "matSisters" },
] as const;

/** A fraction that keeps its order inside right-to-left text. */
function Fraction({ value, lcd }: { value: Frac; lcd?: bigint }) {
  return (
    <bdi dir="ltr" className="whitespace-nowrap tabular-nums">
      {fracDisplay(value, lcd)}
    </bdi>
  );
}

/** One class of heirs: heading, status pill, help text and fields. */
function ClassGroup({
  title,
  status,
  hint,
  children,
}: {
  title: string;
  status: ClassStatus;
  hint?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 border-t border-line pt-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 id={id} className="text-lg font-bold text-ink">
            {title}
          </h3>
          <Badge tone={STATUS_TONES[status.kind]}>{status.text}</Badge>
        </div>
        {hint && <div className="max-w-reading text-sm text-muted">{hint}</div>}
      </div>
      {children}
    </section>
  );
}

/** Rows of deceased children or siblings, greyed out while a closer heir excludes them. */
function BranchGroup({
  title,
  hint,
  inactiveNote,
  children,
}: {
  title: string;
  hint: string;
  inactiveNote?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cn(
        "flex flex-col gap-4 rounded-md border p-4 transition-colors sm:p-5",
        inactiveNote ? "border-dashed border-line-strong bg-surface-muted" : "border-line bg-page",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h4 id={id} className="font-bold text-ink">
            {title}
          </h4>
          {inactiveNote && <Badge>ارث نمی‌برند</Badge>}
        </div>
        <p className="text-sm text-muted">{inactiveNote ?? hint}</p>
      </div>
      {children}
    </div>
  );
}

function RowShell({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-sm border border-line bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p id={id} className="font-semibold text-ink">
          {title}
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 />}
          aria-label={`حذف ${title}`}
          onClick={onRemove}
        >
          حذف
        </Button>
      </div>
      {children}
    </div>
  );
}

export function ErsCalculator() {
  const id = useId();
  const nextId = useRef(1);
  const addGrandchildRef = useRef<HTMLDivElement>(null);
  const addNephewRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ErsForm>(sampleForm);
  // Bumped by «پاک کردن فرم» so uncontrolled fields (amounts, radio cards) start over.
  const [formKey, setFormKey] = useState(0);
  const [useLcd, setUseLcd] = useState(false);

  const set = <K extends keyof ErsForm>(key: K, value: ErsForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const updateGrandchild = (rowId: number, patch: Partial<GrandchildRow>) =>
    setForm((current) => ({
      ...current,
      grandchildren: current.grandchildren.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    }));
  const updateNephew = (rowId: number, patch: Partial<NephewRow>) =>
    setForm((current) => ({
      ...current,
      nephews: current.nephews.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));

  const clear = () => {
    setForm(emptyForm());
    setFormKey((key) => key + 1);
    setUseLcd(false);
  };

  const result = hasAnyHeir(form) ? calculateErs(toErsInput(form)) : null;
  const hasChildren = form.sons + form.daughters > 0;
  const hasSiblings =
    form.fullBrothers + form.fullSisters + form.patBrothers + form.patSisters +
      form.matBrothers + form.matSisters >
    0;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <form
        key={formKey}
        noValidate
        aria-labelledby={`${id}-form-title`}
        onSubmit={(event) => event.preventDefault()}
        className="flex min-w-0 flex-col gap-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 id={`${id}-form-title`} className="text-xl font-bold text-ink">
              متوفی و وراث
            </h2>
            <p className="mt-1 text-sm text-muted">{ersCopy.privacy}</p>
          </div>
          <Button variant="ghost" size="sm" icon={<RotateCcw />} onClick={clear}>
            پاک کردن فرم
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <RadioCards
            legend="متوفی"
            name="deceased"
            columns={2}
            defaultValue={form.deceased}
            onValueChange={(value) => set("deceased", value as ErsForm["deceased"])}
            options={[
              { value: "m", title: "مرد" },
              { value: "f", title: "زن" },
            ]}
          />
          {form.deceased === "m" ? (
            <Stepper
              label="تعداد زوجه دائم زنده"
              hint="از صفر تا چهار."
              value={form.wives}
              max={4}
              onValueChange={(value) => set("wives", value)}
            />
          ) : (
            <Checkbox
              name="husband"
              label="زوج (شوهر) زنده است"
              checked={form.husband}
              onCheckedChange={(checked) => set("husband", checked)}
            />
          )}
        </div>

        <ClassGroup
          title="طبقه اول: پدر، مادر و فرزندان"
          status={classStatus(1, form, result)}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Checkbox
              name="father"
              label="پدر زنده است"
              checked={form.father}
              onCheckedChange={(checked) => set("father", checked)}
            />
            <Checkbox
              name="mother"
              label="مادر زنده است"
              checked={form.mother}
              onCheckedChange={(checked) => set("mother", checked)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stepper label="پسر" value={form.sons} onValueChange={(value) => set("sons", value)} />
            <Stepper
              label="دختر"
              value={form.daughters}
              onValueChange={(value) => set("daughters", value)}
            />
          </div>
          <Checkbox
            name="pregnancy"
            label="حمل در زمان فوت (ماده ۸۷۸)"
            description="فرزندی که هنگام فوت متوفی هنوز متولد نشده بود."
            checked={form.pregnancy}
            onCheckedChange={(checked) => set("pregnancy", checked)}
          />

          <BranchGroup
            title="نوه‌ها"
            hint="اگر فرزندی پیش از متوفی فوت کرده، فرزندان او را اینجا وارد کنید."
            inactiveNote={
              hasChildren && form.grandchildren.length > 0
                ? "با وجود پسر یا دختر زنده، نوه‌ها ارث نمی‌برند (ماده ۹۱۰)."
                : undefined
            }
          >
            {form.grandchildren.map((row, index) => {
              const title = toPersianDigits(`فرزند فوت‌شده ${index + 1}`);
              return (
                <RowShell
                  key={row.id}
                  title={title}
                  onRemove={() => {
                    set(
                      "grandchildren",
                      form.grandchildren.filter((candidate) => candidate.id !== row.id),
                    );
                    addGrandchildRef.current?.querySelector("button")?.focus();
                  }}
                >
                  <RadioCards
                    legend="فرزند فوت‌شده"
                    name={`grandchild-via-${row.id}`}
                    columns={2}
                    defaultValue={row.via}
                    onValueChange={(value) =>
                      updateGrandchild(row.id, { via: value as GrandchildRow["via"] })
                    }
                    options={[
                      { value: "m", title: "پسر" },
                      { value: "f", title: "دختر" },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Stepper
                      label="نوه پسر"
                      fullLabel={`نوه پسر از ${title}`}
                      value={row.sons}
                      onValueChange={(value) => updateGrandchild(row.id, { sons: value })}
                    />
                    <Stepper
                      label="نوه دختر"
                      fullLabel={`نوه دختر از ${title}`}
                      value={row.daughters}
                      onValueChange={(value) => updateGrandchild(row.id, { daughters: value })}
                    />
                  </div>
                </RowShell>
              );
            })}
            <div ref={addGrandchildRef}>
              <Button
                variant="secondary"
                icon={<Plus />}
                onClick={() =>
                  set("grandchildren", [
                    ...form.grandchildren,
                    { id: nextId.current++, via: "m", sons: 0, daughters: 0 },
                  ])
                }
              >
                افزودن فرزند فوت‌شده
              </Button>
            </div>
          </BranchGroup>
        </ClassGroup>

        <ClassGroup
          title="طبقه دوم: اجداد، برادر و خواهر"
          status={classStatus(2, form, result)}
          hint={
            <>
              <p>{ersCopy.hajibHint}</p>
              <p className="mt-1">{ersCopy.sideHint}</p>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3">
            {SIBLING_SIDES.map(({ side, brothers, sisters }) => (
              <fieldset
                key={side}
                className="flex min-w-0 flex-col gap-3 rounded-md border border-line bg-surface p-4"
              >
                <legend className="sr-only">برادر و خواهر {SIDE_LABELS[side]}</legend>
                <p aria-hidden="true" className="font-bold text-ink">
                  {SIDE_LABELS[side]}
                  <span className="block text-sm font-normal text-muted">{SIDE_HINTS[side]}</span>
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Stepper
                    label="برادر"
                    fullLabel={`برادر ${SIDE_LABELS[side]}`}
                    value={form[brothers]}
                    onValueChange={(value) => set(brothers, value)}
                  />
                  <Stepper
                    label="خواهر"
                    fullLabel={`خواهر ${SIDE_LABELS[side]}`}
                    value={form[sisters]}
                    onValueChange={(value) => set(sisters, value)}
                  />
                </div>
              </fieldset>
            ))}
          </div>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-1.5 text-base font-semibold text-ink">اجداد زنده</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GRANDPARENT_KEYS.map((key) => (
                <Checkbox
                  key={key}
                  name={key}
                  label={GRANDPARENT_LABELS[key]}
                  checked={form[key]}
                  onCheckedChange={(checked) => set(key, checked)}
                />
              ))}
            </div>
          </fieldset>

          <BranchGroup
            title="برادرزاده و خواهرزاده"
            hint="اگر برادر یا خواهری پیش از متوفی فوت کرده، فرزندان او را اینجا وارد کنید."
            inactiveNote={
              hasSiblings && form.nephews.length > 0
                ? "با وجود برادر یا خواهر زنده، برادرزاده و خواهرزاده ارث نمی‌برند (ماده ۹۲۵)."
                : undefined
            }
          >
            {form.nephews.map((row, index) => {
              const title = toPersianDigits(`برادر یا خواهر فوت‌شده ${index + 1}`);
              return (
                <RowShell
                  key={row.id}
                  title={title}
                  onRemove={() => {
                    set(
                      "nephews",
                      form.nephews.filter((candidate) => candidate.id !== row.id),
                    );
                    addNephewRef.current?.querySelector("button")?.focus();
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                      label="نسبت"
                      placeholder={null}
                      options={SIDE_OPTIONS}
                      value={row.side}
                      onChange={(event) =>
                        updateNephew(row.id, { side: event.target.value as Side })
                      }
                    />
                    <Select
                      label="فوت‌شده"
                      placeholder={null}
                      options={[
                        { value: "m", label: "برادر" },
                        { value: "f", label: "خواهر" },
                      ]}
                      value={row.via}
                      onChange={(event) =>
                        updateNephew(row.id, { via: event.target.value as NephewRow["via"] })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Stepper
                      label="پسر"
                      fullLabel={`پسر ${title}`}
                      value={row.sons}
                      onValueChange={(value) => updateNephew(row.id, { sons: value })}
                    />
                    <Stepper
                      label="دختر"
                      fullLabel={`دختر ${title}`}
                      value={row.daughters}
                      onValueChange={(value) => updateNephew(row.id, { daughters: value })}
                    />
                  </div>
                </RowShell>
              );
            })}
            <div ref={addNephewRef}>
              <Button
                variant="secondary"
                icon={<Plus />}
                onClick={() =>
                  set("nephews", [
                    ...form.nephews,
                    { id: nextId.current++, side: "full", via: "m", sons: 0, daughters: 0 },
                  ])
                }
              >
                افزودن برادر یا خواهر فوت‌شده
              </Button>
            </div>
          </BranchGroup>
        </ClassGroup>

        <ClassGroup
          title="طبقه سوم: عمو، عمه، دایی و خاله"
          status={classStatus(3, form, result)}
          hint={ersCopy.uncleHint}
        >
          <div className="grid grid-cols-1 gap-3">
            {UNCLE_RELATIVES.map(({ name, keys }) => (
              <fieldset
                key={name}
                className="flex min-w-0 flex-col gap-3 rounded-md border border-line bg-surface p-4"
              >
                <legend className="sr-only">{name}</legend>
                <p aria-hidden="true" className="font-bold text-ink">
                  {name}
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {keys.map((key, index) => (
                    <Stepper
                      key={key}
                      label={SIDE_LABELS[UNCLE_SIDES[index]]}
                      fullLabel={UNCLE_LABELS[key]}
                      value={form[key]}
                      onValueChange={(value) => set(key, value)}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </ClassGroup>

        <section
          aria-labelledby={`${id}-estate`}
          className="flex flex-col gap-5 border-t border-line pt-8"
        >
          <div>
            <h3 id={`${id}-estate`} className="text-lg font-bold text-ink">
              ترکه
            </h3>
            <p className="mt-1 text-sm text-muted">{ersCopy.estateHint}</p>
          </div>
          <MoneyField
            label="ارزش کل ترکه"
            name="estate"
            optional
            onValueChange={(value) => set("estate", value)}
          />
          <MoneyField
            label="کفن، دیون و واجبات مالی"
            name="debts"
            optional
            onValueChange={(value) => set("debts", value)}
          />
          <MoneyField
            label="مبلغ وصیت"
            name="will"
            optional
            onValueChange={(value) => set("will", value)}
          />
          <Checkbox
            name="will-approved"
            label="ورثه وصیتِ بیش از ثلث را اجازه داده‌اند"
            checked={form.willApproved}
            onCheckedChange={(checked) => set("willApproved", checked)}
          />
        </section>
      </form>

      {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
        {result === null && (
          <EmptyState
            Icon={Users}
            title="وارثی وارد نشده است"
            description="دست‌کم یک وارث را وارد کنید؛ نتیجه با هر تغییر همین‌جا به‌روز می‌شود."
          />
        )}
        {result?.ok === false && (
          <Alert tone="danger" live title="محاسبه انجام نشد">
            {toPersianDigits(result.error)}
          </Alert>
        )}
        {result?.ok && (
          <ErsResultView result={result} form={form} useLcd={useLcd} onUseLcd={setUseLcd} />
        )}
      </div>
    </div>
  );
}

function ErsResultView({
  result,
  form,
  useLcd,
  onUseLcd,
}: {
  result: ErsOk;
  form: ErsForm;
  useLcd: boolean;
  onUseLcd: (value: boolean) => void;
}) {
  const shares = colorShares(result.shares);
  const lcd = useLcd ? result.lcd : undefined;
  const money = result.money;
  const hasHakem = !result.hakem.isZero();

  const parts = [
    ...shares.map((share) => ({
      key: share.key,
      label: share.count > 1 ? `${share.label} (${toPersianDigits(share.count)} نفر)` : share.label,
      value: share.total.toNumber(),
      percent: percentText(share.total),
      color: share.color,
      pattern: share.reserved ? ("reserved" as const) : undefined,
    })),
    ...(hasHakem
      ? [
          {
            key: "hakem",
            label: HAKEM_LABEL,
            value: result.hakem.toNumber(),
            percent: percentText(result.hakem),
            color: "bg-ink",
          },
        ]
      : []),
  ];

  const head = ["وارث", "تعداد", "سهم هر نفر", "درصد", ...(money ? ["مبلغ هر نفر"] : []), "مبنا"];
  const rows: ReactNode[][] = shares.map((share) => [
    <span key="name" className="flex items-baseline gap-2">
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 shrink-0 translate-y-px rounded-full",
          share.reserved ? "border border-line-strong" : share.color,
        )}
      />
      <span>
        {share.label}
        {share.count > 1 && (
          <span className="block text-sm font-normal text-muted">
            جمع سهم: <Fraction value={share.total} lcd={lcd} /> ({percentText(share.total)})
          </span>
        )}
        {share.reserved && (
          <span className="block text-sm font-normal">کنار گذاشته؛ هنوز قطعی نیست</span>
        )}
      </span>
    </span>,
    <span key="count" className="tabular-nums">
      {toPersianDigits(share.count)}
    </span>,
    <Fraction key="each" value={share.each} lcd={lcd} />,
    <span key="pct" className="whitespace-nowrap tabular-nums">
      {percentText(share.each)}
    </span>,
    ...(money
      ? [
          <span key="money" className="whitespace-nowrap tabular-nums">
            {formatToman(money.perShare(share).each)}
          </span>,
        ]
      : []),
    <span key="basis" className="text-sm">
      {share.basis}
    </span>,
  ]);
  if (hasHakem) {
    rows.push([
      <span key="name" className="flex items-baseline gap-2">
        <span aria-hidden="true" className="size-2.5 shrink-0 translate-y-px rounded-full bg-ink" />
        <span>{HAKEM_LABEL}</span>
      </span>,
      "—",
      <Fraction key="each" value={result.hakem} lcd={lcd} />,
      <span key="pct" className="whitespace-nowrap tabular-nums">
        {percentText(result.hakem)}
      </span>,
      ...(money
        ? [
            <span key="money" className="whitespace-nowrap tabular-nums">
              {formatToman(Math.round(result.hakem.toNumber() * money.net))}
            </span>,
          ]
        : []),
      <span key="basis" className="text-sm">
        {HAKEM_BASIS}
      </span>,
    ]);
  }
  const mutedRows = shares.flatMap((share, index) => (share.reserved ? [index] : []));

  return (
    <ResultCard
      title={resultTitle(result, form)}
      rows={[]}
      body={
        <div className="flex flex-col gap-6">
          {result.warnings.map((warning) => (
            <Alert key={warning} tone="warning">
              {toPersianDigits(warning)}
            </Alert>
          ))}

          <ShareBar label="سهم هر گروه از ترکه" parts={parts} />

          {money && (
            <dl className="divide-y divide-line border-y border-line">
              {[
                { label: "ترکه", value: money.estate },
                { label: "دیون و هزینه‌ها", value: money.debts },
                { label: "وصیت نافذ", value: money.will },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5"
                >
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{formatToman(row.value)}</dd>
                </div>
              ))}
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 py-3">
                <dt className="font-bold text-ink">قابل تقسیم بین وراث</dt>
                <dd className="text-xl font-bold tabular-nums text-primary">
                  {formatToman(money.net)}
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-col gap-3">
            <Checkbox
              name="lcd"
              label="نمایش با مخرج مشترک"
              description={`همه سهم‌ها از ${toPersianDigits(String(result.lcd))} سهم`}
              checked={useLcd}
              onCheckedChange={onUseLcd}
            />
            <Table caption="سهم هر وارث" head={head} rows={rows} mutedRows={mutedRows} />
          </div>
        </div>
      }
      notes={result.notes.map((note) => toPersianDigits(note))}
    >
      <CopyButton text={buildSummary(result, form, useLcd)} />
    </ResultCard>
  );
}
