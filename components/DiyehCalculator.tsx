"use client";
// DiyehCalculator — the diyeh calculator: the basis (victim, rate year, kind of crime,
// sacred month, a deceased victim), then injuries added one by one from the list of
// articles, as an injury to an organ, or as an arsh or custom share. Every change
// recalculates at once; nothing leaves the browser. Amounts, fractions and rules are
// lib/diyeh/diyeh-calc.ts and are only called here (through lib/diyeh/present.ts).
// Usage: <DiyehCalculator /> (once, on /tools/diyeh)
import { useId, useRef, useState, type ReactNode } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Combobox } from "@/components/Combobox";
import { CopyButton } from "@/components/CopyButton";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { ResultCard } from "@/components/ResultCard";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Select } from "@/components/Select";
import { Stepper } from "@/components/Stepper";
import { Table } from "@/components/Table";
import { TextField } from "@/components/TextField";
import { diyehCopy } from "@/content/diyeh";
import { toPersianDigits } from "@/lib/format";
import {
  CATEGORIES,
  CRIME_TYPES,
  DIYEH_RATES,
  ITEMS,
  ORGANS,
  ORGAN_INJURIES,
  VICTIMS,
  calculateDiyeh,
  formatRial,
  numberToWords,
  parseAmount,
  type Line,
  type Victim,
} from "@/lib/diyeh/diyeh-calc";
import type { CrimeType } from "@/lib/diyeh/diyeh-data";
import {
  CRIME_KEYS,
  NAFS,
  NAFS_TITLE,
  VICTIM_KEYS,
  addLine,
  buildSummary,
  calculateRows,
  categoriesFor,
  cleanTitle,
  customRateValue,
  dueText,
  formatAmountText,
  fracLabel,
  fracPhrase,
  initialSettings,
  itemFits,
  itemFracPhrase,
  itemsFor,
  lineAmountText,
  qtyOf,
  toDiyehInput,
  type DiyehOk,
  type DiyehRow,
  type DiyehSettings,
} from "@/lib/diyeh/present";
import { rial, tomanEquivalent } from "@/lib/tadieh/present";

const VICTIM_OPTIONS = VICTIM_KEYS.map((key) => ({ value: key, label: VICTIMS[key] }));
const RATE_OPTIONS = Object.keys(DIYEH_RATES)
  .map(Number)
  .sort((a, b) => b - a)
  .map((year) => ({
    value: String(year),
    label: `${toPersianDigits(year)}: ${rial(DIYEH_RATES[year])}`,
  }));
const CRIME_OPTIONS = [
  { value: "", label: "مشخص نیست" },
  ...CRIME_KEYS.map((key) => ({ value: key, label: CRIME_TYPES[key].title })),
];
const CATEGORY_TITLES = new Map(CATEGORIES.map((category) => [category.id as string, category.title]));

type Tab = "list" | "organ" | "custom";
const TAB_OPTIONS = [
  { value: "list", label: "فهرست مواد قانونی" },
  { value: "organ", label: "جنایت بر عضو" },
  { value: "custom", label: "ارش یا مقدار دلخواه" },
];

/** Returns the engine's message when the line is refused, null when it was added. */
type AddLine = (line: Line) => string | null;

/** A fraction that keeps its order inside right-to-left text. */
function Fraction({ children }: { children: string }) {
  return (
    <bdi dir="ltr" className="whitespace-nowrap tabular-nums">
      {children}
    </bdi>
  );
}

/** «حکم»: the article, the fraction and the notes of what is about to be added. */
function RulingBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-sm text-muted">حکم</p>
      <p className="mt-1 font-semibold text-ink">{title}</p>
      <div className="mt-3 flex flex-col gap-2 text-sm text-ink">{children}</div>
    </div>
  );
}

/** «افزودن» and, under it, the engine's reason when the injury was refused. */
function AddButton({
  onAdd,
  error,
  disabledText,
}: {
  onAdd: () => void;
  error: string | null;
  disabledText?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button icon={<Plus />} onClick={onAdd} disabled={Boolean(disabledText)}>
          {disabledText ?? "افزودن"}
        </Button>
      </div>
      {error && (
        <Alert tone="danger" live title="اضافه نشد">
          {toPersianDigits(error)}
        </Alert>
      )}
    </div>
  );
}

/** A rial amount typed freely and grouped with separators once the field is left. */
function AmountField({
  label,
  hint,
  optional,
  error,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <TextField
      label={label}
      hint={hint}
      optional={optional}
      error={error}
      inputMode="decimal"
      autoComplete="off"
      className="tabular-nums"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onBlur={() => onValueChange(formatAmountText(value))}
    />
  );
}

/** A number typed with Persian, Arabic or Latin digits («٫» for the decimal point). */
function NumberField({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <TextField
      label={label}
      hint={hint}
      inputMode="decimal"
      autoComplete="off"
      className="tabular-nums"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    />
  );
}

export function DiyehCalculator() {
  const id = useId();
  const nextKey = useRef(1);
  const [settings, setSettings] = useState<DiyehSettings>(initialSettings);
  const [rows, setRows] = useState<DiyehRow[]>([]);
  // Bumped by «پاک کردن همه» so the injury fields start over too.
  const [formKey, setFormKey] = useState(0);

  const set = <K extends keyof DiyehSettings>(key: K, value: DiyehSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const add: AddLine = (line) => {
    const added = addLine(rows, line, settings, nextKey.current);
    if (!added.ok) return added.error;
    nextKey.current++;
    setRows(added.rows);
    return null;
  };

  const clear = () => {
    setSettings(initialSettings());
    setRows([]);
    setFormKey((key) => key + 1);
  };

  const rateError = customRateValue(settings.customRate).error;
  const result = calculateRows(settings, rows);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
      <form
        key={formKey}
        noValidate
        aria-labelledby={`${id}-basis`}
        onSubmit={(event) => event.preventDefault()}
        className="flex min-w-0 flex-col gap-10"
      >
        <section aria-labelledby={`${id}-basis`} className="flex flex-col gap-5">
          <div>
            <h2 id={`${id}-basis`} className="text-xl font-bold text-ink">
              مبنای محاسبه
            </h2>
            <p className="mt-1 text-sm text-muted">{diyehCopy.privacy}</p>
          </div>

          <SegmentedControl
            legend="مجنی‌علیه"
            name="victim"
            options={VICTIM_OPTIONS}
            value={settings.victim}
            onValueChange={(value) => set("victim", value as Victim)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <Select
              label="نرخ دیه سال"
              placeholder={null}
              options={RATE_OPTIONS}
              value={String(settings.year)}
              hint={
                customRateValue(settings.customRate).rate !== undefined
                  ? "نرخ دلخواه وارد شده و به‌جای این نرخ به کار می‌رود."
                  : undefined
              }
              onChange={(event) => set("year", Number(event.target.value))}
            />
            <Select
              label="نوع جنایت"
              placeholder={null}
              options={CRIME_OPTIONS}
              value={settings.crimeType}
              onChange={(event) => set("crimeType", event.target.value as CrimeType | "")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Checkbox
              name="haram"
              label={diyehCopy.haram}
              checked={settings.haram}
              onCheckedChange={(checked) => set("haram", checked)}
            />
            <Checkbox
              name="deceased"
              label={diyehCopy.deceased}
              checked={settings.deceased}
              onCheckedChange={(checked) => set("deceased", checked)}
            />
          </div>

          <DisclosureGroup>
            <Disclosure title="تنظیمات بیشتر">
              <div className="flex flex-col gap-5">
                <AmountField
                  label="نرخ دلخواه دیه کامل (ریال)"
                  hint={diyehCopy.customRateHint}
                  optional
                  error={rateError}
                  value={settings.customRate}
                  onValueChange={(value) => set("customRate", value)}
                />
                <Checkbox
                  name="apply560"
                  label={diyehCopy.apply560}
                  description={diyehCopy.apply560Hint}
                  checked={settings.apply560}
                  onCheckedChange={(checked) => set("apply560", checked)}
                />
              </div>
            </Disclosure>
          </DisclosureGroup>
        </section>

        <AddInjury settings={settings} onAdd={add} />
      </form>

      {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
        <DiyehResultView
          rows={rows}
          settings={settings}
          result={result}
          onRemove={(key) => setRows((current) => current.filter((row) => row.key !== key))}
          onClear={clear}
        />
      </div>
    </div>
  );
}

function AddInjury({ settings, onAdd }: { settings: DiyehSettings; onAdd: AddLine }) {
  const id = useId();
  const [tab, setTab] = useState<Tab>("list");
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-5 border-t border-line pt-8">
      <h2 id={`${id}-title`} className="text-xl font-bold text-ink">
        افزودن صدمه
      </h2>
      <SegmentedControl
        legend="نوع صدمه"
        name="injury-tab"
        options={TAB_OPTIONS}
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
      />
      {tab === "list" && <ListTab settings={settings} onAdd={onAdd} />}
      {tab === "organ" && <OrganTab onAdd={onAdd} />}
      {tab === "custom" && <CustomTab onAdd={onAdd} />}
    </section>
  );
}

function ListTab({ settings, onAdd }: { settings: DiyehSettings; onAdd: AddLine }) {
  const victim = settings.victim;
  const [category, setCategory] = useState<string>(NAFS);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [arshBy, setArshBy] = useState<"percent" | "amount">("percent");
  const [arshValue, setArshValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A choice the victim no longer allows falls back to the first one that fits.
  const categories = categoriesFor(victim);
  const categoryId = categories.some((candidate) => candidate.id === category) ? category : NAFS;
  const isNafs = categoryId === NAFS;
  const items = isNafs ? [] : itemsFor(categoryId, victim);
  const item = items.find((candidate) => candidate.id === itemId) ?? items[0];

  const pick = (nextCategory: string, nextItem = "") => {
    setCategory(nextCategory);
    setItemId(nextItem);
    setQty(1);
    setArshValue("");
    setError(null);
  };

  const comboOptions = [
    { value: NAFS, label: NAFS_TITLE },
    ...ITEMS.filter((candidate) => itemFits(candidate, victim)).map((candidate) => ({
      value: candidate.id,
      label: candidate.title,
      group: CATEGORY_TITLES.get(candidate.cat),
    })),
  ];

  const max = item?.max ?? 1;
  const line: Line | null = isNafs
    ? { type: "nafs" }
    : item?.kind === "fixed"
      ? { type: "item", id: item.id, qty }
      : item?.kind === "arsh"
        ? arshBy === "percent"
          ? { type: "arshPercent", percent: parseAmount(arshValue), title: `ارش: ${item.title}`, art: item.art }
          : { type: "arshAmount", amount: parseAmount(arshValue), title: `ارش: ${item.title}`, art: item.art }
        : null;

  // What one unit comes to for this victim, read from the engine.
  const preview =
    line && (isNafs || item?.kind === "fixed")
      ? calculateDiyeh(toDiyehInput(settings, [isNafs ? line : { type: "item", id: item!.id }]))
      : null;
  const previewLine = preview?.ok ? preview.lines[0] : null;

  const submit = () => {
    if (!line) return;
    const refused = onAdd(line);
    setError(refused);
    if (!refused) {
      setQty(1);
      setArshValue("");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Combobox
        label="جستجو در مواد"
        hint="بخشی از عنوان صدمه را بنویسید، مثلاً «دندان» یا «موضحه»."
        placeholder="جستجوی صدمه"
        options={comboOptions}
        onSelect={(value) =>
          value === NAFS
            ? pick(NAFS)
            : pick(ITEMS.find((candidate) => candidate.id === value)!.cat, value)
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <Select
          label="دسته"
          placeholder={null}
          options={categories.map((candidate) => ({ value: candidate.id, label: candidate.title }))}
          value={categoryId}
          onChange={(event) => pick(event.target.value)}
        />
        <Select
          label="مورد"
          placeholder={null}
          title={isNafs ? NAFS_TITLE : item?.title}
          options={
            isNafs
              ? [{ value: NAFS, label: NAFS_TITLE }]
              : items.map((candidate) => ({ value: candidate.id, label: candidate.title }))
          }
          value={isNafs ? NAFS : (item?.id ?? "")}
          onChange={(event) => pick(categoryId, event.target.value)}
        />
      </div>

      {isNafs ? (
        <RulingBox title={NAFS_TITLE}>
          {previewLine && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">{previewLine.art}</Badge>
              </div>
              <PreviewAmount victim={victim} amount={previewLine.amount} />
            </>
          )}
        </RulingBox>
      ) : (
        item && (
          <RulingBox title={item.title}>
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">{item.art}</Badge>
              {itemFracPhrase(item) && <Badge>{itemFracPhrase(item)}</Badge>}
              {item.kind === "arsh" && <Badge tone="info">ارش</Badge>}
              {item.kind === "rule" && <Badge tone="warning">حکم خاص</Badge>}
              {max > 1 && <Badge>{`حداکثر ${toPersianDigits(max)} مورد`}</Badge>}
            </div>
            {item.note && <p>{toPersianDigits(item.note)}</p>}
            {previewLine && <PreviewAmount victim={victim} amount={previewLine.amount} />}
          </RulingBox>
        )
      )}

      {item?.kind === "fixed" && !isNafs && max > 1 && (
        <Stepper label="تعداد" value={qty} min={1} max={max} onValueChange={setQty} />
      )}

      {item?.kind === "arsh" && !isNafs && (
        <div className="flex flex-col gap-4">
          <SegmentedControl
            legend="ارش به"
            name="arsh-by"
            options={[
              { value: "percent", label: "درصد دیه کامل" },
              { value: "amount", label: "مبلغ" },
            ]}
            value={arshBy}
            onValueChange={(value) => {
              setArshBy(value as "percent" | "amount");
              setArshValue("");
              setError(null);
            }}
          />
          {arshBy === "percent" ? (
            <NumberField label="مقدار ارش (درصد)" value={arshValue} onValueChange={setArshValue} />
          ) : (
            <AmountField label="مقدار ارش (ریال)" value={arshValue} onValueChange={setArshValue} />
          )}
        </div>
      )}

      <AddButton
        onAdd={submit}
        error={error}
        disabledText={!isNafs && item?.kind === "rule" ? "مستقیم محاسبه نمی‌شود" : undefined}
      />
    </div>
  );
}

function PreviewAmount({ victim, amount }: { victim: Victim; amount: number }) {
  return (
    <p className="text-muted">
      دیه هر مورد برای {VICTIMS[victim]}:{" "}
      <span className="font-semibold tabular-nums text-ink">{rial(amount)}</span>
    </p>
  );
}

const CUSTOM_ORGAN = "custom";

function OrganTab({ onAdd }: { onAdd: AddLine }) {
  const [organId, setOrganId] = useState(ORGANS[0].id);
  const [injuryId, setInjuryId] = useState(ORGAN_INJURIES[0].id);
  const [percent, setPercent] = useState("");
  const [organNum, setOrganNum] = useState("");
  const [organDen, setOrganDen] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const custom = organId === CUSTOM_ORGAN;
  const organ = ORGANS.find((candidate) => candidate.id === organId);
  const injury = ORGAN_INJURIES.find((candidate) => candidate.id === injuryId) ?? ORGAN_INJURIES[0];
  const num = parseAmount(organNum);
  const den = parseAmount(organDen);

  const submit = () => {
    // The engine reduces the fraction; it has to be made of whole numbers.
    if (custom && !(Number.isInteger(num) && Number.isInteger(den))) {
      setError("صورت و مخرج کسر دیه عضو را عدد صحیح وارد کنید.");
      return;
    }
    const refused = onAdd({
      type: "organ",
      organId,
      injuryId: injury.id,
      qty,
      ...(injury.percent && { percent: parseAmount(percent) }),
      ...(custom && { organNum: num, organDen: den }),
    });
    setError(refused);
    if (!refused) {
      setQty(1);
      setPercent("");
    }
  };

  const organDiyeh = custom
    ? num > 0 && den > 0
      ? toPersianDigits(`${num}/${den}`)
      : "—"
    : fracPhrase([organ!.num, organ!.den]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <Select
          label="عضو"
          placeholder={null}
          options={[
            ...ORGANS.map((candidate) => ({ value: candidate.id, label: candidate.title })),
            { value: CUSTOM_ORGAN, label: "عضو دیگر (کسر دلخواه)" },
          ]}
          value={organId}
          onChange={(event) => {
            setOrganId(event.target.value);
            setError(null);
          }}
        />
        <Select
          label="نوع آسیب"
          placeholder={null}
          options={ORGAN_INJURIES.map((candidate) => ({
            value: candidate.id,
            label: candidate.title,
          }))}
          value={injury.id}
          onChange={(event) => {
            setInjuryId(event.target.value);
            setError(null);
          }}
        />
      </div>

      {custom && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="صورت کسر دیه عضو" value={organNum} onValueChange={setOrganNum} />
          <NumberField label="مخرج کسر دیه عضو" value={organDen} onValueChange={setOrganDen} />
        </div>
      )}

      <RulingBox title={`${injury.title}، ${custom ? "عضو دیگر" : organ!.title}`}>
        <dl className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">ماده آسیب:</dt>
            <dd>{injury.art}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">کسر آسیب:</dt>
            <dd>
              {injury.percent ? "به نسبت درصد از بین رفته" : <Fraction>{fracLabel([injury.num, injury.den])}</Fraction>}
              {!injury.percent && " دیه عضو"}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">دیه عضو:</dt>
            <dd>
              {organDiyeh}
              {organ && ` (${organ.art})`}
            </dd>
          </div>
        </dl>
      </RulingBox>

      {injury.percent && (
        <NumberField label="درصد از بین رفته" value={percent} onValueChange={setPercent} />
      )}
      <Stepper label="تعداد" value={qty} min={1} onValueChange={setQty} />

      <AddButton onAdd={submit} error={error} />
    </div>
  );
}

type CustomKind = "arshPercent" | "arshAmount" | "percent" | "fraction";
const CUSTOM_OPTIONS: { value: CustomKind; label: string }[] = [
  { value: "arshPercent", label: "ارش به درصد" },
  { value: "arshAmount", label: "ارش به مبلغ" },
  { value: "percent", label: "دیه به درصد" },
  { value: "fraction", label: "دیه به کسر" },
];

function CustomTab({ onAdd }: { onAdd: AddLine }) {
  const [kind, setKind] = useState<CustomKind>("arshPercent");
  const [value, setValue] = useState("");
  const [den, setDen] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const text = cleanTitle(title);
    const amount = parseAmount(value);
    const line: Line =
      kind === "arshPercent"
        ? { type: "arshPercent", percent: amount, title: text }
        : kind === "arshAmount"
          ? { type: "arshAmount", amount, title: text }
          : kind === "percent"
            ? { type: "percent", percent: amount, title: text }
            : { type: "fraction", num: amount, den: parseAmount(den), title: text };
    const refused = onAdd(line);
    setError(refused);
    if (!refused) {
      setValue("");
      setDen("");
      setTitle("");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Select
        label="نوع"
        placeholder={null}
        options={CUSTOM_OPTIONS}
        value={kind}
        onChange={(event) => {
          setKind(event.target.value as CustomKind);
          setValue("");
          setDen("");
          setError(null);
        }}
      />
      {kind === "arshAmount" ? (
        <AmountField label="مبلغ ارش (ریال)" value={value} onValueChange={setValue} />
      ) : kind === "fraction" ? (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="صورت کسر" value={value} onValueChange={setValue} />
          <NumberField label="مخرج کسر" value={den} onValueChange={setDen} />
        </div>
      ) : (
        <NumberField
          label={kind === "arshPercent" ? "درصد ارش از دیه کامل" : "درصد از دیه کامل"}
          value={value}
          onValueChange={setValue}
        />
      )}
      <TextField
        label="شرح"
        optional
        hint="مثلاً عنوان صدمه در گزارش پزشکی قانونی."
        autoComplete="off"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <AddButton onAdd={submit} error={error} />
    </div>
  );
}

function Figure({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "-mx-5 flex flex-col gap-1 bg-primary-soft px-5 py-4 md:-mx-6 md:px-6"
          : "flex flex-col gap-1 py-4"
      }
    >
      <dt className="font-bold text-ink">{label}</dt>
      <dd className={emphasis ? "text-2xl font-bold tabular-nums text-primary" : "text-xl font-bold tabular-nums text-ink"}>
        {value}
      </dd>
      {detail && <dd className="text-sm text-muted">{detail}</dd>}
    </div>
  );
}

function DiyehResultView({
  rows,
  settings,
  result,
  onRemove,
  onClear,
}: {
  rows: DiyehRow[];
  settings: DiyehSettings;
  result: ReturnType<typeof calculateRows>;
  onRemove: (key: number) => void;
  onClear: () => void;
}) {
  const id = useId();
  const ok: DiyehOk | null = result?.ok ? result : null;
  const money = (value: number | undefined) => (ok && value !== undefined ? rial(value) : "—");

  const tableRows: ReactNode[][] = rows.map((row, index) => {
    const line = ok?.lines[index];
    const title = line?.title ?? row.title;
    const isArsh = line ? line.kind === "arsh" : row.line.type === "arshPercent" || row.line.type === "arshAmount";
    return [
      <span key="title" className="flex flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span>{toPersianDigits(title)}</span>
          {isArsh && <Badge tone="info">ارش</Badge>}
        </span>
        <span className="text-sm font-normal text-muted">{line?.art ?? row.art}</span>
        {line?.notes.map((note) => (
          <span key={note} className="text-sm font-normal text-muted">
            {toPersianDigits(note)}
          </span>
        ))}
      </span>,
      <span key="qty" className="tabular-nums">
        {toPersianDigits(line?.qty ?? qtyOf(row.line))}
      </span>,
      line?.appliedFrac ? (
        <Fraction key="frac">{fracLabel(line.appliedFrac)}</Fraction>
      ) : (
        <span key="frac">{line ? (isArsh ? "ارش" : "—") : "—"}</span>
      ),
      <span key="amount" className="whitespace-nowrap tabular-nums">
        {line ? lineAmountText(line) : "—"}
      </span>,
      <span key="fund" className="whitespace-nowrap tabular-nums">
        {line ? formatRial(line.fund) : "—"}
      </span>,
      <Button
        key="remove"
        variant="ghost"
        size="sm"
        icon={<X />}
        aria-label={`حذف ${toPersianDigits(title)}`}
        onClick={() => onRemove(row.key)}
      >
        <span className="sr-only">حذف</span>
      </Button>,
    ];
  });
  if (rows.length > 0) {
    tableRows.push([
      "جمع",
      "—",
      "—",
      <strong key="amount" className="whitespace-nowrap tabular-nums text-primary">
        {ok ? formatRial(ok.payerTotal) : "—"}
      </strong>,
      <strong key="fund" className="whitespace-nowrap tabular-nums">
        {ok ? formatRial(ok.fundTotal) : "—"}
      </strong>,
      "",
    ]);
  }

  const payment = ok?.payment;

  return (
    <ResultCard
      title="نتیجه محاسبه"
      rows={[]}
      body={
        <div className="flex flex-col gap-6">
          {result?.ok === false && (
            <Alert tone="warning" live>
              {toPersianDigits(result.error)}
              {diyehCopy.errorSuffix}
            </Alert>
          )}

          <dl className="divide-y divide-line border-b border-line">
            <Figure
              emphasis
              label="سهم پرداخت‌کننده دیه"
              value={money(ok?.payerTotal)}
              detail={
                ok && ok.payerTotal > 0
                  ? `${numberToWords(ok.payerTotal)} ریال؛ معادل ${tomanEquivalent(ok.payerTotal)}`
                  : undefined
              }
            />
            <Figure
              label="سهم صندوق تأمین خسارت‌های بدنی"
              value={money(ok?.fundTotal)}
              detail={diyehCopy.fundCaption}
            />
            <Figure
              label="جمع دریافتی"
              value={money(ok?.victimTotal)}
              detail={ok ? `دیه کامل مبنا: ${rial(ok.fullDiyeh)}` : "دیه کامل مبنا"}
            />
          </dl>

          <Table
            caption="صدمه‌های اضافه‌شده"
            head={["صدمه", "تعداد", "کسر", "مبلغ (ریال)", "صندوق (ریال)", "حذف"]}
            rows={tableRows}
            emptyText={diyehCopy.empty}
            stacked
            rowAction
          />

          {payment && (
            <section aria-labelledby={`${id}-payment`} className="flex flex-col gap-3">
              <h3 id={`${id}-payment`} className="text-lg font-bold text-ink">
                پرداخت: {payment.title}
              </h3>
              <dl className="divide-y divide-line border-y border-line">
                <PaymentRow label="پرداخت‌کننده" value={toPersianDigits(payment.payer)} />
                {payment.crimeType === "khata" && payment.offenderShare > 0 && (
                  <>
                    <PaymentRow label={diyehCopy.aqelehShare} value={rial(payment.aqelehShare)} />
                    <PaymentRow label={diyehCopy.offenderShare} value={rial(payment.offenderShare)} />
                  </>
                )}
                {payment.installments.map((installment) => (
                  <PaymentRow
                    key={installment.year}
                    label={`قسط ${toPersianDigits(installment.year)}`}
                    value={rial(installment.amount)}
                    detail={dueText(installment.dueDays)}
                  />
                ))}
                <PaymentRow label="ماده" value={payment.art} />
              </dl>
            </section>
          )}
        </div>
      }
      notes={ok ? ok.notes.map((note) => toPersianDigits(note)) : []}
    >
      <div className="flex flex-wrap gap-3">
        {ok && <CopyButton text={buildSummary(ok, settings)} label="کپی خلاصه" />}
        <Button variant="ghost" icon={<RotateCcw />} onClick={onClear}>
          پاک کردن همه
        </Button>
      </div>
    </ResultCard>
  );
}

function PaymentRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{value}</dd>
      {detail && <dd className="basis-full text-sm text-muted">{detail}</dd>}
    </div>
  );
}
