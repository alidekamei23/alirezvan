// LicensingBody — the name of the body that issued the license, with its emblem beside
// it. The emblem is decorative here (the name is always written out), so it has an
// empty alt. Its file has a white background: use it on white surfaces only.
// Usage: <LicensingBody /> or <LicensingBody size="sm" />
import Image from "next/image";
import { lawyer } from "@/content/lawyer";
import { cn } from "@/lib/cn";

const sizes = {
  sm: { box: "h-8", px: "32px" },
  md: { box: "h-11", px: "44px" },
} as const;

export function LicensingBody({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const logo = lawyer.licensingBodyLogo;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {logo && (
        <Image
          src={logo.src}
          alt=""
          width={logo.width}
          height={logo.height}
          sizes={sizes[size].px}
          className={cn("w-auto shrink-0", sizes[size].box)}
        />
      )}
      <span>{lawyer.licensingBody}</span>
    </span>
  );
}
