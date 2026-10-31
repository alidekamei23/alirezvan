// Wiring of the diyeh calculator: form → engine input, adding rows (merge and refusal),
// the item filter by sex, and the summary. The rules themselves are tested in
// lib/diyeh/diyeh-calc.test.ts (the supplied reference cases).
import { describe, expect, it } from "vitest";
import type { Line } from "@/lib/diyeh/diyeh-calc";
import { ITEMS } from "@/lib/diyeh/diyeh-data";
import {
  NAFS,
  addLine,
  buildSummary,
  calculateRows,
  categoriesFor,
  customRateValue,
  formatAmountText,
  initialSettings,
  itemFits,
  type DiyehRow,
  type DiyehSettings,
} from "@/lib/diyeh/present";

const item = (id: string) => ITEMS.find((candidate) => candidate.id === id)!;

/** Adds the lines one by one, as the «افزودن» button does; throws on a refusal. */
function build(settings: DiyehSettings, lines: Line[]): DiyehRow[] {
  let rows: DiyehRow[] = [];
  lines.forEach((line, index) => {
    const added = addLine(rows, line, settings, index);
    if (!added.ok) throw new Error(added.error);
    rows = added.rows;
  });
  return rows;
}

function run(patch: Partial<DiyehSettings>, lines: Line[]) {
  const settings = { ...initialSettings(), ...patch };
  const result = calculateRows(settings, build(settings, lines));
  if (!result?.ok) throw new Error(result ? result.error : "no rows");
  return result;
}

describe("the eight delivery scenarios (rate 1405)", () => {
  it("1. killing of a man", () => {
    expect(run({}, [{ type: "nafs" }]).payerTotal).toBe(21_000_000_000);
  });
  it("2. killing of a woman: half from the payer, half from the fund", () => {
    const r = run({ victim: "female" }, [{ type: "nafs" }]);
    expect([r.payerTotal, r.fundTotal]).toEqual([10_500_000_000, 10_500_000_000]);
  });
  it("3. killing of a woman in a sacred month", () => {
    expect(run({ victim: "female", haram: true }, [{ type: "nafs" }]).payerTotal).toBe(
      14_000_000_000,
    );
  });
  it("4. three front teeth of a man", () => {
    expect(run({}, [{ type: "item", id: "t-front", qty: 3 }]).payerTotal).toBe(3_150_000_000);
  });
  it("5. one hand of a woman", () => {
    const r = run({ victim: "female" }, [{ type: "item", id: "h-hand" }]);
    expect([r.payerTotal, r.fundTotal]).toEqual([5_250_000_000, 5_250_000_000]);
  });
  it("6. hashemeh of a man", () => {
    expect(run({}, [{ type: "item", id: "w-hashemeh" }]).payerTotal).toBe(2_100_000_000);
  });
  it("7. a second bent neck is refused and nothing is added", () => {
    const settings = initialSettings();
    const rows = build(settings, [{ type: "item", id: "nk-bent" }]);
    const again = addLine(rows, { type: "item", id: "nk-bent" }, settings, 9);
    expect(again.ok).toBe(false);
    expect(rows).toHaveLength(1);
  });
  it("8. pure error, a hand and a hares: aqeleh, offender and three instalments", () => {
    const r = run({ crimeType: "khata" }, [
      { type: "item", id: "h-hand" },
      { type: "item", id: "w-hares" },
    ]);
    expect([r.payment!.aqelehShare, r.payment!.offenderShare]).toEqual([
      10_500_000_000, 210_000_000,
    ]);
    expect(r.payment!.installments).toHaveLength(3);
  });
});

describe("adding rows", () => {
  it("adds the same item to its row instead of a new one", () => {
    const rows = build(initialSettings(), [
      { type: "item", id: "t-front", qty: 2 },
      { type: "item", id: "t-front" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].line).toEqual({ type: "item", id: "t-front", qty: 3 });
    expect(rows[0].title).toBe(item("t-front").title);
  });
  it("refuses three eyes, a whole nose with its wing, and a second killing", () => {
    const settings = initialSettings();
    const refused = (lines: Line[], next: Line) =>
      addLine(build(settings, lines), next, settings, 9).ok;
    expect(refused([{ type: "item", id: "e-both" }], { type: "item", id: "e-one" })).toBe(false);
    expect(refused([{ type: "item", id: "n-all" }], { type: "item", id: "n-wing" })).toBe(false);
    expect(refused([{ type: "nafs" }], { type: "nafs" })).toBe(false);
  });
  it("keeps the engine's title and article for an arsh row", () => {
    const [row] = build(initialSettings(), [
      { type: "arshAmount", amount: 5e8, title: "ارش: پاره کردن پرده گوش", art: "ماده ۶۰۵" },
    ]);
    expect([row.title, row.art]).toEqual(["ارش: پاره کردن پرده گوش", "ماده ۶۰۵"]);
  });
  it("still calculates the rows when a later change makes one invalid", () => {
    const settings: DiyehSettings = { ...initialSettings(), victim: "female" };
    const rows = build(settings, [{ type: "item", id: "br-one" }]);
    const result = calculateRows({ ...settings, victim: "male" }, rows);
    expect(result?.ok).toBe(false);
    expect(rows).toHaveLength(1);
  });
  it("is null, not an error, without rows", () => {
    expect(calculateRows(initialSettings(), [])).toBeNull();
  });
});

describe("item filter by the victim's sex", () => {
  it("shows women's items for a woman, a khonsa attached to women and a khonsa moshkel", () => {
    const breast = item("br-one");
    expect(["female", "khonsaFemale", "khonsaMoshkel"].every((v) => itemFits(breast, v as never))).toBe(true);
    expect(itemFits(breast, "male")).toBe(false);
    expect(itemFits(breast, "khonsaMale")).toBe(false);
  });
  it("keeps men's sexual items for khonsa victims, who get arsh, but not men's hair", () => {
    expect(itemFits(item("sx-testes"), "khonsaFemale")).toBe(true);
    expect(itemFits(item("sx-testes"), "khonsaMoshkel")).toBe(true);
    expect(itemFits(item("sx-testes"), "female")).toBe(false);
    expect(itemFits(item("hr-beard"), "khonsaMoshkel")).toBe(false);
  });
  it("lists the killing first and drops categories left empty", () => {
    const male = categoriesFor("male").map((category) => category.id);
    expect(male[0]).toBe(NAFS);
    expect(male).not.toContain("breast");
    expect(categoriesFor("female").map((category) => category.id)).toContain("breast");
  });
});

describe("custom rate and amounts", () => {
  it("reads Persian digits and separators, and refuses text", () => {
    expect(customRateValue("۲۱٬۰۰۰٬۰۰۰٬۰۰۰").rate).toBe(21_000_000_000);
    expect(customRateValue("").rate).toBeUndefined();
    expect(customRateValue("abc").error).toBeDefined();
  });
  it("uses the custom rate over the year", () => {
    expect(run({ customRate: "1000000000" }, [{ type: "nafs" }]).payerTotal).toBe(1_000_000_000);
  });
  it("formats an amount only when it is one", () => {
    expect(formatAmountText("۵۰۰۰۰۰۰۰۰")).toBe("۵۰۰٬۰۰۰٬۰۰۰");
    expect(formatAmountText("abc")).toBe("abc");
  });
});

describe("summary", () => {
  it("lists rows, the three totals, the instalments and the estimate notice", () => {
    const settings: DiyehSettings = { ...initialSettings(), victim: "female", crimeType: "shebh" };
    const result = run(settings, [{ type: "nafs" }]);
    const text = buildSummary(result, settings);
    expect(text).toContain("مجنی‌علیه: زن");
    expect(text).toContain("سهم پرداخت‌کننده دیه: ۱۰٬۵۰۰٬۰۰۰٬۰۰۰ ریال");
    expect(text).toContain("قسط ۲:");
    expect(text).toContain("این نتیجه تخمینی است و مشاوره حقوقی محسوب نمی‌شود.");
  });
});
