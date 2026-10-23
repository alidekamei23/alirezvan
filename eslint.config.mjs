import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Supplied, reference-tested engines are kept byte-identical to the source; style
    // rules that would ask for edits there are switched off.
    files: ["lib/ers/ers-calc.ts"],
    rules: { "prefer-const": "off" },
  },
  {
    // CommonJS so Liara's build can use it (see the file).
    files: ["next.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
