// Keep the one-time handoff in this tab's memory, away from URLs and browser storage.
let handoff: { text: string; expires: number } | undefined;

export function handOffCalculatorResult(text: string) {
  handoff = { text, expires: Date.now() + 60_000 };
}

export function takeCalculatorResult() {
  const result = handoff;
  handoff = undefined;
  return result && result.expires > Date.now() ? result.text : "";
}
