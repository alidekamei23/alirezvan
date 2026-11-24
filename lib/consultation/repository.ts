import "server-only";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, gt, lte, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { consultationCodes, consultationRequests } from "@/db/schema";
import type { ConsultationInput } from "@/lib/consultation/schema";
import type { CodeSender } from "@/lib/sms";

const CODE_LIFETIME = 120_000;
const RESEND_DELAY = 30_000;
const HOUR = 3_600_000;
const MAX_ATTEMPTS = 3;

function digest(secret: string, value: string) {
  return createHmac("sha256", secret).update(`consultation:${value}`).digest("hex");
}

function codeHash(secret: string, id: string, code: string) {
  return digest(secret, `code:${id}:${code}`);
}

export async function issueCode(
  db: Db,
  input: { requestId: string; mobile: string; ip: string; secret: string },
  send: CodeSender,
  clock = Date.now,
) {
  const { requestId, mobile, ip, secret } = input;
  const mobileKey = digest(secret, `mobile:${mobile}`);
  const ipKey = digest(secret, `ip:${ip}`);
  const id = randomUUID();

  const reservation = db.transaction((tx) => {
    const now = clock();
    tx.delete(consultationCodes).where(lte(consultationCodes.issuedAt, now - HOUR)).run();
    if (tx.select({ id: consultationRequests.id }).from(consultationRequests)
      .where(eq(consultationRequests.id, requestId)).get()) {
      return { kind: "closed" } as const;
    }

    const phoneSends = tx.select({ first: sql<number>`min(${consultationCodes.issuedAt})`,
      last: sql<number>`max(${consultationCodes.issuedAt})`, count: sql<number>`count(*)` })
      .from(consultationCodes).where(eq(consultationCodes.mobileKey, mobileKey)).get()!;
    const ipSends = tx.select({ first: sql<number>`min(${consultationCodes.issuedAt})`,
      count: sql<number>`count(*)` })
      .from(consultationCodes).where(eq(consultationCodes.ipKey, ipKey)).get()!;
    const pending = tx.select({ issuedAt: consultationCodes.issuedAt }).from(consultationCodes)
      .where(and(eq(consultationCodes.requestId, requestId), eq(consultationCodes.state, "sending"),
        gt(consultationCodes.issuedAt, now - CODE_LIFETIME))).get();
    const retryAt = Math.max(
      phoneSends.count ? phoneSends.last + RESEND_DELAY : 0,
      phoneSends.count >= 4 ? phoneSends.first + HOUR : 0,
      ipSends.count >= 12 ? ipSends.first + HOUR : 0,
      pending ? pending.issuedAt + CODE_LIFETIME : 0,
    );
    if (retryAt > now) return { kind: "limited", retryAt } as const;

    const previous = tx.select({ id: consultationCodes.id, hash: consultationCodes.hash })
      .from(consultationCodes).where(and(eq(consultationCodes.requestId, requestId),
        eq(consultationCodes.state, "active"))).get();
    let code: string;
    do {
      code = String(randomInt(100_000)).padStart(5, "0");
    } while (previous && previous.hash === codeHash(secret, previous.id, code));

    tx.insert(consultationCodes).values({
      id, requestId, mobileKey, ipKey, issuedAt: now, state: "sending",
    }).run();
    return { kind: "reserved", code, issuedAt: now } as const;
  }, { behavior: "immediate" });

  if (reservation.kind !== "reserved") return reservation;
  const retryAt = reservation.issuedAt + RESEND_DELAY;
  try {
    await send(mobile, reservation.code);
  } catch {
    db.update(consultationCodes).set({ state: "inactive" }).where(eq(consultationCodes.id, id)).run();
    return { kind: "send_failed", retryAt } as const;
  }

  return db.transaction((tx) => {
    const now = clock();
    const closed = tx.select({ id: consultationRequests.id }).from(consultationRequests)
      .where(eq(consultationRequests.id, requestId)).get();
    if (closed || now - reservation.issuedAt >= CODE_LIFETIME) {
      tx.update(consultationCodes).set({ state: "inactive" }).where(eq(consultationCodes.id, id)).run();
      return closed ? { kind: "closed" } as const : { kind: "send_failed", retryAt } as const;
    }
    tx.update(consultationCodes).set({ state: "inactive", hash: null })
      .where(and(eq(consultationCodes.requestId, requestId), eq(consultationCodes.state, "active"))).run();
    tx.update(consultationCodes).set({
      state: "active", expiresAt: now + CODE_LIFETIME, hash: codeHash(secret, id, reservation.code),
    }).where(eq(consultationCodes.id, id)).run();
    return { kind: "sent", challengeId: id, retryAt } as const;
  }, { behavior: "immediate" });
}

export function verifyAndSave(
  db: Db,
  input: { requestId: string; challengeId: string; code: string; draft: ConsultationInput; secret: string },
  clock = Date.now,
) {
  const { requestId, challengeId, code, draft, secret } = input;
  return db.transaction((tx) => {
    const now = clock();
    const row = tx.select().from(consultationCodes).where(and(
      eq(consultationCodes.id, challengeId), eq(consultationCodes.requestId, requestId),
      eq(consultationCodes.mobileKey, digest(secret, `mobile:${draft.mobile}`)),
    )).get();
    if (!row?.hash || !row.expiresAt || row.expiresAt <= now) return { kind: "expired" } as const;
    if (row.attempts >= MAX_ATTEMPTS) return { kind: "locked" } as const;

    if (!timingSafeEqual(Buffer.from(row.hash, "hex"), Buffer.from(codeHash(secret, row.id, code), "hex"))) {
      const attempts = row.attempts + 1;
      tx.update(consultationCodes).set({ attempts }).where(eq(consultationCodes.id, row.id)).run();
      if (attempts >= MAX_ATTEMPTS) return { kind: "locked" } as const;
      return { kind: "wrong", remaining: MAX_ATTEMPTS - attempts } as const;
    }

    if (row.state !== "used") {
      tx.insert(consultationRequests).values({ ...draft, id: requestId, createdAt: new Date(now) }).run();
      tx.update(consultationCodes).set({ state: "used" }).where(eq(consultationCodes.id, row.id)).run();
    }
    return { kind: "saved" } as const;
  }, { behavior: "immediate" });
}
