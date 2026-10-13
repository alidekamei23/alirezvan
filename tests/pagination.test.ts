import { describe, expect, it } from "vitest";
import {
  FIRST_PAGE_SIZE,
  PAGE_SIZE,
  pageCount,
  pageItems,
  pageSlice,
  parsePageParam,
} from "@/lib/pagination";

const list = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("pageCount", () => {
  it("is one page up to the first page size, including an empty list", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(1)).toBe(1);
    expect(pageCount(FIRST_PAGE_SIZE)).toBe(1);
  });

  it("adds a page per PAGE_SIZE items after the first page", () => {
    expect(pageCount(FIRST_PAGE_SIZE + 1)).toBe(2);
    expect(pageCount(FIRST_PAGE_SIZE + PAGE_SIZE)).toBe(2);
    expect(pageCount(FIRST_PAGE_SIZE + PAGE_SIZE + 1)).toBe(3);
  });
});

describe("pageSlice", () => {
  it("gives ten items on page 1 and nine after", () => {
    const items = list(25);
    expect(pageSlice(items, 1)).toEqual(list(10));
    expect(pageSlice(items, 2)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(pageSlice(items, 3)).toEqual([20, 21, 22, 23, 24, 25]);
  });

  it("covers every item exactly once", () => {
    const items = list(47);
    const pages = Array.from({ length: pageCount(47) }, (_, i) => pageSlice(items, i + 1));
    expect(pages.flat()).toEqual(items);
  });

  it("is empty out of range", () => {
    expect(pageSlice(list(5), 2)).toEqual([]);
    expect(pageSlice(list(5), 0)).toEqual([]);
    expect(pageSlice(list(5), 1.5)).toEqual([]);
  });
});

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(2, 3)).toEqual([1, 2, 3]);
    expect(pageItems(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it("puts gaps around the current page", () => {
    expect(pageItems(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
  });

  it("has a single gap at either end", () => {
    expect(pageItems(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageItems(10, 10)).toEqual([1, "gap", 9, 10]);
  });

  it("shows the number instead of a gap that would hide only one page", () => {
    expect(pageItems(3, 10)).toEqual([1, 2, 3, 4, "gap", 10]);
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
    expect(pageItems(8, 10)).toEqual([1, "gap", 7, 8, 9, 10]);
  });
});

describe("parsePageParam", () => {
  it("accepts whole numbers from 2", () => {
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam("15")).toBe(15);
  });

  it("rejects page 1, zero, text, signs, decimals and Persian digits", () => {
    for (const value of ["1", "0", "abc", "-2", "2.5", "02", "۲", ""]) {
      expect(parsePageParam(value)).toBeNull();
    }
  });
});
