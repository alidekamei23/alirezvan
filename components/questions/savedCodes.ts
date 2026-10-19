// Tracking codes saved in this browser, for «سؤال‌های من». localStorage can be missing or
// blocked (private windows, strict settings), so every access is guarded and the pages
// work without it.

const KEY = "porsesh-codes";
const MAX = 20;

export function loadCodes(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function store(codes: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(codes.slice(0, MAX)));
  } catch {
    // Not available: the visitor still has the code on screen.
  }
}

/** Newest first, without duplicates. */
export function saveCode(code: string): void {
  store([code, ...loadCodes().filter((saved) => saved !== code)]);
}

export function forgetCode(code: string): void {
  store(loadCodes().filter((saved) => saved !== code));
}
