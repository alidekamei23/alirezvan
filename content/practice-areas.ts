export type PracticeAreaSlug =
  | "check-safte"
  | "melki-ejare"
  | "motalebe"
  | "gharardad";

export type PracticeArea = {
  slug: PracticeAreaSlug;
  href: string;
  title: string;
  /** One line for cards. Topics only; no legal statements here. */
  summary: string;
};

// Hub content (steps, FAQs) is added in session 3.
export const practiceAreas: PracticeArea[] = [
  {
    slug: "check-safte",
    href: "/check-safte",
    title: "چک و سفته",
    summary: "چک برگشتی، مطالبه وجه چک و سفته",
  },
  {
    slug: "melki-ejare",
    href: "/melki-ejare",
    title: "ملکی و اجاره",
    summary: "اجاره‌نامه، تخلیه و اختلافات ملکی",
  },
  {
    slug: "motalebe",
    href: "/motalebe",
    title: "مطالبه و طلب",
    summary: "مطالبه طلب و خسارت تأخیر تأدیه",
  },
  {
    slug: "gharardad",
    href: "/gharardad",
    title: "قرارداد",
    summary: "تنظیم و بررسی قرارداد، اختلافات قراردادی",
  },
];
