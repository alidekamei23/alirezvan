// Cross-site request check for state-changing Route Handlers. (Server Actions get the
// same check from Next.js itself.) A browser always sends Origin on a cross-site POST,
// so a request is accepted only when Origin is present and names this host.

export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  // Behind a reverse proxy the public host arrives in X-Forwarded-Host.
  const host = headers.get("x-forwarded-host")?.split(",")[0].trim() || headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
