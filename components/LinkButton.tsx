// LinkButton — a link that looks like a button, for navigation to another page.
// Usage: <LinkButton href="/request">درخواست مشاوره</LinkButton>
// External links (http, tel, mailto) render a plain <a>; pass external to open a new tab.
import type { ReactNode } from "react";
import Link from "next/link";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/buttonStyles";

export type LinkButtonProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  /** Opens in a new tab with rel="noopener noreferrer". */
  external?: boolean;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
};

export function LinkButton({
  href,
  variant,
  size,
  fullWidth,
  icon,
  external = false,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  const content = (
    <>
      {icon && (
        <span aria-hidden="true" className="flex [&>svg]:size-5">
          {icon}
        </span>
      )}
      {children}
    </>
  );

  if (href.startsWith("/") && !external) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={classes}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      {...rest}
    >
      {content}
    </a>
  );
}
