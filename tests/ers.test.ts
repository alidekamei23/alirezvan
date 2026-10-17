// Display helpers of the inheritance-share calculator. The rules themselves are tested in
// lib/ers/ers-calc.test.ts (the supplied reference cases).
import { describe, expect, it } from "vitest";
import { calculateErs, Frac } from "@/lib/ers/ers-calc";
import {
  buildSummary,
  classStatus,
  emptyForm,
  fracDisplay,
  hasAnyHeir,
  percentText,
  resultTitle,
  sampleForm,
  toErsInput,
  type ErsOk,
} from "@/lib/ers/present";

const ok = (form: ReturnType<typeof emptyForm>) => {
  const result = calculateErs(toErsInput(form));
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("ers form → input", () => {
  it("the sample is a man with one wife, his mother, two sons and a daughter", () => {
    const result = ok(sampleForm());
    const each = Object.fromEntries(result.shares.map((s) => [s.key, s.each.toString()]));
    expect(each).toEqual({ wife: "1/8", mother: "1/6", sons: "17/60", daughters: "17/120" });
    expect(result.lcd).toBe(120n);
  });

  it("sends wives only for a man and the husband only for a woman", () => {
    const man = toErsInput({ ...emptyForm(), wives: 2, husband: true });
    expect(man).toMatchObject({ wives: 2 });
    expect(man.husband).toBeUndefined();
    const woman = toErsInput({ ...emptyForm(), deceased: "f", wives: 2, husband: true });
    expect(woman).toMatchObject({ husband: true });
    expect(woman.wives).toBeUndefined();
  });

  it("drops row ids and leaves the estate out when it is empty", () => {
    const input = toErsInput({
      ...emptyForm(),
      grandchildren: [{ id: 7, via: "m", sons: 1, daughters: 0 }],
      debts: 100,
    });
    expect(input.grandchildren).toEqual([{ via: "m", sons: 1, daughters: 0 }]);
    expect(input.estate).toBeUndefined();
    expect(input.debts).toBeUndefined();
  });

  it("an empty form has no heir", () => {
    expect(hasAnyHeir(emptyForm())).toBe(false);
    expect(hasAnyHeir({ ...emptyForm(), dayiMat: 1 })).toBe(true);
  });
});

describe("class status pills", () => {
  it("siblings entered with a mother are shown as excluded by the first class", () => {
    const form = { ...emptyForm(), father: true, mother: true, fullBrothers: 2 };
    const result = calculateErs(toErsInput(form));
    expect(classStatus(1, form, result).text).toBe("ارث می‌برد");
    expect(classStatus(2, form, result).text).toBe("ارث نمی‌برد (وجود طبقه اول)");
    expect(classStatus(3, form, result).text).toBe("وارد نشده");
  });

  it("uncles are excluded by the second class", () => {
    const form = { ...emptyForm(), matSisters: 1, ammuFull: 1 };
    const result = calculateErs(toErsInput(form));
    expect(classStatus(3, form, result).text).toBe("ارث نمی‌برد (وجود طبقه دوم)");
  });
});

describe("ers display", () => {
  it("shows fractions with Persian digits, also over the common denominator", () => {
    expect(fracDisplay(new Frac(17n, 60n))).toBe("۱۷/۶۰");
    expect(fracDisplay(new Frac(17n, 60n), 120n)).toBe("۳۴/۱۲۰");
    expect(fracDisplay(new Frac(1n, 1n))).toBe("۱");
    expect(fracDisplay(new Frac(1n, 1n), 8n)).toBe("۸/۸");
  });

  it("rounds percentages to two decimals", () => {
    expect(percentText(new Frac(17n, 60n))).toBe("۲۸٫۳۳٪");
    expect(percentText(new Frac(1n, 4n))).toBe("۲۵٪");
  });

  it("titles the result by class and spouse", () => {
    const form = sampleForm();
    expect(resultTitle(ok(form), form)).toBe("نتیجه — طبقه اول و زوجین");
    const alone = { ...emptyForm(), wives: 1 };
    expect(resultTitle(ok(alone), alone)).toBe("نتیجه — فقط زوجه");
  });

  it("the copied summary has every share, the money, the hakem and the disclaimer", () => {
    const form = { ...emptyForm(), wives: 1, estate: 1_000_000_000, debts: 0, will: 0 };
    const result = ok(form) as ErsOk;
    const text = buildSummary(result, form);
    expect(text).toContain("زوجه");
    expect(text).toContain("حاکم (در حکم مال بلاوارث)");
    expect(text).toContain("قابل تقسیم: ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان");
    expect(text).toContain("۷۵۰٬۰۰۰٬۰۰۰ تومان");
    expect(text).toContain("این نتیجه تخمینی است و مشاوره حقوقی محسوب نمی‌شود.");
  });
});

describe("engine labels", () => {
  it("are shown with Persian digits", () => {
    const form = {
      ...emptyForm(),
      nephews: [{ id: 1, side: "full" as const, via: "m" as const, sons: 1, daughters: 0 }],
    };
    const text = buildSummary(ok(form), form);
    expect(text).toContain("اولاد برادر ابوینی فوت‌شده ۱ — پسر");
    expect(text).not.toMatch(/[0-9]/);
  });
});
