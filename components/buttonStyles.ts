// Shared classes for Button, LinkButton and the contact buttons, so every button-like
// element looks and behaves the same. Every size keeps a 44px minimum tap target.
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-sm font-semibold transition-colors " +
  "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-surface disabled:text-disabled-ink " +
  "aria-disabled:pointer-events-none aria-disabled:border-transparent aria-disabled:bg-disabled-surface aria-disabled:text-disabled-ink";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-primary bg-surface text-primary hover:bg-primary-soft active:bg-primary-soft-strong",
  ghost: "text-primary hover:bg-primary-soft active:bg-primary-soft-strong",
  danger: "bg-danger text-on-primary hover:bg-danger-hover active:bg-danger-active",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}
