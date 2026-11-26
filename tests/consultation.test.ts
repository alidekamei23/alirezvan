import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendConsultationCode, submitConsultation } from "@/app/(site)/request/actions";
import type { Db } from "@/db/client";
import { consultationCodes, consultationRequests } from "@/db/schema";
import {
  forgetConsultationDraft, getConsultationDraft, handOffCalculatorResult, rememberConsultationDraft, takeCalculatorResult,
} from "@/lib/consultation/prefill";
import { issueCode, verifyAndSave } from "@/lib/consultation/repository";
import { consultationSchema, type ConsultationDraft } from "@/lib/consultation/schema";
import { getCodeSender } from "@/lib/sms";
import { testDb } from "./admin/helpers";

vi.mock("@/lib/db", () => ({ getDb: () => db }));
vi.mock("@/lib/auth/admin", () => ({ clientIp: async () => "test-ip" }));

const fields = {
  name: "علی", mobile: "+۹۸ ۹۱۲-۳۴۵-۶۷۸۹", messenger: "", topic: "civil",
  otherTopic: "", description: "شرح آزمایشی درخواست", source: "page",
} satisfies ConsultationDraft;
const draft = consultationSchema.parse(fields);
const calculatorResult = { title: "برآورد هزینهٔ دادرسی", lines: ["مرحلهٔ بدوی · ۲۵۰٬۰۰۰ تومان"] };
const secret = "consultation-test-secret-at-least-32";
let db: Db;

describe("consultation validation", () => {
  it("accepts a single name, supported mobile formats, and an optional messenger", () => {
    expect(draft).toMatchObject({ name: "علی", mobile: "09123456789", messenger: null });
    expect(consultationSchema.parse({ ...fields, messenger: "eitaa" }).messenger).toBe("eitaa");
    expect(consultationSchema.safeParse({ ...fields, messenger: ["bale", "eitaa"] }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...fields, mobile: "02112345678" }).success).toBe(false);
  });

  it("requires the one-line topic only for other and removes it after a category change", () => {
    expect(consultationSchema.safeParse({ ...fields, topic: "other" }).success).toBe(false);
    expect(consultationSchema.parse({ ...fields, topic: "other", otherTopic: " بررسی قرارداد " }).otherTopic)
      .toBe("بررسی قرارداد");
    expect(consultationSchema.parse({ ...fields, otherTopic: "شرح قبلی" }).otherTopic).toBeNull();
  });

  it("requires a nonblank description of at most 3000 characters", () => {
    expect(consultationSchema.safeParse({ ...fields, description: " \n " }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...fields, description: "س".repeat(3000) }).success).toBe(true);
    expect(consultationSchema.safeParse({ ...fields, description: "س".repeat(3001) }).success).toBe(false);
  });

  it("validates the user's description separately and appends the selected result only after validation", () => {
    expect(consultationSchema.safeParse({ ...fields, description: " ", calculatorResult }).success).toBe(false);
    const description = "س".repeat(3000);
    expect(consultationSchema.parse({ ...fields, description, calculatorResult })).toMatchObject({
      source: "calculator",
      description: `${description}\n\nبرآورد هزینهٔ دادرسی\nمرحلهٔ بدوی · 250٬000 تومان`,
    });
    expect(consultationSchema.safeParse({ ...fields, calculatorResult: { ...calculatorResult, lines: [] } }).success).toBe(false);
    expect(consultationSchema.parse(fields)).toMatchObject({ source: "page", description: fields.description });
  });
});

describe("calculator handoff and consultation drafts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("takes only the latest result for its own entry, once, and expires unused results", () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    const first = handOffCalculatorResult(calculatorResult);
    const deadline = { title: "مهلت قانونی", lines: ["آخرین روز · ۲۵ آذر"] };
    const second = handOffCalculatorResult(deadline);
    expect(takeCalculatorResult(undefined)).toBeUndefined();
    expect(takeCalculatorResult(first)).toBeUndefined();
    expect(takeCalculatorResult(second)).toEqual(deadline);
    expect(takeCalculatorResult(second)).toBeUndefined();

    const expired = handOffCalculatorResult(calculatorResult);
    now.mockReturnValue(61_000);
    expect(takeCalculatorResult(expired)).toBeUndefined();
  });

  it("treats written text as a draft and clears it only for its current owner", () => {
    rememberConsultationDraft("first", { ...fields, calculatorResult, description: " " });
    expect(getConsultationDraft()).toBeUndefined();
    rememberConsultationDraft("first", { ...fields, calculatorResult });
    rememberConsultationDraft("second", { ...fields, description: "" });
    expect(getConsultationDraft()?.entryId).toBe("first");
    rememberConsultationDraft("second", fields);
    forgetConsultationDraft("first");
    expect(getConsultationDraft()).toEqual({ entryId: "second", draft: fields });
    forgetConsultationDraft("second");
    expect(getConsultationDraft()).toBeUndefined();
  });
});

describe("consultation verification and storage", () => {
  let now: number;
  let requestId: string;
  let code: string;
  const clock = () => now;

  beforeEach(() => {
    db = testDb();
    now = 1_000_000;
    requestId = randomUUID();
    code = "";
    vi.stubEnv("SMSIR_API_KEY", "");
    vi.stubEnv("SMSIR_TEMPLATE_ID", "");
    vi.stubEnv("SMSIR_CODE_PARAMETER", "");
  });

  afterEach(() => {
    db.$client.close();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function send(mobile = draft.mobile, ip = "test-ip", id = requestId) {
    return issueCode(db, { requestId: id, mobile, ip, secret }, async (_mobile, otp) => { code = otp; }, clock);
  }

  async function sent(mobile = draft.mobile) {
    const result = await send(mobile);
    if (result.kind !== "sent") throw Error(result.kind);
    return result.challengeId;
  }

  function verify(challengeId: string, entered: string, input = draft) {
    return verifyAndSave(db, { requestId, challengeId, code: entered, draft: input, secret }, clock);
  }

  it("stores a hash only, then creates a single new lead and acknowledges a verified replay", async () => {
    const challenge = await sent();
    expect(db.select().from(consultationRequests).all()).toEqual([]);
    expect(db.select().from(consultationCodes).get()?.hash).toMatch(/^[a-f\d]{64}$/);
    const input = { ...draft, source: "calculator", messenger: "bale" } as const;
    expect(await Promise.all([
      Promise.resolve().then(() => verify(challenge, code, input)),
      Promise.resolve().then(() => verify(challenge, code, { ...draft, name: "تکرار" })),
    ])).toEqual([{ kind: "saved" }, { kind: "saved" }]);
    expect(db.select().from(consultationRequests).all()).toEqual([
      expect.objectContaining({ id: requestId, status: "new", ...input }),
    ]);
    expect(db.select().from(consultationCodes).get()?.state).toBe("used");
  });

  it("rejects wrong codes, locks at three attempts, and expires at two minutes", async () => {
    const challenge = await sent();
    const wrong = code === "00000" ? "11111" : "00000";
    expect(verify(challenge, wrong)).toEqual({ kind: "wrong", remaining: 2 });
    expect(verify(challenge, wrong)).toEqual({ kind: "wrong", remaining: 1 });
    expect(verify(challenge, wrong)).toEqual({ kind: "locked" });
    expect(verify(challenge, code)).toEqual({ kind: "locked" });
    now += 30_000;
    const replacement = await sent();
    now += 120_000;
    expect(verify(replacement, code)).toEqual({ kind: "expired" });
    expect(db.select().from(consultationRequests).all()).toEqual([]);
  });

  it("invalidates the prior code only when a resend succeeds", async () => {
    const challenge = await sent();
    const oldCode = code;
    expect(await send()).toEqual({ kind: "limited", retryAt: now + 30_000 });
    now += 30_000;
    const failure = await issueCode(db, { requestId, mobile: draft.mobile, ip: "test-ip", secret },
      async () => { throw Error("sender down"); }, clock);
    expect(failure.kind).toBe("send_failed");
    expect(db.select().from(consultationCodes).all().find((row) => row.id === challenge)?.state)
      .toBe("active");
    now += 30_000;
    const replacement = await sent();
    expect(code).not.toBe(oldCode);
    expect(verify(challenge, oldCode)).toEqual({ kind: "expired" });
    expect(verify(replacement, code)).toEqual({ kind: "saved" });
  });

  it("requires independent verification after changing the mobile number", async () => {
    const challenge = await sent();
    const oldCode = code;
    const next = { ...draft, mobile: "09123456780" };
    expect(verify(challenge, oldCode, next)).toEqual({ kind: "expired" });
    const replacement = await sent(next.mobile);
    expect(verify(challenge, oldCode)).toEqual({ kind: "expired" });
    expect(verify(replacement, code, next)).toEqual({ kind: "saved" });
    expect(db.select().from(consultationRequests).get()?.mobile).toBe(next.mobile);
  });

  it("reserves send capacity atomically and applies phone and IP limits across requests", async () => {
    const input = { requestId, mobile: draft.mobile, ip: "test-ip", secret };
    let finish!: () => void;
    const pending = issueCode(db, input, () => new Promise<void>((resolve) => { finish = resolve; }), clock);
    expect((await send()).kind).toBe("limited");
    finish();
    expect((await pending).kind).toBe("sent");
    for (let i = 0; i < 3; i++) {
      now += 30_000;
      expect((await send(draft.mobile, "another-ip", randomUUID())).kind).toBe("sent");
    }
    now += 30_000;
    expect((await send(draft.mobile, "another-ip", randomUUID())).kind).toBe("limited");
    for (let i = 0; i < 11; i++) {
      expect((await send(`09200000${String(i).padStart(3, "0")}`, "test-ip", randomUUID())).kind)
        .toBe("sent");
    }
    expect((await send("09200000500", "test-ip", randomUUID())).kind).toBe("limited");
  });

  it("registers a calculator request after verification and disables both actions without a production sender", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("IP_HASH_SALT", secret);
    const withCalculator = { ...fields, calculatorResult };
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    expect((await sendConsultationCode(requestId, { ...withCalculator, description: "" })).kind).toBe("fields");
    const sent = await sendConsultationCode(requestId, withCalculator);
    if (sent.kind !== "sent") throw Error(sent.kind);
    expect(Object.keys(sent).sort()).toEqual(["challengeId", "kind", "retryAt"]);
    expect(stdout).toHaveBeenCalledOnce();
    const otp = String(stdout.mock.calls[0][0]).match(/\d{5}/)?.[0];
    expect(otp).toBeDefined();
    stdout.mockRestore();
    vi.stubEnv("NODE_ENV", "production");
    expect(getCodeSender()).toBeNull();
    expect(await sendConsultationCode(requestId, fields)).toEqual({ kind: "unavailable" });
    expect(await submitConsultation(requestId, sent.challengeId, otp, fields)).toEqual({ kind: "unavailable" });
    expect(db.select().from(consultationRequests).all()).toEqual([]);
    vi.stubEnv("NODE_ENV", "development");
    expect(await submitConsultation(requestId, sent.challengeId, otp, { ...withCalculator, description: "" }))
      .toMatchObject({ kind: "fields" });
    expect(await submitConsultation(requestId, sent.challengeId, otp, withCalculator)).toEqual({ kind: "saved" });
    expect(db.select().from(consultationRequests).get()).toMatchObject({
      source: "calculator",
      description: `${fields.description}\n\nبرآورد هزینهٔ دادرسی\nمرحلهٔ بدوی · 250٬000 تومان`,
    });
  });

  it("sends a single SMS.ir verification and registers only after the delivered code", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("IP_HASH_SALT", secret);
    vi.stubEnv("SMSIR_API_KEY", "example-test-key");
    expect(getCodeSender()).toBeNull();
    vi.stubEnv("SMSIR_TEMPLATE_ID", "123456");
    vi.stubEnv("SMSIR_CODE_PARAMETER", "Pin");
    const fetchMock = vi.fn(async (_url: string, options: RequestInit) => {
      const payload = JSON.parse(String(options.body));
      expect(payload).toEqual({
        mobile: "9123456789", templateId: 123456,
        parameters: [{ name: "Pin", value: expect.stringMatching(/^\d{5}$/) }],
      });
      code = payload.parameters[0].value;
      return Response.json({ status: 1, data: { messageId: 9876 } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const sent = await sendConsultationCode(requestId, fields);
    if (sent.kind !== "sent") throw Error(sent.kind);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("https://api.sms.ir/v1/send/verify",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "x-api-key": "example-test-key" }) }));
    expect(db.select().from(consultationRequests).all()).toEqual([]);
    expect(await submitConsultation(requestId, sent.challengeId, code, fields)).toEqual({ kind: "saved" });
    expect(db.select().from(consultationRequests).all()).toHaveLength(1);
  });

  it.each([
    [200, { status: 102 }],
    [503, { status: 1, data: { messageId: 9876 } }],
    [200, { status: 1, data: null }],
  ])("keeps verification inactive for a rejected SMS.ir response (%s)", async (status, body) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("IP_HASH_SALT", secret);
    vi.stubEnv("SMSIR_API_KEY", "example-test-key");
    vi.stubEnv("SMSIR_TEMPLATE_ID", "123456");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(body, { status })));
    expect((await sendConsultationCode(requestId, fields)).kind).toBe("send_failed");
    expect(db.select().from(consultationCodes).get()).toMatchObject({ state: "inactive", hash: null });
  });

  it("does not accept a console OTP after a real sender is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("IP_HASH_SALT", secret);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const sent = await sendConsultationCode(requestId, fields);
    if (sent.kind !== "sent") throw Error(sent.kind);
    const otp = String(stdout.mock.calls[0][0]).match(/\d{5}/)?.[0];
    stdout.mockRestore();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMSIR_API_KEY", "example-test-key");
    vi.stubEnv("SMSIR_TEMPLATE_ID", "123456");
    expect(await submitConsultation(requestId, sent.challengeId, otp, fields)).toEqual({ kind: "expired" });
    expect(db.select().from(consultationRequests).all()).toEqual([]);
  });
});
