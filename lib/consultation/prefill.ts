import type { CalculatorResult, ConsultationDraft } from "./schema";

// Keep results and unfinished requests in this tab's memory. The URL carries only an ID.
let handoff: { id: string; result: CalculatorResult; expires: number } | undefined;
let savedDraft: { entryId: string; draft: ConsultationDraft } | undefined;

export function handOffCalculatorResult(result: CalculatorResult) {
  const id = crypto.randomUUID();
  handoff = { id, result, expires: Date.now() + 60_000 };
  return id;
}

export function takeCalculatorResult(id: string | undefined) {
  if (!handoff || handoff.id !== id) return undefined;
  const { result, expires } = handoff;
  handoff = undefined;
  if (expires > Date.now()) return result;
}

export function getConsultationDraft() {
  return savedDraft;
}

export function rememberConsultationDraft(entryId: string, draft: ConsultationDraft) {
  if (draft.description.trim()) savedDraft = { entryId, draft };
  else forgetConsultationDraft(entryId);
}

export function forgetConsultationDraft(entryId: string) {
  if (savedDraft?.entryId === entryId) savedDraft = undefined;
}
