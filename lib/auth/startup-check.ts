// Configuration warnings printed once when the server starts (see instrumentation.ts).

/** The warnings for an environment; empty when there is nothing to say. */
export function startupWarnings(env: Record<string, string | undefined>): string[] {
  const warnings: string[] = [];
  if (env.NODE_ENV === "production" && !env.TRUSTED_IP_HEADER?.trim()) {
    warnings.push(
      "TRUSTED_IP_HEADER is not set. The admin login cannot tell visitors apart, so the " +
        "limit of 5 failed logins per 15 minutes is shared by everyone: anyone can lock " +
        "the admin out by sending wrong passwords. Set TRUSTED_IP_HEADER to the header " +
        "in which your reverse proxy passes the visitor's IP (e.g. x-real-ip). " +
        "To recover from a lockout, run: npm run unlock-login",
    );
  }
  return warnings;
}
