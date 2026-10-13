// The admin's credentials and the cookie-signing secret, from the environment. Read on
// first use, not at import, so a build without these variables still works.
import { z } from "zod";

const authEnvSchema = z.object({
  ADMIN_USERNAME: z.string().trim().min(1, "ADMIN_USERNAME is not set"),
  ADMIN_PASSWORD_HASH: z
    .string()
    .regex(
      /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/,
      "ADMIN_PASSWORD_HASH is not a bcrypt hash. Make one with `npm run hash-password` and paste the whole line it prints (the \\$ escapes matter).",
    ),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
});

export type AuthConfig = {
  username: string;
  passwordHash: string;
  sessionSecret: string;
};

export function parseAuthConfig(env: Record<string, string | undefined>): AuthConfig {
  const parsed = authEnvSchema.safeParse(env);
  if (!parsed.success) {
    // Messages name the variable, never its value.
    const problems = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Admin login is not configured: ${problems}`);
  }
  return {
    username: parsed.data.ADMIN_USERNAME,
    passwordHash: parsed.data.ADMIN_PASSWORD_HASH,
    sessionSecret: parsed.data.SESSION_SECRET,
  };
}

let cached: AuthConfig | undefined;

export function getAuthConfig(): AuthConfig {
  cached ??= parseAuthConfig({
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });
  return cached;
}
