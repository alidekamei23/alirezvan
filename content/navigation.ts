export type NavItem = { href: string; label: string };

export const practiceNav: NavItem[] = [
  { href: "/check-safte", label: "چک و سفته" },
  { href: "/melki-ejare", label: "ملکی و اجاره" },
  { href: "/motalebe", label: "مطالبه و طلب" },
  { href: "/gharardad", label: "قرارداد" },
];

/** The calculators are listed on their own page, not one by one in menus. */
export const toolsIndexNav: NavItem = { href: "/tools", label: "ابزارهای محاسبه" };

export const siteNav: NavItem[] = [
  toolsIndexNav,
  { href: "/porsesh", label: "پرسش و پاسخ" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/about", label: "درباره وکیل" },
  { href: "/contact", label: "تماس" },
];

export const requestNav: NavItem = { href: "/request", label: "درخواست مشاوره" };

export const legalNav: NavItem[] = [
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/disclaimer", label: "سلب مسئولیت" },
];
