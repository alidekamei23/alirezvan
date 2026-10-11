// Button — triggers an action on the page (submit, open, copy). For navigation use
// LinkButton. One primary button per screen; the rest are secondary or ghost.
// Usage: <Button variant="primary" loading={pending} icon={<Send />}>ارسال کد</Button>
// States: hover, focus-visible, active, disabled, loading (aria-busy, not clickable).
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/buttonStyles";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** A lucide icon element; it is sized and hidden from screen readers for you. */
  icon?: ReactNode;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  icon,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      ) : (
        icon && (
          <span aria-hidden="true" className="flex [&>svg]:size-5">
            {icon}
          </span>
        )
      )}
      {children}
    </button>
  );
}
