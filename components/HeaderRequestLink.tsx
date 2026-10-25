"use client";
// HeaderRequestLink — the consultation-request link in the header. On phones it shows a
// short label (the accessible name stays the full one). On Home it is hidden below `md`,
// where the hero's request button is right under it; the mobile menu still lists the
// request page there. Client-side only to read the path; it renders on the server too,
// so the link never flashes in and out. Used by Header.
// Usage: <HeaderRequestLink />
import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/LinkButton";
import { requestNav } from "@/content/navigation";
import { cn } from "@/lib/cn";

export function HeaderRequestLink() {
  const isHome = usePathname() === "/";
  return (
    <LinkButton
      href={requestNav.href}
      variant="secondary"
      size="sm"
      aria-label={requestNav.label}
      className={cn("whitespace-nowrap max-xs:px-3", isHome && "max-md:hidden")}
    >
      <span className="sm:hidden">مشاوره</span>
      <span className="hidden sm:inline">{requestNav.label}</span>
    </LinkButton>
  );
}
