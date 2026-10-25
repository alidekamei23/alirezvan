"use client";
// NavDisclosure — one item of the desktop navigation that opens a short list of links.
// Follows the WAI-ARIA disclosure navigation pattern: a real button with aria-expanded
// (not role="menu"), and the links are reached with Tab. A click toggles it; Escape closes
// it and returns focus to the button; a click or Tab outside closes it. The list is only
// `hidden`, never left out, so its links are always in the HTML for crawlers and for
// visitors without JavaScript. Used by Header for the practice areas.
// Usage: <NavDisclosure label="حوزه‌های کاری" items={practiceNav} />
import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavItem } from "@/content/navigation";

export function NavDisclosure({ label, items }: { label: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Focus moving to anything outside (Tab past the last link, Shift+Tab before the button).
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  return (
    <div ref={root} className="relative" onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="group flex min-h-11 items-center gap-1 rounded-sm px-2 text-sm font-semibold whitespace-nowrap text-ink transition-colors hover:bg-primary-soft hover:text-primary aria-expanded:bg-primary-soft aria-expanded:text-primary"
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-(--duration-base) group-aria-expanded:rotate-180"
        />
      </button>
      <ul
        id={listId}
        hidden={!open}
        className="absolute start-0 top-full mt-1 min-w-48 rounded-md border border-line bg-surface py-1 shadow-md"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center px-4 text-sm font-semibold whitespace-nowrap text-ink transition-colors -outline-offset-2 hover:bg-primary-soft hover:text-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
