"use client";
// MobileMenu — the full-screen navigation on small screens. Built on <dialog>, which
// gives a real focus trap, Escape to close, and an inert page behind it. Focus returns
// to the menu button on close. Used only by Header.
import { useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { NavItem } from "@/content/navigation";

export function MobileMenu({
  groups,
}: {
  groups: { title: string; items: NavItem[] }[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        aria-label="باز کردن فهرست"
        className="flex size-11 items-center justify-center rounded-sm text-ink transition-colors hover:bg-surface-muted"
      >
        <Menu aria-hidden="true" className="size-6" />
      </button>

      <dialog
        ref={dialog}
        aria-label="فهرست سایت"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col bg-surface text-ink open:flex"
      >
        <div className="flex min-h-(--header-height) items-center justify-between border-b border-line px-4">
          <span className="text-lg font-bold">فهرست</span>
          <button
            type="button"
            onClick={close}
            aria-label="بستن فهرست"
            className="flex size-11 items-center justify-center rounded-sm text-ink transition-colors hover:bg-surface-muted"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
        <nav aria-label="ناوبری اصلی" className="flex-1 overflow-y-auto px-4 pb-8">
          {groups.map((group) => (
            <div key={group.title} className="pt-6">
              <p className="text-sm font-semibold text-muted">{group.title}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href} className="border-b border-line">
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex min-h-12 items-center text-lg font-semibold text-ink hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </dialog>
    </>
  );
}
