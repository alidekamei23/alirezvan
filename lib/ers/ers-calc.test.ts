/**
 * تست‌های مرجع سهم‌الارث — هر ۲۹ حالت با ماشین حساب مستقل دادحساب هم تطبیق داده شده‌اند.
 * سهم‌ها «سهم هر نفر» هستند.
 */
import { describe, it, expect } from "vitest";
import { calculateErs, type ErsInput } from "./ers-calc";

const cases: [string, ErsInput, Record<string, string>, string?][] = [
  ["زوجه + پسر + دختر", { deceased: "m", wives: 1, sons: 1, daughters: 1 }, { wife: "1/8", sons: "7/12", daughters: "7/24" }],
  ["زوج + پدر + مادر", { deceased: "f", husband: true, father: true, mother: true }, { husband: "1/2", mother: "1/3", father: "1/6" }],
  ["زوجه + پدر + مادر", { deceased: "m", wives: 1, father: true, mother: true }, { wife: "1/4", mother: "1/3", father: "5/12" }],
  ["ابوین + یک دختر (رد)", { deceased: "m", father: true, mother: true, daughters: 1 }, { father: "1/5", mother: "1/5", daughters: "3/5" }],
  ["ابوین + یک دختر، مادر حاجب دارد", { deceased: "m", father: true, mother: true, daughters: 1, fullBrothers: 2 }, { father: "5/24", mother: "1/6", daughters: "5/8" }],
  ["زوج + ابوین + دو دختر (نقص)", { deceased: "f", husband: true, father: true, mother: true, daughters: 2 }, { husband: "1/4", father: "1/6", mother: "1/6", daughters: "5/24" }],
  ["ابوین، حاجب: یک برادر و دو خواهر", { deceased: "m", father: true, mother: true, fullBrothers: 1, fullSisters: 2 }, { mother: "1/6", father: "5/6" }],
  ["خواهر ابوینی + برادر امی", { deceased: "m", fullSisters: 1, matBrothers: 1 }, { ps: "5/6", mb: "1/6" }],
  ["دو برادر امی + جد و جده ابی", { deceased: "m", matBrothers: 2, patGrandfather: true, patGrandmother: true }, { mb: "1/6", pgf: "4/9", pgm: "2/9" }],
  ["زوجه + عمو + دایی", { deceased: "m", wives: 1, ammuFull: 1, dayiFull: 1 }, { wife: "1/4", dayi: "1/3", ammu: "5/12" }],
  ["فقط زوجه", { deceased: "m", wives: 1 }, { wife: "1/4" }, "3/4"],
  ["نوه‌ها به قائم‌مقامی", { deceased: "m", grandchildren: [{ via: "m", sons: 0, daughters: 1 }, { via: "f", sons: 1, daughters: 0 }] }, { "g0-d": "2/3", "g1-s": "1/3" }],
  ["دو زوجه + پسر", { deceased: "m", wives: 2, sons: 1 }, { wife: "1/16", sons: "7/8" }],
  ["فقط زوج", { deceased: "f", husband: true }, { husband: "1" }, "0"],
  ["زوج + مادر + دو دختر (نقص)", { deceased: "f", husband: true, mother: true, daughters: 2 }, { husband: "1/4", mother: "1/6", daughters: "7/24" }],
  ["زوجه + مادر + یک دختر (رد)", { deceased: "m", wives: 1, mother: true, daughters: 1 }, { wife: "1/8", mother: "7/32", daughters: "21/32" }],
  ["برادر ابوینی، برادر ابی محروم", { deceased: "m", fullBrothers: 1, patBrothers: 2 }, { pb: "1" }],
  ["دو خواهر امی + جده امی", { deceased: "m", matSisters: 2, matGrandmother: true }, { ms: "1/3", mgm: "1/3" }],
  ["زوج + خواهر ابوینی + برادر امی", { deceased: "f", husband: true, fullSisters: 1, matBrothers: 1 }, { husband: "1/2", mb: "1/6", ps: "1/3" }],
  ["عمو و عمه ابوینی + عمو امی", { deceased: "m", ammuFull: 1, ammeFull: 1, ammuMat: 1 }, { ammuM: "1/6", ammu: "5/9", amme: "5/18" }],
  ["دو دایی ابوینی + خاله امی", { deceased: "m", dayiFull: 2, khaleMat: 1 }, { khaleM: "1/6", dayi: "5/12" }],
  ["برادرزاده و خواهرزاده", { deceased: "m", nephews: [{ side: "full", via: "m", sons: 2, daughters: 1 }, { side: "maternal", via: "f", sons: 1, daughters: 1 }] }, { "n0-s": "1/3", "n0-d": "1/6", "n1-s": "1/12", "n1-d": "1/12" }],
  ["بدون وارث", { deceased: "m" }, {}, "1"],
  ["دو پسر + یک دختر", { deceased: "m", sons: 2, daughters: 1 }, { sons: "2/5", daughters: "1/5" }],
  ["دو خواهر ابی + برادر امی", { deceased: "m", patSisters: 2, matBrothers: 1 }, { ps: "5/12", mb: "1/6" }],
  ["برادر ابوینی + جد امی", { deceased: "m", fullBrothers: 1, matGrandfather: true }, { pb: "2/3", mgf: "1/3" }],
  ["زوجه + ابوین + دو برادر (حاجب)", { deceased: "m", wives: 1, father: true, mother: true, fullBrothers: 2 }, { wife: "1/4", mother: "1/6", father: "7/12" }],
  ["زوج + مادر", { deceased: "f", husband: true, mother: true }, { husband: "1/2", mother: "1/2" }],
  ["زوج + عمو + خاله", { deceased: "f", husband: true, ammuFull: 1, khaleFull: 1 }, { husband: "1/2", ammu: "1/6", khale: "1/3" }],
];

describe("سهم‌الارث", () => {
  for (const [name, inp, exp, hakem] of cases) {
    it(name, () => {
      const r = calculateErs(inp);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const got = Object.fromEntries(r.shares.map((s) => [s.key, s.each.toString()]));
      expect(got).toEqual(exp);
      if (hakem !== undefined) expect(r.hakem.toString()).toBe(hakem);
    });
  }
  it("وصیت بیش از ثلث بدون اجازه ورثه تا ثلث نافذ است", () => {
    const r = calculateErs({ deceased: "m", wives: 1, sons: 2, daughters: 1, estate: 1e9, debts: 1e8, will: 4e8 });
    if (!r.ok || !r.money) throw new Error();
    expect(r.money.will).toBe(300_000_000);
    expect(r.money.net).toBe(600_000_000);
  });
  it("حمل با نوه‌ها: تقسیم انجام نمی‌شود", () => {
    const r = calculateErs({ deceased: "m", pregnancy: true, grandchildren: [{ via: "m", sons: 1, daughters: 0 }] });
    expect(r.ok).toBe(false);
  });
});
