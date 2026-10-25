// Checks the colour tokens in app/globals.css against WCAG 2.1 AA.
// Text pairs need 4.5:1; borders of form controls and focus rings need 3:1.
// Run: npm run check:contrast. Exits 1 if any pair fails.
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

const raw = {};
for (const [, name, value] of css.matchAll(/--color-([\w-]+):\s*([^;]+);/g)) {
  raw[name] = value.trim();
}

function resolve(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular token: ${name}`);
  const value = raw[name];
  if (!value) throw new Error(`Unknown token: --color-${name}`);
  const ref = /^var\(--color-([\w-]+)\)$/.exec(value);
  if (ref) return resolve(ref[1], seen.add(name));
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`--color-${name} is not a hex colour`);
  return value;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(resolve(a)), luminance(resolve(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5;
const UI = 3;

// [foreground, background, minimum]
const pairs = [
  // Body and muted text on every surface
  ["ink", "page", TEXT],
  ["ink", "surface", TEXT],
  ["ink", "surface-muted", TEXT],
  ["muted", "page", TEXT],
  ["muted", "surface", TEXT],
  ["muted", "surface-muted", TEXT],
  // Primary as text and as a button
  ["primary", "surface", TEXT],
  ["primary", "page", TEXT],
  ["primary", "surface-muted", TEXT],
  ["primary", "primary-soft", TEXT],
  ["primary", "primary-soft-strong", TEXT],
  ["on-primary", "primary", TEXT],
  ["on-primary", "primary-hover", TEXT],
  ["on-primary", "primary-active", TEXT],
  ["primary-active", "primary-soft", TEXT],
  ["ink", "primary-soft", TEXT],
  ["muted", "primary-soft", TEXT],
  // Danger button and error text
  ["on-primary", "danger", TEXT],
  ["on-primary", "danger-hover", TEXT],
  ["on-primary", "danger-active", TEXT],
  ["danger-ink", "surface", TEXT],
  ["danger-ink", "page", TEXT],
  // Notices
  ["success-ink", "success-surface", TEXT],
  ["warning-ink", "warning-surface", TEXT],
  ["warning-ink", "surface", TEXT],
  ["danger-ink", "danger-surface", TEXT],
  ["info-ink", "info-surface", TEXT],
  ["estimate-ink", "estimate-surface", TEXT],
  // Home hero on phones: the dark band and the light button on it
  ["on-inverse", "inverse-surface", TEXT],
  ["on-inverse-muted", "inverse-surface", TEXT],
  ["primary-active", "surface", TEXT],
  ["primary-active", "primary-soft-strong", TEXT],
  ["surface", "inverse-surface", UI],
  // Non-text: control borders and the focus ring
  ["line-strong", "surface", UI],
  ["line-strong", "page", UI],
  ["danger", "surface", UI],
  ["focus", "surface", UI],
  ["focus", "page", UI],
  ["focus", "surface-muted", UI],
  ["focus-inverse", "inverse-surface", UI],
];

let failed = 0;
for (const [fg, bg, min] of pairs) {
  const value = ratio(fg, bg);
  const ok = value >= min;
  if (!ok) failed++;
  console.log(
    `${ok ? "pass" : "FAIL"}  ${value.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} on ${bg}`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} colour pair(s) below WCAG AA.`);
  process.exit(1);
}
console.log(`\nAll ${pairs.length} colour pairs meet WCAG AA.`);
