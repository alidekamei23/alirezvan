"use client";
// KarshenasiCalculator — the official-expert fee calculator for the 101 subjects of the
// 1405 tariff: pick a subject (search, or group then subject), enter its value, and add
// the optional parts (several valuations, GPS points, a same-field panel, financial
// incapacity, mission days). The result updates as the visitor types; nothing leaves the
// browser. The arithmetic is lib/karshenasi/karshenasi-calc.ts and is only called here.
// Usage: <KarshenasiCalculator /> (once, on /tools/dastmozd-karshenasi)
import { useId, useRef, useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Combobox } from "@/components/Combobox";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { MoneyField } from "@/components/MoneyField";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard, type ResultRow } from "@/components/ResultCard";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";
import { karshenasiCopy } from "@/content/karshenasi";
import { toPersianDigits } from "@/lib/format";
import {
  calculateExpertFee,
  numberToWords,
  parseAmount,
  supportsGps,
  supportsMultiple,
} from "@/lib/karshenasi/karshenasi-calc";
import {
  CATEGORIES,
  GPS_MAX_POINTS,
  GPS_PER_POINT,
  ITEMS,
  MISSION_PER_DAY,
} from "@/lib/karshenasi/karshenasi-tariff";
import {
  GPS_DEVICE_LABELS,
  KIND_LABELS,
  MISSION_LABELS,
  amountInWords,
  buildSummary,
  coefficientLabel,
  faText,
  type GpsDevice,
  type MissionLocation,
} from "@/lib/karshenasi/present";
import { rial } from "@/lib/tadieh/present";

type ValueRow = { id: number; value: number | null };

const COMBO_OPTIONS = ITEMS.map((item) => ({
  value: String(item.id),
  label: item.title,
  group: CATEGORIES[item.category],
}));
const CATEGORY_OPTIONS = CATEGORIES.map((title, index) => ({ value: String(index), label: title }));
const itemsIn = (category: number) => ITEMS.filter((item) => item.category === category);
const GPS_OPTIONS = (Object.keys(GPS_PER_POINT) as GpsDevice[]).map((device) => ({
  value: device,
  title: GPS_DEVICE_LABELS[device],
  description: `هر نقطه ${rial(GPS_PER_POINT[device])}`,
}));
const MISSION_OPTIONS = (Object.keys(MISSION_PER_DAY) as MissionLocation[]).map((location) => ({
  value: location,
  title: MISSION_LABELS[location],
  description: `هر روز ${rial(MISSION_PER_DAY[location])}`,
}));

/** A whole number typed with Persian or Latin digits; empty is 0, anything else NaN. */
function parseCount(text: string): number {
  if (text.trim() === "") return 0;
  const value = parseAmount(text);
  return Number.isInteger(value) && value >= 0 ? value : NaN;
}

export function KarshenasiCalculator() {
  const id = useId();
  const nextId = useRef(1);
  const addRowRef = useRef<HTMLDivElement>(null);

  const [itemId, setItemId] = useState(1);
  const [moneyValue, setMoneyValue] = useState<number | null>(null);
  const [textValue, setTextValue] = useState("");
  const [multi, setMulti] = useState(false);
  const [rows, setRows] = useState<ValueRow[]>([
    { id: 0, value: null },
    { id: 1, value: null },
  ]);
  const [sameParcel, setSameParcel] = useState(true);
  const [gpsPoints, setGpsPoints] = useState("");
  const [gpsDevice, setGpsDevice] = useState<GpsDevice>("multiFrequency");
  const [panel, setPanel] = useState(false);
  const [incapacity, setIncapacity] = useState(false);
  const [missionDays, setMissionDays] = useState("");
  const [missionLocation, setMissionLocation] = useState<MissionLocation>("inProvince");

  const item = ITEMS.find((candidate) => candidate.id === itemId) ?? ITEMS[0];
  const isTiered = item.kind === "tiered";
  const isRial = item.unit === "ریال";
  const canMulti = supportsMultiple(item);
  const canGps = supportsGps(item);
  const useRows = canMulti && multi;
  // Area, length and flow can be fractional; counts (no unit) are whole numbers.
  const allowsDecimal = Boolean(item.unit) && !isRial;

  const selectItem = (nextItemId: number) => {
    setItemId(nextItemId);
    setMoneyValue(null);
    setTextValue("");
    setMulti(false);
    setRows([
      { id: nextId.current++, value: null },
      { id: nextId.current++, value: null },
    ]);
    setGpsPoints("");
  };

  const removeRow = (rowId: number) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
    addRowRef.current?.querySelector("button")?.focus();
  };

  // The value(s) to send. null means "nothing typed yet", which is not an error.
  const textNumber = textValue.trim() === "" ? null : parseAmount(textValue);
  const countError =
    textNumber !== null && !allowsDecimal && !Number.isInteger(textNumber)
      ? "عدد صحیح وارد کنید."
      : undefined;
  let values: number[] | null = null;
  if (isTiered) {
    if (useRows) {
      const filled = rows.flatMap((row) => (row.value && row.value > 0 ? [row.value] : []));
      values = filled.length > 0 ? filled : null;
    } else {
      const single = isRial ? moneyValue : textNumber;
      values = single === null ? null : [single];
    }
  }

  const points = canGps ? parseCount(gpsPoints) : 0;
  const days = parseCount(missionDays);
  const result =
    isTiered && (values === null || countError)
      ? null
      : calculateExpertFee({
          itemId: item.id,
          ...(isTiered && values
            ? useRows
              ? { values, sameParcelAndPerson: sameParcel }
              : { value: values[0] }
            : {}),
          samefieldPanel: panel,
          incapacity,
          ...(canGps && points !== 0 ? { gps: { points, device: gpsDevice } } : {}),
          missionDays: days,
          missionLocation,
        });

  const resultRows: ResultRow[] = [];
  const notes: string[] = [];
  if (result?.ok) {
    for (const step of result.steps) {
      resultRows.push({ label: faText(step.label), value: rial(step.amount) });
    }
    if (result.fee !== null) {
      resultRows.push({
        label: "دستمزد هر کارشناس",
        value: rial(result.fee),
        emphasis: true,
        badges: [
          ...(result.provisional ? [{ text: "موقت", tone: "warning" as const }] : []),
          ...(result.capped ? [{ text: "سقف اعمال شد", tone: "info" as const }] : []),
        ],
      });
    }
    if (result.gps > 0) {
      resultRows.push({
        label: "هزینه GPS (ماده ۳۹)",
        value: rial(result.gps),
        detail: `${toPersianDigits(Math.min(points, GPS_MAX_POINTS))} نقطه × ${rial(GPS_PER_POINT[gpsDevice])}`,
      });
    }
    if (result.mission > 0) {
      resultRows.push({
        label: "فوق‌العاده مأموریت (ماده ۶)",
        value: rial(result.mission),
        detail: `${toPersianDigits(days)} روز ${MISSION_LABELS[missionLocation]} × ${rial(MISSION_PER_DAY[missionLocation])}`,
      });
    }
    if (result.total !== null) notes.push(`جمع کل به حروف: ${amountInWords(result.total)}`);
    if (result.capped) {
      notes.push(`سقف دستمزد هر کارشناس در این موضوع ${rial(result.cap)} است و اعمال شد.`);
    }
    notes.push(...result.notes.map(faText));
  }
  const extras = result?.ok ? result.gps + result.mission : 0;

  const unitLabel = item.unit ? ` (${item.unit})` : "";

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
            موضوع کارشناسی
          </h2>
          <p className="mt-1 text-sm text-muted">{karshenasiCopy.privacy}</p>
        </div>

        <Combobox
          label="جستجوی سریع موضوع"
          hint="بخشی از عنوان موضوع یا نام گروه را بنویسید، مثلاً «خودرو» یا «نقشه»."
          placeholder="جستجو در ۱۰۱ موضوع"
          options={COMBO_OPTIONS}
          onSelect={(value) => selectItem(Number(value))}
        />

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <Select
              label="گروه"
              placeholder={null}
              options={CATEGORY_OPTIONS}
              value={String(item.category)}
              onChange={(event) => selectItem(itemsIn(Number(event.target.value))[0].id)}
            />
            <Select
              label="موضوع"
              placeholder={null}
              title={item.title}
              options={itemsIn(item.category).map((candidate) => ({
                value: String(candidate.id),
                label: toPersianDigits(candidate.title),
              }))}
              value={String(item.id)}
              onChange={(event) => selectItem(Number(event.target.value))}
            />
          </div>
          {/* The full title, since a closed select cuts long titles off. */}
          <div className="rounded-md border border-line bg-surface p-4">
            <p className="text-sm text-muted">موضوع انتخاب‌شده</p>
            <p className="mt-1 font-semibold text-ink">{toPersianDigits(item.title)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="primary">{item.article}</Badge>
              <Badge>{KIND_LABELS[item.kind]}</Badge>
              {item.coefficient && <Badge tone="info">{coefficientLabel(item.coefficient)}</Badge>}
            </div>
          </div>
        </div>

        {isTiered && (
          <div key={item.id} className="flex flex-col gap-4">
            {canMulti && (
              <Checkbox
                name="multi"
                label="چند مورد ارزیابی در یک ارجاع (تبصره ۲ ماده ۱۱)"
                checked={multi}
                onCheckedChange={setMulti}
              />
            )}

            {useRows ? (
              <>
                <RadioCards
                  legend="نحوه محاسبه موردها"
                  name="same-parcel"
                  columns={1}
                  defaultValue={sameParcel ? "same" : "separate"}
                  onValueChange={(value) => setSameParcel(value === "same")}
                  options={[
                    { value: "same", title: "یک عرصه و یک شخص: جمع ارزش‌ها" },
                    { value: "separate", title: "عرصه یا اشخاص متفاوت: جداگانه" },
                  ]}
                />
                {rows.map((row, index) => {
                  const rowTitle = toPersianDigits(`مورد ${index + 1}`);
                  return (
                    <div
                      key={row.id}
                      role="group"
                      aria-labelledby={`${id}-row-${row.id}`}
                      className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 sm:p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 id={`${id}-row-${row.id}`} className="font-bold text-ink">
                          {rowTitle}
                        </h3>
                        {rows.length > 1 && (
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
                        label={item.inputTitle ?? "ارزش موضوع"}
                        name={`value-${row.id}`}
                        unit="ریال"
                        onValueChange={(value) =>
                          setRows((current) =>
                            current.map((candidate) =>
                              candidate.id === row.id ? { ...candidate, value } : candidate,
                            ),
                          )
                        }
                      />
                    </div>
                  );
                })}
                <div ref={addRowRef}>
                  <Button
                    variant="secondary"
                    icon={<Plus />}
                    onClick={() =>
                      setRows((current) => [...current, { id: nextId.current++, value: null }])
                    }
                  >
                    افزودن مورد
                  </Button>
                </div>
              </>
            ) : isRial ? (
              <div className="flex flex-col gap-1.5">
                <MoneyField
                  label={item.inputTitle ?? "ارزش موضوع"}
                  name="value"
                  unit="ریال"
                  hint="مبلغ را به ریال وارد کنید."
                  onValueChange={setMoneyValue}
                />
                {moneyValue !== null && moneyValue > 0 && (
                  <p className="text-sm text-muted tabular-nums">{amountInWords(moneyValue)}</p>
                )}
              </div>
            ) : (
              <TextField
                label={`${item.inputTitle ?? "مقدار"}${unitLabel}`}
                name="value"
                inputMode={allowsDecimal ? "decimal" : "numeric"}
                autoComplete="off"
                hint={allowsDecimal ? "اعشار مجاز است، مثلاً ۲۵۰٫۵" : "عدد صحیح وارد کنید."}
                value={textValue}
                error={countError}
                onChange={(event) => setTextValue(event.target.value)}
                className="tabular-nums"
              />
            )}
          </div>
        )}

        {canGps && (
          <fieldset className="flex min-w-0 flex-col gap-4 border-t border-line pt-8">
            <legend className="sr-only">هزینه GPS</legend>
            <h3 className="font-bold text-ink" aria-hidden="true">
              هزینه GPS (ماده ۳۹)
            </h3>
            <TextField
              label="تعداد نقاط"
              name="gps-points"
              inputMode="numeric"
              autoComplete="off"
              optional
              hint={`حداکثر ${toPersianDigits(GPS_MAX_POINTS)} نقطه قابل پرداخت است.`}
              value={gpsPoints}
              onChange={(event) => setGpsPoints(event.target.value)}
              className="tabular-nums"
            />
            <RadioCards
              legend="نوع دستگاه"
              name="gps-device"
              columns={2}
              defaultValue={gpsDevice}
              onValueChange={(value) => setGpsDevice(value as GpsDevice)}
              options={GPS_OPTIONS}
            />
          </fieldset>
        )}

        <div className="flex flex-col gap-4 border-t border-line pt-8">
          <Checkbox
            name="panel"
            label="چند کارشناس رسمی از یک رشته (ماده ۵۶)"
            checked={panel}
            onCheckedChange={setPanel}
          />
          <Checkbox
            name="incapacity"
            label="متقاضی توان مالی ندارد؛ کاهش تا ۵۰٪ به تشخیص قاضی (تبصره ۲ ماده ۲)"
            checked={incapacity}
            onCheckedChange={setIncapacity}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-8">
          <h3 className="font-bold text-ink">مأموریت</h3>
          <TextField
            label="تعداد روز سفر"
            name="mission-days"
            inputMode="numeric"
            autoComplete="off"
            optional
            hint="اگر سفری نیست، خالی بگذارید."
            value={missionDays}
            onChange={(event) => setMissionDays(event.target.value)}
            className="tabular-nums"
          />
          <RadioCards
            legend="محل مأموریت"
            name="mission-location"
            columns={2}
            defaultValue={missionLocation}
            onValueChange={(value) => setMissionLocation(value as MissionLocation)}
            options={MISSION_OPTIONS}
          />
        </div>
      </form>

      {/* Stays beside the form on desktop; scrolls inside itself on a short screen. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:max-h-[calc(100dvh-var(--header-height)-2rem)] lg:self-start lg:overflow-y-auto">
        {result === null && (
          <EmptyState
            Icon={Calculator}
            title={`${item.inputTitle ?? "مقدار"} را وارد کنید`}
            description="نتیجه با هر تغییر، همین‌جا به‌روز می‌شود."
          />
        )}
        {result?.ok === false && (
          <Alert tone="danger" live title="محاسبه انجام نشد">
            {faText(result.error)}
          </Alert>
        )}
        {result?.ok && (
          <ResultCard
            title="نتیجه محاسبه"
            highlight={
              result.fee === null && result.rangeText ? (
                <>
                  <span className="block text-sm font-semibold text-muted">
                    دستمزد هر کارشناس
                  </span>
                  {faText(result.rangeText)}
                </>
              ) : undefined
            }
            rows={resultRows}
            total={
              result.total !== null
                ? { label: "جمع کل", value: rial(result.total) }
                : extras > 0
                  ? { label: "هزینه‌های جدا از دستمزد", value: rial(extras) }
                  : undefined
            }
            notes={
              result.total === null && extras > 0
                ? [`هزینه‌های جدا از دستمزد به حروف: ${numberToWords(extras)} ریال`, ...notes]
                : notes
            }
          >
            <CopyButton
              text={buildSummary(result, {
                values: values ?? [],
                missionDays: days,
                missionLocation,
                gpsPoints: points || undefined,
                gpsDevice,
              })}
            />
          </ResultCard>
        )}
      </div>
    </div>
  );
}
