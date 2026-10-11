export type NavItem = { href: string; label: string };

export const practiceNav: NavItem[] = [
  { href: "/check-safte", label: "چک و سفته" },
  { href: "/melki-ejare", label: "ملکی و اجاره" },
  { href: "/motalebe", label: "مطالبه و طلب" },
  { href: "/gharardad", label: "قرارداد" },
];

export const toolsNav: NavItem[] = [
  { href: "/tools/khesarat-takhir", label: "محاسبه خسارت تأخیر تأدیه" },
  { href: "/tools/ejare", label: "محاسبه افزایش اجاره" },
];

export const siteNav: NavItem[] = [
  { href: "/guides", label: "راهنماها" },
  { href: "/about", label: "درباره وکیل" },
  { href: "/contact", label: "تماس" },
];

export const requestNav: NavItem = { href: "/request", label: "درخواست مشاوره" };

export const legalNav: NavItem[] = [
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/disclaimer", label: "سلب مسئولیت" },
];
