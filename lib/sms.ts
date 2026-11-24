import "server-only";
import { z } from "zod";

export type CodeSender = (mobile: string, code: string) => Promise<void>;

type SmsDelivery = { mode: "smsir" | "development"; send: CodeSender };

const verificationReceipt = z.object({
  status: z.literal(1),
  data: z.object({ messageId: z.number().int().positive() }),
});

export function getCodeSender(): SmsDelivery | null {
  const apiKey = process.env.SMSIR_API_KEY?.trim();
  const template = process.env.SMSIR_TEMPLATE_ID?.trim();
  const parameter = process.env.SMSIR_CODE_PARAMETER?.trim() || "Code";
  if (apiKey || template) {
    const templateId = Number(template);
    if (!apiKey || !template || !/^\d+$/.test(template) || !Number.isSafeInteger(templateId)
      || templateId <= 0 || parameter.includes("#")) return null;

    return {
      mode: "smsir",
      async send(mobile, code) {
        const response = await fetch("https://api.sms.ir/v1/send/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/plain", "x-api-key": apiKey },
          body: JSON.stringify({
            mobile: mobile.slice(1),
            templateId,
            parameters: [{ name: parameter, value: code }],
          }),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok || !verificationReceipt.safeParse(await response.json()).success) {
          throw new Error("SMS.ir did not accept the verification message.");
        }
      },
    };
  }

  if (process.env.NODE_ENV === "development") {
    return {
      mode: "development",
      async send(_mobile, code) {
        process.stdout.write(`[consultation dev SMS] ${code}\n`);
      },
    };
  }
  return null;
}
