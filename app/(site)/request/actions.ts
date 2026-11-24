"use server";

import { clientIp } from "@/lib/auth/admin";
import { issueCode, verifyAndSave } from "@/lib/consultation/repository";
import { codeSchema, consultationSchema, requestIdSchema } from "@/lib/consultation/schema";
import { getDb } from "@/lib/db";
import { questionSecret } from "@/lib/questions/config";
import { getCodeSender } from "@/lib/sms";
import { z } from "zod";

export async function sendConsultationCode(requestId: unknown, draft: unknown) {
  const delivery = getCodeSender();
  if (!delivery) return { kind: "unavailable" } as const;
  const input = consultationSchema.safeParse(draft);
  if (!input.success) return { kind: "fields", errors: z.flattenError(input.error).fieldErrors } as const;
  const id = requestIdSchema.safeParse(requestId);
  if (!id.success) return { kind: "error" } as const;

  try {
    return await issueCode(getDb(), {
      requestId: id.data, mobile: input.data.mobile, ip: await clientIp(),
      secret: `${questionSecret()}:${delivery.mode}`,
    }, delivery.send);
  } catch {
    return { kind: "error" } as const;
  }
}

export async function submitConsultation(requestId: unknown, challengeId: unknown, code: unknown, draft: unknown) {
  const delivery = getCodeSender();
  if (!delivery) return { kind: "unavailable" } as const;
  const input = consultationSchema.safeParse(draft);
  if (!input.success) return { kind: "fields", errors: z.flattenError(input.error).fieldErrors } as const;
  const id = requestIdSchema.safeParse(requestId);
  const challenge = requestIdSchema.safeParse(challengeId);
  const digits = codeSchema.safeParse(code);
  if (!digits.success) return { kind: "incomplete" } as const;
  if (!id.success || !challenge.success) return { kind: "expired" } as const;

  try {
    return verifyAndSave(getDb(), {
      requestId: id.data, challengeId: challenge.data, code: digits.data, draft: input.data,
      secret: `${questionSecret()}:${delivery.mode}`,
    });
  } catch {
    return { kind: "error" } as const;
  }
}
