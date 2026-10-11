import { describe, expect, it } from "vitest";
import { isValidMobile, normalizeMobile } from "@/lib/phone";

describe("normalizeMobile", () => {
  it("keeps a plain Latin number", () => {
    expect(normalizeMobile("09123456789")).toBe("09123456789");
  });

  it("converts Persian and Arabic-Indic digits", () => {
    expect(normalizeMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizeMobile("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
  });

  it("drops spaces and dashes", () => {
    expect(normalizeMobile("0912 345-6789")).toBe("09123456789");
  });

  it("turns +98, 0098 and 98 prefixes into a leading 0", () => {
    expect(normalizeMobile("+989123456789")).toBe("09123456789");
    expect(normalizeMobile("00989123456789")).toBe("09123456789");
    expect(normalizeMobile("989123456789")).toBe("09123456789");
  });

  it("adds the leading 0 when it is missing", () => {
    expect(normalizeMobile("9123456789")).toBe("09123456789");
  });

  it("leaves a half-typed number alone and caps the length", () => {
    expect(normalizeMobile("0912")).toBe("0912");
    expect(normalizeMobile("091234567890000")).toBe("09123456789");
  });
});

describe("isValidMobile", () => {
  it("accepts 09xxxxxxxxx", () => {
    expect(isValidMobile("09123456789")).toBe(true);
  });

  it("rejects short, landline and non-normalised numbers", () => {
    expect(isValidMobile("0912345678")).toBe(false);
    expect(isValidMobile("02112345678")).toBe(false);
    expect(isValidMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe(false);
    expect(isValidMobile("")).toBe(false);
  });
});
